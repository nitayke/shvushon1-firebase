import React, { useState, useEffect, useMemo } from 'react';
import { Search, ArrowDownUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getAllTestResultsDB, getYeshivotDB } from '../firebase';
import { computeAnalytics } from '../analytics';
import { PARAM_DEFINITIONS, REGION_TRANSLATIONS } from '../knn';

const CACHE_KEY = 'shvushon_analytics_cache_v1';
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a855f7'];

const readCache = () => {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); } catch { return null; }
};
const writeCache = (stats) => {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(stats)); } catch { /* storage unavailable */ }
};

const cardTitle = { fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', color: '#1e293b' };

export default function AnalyticsTab({ refreshTick }) {
  // Show the last computed summary immediately, then refresh it in the background.
  const [stats, setStats] = useState(readCache);
  const [yeshivotList, setYeshivotList] = useState([]);
  const [refreshing, setRefreshing] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('first'); // 'first' | 'top3' | 'name'

  useEffect(() => {
    let cancelled = false;
    setRefreshing(true);
    setError(false);
    Promise.all([getAllTestResultsDB(), getYeshivotDB().catch(() => [])])
      .then(([results, yeshivot]) => {
        if (cancelled) return;
        const next = computeAnalytics(results);
        writeCache(next);
        setStats(next);
        setYeshivotList(yeshivot);
      })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setRefreshing(false); });
    return () => { cancelled = true; };
  }, [refreshTick]);

  // Every yeshiva in the database, including ones that were never suggested (0 times).
  const rows = useMemo(() => {
    if (!stats) return [];
    const byName = new Map(stats.yeshivot.map(y => [y.name, { ...y }]));
    yeshivotList.forEach(y => {
      if (!byName.has(y.name)) byName.set(y.name, { name: y.name, first: 0, top3: 0 });
    });
    return [...byName.values()];
  }, [stats, yeshivotList]);

  const visibleRows = useMemo(() => {
    const q = query.trim();
    const filtered = q ? rows.filter(r => r.name.includes(q)) : rows;
    return [...filtered].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name, 'he');
      return (b[sortBy] - a[sortBy]) || (b.top3 - a.top3) || a.name.localeCompare(b.name, 'he');
    });
  }, [rows, query, sortBy]);

  if (!stats) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
        {error ? 'שגיאה בטעינת הנתונים.' : 'טוען נתונים...'}
      </div>
    );
  }
  if (stats.total === 0) {
    return <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>אין עדיין תוצאות מבדקים.</div>;
  }

  const paramAveragesData = PARAM_DEFINITIONS.map(p => ({ name: p.label, avg: stats.paramAverages[p.id] || 0 }))
    .sort((a, b) => b.avg - a.avg);
  const regionData = Object.entries(stats.regionCounts).map(([region, value]) => ({ name: REGION_TRANSLATIONS[region] || region, value }));
  const maxFirst = Math.max(1, ...rows.map(r => r.first));
  const neverShown = rows.filter(r => r.top3 === 0).length;

  const sortBtn = (key, label) => (
    <button
      type="button"
      onClick={() => setSortBy(key)}
      className={sortBy === key ? 'btn-primary' : 'btn-secondary'}
      style={{ padding: '0.35rem 0.8rem', fontSize: '0.82rem', minHeight: 36 }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ animation: 'fadeIn 0.3s', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.8rem' }}>
        <div className="glass-card" style={{ marginBottom: 0, textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{stats.total.toLocaleString('he-IL')}</div>
          <div style={{ color: '#64748b', fontSize: '0.85rem' }}>שאלונים הושלמו</div>
        </div>
        <div className="glass-card" style={{ marginBottom: 0, textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{stats.last7.toLocaleString('he-IL')}</div>
          <div style={{ color: '#64748b', fontSize: '0.85rem' }}>ב-7 הימים האחרונים</div>
        </div>
        <div className="glass-card" style={{ marginBottom: 0, textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{neverShown}</div>
          <div style={{ color: '#64748b', fontSize: '0.85rem' }}>ישיבות שלא הוצעו אף פעם</div>
        </div>
      </div>
      {refreshing && <div style={{ color: '#64748b', fontSize: '0.82rem' }}>מרענן נתונים...</div>}

      <div className="glass-card">
        <h3 style={cardTitle}>כל הישיבות והמכינות: כמה פעמים כל אחת יצאה</h3>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <Search style={{ position: 'absolute', insetInlineStart: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#94a3b8' }} />
            <input
              type="search"
              className="input-field"
              placeholder="חיפוש ישיבה..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ marginBottom: 0, paddingInlineStart: '2.4rem' }}
            />
          </div>
          <ArrowDownUp style={{ width: 16, height: 16, color: '#64748b' }} aria-hidden="true" />
          {sortBtn('first', 'מקום ראשון')}
          {sortBtn('top3', 'בטופ 3')}
          {sortBtn('name', 'שם')}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.92rem' }}>
            <thead>
              <tr style={{ textAlign: 'right', color: '#64748b', fontSize: '0.8rem' }}>
                <th style={{ padding: '0.4rem' }}>#</th>
                <th style={{ padding: '0.4rem' }}>ישיבה / מכינה</th>
                <th style={{ padding: '0.4rem' }}>מקום ראשון</th>
                <th style={{ padding: '0.4rem' }}>בטופ 3</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((r, i) => (
                <tr key={r.name} style={{ borderTop: '1px solid #e2d9c8' }}>
                  <td style={{ padding: '0.5rem 0.4rem', color: '#94a3b8' }}>{i + 1}</td>
                  <td style={{ padding: '0.5rem 0.4rem', fontWeight: 600 }}>{r.name}</td>
                  <td style={{ padding: '0.5rem 0.4rem', minWidth: 140 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <strong style={{ minWidth: 28 }}>{r.first}</strong>
                      <div style={{ flex: 1, height: 8, background: '#efe6d6', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ width: `${(r.first / maxFirst) * 100}%`, height: '100%', background: '#3b82f6' }} />
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '0.5rem 0.4rem' }}>{r.top3}</td>
                </tr>
              ))}
              {visibleRows.length === 0 && (
                <tr><td colSpan={4} style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>לא נמצאו ישיבות.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))', gap: '1.5rem' }}>
        <div className="glass-card" style={{ marginBottom: 0 }}>
          <h3 style={cardTitle}>ממוצע ציוני ההעדפות בשאלונים (1 עד 5)</h3>
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
              <BarChart data={paramAveragesData} margin={{ top: 5, right: 5, left: 0, bottom: 40 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" />
                <YAxis domain={[1, 5]} />
                <Tooltip />
                <Bar dataKey="avg" fill="#10b981" radius={[4, 4, 0, 0]} name="ממוצע ציון מבוקש" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card" style={{ marginBottom: 0 }}>
          <h3 style={cardTitle}>העדפת אזורים גאוגרפיים</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={regionData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {regionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
