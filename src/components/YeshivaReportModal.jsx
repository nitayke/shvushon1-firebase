import React, { useEffect, useRef, useState } from 'react';
import { Download, X } from 'lucide-react';
import { getYeshivaReportDB } from '../firebase';
import { ReportPageOne, ReportPageTwo, ReportPageThree, reportFacts, PAGE_W, PAGE_H } from './YeshivaReport';
import { REPORT_MIN_RECIPIENTS } from '../yeshivaReport';
import { saveReportPdf } from '../reportPdf';
import { PRICE_TIERS } from '../listing';

const dayLabel = (key) => new Date(`${key}T12:00:00`).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric', year: 'numeric' });

const SENDER_KEY = 'shvushon_report_sender_v2';
const DEFAULT_SENDER = 'אמיתי סולר';
const DEFAULT_PHONE = '058-432-0642';
const readSender = () => {
  try { return JSON.parse(localStorage.getItem(SENDER_KEY) || '{}'); } catch { return {}; }
};

const label = { display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.25rem', color: '#111827' };

export default function YeshivaReportModal({ yeshiva, onClose, initialReport = null }) {
  const [report, setReport] = useState(initialReport);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [note, setNote] = useState('');
  const [sender, setSender] = useState(() => readSender().sender ?? DEFAULT_SENDER);
  const [phone, setPhone] = useState(() => readSender().phone ?? DEFAULT_PHONE);
  const [scale, setScale] = useState(0.6);
  const [tierId, setTierId] = useState(''); // '' = by the monthly exposure
  const pageOne = useRef(null);
  const pageTwo = useRef(null);
  const pageThree = useRef(null);
  const previewBox = useRef(null);

  useEffect(() => {
    if (initialReport) return;
    let cancelled = false;
    getYeshivaReportDB(yeshiva.id)
      .then(r => { if (!cancelled) setReport(r); })
      .catch(() => { if (!cancelled) setError('שגיאה בטעינת הנתונים לדו"ח.'); });
    return () => { cancelled = true; };
  }, [yeshiva.id, initialReport]);

  useEffect(() => {
    const el = previewBox.current;
    if (!el) return;
    const fit = () => setScale(Math.min(0.75, (el.clientWidth - 2) / PAGE_W));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [report]);

  useEffect(() => {
    try { localStorage.setItem(SENDER_KEY, JSON.stringify({ sender, phone })); } catch { /* storage unavailable */ }
  }, [sender, phone]);

  const facts = report ? reportFacts(report) : null;

  const handleDownload = async () => {
    setSaving(true);
    setError('');
    try {
      const date = new Date().toISOString().slice(0, 10);
      const safeName = yeshiva.name.replace(/[\\/:*?"<>|]/g, '').trim();
      await saveReportPdf([pageOne.current, pageTwo.current, pageThree.current], `שבושון - ${safeName} - ${date}.pdf`, `שבושון · דו"ח חשיפה והצעת מחיר · ${yeshiva.name}`);
    } catch (err) {
      console.error('PDF export failed:', err);
      setError('שגיאה ביצירת קובץ ה-PDF.');
    } finally {
      setSaving(false);
    }
  };

  const tier = facts ? (PRICE_TIERS.find(t => t.id === tierId) || facts.tier) : null;
  const pageProps = { r: report, f: facts, recipient: recipient.trim(), note, sender, phone: phone.trim(), tierId: tier?.id };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="glass-card" style={{ maxWidth: 1100, width: '100%', maxHeight: '94vh', overflowY: 'auto', background: '#ffffff', border: '1px solid #e2d9c8', marginBottom: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>דו"ח חשיפה והצעת מחיר – {yeshiva.name}</h2>
          <button type="button" className="btn-secondary" onClick={onClose} style={{ padding: '0.4rem 0.6rem' }} aria-label="סגור">
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {error && <div style={{ color: '#b91c1c', marginBottom: '1rem' }}>{error}</div>}
        {!report && !error && <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>אוסף נתונים עדכניים...</div>}

        {report && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '1.5rem', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <div style={{ background: '#f8f4ec', border: '1px solid #e2d9c8', borderRadius: 8, padding: '0.8rem', fontSize: '0.85rem', color: '#374151' }}>
                {facts.showOwn
                  ? <>ב-30 הימים האחרונים {report.yeshiva.name} יצאה ל-<strong>{report.own.top3.toLocaleString('he-IL')}</strong> תלמידים בטופ 3, ולכן הנתון מוצג במסמך.</>
                  : <>ב-30 הימים האחרונים {report.yeshiva.name} יצאה ל-{report.own.top3} תלמידים בלבד בטופ 3 (עד {REPORT_MIN_RECIPIENTS}), ולכן המסמך מציג נתוני אתר כלליים במקום.</>}
              </div>
              <div style={{ background: '#f8f4ec', border: '1px solid #e2d9c8', borderRadius: 8, padding: '0.8rem', fontSize: '0.85rem', color: '#374151' }}>
                {report.banner?.current
                  ? <>באנר: כרגע <strong>{report.banner.current.yeshivaName}</strong> עד {dayLabel(report.banner.current.end)}. </>
                  : <>באנר: פנוי כרגע. </>}
                השריון הבא אפשרי מ-<strong>{dayLabel(report.banner?.nextFree || new Date().toISOString().slice(0, 10))}</strong>.
                {' '}(במסמך לא מופיע שם המוסד שבבאנר, רק עד מתי הוא תפוס.)
              </div>
              <div>
                <label style={label}>מדרגת מחיר</label>
                <select className="input-field" style={{ marginBottom: 0 }} value={tierId} onChange={e => setTierId(e.target.value)}>
                  <option value="">לפי החשיפה ({report.own.top3} בטופ 3): {facts.tier.label}</option>
                  {PRICE_TIERS.map(t => <option key={t.id} value={t.id}>{t.label}: {t.quarter} / {t.year} / {t.bundle} ₪</option>)}
                </select>
                <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 4 }}>
                  רבעון {tier.quarter} ₪ · שנה {tier.year} ₪ · שנה + באנר לחודש {tier.bundle} ₪
                </div>
              </div>
              <div>
                <label style={label}>לכבוד (לא חובה)</label>
                <input className="input-field" style={{ marginBottom: 0 }} value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="למשל: הרב ישראל ישראלי, ראש הישיבה" />
              </div>
              <div>
                <label style={label}>החתום (יישמר לפעם הבאה)</label>
                <input className="input-field" style={{ marginBottom: 0 }} value={sender} onChange={e => setSender(e.target.value)} placeholder="ברירת מחדל: צוות שבושון" />
              </div>
              <div>
                <label style={label}>טלפון ליצירת קשר (לא חובה)</label>
                <input className="input-field" style={{ marginBottom: 0 }} dir="ltr" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div>
                <label style={label}>מילים אחרונות בעמוד ההצעה (ריק = נוסח ברירת המחדל)</label>
                <textarea className="input-field" style={{ marginBottom: 0, minHeight: 110, resize: 'vertical' }} value={note} onChange={e => setNote(e.target.value)} placeholder="למשל: למי שסוגר עד סוף החודש..." />
              </div>
              <button type="button" className="btn-primary" onClick={handleDownload} disabled={saving}>
                <Download style={{ width: 18, height: 18 }} />
                {saving ? 'מכין PDF...' : 'הורדת PDF'}
              </button>
            </div>

            <div ref={previewBox} style={{ minWidth: 0 }}>
              {[pageOne, pageTwo, pageThree].map((ref, i) => (
                <div key={i} style={{ width: PAGE_W * scale, height: PAGE_H * scale, overflow: 'hidden', marginBottom: '1rem', boxShadow: '0 2px 12px rgba(0,0,0,0.15)', border: '1px solid #e2d9c8', direction: 'ltr' }}>
                  <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: PAGE_W }}>
                    {i === 0 ? <ReportPageOne ref={ref} {...pageProps} /> : i === 1 ? <ReportPageTwo ref={ref} {...pageProps} /> : <ReportPageThree ref={ref} {...pageProps} />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
