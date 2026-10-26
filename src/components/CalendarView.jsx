import React, { useState, useEffect } from 'react';
import { CalendarDays, Clock } from 'lucide-react';
import { getUpcomingEventsDB, parseDateKey, EVENT_TYPES } from '../manager';

const fullDate = (key) => new Intl.DateTimeFormat('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(parseDateKey(key));
const hebrewDate = (key) => new Intl.DateTimeFormat('he-u-ca-hebrew', { day: 'numeric', month: 'long' }).format(parseDateKey(key));

const TYPE_COLORS = {
  open_day: { bg: 'rgba(180, 120, 40, 0.14)', border: 'var(--gold-accent)' },
  shabbat: { bg: 'rgba(82, 52, 29, 0.10)', border: 'var(--primary-accent)' }
};

export default function CalendarView() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getUpcomingEventsDB()
      .then(setEvents)
      .catch(err => {
        console.error('Calendar load error:', err);
        setError('שגיאה בטעינת הלוח');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="glass-card">
      <h2 className="section-title" style={{ marginBottom: '0.4rem' }}>
        <CalendarDays className="w-5 h-5" />
        ימים פתוחים ושבתות שבושים
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '1rem' }}>
        האירועים הקרובים שהישיבות והמכינות פרסמו, מהקרוב לרחוק.
      </p>

      {error && <div style={{ color: '#b91c1c', marginBottom: '0.8rem' }}>{error}</div>}
      {loading && <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>טוען...</p>}
      {!loading && !error && events.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>אין כרגע אירועים קרובים.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {events.map(ev => (
          <div key={ev.id} style={{
            background: TYPE_COLORS[ev.type]?.bg,
            borderInlineStart: `4px solid ${TYPE_COLORS[ev.type]?.border}`,
            borderRadius: 'var(--radius-md)',
            padding: '0.7rem 0.9rem'
          }}>
            <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{ev.yeshivaName}</div>
            <div style={{ fontWeight: 600 }}>{EVENT_TYPES[ev.type] || ev.type}</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              {fullDate(ev.date)} · {hebrewDate(ev.date)}
            </div>
            {ev.time && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <Clock style={{ width: 13, height: 13 }} />
                <span dir="ltr">{ev.time}</span>
              </div>
            )}
            {ev.notes && <div style={{ marginTop: 2, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{ev.notes}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
