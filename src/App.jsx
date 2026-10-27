import React, { useState, useEffect, Suspense, lazy } from 'react';
// Shvushon 2.0.1 - Male phrasing & 100% Live Firestore
import Questionnaire from './components/Questionnaire';
import ResultsView from './components/ResultsView';
const ManagerPortal = lazy(() => import('./components/ManagerPortal'));
import CalendarView from './components/CalendarView';
import PrivacyPolicy from './components/PrivacyPolicy';
import YeshivaRequestModal from './components/YeshivaRequestModal';
import { getYeshivotDB, saveTestResultDB } from './firebase';
import { calculateKNNMatches } from './knn';
import { PlusCircle, Compass, Home, Mail, UserCog, CalendarDays } from 'lucide-react';

export default function App() {
  const getInitialView = () => {
    const path = window.location.pathname;
    const search = window.location.search;
    const hash = window.location.hash;
    if (path.startsWith('/calendar')) return 'calendar';
    if (path.startsWith('/privacy')) return 'privacy';
    if (path.startsWith('/manager/register')) return 'manager-register';
    if (path.startsWith('/manager') || path.startsWith('/admin') || search.includes('admin=true') || hash === '#admin') {
      return 'manager';
    }
    if (path.startsWith('/results') || hash === '#results') {
      return 'results';
    }
    return 'questionnaire';
  };

  const [view, setViewState] = useState(getInitialView);
  const [yeshivotList, setYeshivotList] = useState([]);
  const [userPreferences, setUserPreferences] = useState(null);
  const [results, setResults] = useState([]);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasTriggeredLoad, setHasTriggeredLoad] = useState(false);

  const [resetKey, setResetKey] = useState(0);

  // Helper navigation functions
  const navigateToAdmin = (e) => {
    if (e) e.preventDefault();
    window.history.pushState({ view: 'manager' }, '', '/admin');
    setViewState('manager');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (!hasTriggeredLoad) loadYeshivot();
  };

  const navigateToCalendar = (e) => {
    if (e) e.preventDefault();
    window.history.pushState({ view: 'calendar' }, '', '/calendar');
    setViewState('calendar');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToHome = (e) => {
    if (e) e.preventDefault();
    window.history.pushState({ view: 'questionnaire' }, '', '/');
    setUserPreferences(null);
    setResults([]);
    setViewState('questionnaire');
    setResetKey(prev => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToResults = () => {
    window.history.pushState({ view: 'results' }, '', '/results');
    setViewState('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sync back/forward browser navigation & direct URL changes
  useEffect(() => {
    const handleUrlSync = () => {
      setViewState(getInitialView());
    };

    window.addEventListener('popstate', handleUrlSync);
    return () => window.removeEventListener('popstate', handleUrlSync);
  }, []);

  // Fetch Yeshivot list function (triggered on "התחל" or when entering Admin/Results)
  const loadYeshivot = async () => {
    if (hasTriggeredLoad && yeshivotList.length > 0) return;
    setHasTriggeredLoad(true);
    setLoading(true);
    try {
      const data = await getYeshivotDB();
      setYeshivotList(data);
    } catch (err) {
      console.error("Error loading yeshivot:", err);
    } finally {
      setLoading(false);
    }
  };

  // If opening directly on admin or results view, load immediately
  useEffect(() => {
    const initialView = getInitialView();
    if (initialView === 'admin' || initialView === 'results') {
      loadYeshivot();
    }
  }, []);

  const handleCalculateMatches = async (preferences) => {
    setUserPreferences(preferences);
    // Ensure yeshivot data is loaded before calculating matches
    let listToUse = yeshivotList;
    if (listToUse.length === 0) {
      setLoading(true);
      try {
        listToUse = await getYeshivotDB();
        setYeshivotList(listToUse);
        setHasTriggeredLoad(true);
      } catch (err) {
        console.error("Error fetching yeshivot on finish:", err);
      } finally {
        setLoading(false);
      }
    }
    const matches = calculateKNNMatches(preferences, listToUse, 3);
    setResults(matches);
    
    // Log the answers and the generated matches automatically (Task B)
    saveTestResultDB({
      preferences,
      top_matches: matches.map(m => ({ id: m.id, name: m.name, matchScore: m.matchScore }))
    });

    navigateToResults();
  };

  return (
    <div className="app-container">
      {/* Top App Header - Ultra Compact Single Row */}
      <header className="app-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.2rem 0.1rem' }}>
        <h1
          className="app-title"
          onClick={navigateToHome}
          title="לדף הבית"
          style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer', margin: 0 }}
        >
          <Compass style={{ width: 26, height: 26, color: 'var(--gold-accent)' }} />
          <span>שבושון</span>
        </h1>

        {view !== 'questionnaire' && (
          <button onClick={navigateToHome} className="btn-secondary" title="חזרה לדף הבית">
            <Home style={{ width: 16, height: 16 }} />
            דף הבית
          </button>
        )}
      </header>

      {/* Main View Router */}
      <main>
        {loading && view !== 'questionnaire' ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
            <h3 style={{ fontSize: '1.3rem', color: '#111827', marginBottom: '0.5rem' }}>
              טוען נתוני ישיבות/מכינות מהמאגר...
            </h3>
            <p style={{ color: '#4b5563', fontSize: '0.9rem' }}>אנא המתן מספר שניות</p>
          </div>
        ) : (
          <>
            {view === 'questionnaire' && (
              <a href="/calendar" onClick={navigateToCalendar} className="btn-gold" style={{
                textDecoration: 'none', width: '100%', marginBottom: '1rem', minHeight: 56,
                fontSize: '1.1rem', fontWeight: 700, boxShadow: '0 4px 12px rgba(180, 120, 40, 0.35)'
              }}>
                <CalendarDays style={{ width: 22, height: 22 }} />
                ימים פתוחים ושבתות שבושים
                <span style={{
                  background: '#fff', color: '#94601c', fontWeight: 800, fontSize: '0.75rem',
                  padding: '0.1rem 0.55rem', borderRadius: 999, whiteSpace: 'nowrap'
                }}>בהרצה</span>
              </a>
            )}

            {view === 'questionnaire' && (
              <Questionnaire
                key={resetKey}
                onStartQuiz={loadYeshivot}
                onCalculateMatches={handleCalculateMatches}
                onRequestAddYeshiva={() => setIsRequestModalOpen(true)}
              />
            )}

            {view === 'results' && (
              <ResultsView
                results={results}
                userPreferences={userPreferences}
                yeshivotList={yeshivotList}
                onRestart={navigateToHome}
                onRequestAddYeshiva={() => setIsRequestModalOpen(true)}
              />
            )}

            {view === 'calendar' && <CalendarView />}

            {view === 'privacy' && <PrivacyPolicy />}

            {(view === 'manager' || view === 'manager-register') && (
              <Suspense fallback={<p style={{ textAlign: 'center', padding: '2rem' }}>טוען...</p>}>
                <ManagerPortal
                  mode={view === 'manager-register' ? 'register' : 'login'}
                  inviteToken={new URLSearchParams(window.location.search).get('invite')}
                  onExit={navigateToHome}
                />
              </Suspense>
            )}

          </>
        )}
      </main>

      {/* Bottom Footer Action Links */}
      <footer style={{ marginTop: '1.5rem', padding: '1rem 0 0.5rem', textAlign: 'center', borderTop: '1px solid var(--border-color)' }}>
        <div className={view !== 'manager' && view !== 'manager-register' && view !== 'calendar' && view !== 'privacy' ? 'footer-grid' : 'footer-links'}>
          {view !== 'manager' && view !== 'manager-register' && view !== 'calendar' && view !== 'privacy' ? (
            <>
              <button
                onClick={() => {
                  setIsRequestModalOpen(true);
                  if (!hasTriggeredLoad) loadYeshivot();
                }}
                className="btn-secondary"
              >
                <PlusCircle style={{ width: 16, height: 16 }} />
                בקשה להוספת ישיבה / מכינה
              </button>

              <a href="mailto:shvushon@gmail.com" className="btn-secondary" style={{ textDecoration: 'none' }}>
                <Mail style={{ width: 16, height: 16 }} />
                צור קשר
              </a>

              <a href="/admin" onClick={navigateToAdmin} className="btn-secondary" style={{ textDecoration: 'none' }}>
                <UserCog style={{ width: 16, height: 16 }} />
                כניסת אחראי ישיבות
              </a>
            </>
          ) : (
            <a href="/" onClick={navigateToHome} className="btn-secondary" style={{ textDecoration: 'none' }}>
              חזרה לשאלון בשבושון
            </a>
          )}
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          © שבושון · מערכת להתאמת ישיבות ומכינות
        </div>
      </footer>

      {/* Yeshiva Request Modal */}
      <YeshivaRequestModal
        isOpen={isRequestModalOpen}
        yeshivotList={yeshivotList}
        onClose={() => setIsRequestModalOpen(false)}
        onOpenAdmin={() => {
          setIsRequestModalOpen(false);
          setViewState('manager');
          window.history.pushState({ view: 'manager' }, '', '/admin');
        }}
      />
    </div>
  );
}
