import React, { useState, useEffect } from 'react';
import { CalendarDays, Clock, Phone } from 'lucide-react';
import { getUpcomingEventsDB, parseDateKey, EVENT_TYPES, telUrl, whatsappUrl } from '../manager';

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

// lucide-react has no brand icons, so the WhatsApp logo is inline
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="#25D366" aria-hidden="true">
    <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.05 21.8h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88zM20.52 3.45A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.69 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.16-3.49-8.4z"/>
  </svg>
);

const contactBtn = { textDecoration: 'none', padding: '0.3rem 0.7rem', fontSize: '0.85rem' };

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
              {ev.phone && (
                <div style={{ marginTop: 6 }}>
                  {ev.hasWhatsapp ? (
                    <a href={whatsappUrl(ev.phone)} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={contactBtn}>
                      <WhatsAppIcon />
                      ווצאפ לאחראי
                    </a>
                  ) : (
                    <a href={telUrl(ev.phone)} className="btn-secondary" style={contactBtn}>
                      <Phone style={{ width: 14, height: 14 }} />
                      טלפון לאחראי
                    </a>
                  )}
                </div>
              )}
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
