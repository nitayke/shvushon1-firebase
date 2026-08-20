import React, { useState, useRef } from 'react';
import { PARAM_DEFINITIONS, REGIONS, TYPES } from '../knn';
import { MapPin, GraduationCap, ChevronRight, ChevronLeft, Check, PlusCircle, RotateCcw, Play } from 'lucide-react';

export default function Questionnaire({ onStartQuiz, onCalculateMatches, onRequestAddYeshiva }) {
  const [isStarted, setIsStarted] = useState(false);
  // Step 0: Type & Region. Steps 1..11: The 11 parameters. Total 12 steps.
  const [currentStep, setCurrentStep] = useState(0);

  const [region, setRegion] = useState('all');
  const [type, setType] = useState('all');

  // Initialize all 11 rating parameters to null (NOTHING SELECTED BY DEFAULT)
  const initialRatings = PARAM_DEFINITIONS.reduce((acc, p) => {
    acc[p.id] = null;
    return acc;
  }, {});

  const initialIgnoreParams = PARAM_DEFINITIONS.reduce((acc, p) => {
    acc[p.id] = false; // Default is FALSE - Nothing is selected or ignored by default!
    return acc;
  }, {});

  const [ratings, setRatings] = useState(initialRatings);
  const [ignoreParams, setIgnoreParams] = useState(initialIgnoreParams);

  const totalSteps = PARAM_DEFINITIONS.length + 1; // 12 steps total
  const timerRef = useRef(null);

  // Smooth Auto-Advance timer function (400ms delay so user can see selection)
  const triggerAutoAdvance = (updatedRatings = ratings, updatedIgnore = ignoreParams) => {
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      setCurrentStep(prev => {
        if (prev < totalSteps - 1) {
          return prev + 1;
        } else {
          // Final question completed -> calculate matches!
          onCalculateMatches({
            region,
            type,
            ratings: updatedRatings,
            ignoreParams: updatedIgnore
          });
          return prev;
        }
      });
    }, 400);
  };

  const handleSelectScore = (paramId, score) => {
    const nextRatings = { ...ratings, [paramId]: score };
    const nextIgnore = { ...ignoreParams, [paramId]: false };

    setRatings(nextRatings);
    setIgnoreParams(nextIgnore);

    // Auto-advance to next question after 400ms
    triggerAutoAdvance(nextRatings, nextIgnore);
  };

  const handleSetIndifferent = (paramId) => {
    const nextRatings = { ...ratings, [paramId]: null };
    const nextIgnore = { ...ignoreParams, [paramId]: true };

    setRatings(nextRatings);
    setIgnoreParams(nextIgnore);

    // Auto-advance to next question after 400ms
    triggerAutoAdvance(nextRatings, nextIgnore);
  };

  const handleNext = () => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onCalculateMatches({
        region,
        type,
        ratings,
        ignoreParams
      });
    }
  };

  const handlePrev = () => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    } else {
      setIsStarted(false);
    }
  };

  const currentParam = currentStep > 0 ? PARAM_DEFINITIONS[currentStep - 1] : null;
  const progressPercent = currentStep === 0 ? 0 : Math.round((currentStep / (totalSteps - 1)) * 100);

  if (!isStarted) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '2rem 1.25rem', animation: 'fadeIn 0.3s' }}>
        <h1 style={{ fontSize: '2.1rem', fontWeight: 700, marginBottom: '1.1rem', color: '#111827' }}>
          ברוכים הבאים ל"שבושון"
        </h1>

        <div style={{ color: '#374151', fontSize: '1rem', lineHeight: 1.65, maxWidth: 620, margin: '0 auto 1.5rem auto', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <p style={{ fontWeight: 700, color: '#1f2937', fontSize: '1.08rem' }}>
            שמיניסט יקר! לפניך שאלון שבו תוכל לגלות איזו ישיבה/מכינה מתאימה לך.
          </p>
          <p>
            ישנם 11 מאפיינים. עליך לדרג מ-1 עד 5 כל מאפיין - כמה חשוב לך שיהיה בישיבה/מכינה.
          </p>
          <p>
            השאלון אינו ח"ו מדרג ישיבות ומכינות אלא עובד על בסיס התאמה אישית.
          </p>
          <p>
            השאלון הינו המלצה כללית בלבד ואינו מהווה תחליף לשיחה עם הר"מ/המחנך בעניין בחירת הישיבה/המכינה.
          </p>
          <p style={{ fontWeight: 700, color: '#111827', fontSize: '1.1rem', marginTop: '0.2rem' }}>
            בהצלחה!
          </p>
        </div>

        <button
          onClick={() => {
            setIsStarted(true);
            if (onStartQuiz) onStartQuiz();
          }}
          className="btn-primary"
          style={{ fontSize: '1.05rem', padding: '0.75rem 2.2rem', borderRadius: 8 }}
        >
          <Play style={{ width: 16, height: 16, fill: 'currentColor' }} />
          התחל
        </button>

        <div style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: '1.3rem', fontWeight: 500 }}>
          *השאלון מבוסס על מידע שנאסף מביינישים, תלמידים ובוגרי ישיבות ומכינות רבים, וממשיך להתעדכן באופן שוטף מתשובות ודיווחים של תלמידים כיום.
        </div>
      </div>
    );
  }

  return (
    <div className="questionnaire-wizard">
      {/* Top Progress Bar - Compact Padding */}
      <div className="glass-card" style={{ padding: '0.75rem 1.25rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', fontSize: '0.88rem', fontWeight: 700 }}>
          <span style={{ color: '#111827' }}>שאלה {currentStep + 1} מתוך {totalSteps}</span>
          <span style={{ color: '#4b5563' }}>{progressPercent}% הושלמו</span>
        </div>
        <div style={{ height: 6, background: '#e5decb', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ width: `${progressPercent}%`, height: '100%', background: '#52341d', transition: 'width 0.3s ease' }} />
        </div>
      </div>

      {/* STEP 0: Institution Type & Region */}
      {currentStep === 0 && (
        <div className="glass-card" style={{ animation: 'fadeIn 0.3s', padding: '1.35rem' }}>
          <h2 className="section-title" style={{ fontSize: '1.35rem', marginBottom: '1rem', color: '#111827' }}>
            סוג המוסד והאזור הגאוגרפי
          </h2>

          {/* Yeshiva Type Selection */}
          <div style={{ marginBottom: '1.3rem' }}>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.98rem', marginBottom: '0.6rem', color: '#1f2937' }}>
              <GraduationCap style={{ display: 'inline', width: 18, height: 18, marginLeft: 6, color: '#52341d' }} />
              איזה סוג מוסד תורני אתה מחפש?
            </label>
            <div className="chips-grid">
              {TYPES.map(t => (
                <div
                  key={t.id}
                  className={`chip-card ${type === t.id ? 'selected' : ''}`}
                  onClick={() => setType(t.id)}
                  style={{ padding: '0.75rem', fontSize: '0.98rem' }}
                >
                  {t.label}
                </div>
              ))}
            </div>
          </div>

          {/* Region Chip Selection */}
          <div style={{ marginBottom: '0.5rem' }}>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.98rem', marginBottom: '0.6rem', color: '#1f2937' }}>
              <MapPin style={{ display: 'inline', width: 18, height: 18, marginLeft: 6, color: '#52341d' }} />
              אזור גאוגרפי מועדף
            </label>
            <div className="chips-grid">
              {REGIONS.map(r => (
                <div
                  key={r.id}
                  className={`chip-card ${region === r.id ? 'selected' : ''}`}
                  onClick={() => setRegion(r.id)}
                  style={{ padding: '0.7rem', fontSize: '0.92rem' }}
                >
                  {r.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEPS 1..11: The 11 Parameters (100% Neutral, NO DEFAULT SELECTIONS) */}
      {currentStep > 0 && currentParam && (
        <div className="glass-card" style={{ animation: 'fadeIn 0.3s', textAlign: 'center', padding: '1.6rem 1.25rem', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.2rem', color: '#111827', lineHeight: 1.35 }}>
            {currentParam.question || currentParam.label}
          </h2>

          {/* 1 to 5 Score Buttons Grid (Nothing pressed by default) */}
          <div style={{ margin: '0 auto', maxWidth: 600 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#4b5563', fontWeight: 700 }}>
              <span>1 - {currentParam.minLabel}</span>
              <span>5 - {currentParam.maxLabel}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
              {[1, 2, 3, 4, 5].map(score => {
                const isSelected = !ignoreParams[currentParam.id] && ratings[currentParam.id] === score;
                return (
                  <button
                    key={score}
                    type="button"
                    onClick={() => handleSelectScore(currentParam.id, score)}
                    style={{
                      background: isSelected ? '#52341d' : '#ede5d7',
                      color: isSelected ? '#ffffff' : '#1f2937',
                      border: isSelected ? '2px solid #3f2411' : '2px solid #d9ccb9',
                      padding: '0.85rem 0.2rem',
                      borderRadius: 8,
                      fontSize: '1.3rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {score}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Small, Discreet "לא משנה לי" Option at the Bottom (Unselected by default) */}
          <div style={{ marginTop: '1.2rem', textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => handleSetIndifferent(currentParam.id)}
              style={{
                background: ignoreParams[currentParam.id] ? '#52341d' : '#ede5d7',
                border: ignoreParams[currentParam.id] ? '2px solid #3f2411' : '1px solid #d9ccb9',
                color: ignoreParams[currentParam.id] ? '#ffffff' : '#4b5563',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '0.4rem 0.9rem',
                borderRadius: 999,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                transition: 'all 0.2s ease'
              }}
            >
              {ignoreParams[currentParam.id] && <Check style={{ width: 13, height: 13, color: '#ffffff' }} />}
              לא משנה לי (ללא העדפה בנושא זה)
            </button>
          </div>
        </div>
      )}

      {/* Navigation Buttons (Back & Next) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={handlePrev}
          className="btn-secondary"
          style={{ padding: '0.6rem 1.2rem', fontSize: '0.92rem' }}
        >
          <ChevronRight style={{ width: 16, height: 16 }} />
          הקודם
        </button>

        <button onClick={handleNext} className="btn-primary" style={{ padding: '0.65rem 1.4rem', fontSize: '0.95rem' }}>
          {currentStep === totalSteps - 1 ? (
            <>
              <Check style={{ width: 16, height: 16 }} />
              חשב התאמה לישיבות/מכינות
            </>
          ) : (
            <>
              הבא
              <ChevronLeft style={{ width: 16, height: 16 }} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
