// Vercel function: serves the admin analytics summary without reading every all_test_results document.
//
// - Tests older than CLICK_GRACE_MS are folded once into the stored aggregate `stats/rollup`
//   (contact clicks arrive shortly after a test, so recent tests are still counted live).
// - Raw tests older than RAW_RETENTION_DAYS are deleted. Their contribution stays in the aggregate.
// - Callers: the signed-in admin (Firebase ID token) or Vercel Cron (CRON_SECRET).
//
// Env: FIREBASE_SERVICE_ACCOUNT (service account JSON), CRON_SECRET (optional, for the daily cron).
import { db, isAuthorized } from './_firebaseAdmin.js';
import { createAggregate, addResult, mergeAggregates, summarize } from '../src/analytics.js';

const RAW_RETENTION_DAYS = 180;
const CLICK_GRACE_MS = 24 * 60 * 60 * 1000;
const PURGE_BATCH = 500;
const PURGE_MAX_BATCHES = 20;

// Folds the tests in [watermark, cutoff) into the stored aggregate, atomically.
const foldIntoRollup = (rollupRef, results, cutoff, keepFromDay) => db.runTransaction(async (tx) => {
  const snap = await tx.get(rollupRef);
  const state = snap.exists ? snap.data() : {};
  const docs = await tx.get(results.where('created_at', '>=', state.watermark || '').where('created_at', '<', cutoff));

  const fresh = createAggregate();
  docs.forEach(d => addResult(fresh, d.data()));
  const next = mergeAggregates(state, fresh);
  Object.keys(next.daily).forEach(day => { if (day < keepFromDay) delete next.daily[day]; });

  tx.set(rollupRef, { ...next, watermark: cutoff, updatedAt: new Date().toISOString() });
  return next;
});

const purgeOldResults = async (results, purgeBefore) => {
  let purged = 0;
  for (let i = 0; i < PURGE_MAX_BATCHES; i++) {
    const snap = await results.where('created_at', '<', purgeBefore).select().limit(PURGE_BATCH).get();
    if (snap.empty) break;
    const batch = db.batch();
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    purged += snap.size;
    if (snap.size < PURGE_BATCH) break;
  }
  return purged;
};

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: 'method not allowed' });
  if (!(await isAuthorized(req, { allowCron: true }))) return res.status(401).json({ error: 'unauthorized' });

  try {
    const now = Date.now();
    const cutoff = new Date(now - CLICK_GRACE_MS).toISOString();
    const purgeBefore = new Date(now - RAW_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const results = db.collection('all_test_results');

    const base = await foldIntoRollup(db.collection('stats').doc('rollup'), results, cutoff, purgeBefore.slice(0, 10));

    const recent = createAggregate();
    (await results.where('created_at', '>=', cutoff).get()).forEach(d => addResult(recent, d.data()));

    const purged = await purgeOldResults(results, purgeBefore);
    return res.status(200).json({ ...summarize(mergeAggregates(base, recent), now), purged });
  } catch (err) {
    console.error('analytics rollup failed:', err);
    return res.status(500).json({ error: 'internal error' });
  }
}
