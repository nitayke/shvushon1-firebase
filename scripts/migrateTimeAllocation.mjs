// One-off migration: the 1-5 ratings for gemara / emunah / tanach / karviut / social become a time split
// (`time`: percents summing to 100, see src/timeAllocation.js).
//
// - yeshivot:            set `time` from the old ratings and remove the 5 old keys from `ratings`
// - student_submissions: add `time` (old ratings are kept as history)
// - yeshiva_requests:    add `time` (old ratings are kept)
// Documents that already have a valid `time` are skipped. all_test_results are not touched: they are
// answers to the old questions and the code ignores the old keys.
//
// Run from a directory that has firebase-admin installed (not the project):
//   node scripts/migrateTimeAllocation.mjs <service-account.json> <backup-dir>            (dry run)
//   node scripts/migrateTimeAllocation.mjs <service-account.json> <backup-dir> --apply    (writes)
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { pathToFileURL } from 'url';

const [saPath, backupDir, flag] = process.argv.slice(2);
if (!saPath || !backupDir) {
  console.error('usage: node migrateTimeAllocation.mjs <service-account.json> <backup-dir> [--apply]');
  process.exit(1);
}
const APPLY = flag === '--apply';

// firebase-admin is resolved from the current working directory (a temp dir), not from the project.
const requireFromCwd = createRequire(path.join(process.cwd(), 'noop.js'));
const { initializeApp, cert } = requireFromCwd('firebase-admin/app');
const { getFirestore, FieldValue } = requireFromCwd('firebase-admin/firestore');
const { ratingsToTime, isValidTime, LEGACY_TIME_PARAMS, TIME_IDS } = await import(
  pathToFileURL(path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..', 'src', 'timeAllocation.js')).href
);

initializeApp({ credential: cert(JSON.parse(fs.readFileSync(saPath, 'utf8'))) });
const db = getFirestore();

const plan = []; // { ref, update, label }
const backup = {};

const fmt = (t) => TIME_IDS.map(id => `${id} ${t[id]}%`).join(', ');

for (const [collection, dropOldKeys] of [['yeshivot', true], ['student_submissions', false], ['yeshiva_requests', false]]) {
  const snap = await db.collection(collection).get();
  backup[collection] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  let skipped = 0;
  snap.forEach(d => {
    const data = d.data();
    if (isValidTime(data.time) || !data.ratings) { skipped++; return; }
    const time = ratingsToTime(data.ratings);
    const update = { time };
    if (dropOldKeys) {
      LEGACY_TIME_PARAMS.forEach(k => { if (k in data.ratings) update[`ratings.${k}`] = FieldValue.delete(); });
    }
    plan.push({ ref: d.ref, update, label: `${collection}/${d.id} ${data.name || data.yeshiva_name || ''}`, time, type: data.type, collection });
  });
  console.log(`${collection}: ${snap.size} docs, ${snap.size - skipped} to migrate, ${skipped} skipped`);
}

// Summary of the converted yeshivot
const ys = plan.filter(p => p.collection === 'yeshivot');
const avgBy = (rows) => Object.fromEntries(TIME_IDS.map(id => [id, Math.round(rows.reduce((s, r) => s + r.time[id], 0) / Math.max(1, rows.length))]));
console.log('\naverage yeshiva split:', fmt(avgBy(ys)));
['hesder', 'gvoha', 'hesder_gvoha', 'mechina'].forEach(t => {
  const rows = ys.filter(r => r.type === t);
  if (rows.length) console.log(`  ${t} (${rows.length}):`, fmt(avgBy(rows)));
});
console.log('\nsamples:');
ys.slice(0, 12).forEach(p => console.log(' ', p.label, '->', fmt(p.time)));

fs.mkdirSync(backupDir, { recursive: true });
const backupFile = path.join(backupDir, `time-migration-backup-${Date.now()}.json`);
fs.writeFileSync(backupFile, JSON.stringify(backup, null, 1));
console.log('\nbackup written to', backupFile);

if (!APPLY) {
  console.log(`\nDRY RUN: ${plan.length} documents would be updated. Re-run with --apply to write.`);
  process.exit(0);
}

for (let i = 0; i < plan.length; i += 400) {
  const batch = db.batch();
  plan.slice(i, i + 400).forEach(p => batch.update(p.ref, p.update));
  await batch.commit();
}
console.log(`\nAPPLIED: ${plan.length} documents updated.`);
