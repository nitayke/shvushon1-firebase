import React, { useState, useEffect } from 'react';
import { CalendarDays, Clock } from 'lucide-react';
import { getUpcomingEventsDB, parseDateKey, EVENT_TYPES } from '../manager';

const fmt = (key, opts, locale = 'he-IL') => new Intl.DateTimeFormat(locale, opts).format(parseDateKey(key));

const ONES = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
const TENS = ['', 'י', 'כ', 'ל'];
// Day of the Hebrew month (1-30) as letters, e.g. 27 -> כ״ז
const hebrewDayLetters = (n) => {
  let letters = n === 15 ? 'טו' : n === 16 ? 'טז' : TENS[Math.floor(n / 10)] + ONES[n % 10];
  return letters.length === 1 ? `${letters}׳` : `${letters.slice(0, -1)}״${letters.slice(-1)}`;
};
const hebrewParts = (key) => {
  const parts = new Intl.DateTimeFormat('he-u-ca-hebrew', { day: 'numeric', month: 'long' }).formatToParts(parseDateKey(key));
  return {
    day: hebrewDayLetters(Number(parts.find(p => p.type === 'day').value)),
    month: parts.find(p => p.type === 'month').value
  };
};

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
            padding: '0.7rem 0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.8rem'
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{ev.yeshivaName}</div>
              <div style={{ fontWeight: 600 }}>{EVENT_TYPES[ev.type] || ev.type}</div>
              {ev.notes && <div style={{ marginTop: 2, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{ev.notes}</div>}
            </div>
            <div style={{ textAlign: 'center', minWidth: 84, lineHeight: 1.25, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              <div style={{ fontWeight: 800, fontSize: '1.9rem', color: 'var(--primary-accent)', lineHeight: 1.1 }}>{hebrewParts(ev.date).day}</div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--primary-accent)' }}>{hebrewParts(ev.date).month}</div>
              {ev.type !== 'shabbat' && <div style={{ marginTop: 2 }}>{fmt(ev.date, { weekday: 'long' })}</div>}
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{fmt(ev.date, { day: 'numeric', month: 'numeric' })}</div>
              {ev.time && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, marginTop: 2, fontWeight: 600 }}>
                  <Clock style={{ width: 12, height: 12 }} />
                  <span dir="ltr">{ev.time}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
