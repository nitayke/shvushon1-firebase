// Vercel function: data for the per-yeshiva exposure report (admin only). GET /api/yeshiva-report?id=<yeshivaId>
//
// Scanning the last REPORT_WINDOW_DAYS days of all_test_results is the expensive part (one read per
// document), so a single scan builds the report of EVERY yeshiva and stores them in `report_cache/{id}`.
// Requests are then served from the cache (1 read) until it is older than CACHE_TTL_MS. If a rebuild
// fails (e.g. Firestore quota) a stale cached report is still served, flagged with `stale: true`.
// Errors carry a machine-readable `code` the UI turns into a clear message.
import { db, isAuthorized } from './_firebaseAdmin.js';
import { buildYeshivaReport, REPORT_WINDOW_DAYS } from '../src/yeshivaReport.js';
import { bannerStatus, todayKey } from '../src/listing.js';

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const BATCH_SIZE = 400;

const isQuotaError = (err) => err?.code === 8 || /RESOURCE_EXHAUSTED|quota/i.test(String(err?.message || ''));

const fail = (res, status, code) => res.status(status).json({ error: code, code });

// One scan of the window -> a report per yeshiva, saved to report_cache.
const rebuildCache = async (yeshivaDocs, now) => {
  const since = new Date(now - REPORT_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const snap = await db.collection('all_test_results').where('created_at', '>=', since)
    .select('created_at', 'top_matches', 'top_match', 'contact_clicks', 'preferences').get();
  const results = snap.docs.map(d => d.data());
  const yeshivot = yeshivaDocs.map(d => ({ id: d.id, name: d.get('name'), banner_bookings: d.get('banner_bookings') }));

  const reports = {};
  const generatedAt = new Date(now).toISOString();
  for (let i = 0; i < yeshivaDocs.length; i += BATCH_SIZE) {
    const batch = db.batch();
    yeshivaDocs.slice(i, i + BATCH_SIZE).forEach(d => {
      const report = buildYeshivaReport({ yeshiva: { id: d.id, ...d.data() }, yeshivot, results, now });
      reports[d.id] = report;
      batch.set(db.collection('report_cache').doc(d.id), { report, generatedAt });
    });
    await batch.commit();
  }
  return reports;
};

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return fail(res, 405, 'method_not_allowed');
  if (!(await isAuthorized(req))) return fail(res, 401, 'unauthorized');

  const id = String(req.query?.id || '');
  if (!id) return fail(res, 400, 'missing_id');

  const now = Date.now();
  let cached = null;
  try {
    // yeshivot are read every time (small) so the banner status is always current.
    const [yeshivaSnap, yeshivaDocsSnap, cacheSnap] = await Promise.all([
      db.collection('yeshivot').doc(id).get(),
      db.collection('yeshivot').get(),
      db.collection('report_cache').doc(id).get()
    ]);
    if (!yeshivaSnap.exists) return fail(res, 404, 'yeshiva_not_found');
    const yeshivot = yeshivaDocsSnap.docs.map(d => ({ id: d.id, name: d.get('name'), banner_bookings: d.get('banner_bookings') }));
    const banner = bannerStatus(yeshivot, todayKey(now));

    cached = cacheSnap.exists ? cacheSnap.data() : null;
    const fresh = cached && now - Date.parse(cached.generatedAt) < CACHE_TTL_MS;
    if (fresh) return res.status(200).json({ ...cached.report, banner });

    try {
      const reports = await rebuildCache(yeshivaDocsSnap.docs, now);
      return res.status(200).json({ ...reports[id], banner });
    } catch (err) {
      if (!cached) throw err;
      console.error('yeshiva report rebuild failed, serving stale cache:', err);
      return res.status(200).json({ ...cached.report, banner, stale: true, staleReason: isQuotaError(err) ? 'quota' : 'error' });
    }
  } catch (err) {
    console.error('yeshiva report failed:', err);
    return isQuotaError(err) ? fail(res, 503, 'quota_exceeded') : fail(res, 500, 'internal_error');
  }
}
