import React, { useState, useRef } from 'react';
import { PARAM_DEFINITIONS, REGIONS, TYPES } from '../knn';
import { TIME_TOTAL_HOURS, emptyHours, hoursUsed, hoursToTime } from '../timeAllocation';
import TimeAllocator from './TimeAllocator';
import { MapPin, GraduationCap, ChevronRight, ChevronLeft, Check, Play } from 'lucide-react';

// Step 0: type & region. Step 1: time split. Then one step per 1-5 parameter.
const TIME_STEP = 1;
const FIRST_PARAM_STEP = 2;

export default function Questionnaire({ onStartQuiz, onCalculateMatches, onRequestAddYeshiva, banner = null }) {
  const [isStarted, setIsStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Multi-select; an empty list means "all" (the default)
  const [regions, setRegions] = useState([]);
  const [types, setTypes] = useState([]);

  const toggleChoice = (list, setList, id) => {
    if (id === 'all') return setList([]);
    setList(list.includes(id) ? list.filter(x => x !== id) : [...list, id]);
  };
  const toPreference = (list) => (list.length === 0 ? 'all' : list);

  // Initialize all rating parameters to null (NOTHING SELECTED BY DEFAULT)
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
  const [hours, setHours] = useState(emptyHours);
  const timeComplete = hoursUsed(hours) === TIME_TOTAL_HOURS;

  const totalSteps = PARAM_DEFINITIONS.length + FIRST_PARAM_STEP;
  const timerRef = useRef(null);

  const buildPreferences = (finalRatings, finalIgnore) => ({
    region: toPreference(regions),
    type: toPreference(types),
    ratings: finalRatings,
    ignoreParams: finalIgnore,
    time: hoursToTime(hours)
  });

  // Smooth Auto-Advance timer function (400ms delay so user can see selection)
  const triggerAutoAdvance = (updatedRatings = ratings, updatedIgnore = ignoreParams) => {
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      if (currentStep < totalSteps - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        // Final question completed -> calculate matches!
        onCalculateMatches(buildPreferences(updatedRatings, updatedIgnore));
      }
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

    if (currentStep === TIME_STEP && !timeComplete) return;
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onCalculateMatches(buildPreferences(ratings, ignoreParams));
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

  const currentParam = currentStep >= FIRST_PARAM_STEP ? PARAM_DEFINITIONS[currentStep - FIRST_PARAM_STEP] : null;
  const progressPercent = currentStep === 0 ? 0 : Math.round((currentStep / (totalSteps - 1)) * 100);

  if (!isStarted) {
    return (
      <>
      <div className="glass-card hero-card fade-in">
        <h1 className="hero-title">ברוכים הבאים ל"שבושון"</h1>
        <p className="hero-lead">
          שמיניסט יקר! שאלון קצר שיעזור לך לגלות איזו ישיבה או מכינה מתאימה לך באמת. תחלק את הזמן הפנוי שלך בין גמרא, אמונה, תנ"ך, אימונים וחברים, ותענה על עוד {PARAM_DEFINITIONS.length} שאלות קצרות.
        </p>

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
      {banner}
      </>
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
              <span className="multi-hint">אפשר לבחור כמה</span>
            </div>
            <div className="chips-grid" role="group" aria-label="סוג מוסד">
              {TYPES.map(t => {
                const selected = t.id === 'all' ? types.length === 0 : types.includes(t.id);
                return (
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={selected}
                    key={t.id}
                    className={`chip-card ${selected ? 'selected' : ''}`}
                    onClick={() => toggleChoice(types, setTypes, t.id)}
                  >
                    <span className="chip-box" aria-hidden="true">{selected && <Check style={{ width: 14, height: 14 }} />}</span>
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, marginBottom: '0.65rem', color: 'var(--text-primary)' }}>
              <MapPin style={{ width: 18, height: 18, color: 'var(--primary-accent)' }} />
              אזור גאוגרפי מועדף
              <span className="multi-hint">אפשר לבחור כמה</span>
            </div>
            <div className="chips-grid" role="group" aria-label="אזור גאוגרפי">
              {REGIONS.map(r => {
                const selected = r.id === 'all' ? regions.length === 0 : regions.includes(r.id);
                return (
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={selected}
                    key={r.id}
                    className={`chip-card ${selected ? 'selected' : ''}`}
                    onClick={() => toggleChoice(regions, setRegions, r.id)}
                  >
                    <span className="chip-box" aria-hidden="true">{selected && <Check style={{ width: 14, height: 14 }} />}</span>
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* STEP 1: split the free hours */}
      {currentStep === TIME_STEP && (
        <div className="glass-card question-card fade-in">
          <h2 className="question-title">איך היית מחלק את הזמן שלך?</h2>
          <p className="ta-lead">
            נניח שיש לך {TIME_TOTAL_HOURS} שעות פנויות בשבוע. כמה מהן היית רוצה להקדיש לכל תחום? אי אפשר לתת הכול לכולם, אז תבחר מה באמת חשוב לך.
          </p>
          <TimeAllocator value={hours} onChange={setHours} />
        </div>
      )}

      {/* The 1-5 parameters (no default selections) */}
      {currentParam && (
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
        {currentStep === TIME_STEP && (
          <button onClick={handleNext} className="btn-primary" disabled={!timeComplete}>
            {timeComplete ? 'הבא' : `עוד ${TIME_TOTAL_HOURS - hoursUsed(hours)} שעות לחלק`}
            {timeComplete && <ChevronLeft style={{ width: 18, height: 18 }} />}
          </button>
        )}
      </div>
    </div>
  );
}
