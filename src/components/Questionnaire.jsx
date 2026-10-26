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
      <div className="glass-card hero-card fade-in">
        <h1 className="hero-title">ברוכים הבאים ל"שבושון"</h1>
        <p className="hero-lead">
          שמיניסט יקר! שאלון קצר שיעזור לך לגלות איזו ישיבה או מכינה מתאימה לך באמת.
        </p>

        <div className="hero-facts">
          <div className="hero-fact"><b>11</b><span>מאפיינים</span></div>
          <div className="hero-fact"><b>1–5</b><span>דירוג לכל אחד</span></div>
          <div className="hero-fact"><b>3</b><span>דקות בערך</span></div>
        </div>

        <button
          onClick={() => {
            setIsStarted(true);
            if (onStartQuiz) onStartQuiz();
          }}
          className="btn-primary btn-hero"
        >
          <Play style={{ width: 18, height: 18, fill: 'currentColor' }} />
          מתחילים
        </button>

        <p className="hero-note">
          השאלון אינו מדרג ישיבות, אלא מתאים לפי מה שחשוב לך. הוא המלצה כללית בלבד ואינו תחליף לשיחה עם הר"מ או המחנך.
          המידע נאסף מתלמידים ובוגרים רבים ומתעדכן באופן שוטף.
        </p>
      </div>
    );
  }

  return (
    <div className="questionnaire-wizard">
      <div className="glass-card" style={{ padding: '0.85rem 1.1rem', marginBottom: '0.9rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
          <span>שאלה <strong style={{ color: 'var(--text-primary)' }}>{currentStep + 1}</strong> מתוך {totalSteps}</span>
        </div>
        <div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPercent}>
          <div className="progress-fill" style={{ width: `${Math.max(progressPercent, 4)}%` }} />
        </div>
      </div>

      {/* STEP 0: Institution Type & Region */}
      {currentStep === 0 && (
        <div className="glass-card fade-in">
          <h2 className="section-title">סוג המוסד והאזור</h2>

          <div style={{ marginBottom: '1.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, marginBottom: '0.65rem', color: 'var(--text-primary)' }}>
              <GraduationCap style={{ width: 18, height: 18, color: 'var(--primary-accent)' }} />
              איזה סוג מוסד תורני אתה מחפש?
            </div>
            <div className="chips-grid" role="radiogroup">
              {TYPES.map(t => (
                <button
                  type="button"
                  role="radio"
                  aria-checked={type === t.id}
                  key={t.id}
                  className={`chip-card ${type === t.id ? 'selected' : ''}`}
                  onClick={() => setType(t.id)}
                >
                  {type === t.id && <Check style={{ width: 16, height: 16 }} />}
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, marginBottom: '0.65rem', color: 'var(--text-primary)' }}>
              <MapPin style={{ width: 18, height: 18, color: 'var(--primary-accent)' }} />
              אזור גאוגרפי מועדף
            </div>
            <div className="chips-grid" role="radiogroup">
              {REGIONS.map(r => (
                <button
                  type="button"
                  role="radio"
                  aria-checked={region === r.id}
                  key={r.id}
                  className={`chip-card ${region === r.id ? 'selected' : ''}`}
                  onClick={() => setRegion(r.id)}
                >
                  {region === r.id && <Check style={{ width: 16, height: 16 }} />}
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEPS 1..11: The 11 Parameters (no default selections) */}
      {currentStep > 0 && currentParam && (
        <div className="glass-card question-card fade-in" key={currentParam.id}>
          <h2 className="question-title">{currentParam.question || currentParam.label}</h2>

          <div style={{ margin: '0 auto', maxWidth: 560 }}>
            <div className="score-ends">
              <span><strong>1</strong> · {currentParam.minLabel}</span>
              <span>{currentParam.maxLabel} · <strong>5</strong></span>
            </div>

            <div className="score-grid">
              {[1, 2, 3, 4, 5].map(score => {
                const isSelected = !ignoreParams[currentParam.id] && ratings[currentParam.id] === score;
                return (
                  <button
                    key={score}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => handleSelectScore(currentParam.id, score)}
                    className={`score-btn ${isSelected ? 'selected' : ''}`}
                  >
                    {score}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: '1.3rem' }}>
            <button
              type="button"
              onClick={() => handleSetIndifferent(currentParam.id)}
              className={`indifferent-btn ${ignoreParams[currentParam.id] ? 'selected' : ''}`}
            >
              {ignoreParams[currentParam.id] && <Check style={{ width: 14, height: 14 }} />}
              לא משנה לי
            </button>
          </div>
        </div>
      )}

      {/* Sticky navigation (thumb-reachable on mobile) */}
      <div className="wizard-nav">
        <button onClick={handlePrev} className="btn-secondary">
          <ChevronRight style={{ width: 18, height: 18 }} />
          הקודם
        </button>

        {currentStep === 0 && (
          <button onClick={handleNext} className="btn-primary">
            הבא
            <ChevronLeft style={{ width: 18, height: 18 }} />
          </button>
        )}
      </div>
    </div>
  );
}
