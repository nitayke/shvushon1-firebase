// Vercel function: data for the per-yeshiva exposure report (admin only). GET /api/yeshiva-report?id=<yeshivaId>
// Reads only the last REPORT_WINDOW_DAYS days of all_test_results.
import { db, isAuthorized } from './_firebaseAdmin.js';
import { buildYeshivaReport, REPORT_WINDOW_DAYS } from '../src/yeshivaReport.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: 'method not allowed' });
  if (!(await isAuthorized(req))) return res.status(401).json({ error: 'unauthorized' });

  const id = String(req.query?.id || '');
  if (!id) return res.status(400).json({ error: 'missing id' });

  try {
    const now = Date.now();
    const since = new Date(now - REPORT_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const results = db.collection('all_test_results');

    const [yeshivaSnap, yeshivotSnap, recentSnap] = await Promise.all([
      db.collection('yeshivot').doc(id).get(),
      db.collection('yeshivot').select('name').get(),
      results.where('created_at', '>=', since).select('created_at', 'top_matches', 'top_match', 'contact_clicks', 'preferences').get()
    ]);
    if (!yeshivaSnap.exists) return res.status(404).json({ error: 'yeshiva not found' });

    const report = buildYeshivaReport({
      yeshiva: { id, ...yeshivaSnap.data() },
      yeshivot: yeshivotSnap.docs.map(d => ({ id: d.id, name: d.get('name') })),
      results: recentSnap.docs.map(d => d.data()),
      now
    });
    return res.status(200).json(report);
  } catch (err) {
    console.error('yeshiva report failed:', err);
    return res.status(500).json({ error: 'internal error' });
  }
}
