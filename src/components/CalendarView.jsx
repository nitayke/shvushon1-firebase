import React, { useState, useEffect, useMemo } from 'react';
import { CalendarDays, ChevronRight, ChevronLeft, Clock } from 'lucide-react';
import { getEventsInRangeDB, toDateKey, EVENT_TYPES } from '../manager';

const DAY_NAMES = ['יום ראשון', 'יום שני', 'יום שלישי', 'יום רביעי', 'יום חמישי', 'יום שישי', 'שבת'];

const startOfWeek = (d) => {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  r.setDate(r.getDate() - r.getDay());
  return r;
};
const addDays = (d, n) => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};

const hebrewDay = (d) => new Intl.DateTimeFormat('he-u-ca-hebrew', { day: 'numeric', month: 'long' }).format(d);
const gregDay = (d) => new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'long' }).format(d);

const TYPE_COLORS = {
  open_day: { bg: 'rgba(180, 120, 40, 0.14)', border: 'var(--gold-accent)' },
  shabbat: { bg: 'rgba(82, 52, 29, 0.10)', border: 'var(--primary-accent)' }
};

export default function CalendarView() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    getEventsInRangeDB(toDateKey(days[0]), toDateKey(days[6]))
      .then(list => { if (!cancelled) setEvents(list); })
      .catch(err => {
        console.error('Calendar load error:', err);
        if (!cancelled) { setEvents([]); setError('שגיאה בטעינת הלוח'); }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [days]);

  const todayKey = toDateKey(new Date());
  const isCurrentWeek = toDateKey(weekStart) === toDateKey(startOfWeek(new Date()));
  const rangeLabel = `${gregDay(days[0])} – ${gregDay(days[6])}`;

  return (
    <div className="glass-card">
      <h2 className="section-title" style={{ marginBottom: '0.4rem' }}>
        <CalendarDays className="w-5 h-5" />
        לוח ימים פתוחים ושבתות שבושים
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '1rem' }}>
        כל הימים הפתוחים ושבתות השבושים שהישיבות והמכינות פרסמו, לפי שבועות.
      </p>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <button className="btn-secondary" onClick={() => setWeekStart(addDays(weekStart, -7))} aria-label="שבוע קודם">
          <ChevronRight style={{ width: 16, height: 16 }} />
          שבוע קודם
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{rangeLabel}</div>
          {!isCurrentWeek && (
            <button className="btn-secondary" style={{ marginTop: 4, minHeight: 32, padding: '0.2rem 0.8rem', fontSize: '0.85rem' }}
              onClick={() => setWeekStart(startOfWeek(new Date()))}>
              השבוע
            </button>
          )}
        </div>
        <button className="btn-secondary" onClick={() => setWeekStart(addDays(weekStart, 7))} aria-label="שבוע הבא">
          שבוע הבא
          <ChevronLeft style={{ width: 16, height: 16 }} />
        </button>
      </div>

      {error && <div style={{ color: '#b91c1c', marginBottom: '0.8rem' }}>{error}</div>}
      {loading && <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>טוען...</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.6rem' }}>
        {days.map((d, i) => {
          const key = toDateKey(d);
          const dayEvents = events
            .filter(e => e.date === key)
            .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
          return (
            <div key={key} style={{
              border: `1px solid ${key === todayKey ? 'var(--gold-accent)' : 'var(--border-color)'}`,
              borderRadius: 'var(--radius-md)',
              background: key === todayKey ? 'var(--bg-card-hover)' : 'var(--bg-card)',
              padding: '0.6rem',
              minHeight: 110
            }}>
              <div style={{ fontWeight: 700, color: i === 6 ? 'var(--gold-accent)' : 'var(--text-primary)' }}>{DAY_NAMES[i]}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                {gregDay(d)} · {hebrewDay(d)}
              </div>
              {dayEvents.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</div>
              ) : dayEvents.map(ev => (
                <div key={ev.id} style={{
                  background: TYPE_COLORS[ev.type]?.bg,
                  borderInlineStart: `3px solid ${TYPE_COLORS[ev.type]?.border}`,
                  borderRadius: 6,
                  padding: '0.35rem 0.5rem',
                  marginBottom: '0.4rem',
                  fontSize: '0.85rem'
                }}>
                  <div style={{ fontWeight: 700 }}>{ev.yeshivaName}</div>
                  <div>{EVENT_TYPES[ev.type] || ev.type}</div>
                  {ev.time && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--text-secondary)' }} dir="ltr">
                      <Clock style={{ width: 12, height: 12 }} />{ev.time}
                    </div>
                  )}
                  {ev.notes && <div style={{ color: 'var(--text-secondary)', marginTop: 2 }}>{ev.notes}</div>}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {!loading && !error && events.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '1rem' }}>אין אירועים בשבוע הזה.</p>
      )}
    </div>
  );
}
