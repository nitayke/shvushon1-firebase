import React, { useEffect, useRef, useState } from 'react';
import { Download, X } from 'lucide-react';
import { PriceListPage } from './PriceList';
import { PAGE_W, PAGE_H } from './YeshivaReport';
import { PRICE_PRESETS, buildPriceList } from '../listing';
import { saveReportPdf } from '../reportPdf';

const SENDER_KEY = 'shvushon_report_sender_v2'; // shared with the exposure report
const readSender = () => {
  try { return JSON.parse(localStorage.getItem(SENDER_KEY) || '{}'); } catch { return {}; }
};

const SLIDERS = [
  { key: 'card', label: 'כרטיס מורחב לרבעון', min: 200, max: 2000, step: 50, note: (l) => `חצי שנה ${l.card[1][2]} · שנה ${l.card[2][2]}` },
  { key: 'mainBanner', label: 'באנר ראשי בדף הבית, לחודש', min: 300, max: 4000, step: 50, note: (l) => `רבעון ${l.mainBanner[1][2]} · חצי שנה ${l.mainBanner[2][2]}` },
  { key: 'questionBanner', label: 'באנר בשאלה, לחודש', min: 100, max: 1500, step: 25, note: (l) => `רבעון ${l.questionBanner[1][2]} · חצי שנה ${l.questionBanner[2][2]}` }
];

const label = { display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.25rem', color: '#111827' };

export default function PriceListModal({ onClose }) {
  const [preset, setPreset] = useState('low');
  const [prices, setPrices] = useState(PRICE_PRESETS.low);
  const [sender, setSender] = useState(() => readSender().sender ?? 'אמיתי סולר');
  const [phone, setPhone] = useState(() => readSender().phone ?? '058-432-0642');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [scale, setScale] = useState(0.6);
  const page = useRef(null);
  const previewBox = useRef(null);
  const list = buildPriceList(prices);

  useEffect(() => {
    const el = previewBox.current;
    if (!el) return;
    const fit = () => setScale(Math.min(0.75, (el.clientWidth - 2) / PAGE_W));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    try { localStorage.setItem(SENDER_KEY, JSON.stringify({ sender, phone })); } catch { /* storage unavailable */ }
  }, [sender, phone]);

  const choosePreset = (id) => {
    setPreset(id);
    setPrices(PRICE_PRESETS[id]);
  };

  const handleDownload = async () => {
    setSaving(true);
    setError('');
    try {
      const date = new Date().toISOString().slice(0, 10);
      await saveReportPdf([page.current], `שבושון - מחירון - ${date}.pdf`, 'שבושון · מחירון פרסום');
    } catch (err) {
      console.error('PDF export failed:', err);
      setError('שגיאה ביצירת קובץ ה-PDF.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="glass-card" style={{ maxWidth: 1100, width: '100%', maxHeight: '94vh', overflowY: 'auto', background: '#ffffff', border: '1px solid #e2d9c8', marginBottom: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>מחירון פרסום</h2>
          <button type="button" className="btn-secondary" onClick={onClose} style={{ padding: '0.4rem 0.6rem' }} aria-label="סגור">
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {error && <div style={{ color: '#b91c1c', marginBottom: '1rem' }}>{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '1.5rem', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <span style={label}>נקודת התחלה</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[['low', 'מחירון נמוך'], ['high', 'מחירון גבוה']].map(([id, text]) => (
                  <button key={id} type="button" onClick={() => choosePreset(id)}
                    className={preset === id ? 'btn-primary' : 'btn-secondary'} style={{ flex: 1, minHeight: 40, padding: '0.4rem 0.8rem' }}>
                    {text}
                  </button>
                ))}
              </div>
            </div>

            {SLIDERS.map(s => (
              <div key={s.key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <label style={label} htmlFor={`price-${s.key}`}>{s.label}</label>
                  <strong style={{ fontSize: '1.05rem', color: '#52341d' }}>{prices[s.key].toLocaleString('he-IL')} ₪</strong>
                </div>
                <input
                  id={`price-${s.key}`}
                  type="range"
                  min={s.min}
                  max={s.max}
                  step={s.step}
                  value={prices[s.key]}
                  onChange={e => { setPreset(''); setPrices(p => ({ ...p, [s.key]: Number(e.target.value) })); }}
                  style={{ width: '100%', accentColor: '#52341d' }}
                />
                <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>מחושב אוטומטית: {s.note(list)} ₪</div>
              </div>
            ))}
            <div style={{ fontSize: '0.82rem', color: '#374151', background: '#f8f4ec', border: '1px solid #e2d9c8', borderRadius: 8, padding: '0.6rem 0.8rem' }}>
              חבילה (כרטיס לשנה + חודש באנר ראשי): <strong>{list.bundle.toLocaleString('he-IL')} ₪</strong>
            </div>

            <div>
              <label style={label}>החתום (יישמר לפעם הבאה)</label>
              <input className="input-field" style={{ marginBottom: 0 }} value={sender} onChange={e => setSender(e.target.value)} placeholder="ברירת מחדל: צוות שבושון" />
            </div>
            <div>
              <label style={label}>טלפון ליצירת קשר (לא חובה)</label>
              <input className="input-field" style={{ marginBottom: 0 }} dir="ltr" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <button type="button" className="btn-primary" onClick={handleDownload} disabled={saving}>
              <Download style={{ width: 18, height: 18 }} />
              {saving ? 'מכין PDF...' : 'הורדת מחירון PDF'}
            </button>
          </div>

          <div ref={previewBox} style={{ minWidth: 0 }}>
            <div style={{ width: PAGE_W * scale, height: PAGE_H * scale, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.15)', border: '1px solid #e2d9c8', direction: 'ltr' }}>
              <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: PAGE_W }}>
                <PriceListPage ref={page} list={list} sender={sender} phone={phone.trim()} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
