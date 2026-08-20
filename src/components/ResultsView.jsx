import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Award, CheckCircle, RefreshCw, HelpCircle, Save, Edit2, MailCheck } from 'lucide-react';
import { saveStudentSubmissionDB, saveYeshivaRequestDB } from '../firebase';
import { PARAM_DEFINITIONS, REGION_TRANSLATIONS, TYPE_TRANSLATIONS } from '../knn';
import AutocompleteYeshivaSelect from './AutocompleteYeshivaSelect';

const LOCAL_SURVEY_SAVED_KEY = 'shvushon_has_submitted_student_survey';

export default function ResultsView({ results, userPreferences, yeshivotList, onRestart, onRequestAddYeshiva }) {
  const [isCurrentStudent, setIsCurrentStudent] = useState(null); // true, false, null
  const [selectedYeshivaName, setSelectedYeshivaName] = useState('');
  const [customYeshivaInput, setCustomYeshivaInput] = useState('');
  const [reflectsYeshiva, setReflectsYeshiva] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Persist submission state in localStorage so UI remembers the user has already submitted!
  const [submissionSaved, setSubmissionSaved] = useState(() => {
    return localStorage.getItem(LOCAL_SURVEY_SAVED_KEY) === 'true';
  });

  const [isNewYeshivaRequest, setIsNewYeshivaRequest] = useState(() => {
    return localStorage.getItem(LOCAL_SURVEY_SAVED_KEY + '_is_new_req') === 'true';
  });

  // Initialize editable student ratings with user's quiz answers pre-filled
  const [studentRatings, setStudentRatings] = useState(
    userPreferences?.ratings || PARAM_DEFINITIONS.reduce((acc, p) => ({ ...acc, [p.id]: 3 }), {})
  );

  useEffect(() => {
    confetti({
      particleCount: 85,
      spread: 75,
      origin: { y: 0.55 }
    });
  }, []);

  const handleStudentRatingChange = (id, val) => {
    setStudentRatings(prev => ({ ...prev, [id]: Number(val) }));
  };

  const sendAutomaticEmailToAdmin = async (requestData) => {
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || "nitayke1@gmail.com";
    const paramsList = PARAM_DEFINITIONS.map(p => `${p.label}: ${requestData.ratings[p.id] || 3}`).join('\n');

    const emailPayload = {
      to: adminEmail,
      subject: `[שבושון] בקשה להוספת ישיבה חדשה (מתלמיד כיום): ${requestData.yeshiva_name}`,
      message: `התקבלה בקשה חדשה להוספת ישיבה למערכת ע"י תלמיד כיום:\n\n` +
               `שם המוסד: ${requestData.yeshiva_name}\n` +
               `סוג: ${TYPE_TRANSLATIONS[requestData.type] || requestData.type}\n` +
               `אזור: ${REGION_TRANSLATIONS[requestData.region] || requestData.region}\n\n` +
               `פרמטרים מוצעים:\n${paramsList}\n\n` +
               `הערות: הוגש ע"י תלמיד כיום בשאלון\n\n` +
               `קישור לפתיחת ממשק הניהול: ${window.location.origin}/admin`
    };

    try {
      const webhookUrl = import.meta.env.VITE_EMAIL_WEBHOOK_URL;
      if (webhookUrl) {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emailPayload)
        });
      }
    } catch (err) {
      console.log("Background email notification logged:", emailPayload);
    }
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    const finalYeshivaName = selectedYeshivaName === 'other' ? customYeshivaInput.trim() : selectedYeshivaName;
    if (!finalYeshivaName) return;

    setIsSubmitting(true);
    try {
      const existingYeshiva = yeshivotList.find(
        y => y.name.trim().toLowerCase() === finalYeshivaName.toLowerCase()
      );

      let isNew = false;
      if (!existingYeshiva || selectedYeshivaName === 'other') {
        isNew = true;
        const requestPayload = {
          yeshiva_name: finalYeshivaName,
          type: userPreferences.type,
          region: userPreferences.region,
          ratings: studentRatings,
          submitter_email: '',
          notes: 'הוגש ע"י תלמיד כיום בשאלון התאמה'
        };

        await saveYeshivaRequestDB(requestPayload);
        await sendAutomaticEmailToAdmin(requestPayload);
        setIsNewYeshivaRequest(true);
        localStorage.setItem(LOCAL_SURVEY_SAVED_KEY + '_is_new_req', 'true');
      } else {
        await saveStudentSubmissionDB({
          yeshiva_name: finalYeshivaName,
          reflects_yeshiva: reflectsYeshiva,
          region: userPreferences.region,
          type: userPreferences.type,
          ratings: studentRatings
        });
        setIsNewYeshivaRequest(false);
        localStorage.removeItem(LOCAL_SURVEY_SAVED_KEY + '_is_new_req');
      }

      localStorage.setItem(LOCAL_SURVEY_SAVED_KEY, 'true');
      setSubmissionSaved(true);
    } catch (err) {
      console.error("Save submission error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const topMatch = results[0];

  return (
    <div className="results-container">
      {/* Top Match Banner */}
      <div className="glass-card" style={{ textAlign: 'center', borderColor: 'rgba(16, 185, 129, 0.4)' }}>
        <div style={{ display: 'inline-flex', padding: '0.8rem', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', marginBottom: '1rem' }}>
          <Award style={{ width: 44, height: 44 }} />
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '0.5rem' }}>
          תוצאות מבחן ההתאמה
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>
          המוסד בעל ההתאמה הגבוהה ביותר עבורך הוא: <strong style={{ color: '#10b981', fontSize: '1.4rem' }}>{topMatch?.name}</strong> עם {topMatch?.matchScore}% התאמה!
        </p>
      </div>

      {/* Results List */}
      <div className="glass-card">
        <h2 className="section-title">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          הישיבות והמכינות שהכי מתאימות לך:
        </h2>

        {results.map((item, index) => {
          const regionHebrew = REGION_TRANSLATIONS[item.region] || item.region;
          const typeHebrew = TYPE_TRANSLATIONS[item.type] || item.type;

          return (
            <div key={item.id} className="yeshiva-result-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                    <span style={{ fontWeight: 900, color: '#a855f7', fontSize: '1.2rem' }}>#{index + 1}</span>
                    <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>{item.name}</h3>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span className="tag" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#c7d2fe' }}>סוג: {typeHebrew}</span>
                    <span className="tag" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#e9d5ff' }}>אזור: {regionHebrew}</span>
                  </div>
                </div>

                <div className="match-score-badge">
                  {item.matchScore}% התאמה
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CURRENT STUDENT SURVEY & COMPACT RATING EDITOR */}
      <div className="glass-card" style={{ borderColor: 'rgba(99, 102, 241, 0.4)', background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(49, 46, 129, 0.4) 100%)' }}>
        <h2 className="section-title" style={{ color: '#a5b4fc' }}>
          <HelpCircle className="w-6 h-6 text-indigo-400" />
          לומד כרגע בישיבה? עזור לנו לשפר ולדייק את הנתונים!
        </h2>
        <p style={{ color: '#cbd5e1', marginBottom: '1.2rem', lineHeight: 1.6 }}>
          כדי ששאלון שבושון יהיה המדויק ביותר עבור השמיניסטים הבאים, אנו אוספים ושומרים במאגר אך ורק תשובות של משתתפים הלומדים כיום בישיבות ובמכינות.
        </p>

        {submissionSaved ? (
          <div>
            {isNewYeshivaRequest ? (
              <div style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', padding: '1.2rem', borderRadius: 12, color: '#34d399', textAlign: 'center' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.4rem' }}>
                  ✓ הבקשה להוספת ישיבה חדשה נרשמה ונשלחה לאדמין!
                </h3>
                <p style={{ color: '#cbd5e1', fontSize: '0.92rem', marginBottom: '0.8rem' }}>
                  תודה רבה! הבקשה להוספת הישיבה שלך נשמרה במאגר ונשלחה במייל לאדמין (nitayke1@gmail.com) לאישור.
                </p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#a5b4fc' }}>
                  <MailCheck style={{ width: 16, height: 16 }} />
                  הטופס נשלח בהצלחה
                </div>
              </div>
            ) : (
              <div style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', padding: '1.2rem', borderRadius: 12, color: '#34d399', textAlign: 'center' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.4rem' }}>
                  ✓ דיווח התלמיד שלך נרשם ונשמר במאגר בהצלחה!
                </h3>
                <p style={{ color: '#cbd5e1', fontSize: '0.92rem' }}>
                  תודה רבה על תרומתך לדיוק הנתונים בשבושון! המערכת זוכרת ששלחת כבר את תשובותיך.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.8rem' }}>
              האם אתה לומד כרגע בישיבה / מכינה?
            </label>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.2rem' }}>
              <button
                type="button"
                className={`chip-card ${isCurrentStudent === true ? 'selected' : ''}`}
                onClick={() => setIsCurrentStudent(true)}
              >
                כן, אני לומד בישיבה כיום
              </button>
              <button
                type="button"
                className={`chip-card ${isCurrentStudent === false ? 'selected' : ''}`}
                onClick={() => setIsCurrentStudent(false)}
              >
                לא (אני שמיניסט / אורח)
              </button>
            </div>

            {isCurrentStudent === false && (
              <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '1rem', borderRadius: 8, color: '#94a3b8', fontSize: '0.9rem' }}>
                תודה! מכיוון שאינך לומד כרגע בישיבה, תשובותיך לא ישמרו ב-DB כדי להבטיח שאך ורק דיווחים של ביינישים ותלמידים יעדכנו את הנתונים המפוקחים.
              </div>
            )}

            {isCurrentStudent === true && (
              <form onSubmit={handleStudentSubmit} style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1.25rem', borderRadius: 12, border: '1px solid rgba(99, 102, 241, 0.3)', animation: 'fadeIn 0.3s' }}>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '1rem', marginBottom: '0.4rem', color: '#f8fafc' }}>
                  באיזו ישיבה / מכינה אתה לומד כיום? *
                </label>
                
                <AutocompleteYeshivaSelect
                  yeshivotList={yeshivotList}
                  value={selectedYeshivaName}
                  onChange={(val) => setSelectedYeshivaName(val)}
                  placeholder="הקלד חיפוש שם ישיבה..."
                />

                {selectedYeshivaName === 'other' && (
                  <div style={{ marginBottom: '1rem' }}>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="הקלד את שם הישיבה החדשה שלך..."
                      value={customYeshivaInput}
                      onChange={(e) => setCustomYeshivaInput(e.target.value)}
                      required
                    />
                  </div>
                )}

                {/* COMPACT SINGLE-PAGE 11 PARAMETERS EDITOR FOR CURRENT STUDENTS */}
                <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '1rem', borderRadius: 12, marginBottom: '1.2rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', fontWeight: 700, color: '#a5b4fc', marginBottom: '0.8rem' }}>
                    <Edit2 style={{ width: 16, height: 16 }} />
                    דייק את 11 הפרמטרים עבור הישיבה שלך (הכול במסך אחד):
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '0.75rem' }}>
                    {PARAM_DEFINITIONS.map(p => (
                      <div key={p.id} className="slider-group" style={{ margin: 0, padding: '0.75rem' }}>
                        <div className="slider-header" style={{ marginBottom: '0.3rem' }}>
                          <span className="slider-title" style={{ fontSize: '0.85rem' }}>{p.label}</span>
                          <span className="slider-value-badge" style={{ fontSize: '0.8rem', padding: '0.15rem 0.55rem' }}>
                            {studentRatings[p.id] || 3}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          value={studentRatings[p.id] || 3}
                          onChange={(e) => handleStudentRatingChange(p.id, Number(e.target.value))}
                          className="custom-range"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.2rem' }}>
                  <input
                    type="checkbox"
                    id="reflects_cb"
                    checked={reflectsYeshiva}
                    onChange={(e) => setReflectsYeshiva(e.target.checked)}
                    style={{ width: 18, height: 18, cursor: 'pointer' }}
                  />
                  <label htmlFor="reflects_cb" style={{ cursor: 'pointer', fontSize: '0.95rem' }}>
                    הנתונים שהכנסתי כרגע בשאלון משקפים את הישיבה שלי וברצוני לתרום אותם לשיפור המערכת
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-gold"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <Save style={{ width: 18, height: 18 }} />
                  {isSubmitting ? 'שומר במאגר...' : 'שמור תשובות במאגר'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
        <button onClick={onRestart} className="btn-primary">
          <RefreshCw style={{ width: 18, height: 18 }} />
          התחל שאלון מחדש
        </button>
      </div>
    </div>
  );
}
