import React, { useState, useRef } from 'react';
import { PARAM_DEFINITIONS, REGIONS, TYPES } from '../knn';
import { MapPin, GraduationCap, Sparkles, ChevronRight, ChevronLeft, Check, PlusCircle, RotateCcw } from 'lucide-react';

export default function Questionnaire({ onCalculateMatches, onRequestAddYeshiva }) {
  // Step 0: Type & Region. Steps 1..11: The 11 parameters. Total 12 steps.
  const [currentStep, setCurrentStep] = useState(0);

  const [region, setRegion] = useState('all');
  const [type, setType] = useState('all');

  // Initialize all 11 rating parameters to DEFAULT score 3 (Active, ignoreParams = false)
  const initialRatings = PARAM_DEFINITIONS.reduce((acc, p) => {
    acc[p.id] = 3;
    return acc;
  }, {});

  const initialIgnoreParams = PARAM_DEFINITIONS.reduce((acc, p) => {
    acc[p.id] = false; // DEFAULT IS ACTIVE SCORE 3!
    return acc;
  }, {});

  const [ratings, setRatings] = useState(initialRatings);
  const [ignoreParams, setIgnoreParams] = useState(initialIgnoreParams);

  const totalSteps = PARAM_DEFINITIONS.length + 1; // 12 steps total
  const timerRef = useRef(null);

  // Smooth 600ms Auto-Advance timer function
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
    }, 600);
  };

  const handleSelectScore = (paramId, score) => {
    const nextRatings = { ...ratings, [paramId]: score };
    const nextIgnore = { ...ignoreParams, [paramId]: false };

    setRatings(nextRatings);
    setIgnoreParams(nextIgnore);

    // Auto-advance to next question after 600ms
    triggerAutoAdvance(nextRatings, nextIgnore);
  };

  const handleSetIndifferent = (paramId) => {
    const nextIgnore = { ...ignoreParams, [paramId]: true };
    setIgnoreParams(nextIgnore);

    // Auto-advance to next question after 600ms
    triggerAutoAdvance(ratings, nextIgnore);
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
    }
  };

  const currentParam = currentStep > 0 ? PARAM_DEFINITIONS[currentStep - 1] : null;
  const progressPercent = Math.round(((currentStep + 1) / totalSteps) * 100);

  return (
    <div className="questionnaire-wizard">
      {/* Top Progress Bar */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', fontSize: '0.9rem', fontWeight: 600 }}>
          <span style={{ color: '#a5b4fc' }}>שאלה {currentStep + 1} מתוך {totalSteps}</span>
          <span style={{ color: '#94a3b8' }}>{progressPercent}% הושלמו</span>
        </div>
        <div style={{ height: 8, background: 'rgba(255, 255, 255, 0.1)', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ width: `${progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 100%)', transition: 'width 0.3s ease' }} />
        </div>
      </div>

      {/* STEP 0: Institution Type & Region */}
      {currentStep === 0 && (
        <div className="glass-card" style={{ animation: 'fadeIn 0.3s' }}>
          <div className="brand-badge" style={{ marginBottom: '1.2rem' }}>
            <Sparkles style={{ width: 14, height: 14 }} /> שלב 1: העדפות כלליות
          </div>

          <h2 className="section-title" style={{ fontSize: '1.6rem', marginBottom: '1.5rem' }}>
            סוג המוסד והאזור הגאוגרפי
          </h2>

          {/* Yeshiva Type Selection */}
          <div style={{ marginBottom: '1.8rem' }}>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.8rem' }}>
              <GraduationCap style={{ display: 'inline', width: 20, height: 20, marginLeft: 6, color: '#a855f7' }} />
              איזה סוג מוסד תורני אתה מחפש?
            </label>
            <div className="chips-grid">
              {TYPES.map(t => (
                <div
                  key={t.id}
                  className={`chip-card ${type === t.id ? 'selected' : ''}`}
                  onClick={() => setType(t.id)}
                  style={{ padding: '1rem', fontSize: '1.05rem' }}
                >
                  {t.label}
                </div>
              ))}
            </div>
          </div>

          {/* Region Chip Selection */}
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.8rem' }}>
              <MapPin style={{ display: 'inline', width: 20, height: 20, marginLeft: 6, color: '#6366f1' }} />
              אזור גאוגרפי מועדף
            </label>
            <div className="chips-grid">
              {REGIONS.map(r => (
                <div
                  key={r.id}
                  className={`chip-card ${region === r.id ? 'selected' : ''}`}
                  onClick={() => setRegion(r.id)}
                  style={{ padding: '1rem', fontSize: '1rem' }}
                >
                  {r.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEPS 1..11: The 11 Parameters (One Per Screen) */}
      {currentStep > 0 && currentParam && (
        <div className="glass-card" style={{ animation: 'fadeIn 0.3s', textAlign: 'center', padding: '2.5rem 1.5rem' }}>
          <div className="brand-badge" style={{ marginBottom: '1rem' }}>
            מאפיין {currentStep} מתוך 11
          </div>

          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '1.8rem', color: '#f8fafc' }}>
            {currentParam.question || currentParam.label}
          </h2>

          {/* 1 to 5 Score Buttons Grid (Default score is 3) */}
          <div style={{ margin: '0 auto', maxWidth: 650 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', fontSize: '0.88rem', color: '#cbd5e1', fontWeight: 600 }}>
              <span>1 - {currentParam.minLabel}</span>
              <span>5 - {currentParam.maxLabel}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.8rem' }}>
              {[1, 2, 3, 4, 5].map(score => {
                const isSelected = !ignoreParams[currentParam.id] && ratings[currentParam.id] === score;
                return (
                  <button
                    key={score}
                    type="button"
                    onClick={() => handleSelectScore(currentParam.id, score)}
                    style={{
                      background: isSelected ? 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' : 'rgba(255, 255, 255, 0.06)',
                      color: isSelected ? '#ffffff' : '#f1f5f9',
                      border: isSelected ? '2px solid #c7d2fe' : '1px solid rgba(255, 255, 255, 0.12)',
                      padding: '1.2rem 0.5rem',
                      borderRadius: 14,
                      fontSize: '1.4rem',
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

          {/* Small, Discreet "לא משנה לי" Option at the Bottom */}
          <div style={{ marginTop: '1.8rem', textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => handleSetIndifferent(currentParam.id)}
              style={{
                background: ignoreParams[currentParam.id] ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                border: ignoreParams[currentParam.id] ? '1px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.1)',
                color: ignoreParams[currentParam.id] ? '#c084fc' : '#94a3b8',
                fontSize: '0.85rem',
                cursor: 'pointer',
                padding: '0.45rem 1rem',
                borderRadius: 999,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s ease'
              }}
            >
              {ignoreParams[currentParam.id] && <Check style={{ width: 14, height: 14, color: '#c084fc' }} />}
              לא משנה לי (ללא העדפה בנושא זה)
            </button>
          </div>
        </div>
      )}

      {/* Navigation Buttons (Back & Next) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={handlePrev}
          disabled={currentStep === 0}
          className="btn-secondary"
          style={{ opacity: currentStep === 0 ? 0.4 : 1, cursor: currentStep === 0 ? 'not-allowed' : 'pointer' }}
        >
          <ChevronRight style={{ width: 18, height: 18 }} />
          הקודם
        </button>

        <button onClick={handleNext} className="btn-primary">
          {currentStep === totalSteps - 1 ? (
            <>
              <Check style={{ width: 18, height: 18 }} />
              חשב התאמה לישיבות
            </>
          ) : (
            <>
              הבא
              <ChevronLeft style={{ width: 18, height: 18 }} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
