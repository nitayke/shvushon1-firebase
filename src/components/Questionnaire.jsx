import React, { useState, useRef } from 'react';
import { PARAM_DEFINITIONS, REGIONS, TYPES } from '../knn';
import { MapPin, GraduationCap, Sparkles, ChevronRight, ChevronLeft, Check, PlusCircle, RotateCcw } from 'lucide-react';

export default function Questionnaire({ onCalculateMatches, onRequestAddYeshiva }) {
  // Step 0: Type & Region. Steps 1..11: The 11 parameters. Total 12 steps.
  const [currentStep, setCurrentStep] = useState(0);

  const [region, setRegion] = useState('all');
  const [type, setType] = useState('all');

  // Initialize all 11 rating parameters to null (No number selected by default)
  const initialRatings = PARAM_DEFINITIONS.reduce((acc, p) => {
    acc[p.id] = null;
    return acc;
  }, {});

  const initialIgnoreParams = PARAM_DEFINITIONS.reduce((acc, p) => {
    acc[p.id] = true; // Default is ignored until a number or preference is clicked
    return acc;
  }, {});

  const [ratings, setRatings] = useState(initialRatings);
  const [ignoreParams, setIgnoreParams] = useState(initialIgnoreParams);

  const totalSteps = PARAM_DEFINITIONS.length + 1; // 12 steps total
  const timerRef = useRef(null);

  // Smooth Auto-Advance timer function (200ms snappy response)
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
    }, 200);
  };

  const handleSelectScore = (paramId, score) => {
    const nextRatings = { ...ratings, [paramId]: score };
    const nextIgnore = { ...ignoreParams, [paramId]: false };

    setRatings(nextRatings);
    setIgnoreParams(nextIgnore);

    // Auto-advance to next question after 200ms
    triggerAutoAdvance(nextRatings, nextIgnore);
  };

  const handleSetIndifferent = (paramId) => {
    const nextRatings = { ...ratings, [paramId]: null };
    const nextIgnore = { ...ignoreParams, [paramId]: true };

    setRatings(nextRatings);
    setIgnoreParams(nextIgnore);

    // Auto-advance to next question after 200ms
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
    }
  };

  const currentParam = currentStep > 0 ? PARAM_DEFINITIONS[currentStep - 1] : null;
  const progressPercent = currentStep === 0 ? 0 : Math.round((currentStep / (totalSteps - 1)) * 100);

  return (
    <div className="questionnaire-wizard">
      {/* Top Progress Bar - Compact Padding */}
      <div className="glass-card" style={{ padding: '0.75rem 1.25rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>
          <span style={{ color: '#a5b4fc' }}>שאלה {currentStep + 1} מתוך {totalSteps}</span>
          <span style={{ color: '#94a3b8' }}>{progressPercent}% הושלמו</span>
        </div>
        <div style={{ height: 6, background: 'rgba(255, 255, 255, 0.1)', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ width: `${progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 100%)', transition: 'width 0.3s ease' }} />
        </div>
      </div>

      {/* STEP 0: Institution Type & Region */}
      {currentStep === 0 && (
        <div className="glass-card" style={{ animation: 'fadeIn 0.3s', padding: '1.25rem' }}>
          <div className="brand-badge" style={{ marginBottom: '0.8rem', fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}>
            <Sparkles style={{ width: 13, height: 13 }} /> שלב 1: העדפות כלליות
          </div>

          <h2 className="section-title" style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>
            סוג המוסד והאזור הגאוגרפי
          </h2>

          {/* Yeshiva Type Selection */}
          <div style={{ marginBottom: '1.2rem' }}>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.6rem' }}>
              <GraduationCap style={{ display: 'inline', width: 18, height: 18, marginLeft: 6, color: '#a855f7' }} />
              איזה סוג מוסד תורני אתה מחפש?
            </label>
            <div className="chips-grid">
              {TYPES.map(t => (
                <div
                  key={t.id}
                  className={`chip-card ${type === t.id ? 'selected' : ''}`}
                  onClick={() => setType(t.id)}
                  style={{ padding: '0.7rem', fontSize: '0.95rem' }}
                >
                  {t.label}
                </div>
              ))}
            </div>
          </div>

          {/* Region Chip Selection */}
          <div style={{ marginBottom: '0.5rem' }}>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.6rem' }}>
              <MapPin style={{ display: 'inline', width: 18, height: 18, marginLeft: 6, color: '#6366f1' }} />
              אזור גאוגרפי מועדף
            </label>
            <div className="chips-grid">
              {REGIONS.map(r => (
                <div
                  key={r.id}
                  className={`chip-card ${region === r.id ? 'selected' : ''}`}
                  onClick={() => setRegion(r.id)}
                  style={{ padding: '0.65rem', fontSize: '0.9rem' }}
                >
                  {r.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEPS 1..11: The 11 Parameters (No score pressed by default) */}
      {currentStep > 0 && currentParam && (
        <div className="glass-card" style={{ animation: 'fadeIn 0.3s', textAlign: 'center', padding: '1.5rem 1.2rem', marginBottom: '1rem' }}>
          <div className="brand-badge" style={{ marginBottom: '0.8rem', fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}>
            מאפיין {currentStep} מתוך 11
          </div>

          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '1.2rem', color: '#f8fafc', lineHeight: 1.35 }}>
            {currentParam.question || currentParam.label}
          </h2>

          {/* 1 to 5 Score Buttons Grid (No number pressed by default) */}
          <div style={{ margin: '0 auto', maxWidth: 600 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.82rem', color: '#cbd5e1', fontWeight: 600 }}>
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
                      background: isSelected ? 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' : 'rgba(255, 255, 255, 0.06)',
                      color: isSelected ? '#ffffff' : '#f1f5f9',
                      border: isSelected ? '2px solid #c7d2fe' : '1px solid rgba(255, 255, 255, 0.12)',
                      padding: '0.85rem 0.2rem',
                      borderRadius: 12,
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

          {/* Small, Discreet "לא משנה לי" Option at the Bottom */}
          <div style={{ marginTop: '1.1rem', textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => handleSetIndifferent(currentParam.id)}
              style={{
                background: ignoreParams[currentParam.id] ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                border: ignoreParams[currentParam.id] ? '1px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.1)',
                color: ignoreParams[currentParam.id] ? '#c084fc' : '#94a3b8',
                fontSize: '0.82rem',
                cursor: 'pointer',
                padding: '0.35rem 0.85rem',
                borderRadius: 999,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                transition: 'all 0.2s ease'
              }}
            >
              {ignoreParams[currentParam.id] && <Check style={{ width: 13, height: 13, color: '#c084fc' }} />}
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
          style={{ opacity: currentStep === 0 ? 0.4 : 1, cursor: currentStep === 0 ? 'not-allowed' : 'pointer', padding: '0.55rem 1.1rem', fontSize: '0.9rem' }}
        >
          <ChevronRight style={{ width: 16, height: 16 }} />
          הקודם
        </button>

        <button onClick={handleNext} className="btn-primary" style={{ padding: '0.55rem 1.3rem', fontSize: '0.9rem' }}>
          {currentStep === totalSteps - 1 ? (
            <>
              <Check style={{ width: 16, height: 16 }} />
              חשב התאמה לישיבות
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
