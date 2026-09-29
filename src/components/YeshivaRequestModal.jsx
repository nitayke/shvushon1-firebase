import React, { useState } from 'react';
import { X, Send, CheckCircle, MailCheck, Mail } from 'lucide-react';
import { saveYeshivaRequestDB } from '../firebase';
import { PARAM_DEFINITIONS, REGIONS, TYPES, REGION_TRANSLATIONS, TYPE_TRANSLATIONS } from '../knn';
import CustomSelect from './CustomSelect';

export default function YeshivaRequestModal({ isOpen, onClose, onOpenAdmin, yeshivotList = [] }) {
  const [yeshivaName, setYeshivaName] = useState('');
  const [type, setType] = useState('');
  const [region, setRegion] = useState('');
  const [submitterEmail, setSubmitterEmail] = useState('');
  const [notes, setNotes] = useState('');

  // Initial suggested ratings (3 for all)
  const initialRatings = PARAM_DEFINITIONS.reduce((acc, p) => {
    acc[p.id] = 3;
    return acc;
  }, {});

  const [ratings, setRatings] = useState(initialRatings);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState(null);

  if (!isOpen) return null;

  // Check if name already exists (similarity check)
  const cleanStr = (s) => (s || '').replace(/ישיבת|ישיבה|מכינת|מכינה|ההסדר|הסדר|גבוהה|שלוחת/g, '').replace(/[^א-ת]/g, '').replace(/יי/g, 'י').replace(/וו/g, 'ו');
  const inputClean = cleanStr(yeshivaName);
  let existingMatch = null;
  if (inputClean.length >= 3) {
    existingMatch = yeshivotList.find(y => {
      const yClean = cleanStr(y.name);
      return yClean.includes(inputClean) || inputClean.includes(yClean);
    });
  }

  const handleRatingChange = (id, val) => {
    setRatings(prev => ({ ...prev, [id]: Number(val) }));
  };

  // ... (keep generateMailtoLink etc. intact)
  // Let's replace the form input block instead.

  const generateMailtoLink = (req) => {
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || "nitayke1@gmail.com";
    const subject = encodeURIComponent(`[שבושון] בקשה להוספת ישיבה חדשה: ${req.yeshiva_name}`);
    const paramsList = PARAM_DEFINITIONS.map(p => `- ${p.label}: ${req.ratings[p.id] || 3}`).join('\n');
    const body = encodeURIComponent(
      `שלום אדמין שבושון,\n\nהתקבלה בקשה חדשה להוספת ישיבה/מכינה למערכת:\n\n` +
      `שם המוסד: ${req.yeshiva_name}\n` +
      `סוג: ${TYPE_TRANSLATIONS[req.type] || req.type}\n` +
      `אזור: ${REGION_TRANSLATIONS[req.region] || req.region}\n\n` +
      `פרמטרים מוצעים:\n${paramsList}\n\n` +
      `אימייל מגיש הבקשה: ${req.submitter_email || 'לא צוין'}\n` +
      `הערות: ${req.notes || 'אין'}\n\n` +
      `לחץ על הקישור לאישור בלחיצה אחת: ${window.location.origin}/?admin=true`
    );
    return `mailto:${adminEmail}?subject=${subject}&body=${body}`;
  };

  const sendAutomaticEmailToAdmin = async (requestData) => {
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || "nitayke1@gmail.com";
    const paramsList = PARAM_DEFINITIONS.map(p => `- ${p.label}: ${requestData.ratings[p.id] || 3}`).join('\n');

    try {
      // Send real email via FormSubmit service directly to nitayke1@gmail.com!
      await fetch(`https://formsubmit.co/ajax/${adminEmail}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          _subject: `[שבושון] בקשה להוספת ישיבה חדשה: ${requestData.yeshiva_name}`,
          yeshiva_name: requestData.yeshiva_name,
          type: TYPE_TRANSLATIONS[requestData.type] || requestData.type,
          region: REGION_TRANSLATIONS[requestData.region] || requestData.region,
          submitter_email: requestData.submitter_email || 'לא צוין',
          notes: requestData.notes || 'אין',
          proposed_parameters: paramsList,
          admin_dashboard_link: `${window.location.origin}/?admin=true`
        })
      });
    } catch (err) {
      console.log("Email dispatch:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!yeshivaName.trim()) return;
    if (!type) return alert("אנא בחר סוג מוסד כדי להמשיך.");
    if (!region) return alert("אנא בחר אזור גאוגרפי כדי להמשיך.");

    setIsSubmitting(true);
    const requestPayload = {
      yeshiva_name: yeshivaName.trim(),
      type,
      region,
      ratings,
      submitter_email: submitterEmail,
      notes
    };

    try {
      const saved = await saveYeshivaRequestDB(requestPayload);
      setSubmittedRequest(saved);
      await sendAutomaticEmailToAdmin(requestPayload);
    } catch (err) {
      console.error("Error submitting yeshiva request:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const typeOptions = TYPES.filter(t => t.id !== 'all').map(t => ({ value: t.id, label: t.label }));
  const regionOptions = REGIONS.filter(r => r.id !== 'all').map(r => ({ value: r.id, label: r.label }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#111827' }}>
            בקשה להוספת ישיבה / מכינה חדשה
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}>
            <X style={{ width: 24, height: 24 }} />
          </button>
        </div>

        {submittedRequest ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ display: 'inline-flex', padding: '1rem', borderRadius: '50%', background: '#ecfdf5', color: '#047857', marginBottom: '1rem' }}>
              <CheckCircle style={{ width: 48, height: 48 }} />
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem', color: '#111827' }}>
              הבקשה נשלחה בהצלחה והיא בבדיקה.
            </h3>
            <p style={{ color: '#4b5563', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              תודה רבה על העזרה בהרחבת המאגר! צוות האתר יבחן את הבקשה בהקדם.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', alignItems: 'center' }}>
              <button type="button" onClick={onClose} className="btn-primary" style={{ padding: '0.6rem 1.8rem', minWidth: 120 }}>
                סגור
              </button>

              {/* Discreet Admin Link */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenAdmin) onOpenAdmin();
                }}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#6b7280', 
                  fontSize: '0.8rem', 
                  cursor: 'pointer', 
                  textDecoration: 'underline',
                  marginTop: '0.4rem',
                  opacity: 0.7 
                }}
              >
                (אדמין? לחץ כאן לממשק הניהול)
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem', position: 'relative' }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', color: '#111827' }}>
                שם הישיבה/מכינה *
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="לדוגמה: ישיבת ההסדר קריית שמונה"
                value={yeshivaName}
                onChange={(e) => setYeshivaName(e.target.value)}
                required
              />
              {existingMatch && (
                <div style={{ color: '#b91c1c', fontSize: '0.85rem', marginTop: '0.4rem', fontWeight: 600 }}>
                  שים לב: הישיבה "{existingMatch.name}" כבר קיימת במאגר! אנא ודא שאינך מוסיף כפילות.
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', color: '#111827' }}>סוג המוסד</label>
                <CustomSelect
                  options={typeOptions}
                  value={type}
                  onChange={(val) => setType(val)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', color: '#111827' }}>אזור גאוגרפי</label>
                <CustomSelect
                  options={regionOptions}
                  value={region}
                  onChange={(val) => setRegion(val)}
                />
              </div>
            </div>

            {/* Ratings Sliders for the 11 Parameters */}
            <div style={{ background: '#f8f4ec', padding: '1rem', borderRadius: 12, marginBottom: '1.2rem', border: '1px solid #e2d9c8' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.8rem', color: '#52341d' }}>
                הצע דירוג (1-5) ל-11 הפרמטרים של הישיבה/מכינה:
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.8rem' }}>
                {PARAM_DEFINITIONS.map(p => (
                  <div key={p.id} className="slider-group" style={{ margin: 0, padding: '0.8rem' }}>
                    <div className="slider-header" style={{ marginBottom: '0.4rem' }}>
                      <span className="slider-title" style={{ fontSize: '0.85rem' }}>{p.label}</span>
                      <span className="slider-value-badge" style={{ fontSize: '0.8rem', padding: '0.15rem 0.6rem' }}>{ratings[p.id]}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={ratings[p.id]}
                      onChange={(e) => handleRatingChange(p.id, e.target.value)}
                      className="custom-range"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', color: '#111827' }}>דוא"ל של המגיש (אופציונלי)</label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="yourname@email.com"
                  value={submitterEmail}
                  onChange={(e) => setSubmitterEmail(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', color: '#111827' }}>הערות / פירוט נוסף</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="הערות לאדמין..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={onClose} className="btn-secondary">
                ביטול
              </button>
              <button type="submit" disabled={isSubmitting} className="btn-primary">
                <Send style={{ width: 18, height: 18 }} />
                {isSubmitting ? 'שולח בקשה...' : 'שלח בקשה להוספה'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
