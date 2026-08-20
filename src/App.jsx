import React, { useState, useEffect } from 'react';
// Shvushon 2.0.1 - Male phrasing & 100% Live Firestore
import Questionnaire from './components/Questionnaire';
import ResultsView from './components/ResultsView';
import AdminDashboard from './components/AdminDashboard';
import YeshivaRequestModal from './components/YeshivaRequestModal';
import { getYeshivotDB } from './firebase';
import { calculateKNNMatches } from './knn';
import { Shield, PlusCircle, Compass, Home } from 'lucide-react';

export default function App() {
  const getInitialView = () => {
    const path = window.location.pathname;
    const search = window.location.search;
    const hash = window.location.hash;
    if (path.startsWith('/admin') || search.includes('admin=true') || hash === '#admin') {
      return 'admin';
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

  // Helper navigation functions
  const navigateToAdmin = (e) => {
    if (e) e.preventDefault();
    window.history.pushState({ view: 'admin' }, '', '/admin');
    setViewState('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (!hasTriggeredLoad) loadYeshivot();
  };

  const navigateToHome = (e) => {
    if (e) e.preventDefault();
    window.history.pushState({ view: 'questionnaire' }, '', '/');
    setUserPreferences(null);
    setResults([]);
    setViewState('questionnaire');
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
    navigateToResults();
  };

  return (
    <div className="app-container">
      {/* Top App Header - Ultra Compact Single Row */}
      <header className="app-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', padding: '0 0.1rem' }}>
        {/* Clickable Logo and Title */}
        <h1 
          className="app-title" 
          onClick={navigateToHome}
          title="לחץ לחזרה לדף הבית"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.4rem', 
            cursor: 'pointer',
            fontSize: '1.4rem',
            margin: 0
          }}
        >
          <Compass style={{ width: 22, height: 22, color: '#6e441f' }} />
          <span>שבושון</span>
        </h1>

        {/* Return to Home Button */}
        <button
          onClick={navigateToHome}
          className="btn-secondary"
          style={{
            fontSize: '0.78rem',
            padding: '0.3rem 0.75rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}
          title="חזרה לדף הבית"
        >
          <Home style={{ width: 14, height: 14 }} />
          דף הבית
        </button>
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
              <Questionnaire
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

            {view === 'admin' && (
              <AdminDashboard
                onExitAdmin={navigateToHome}
              />
            )}
          </>
        )}
      </main>

      {/* Bottom Footer Action Links */}
      <footer style={{ marginTop: '2rem', padding: '1rem 0', textAlign: 'center', borderTop: '1px solid #262a36' }}>
        <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
          {view !== 'admin' ? (
            <>
              <button
                onClick={() => setIsRequestModalOpen(true)}
                className="btn-secondary"
                style={{ fontSize: '0.82rem', padding: '0.4rem 0.9rem' }}
              >
                <PlusCircle style={{ width: 14, height: 14 }} />
                בקשה להוספת ישיבה / מכינה
              </button>

              <a
                href="/admin"
                onClick={navigateToAdmin}
                className="btn-secondary"
                style={{ 
                  fontSize: '0.82rem', 
                  padding: '0.4rem 0.9rem', 
                  opacity: 0.7, 
                  textDecoration: 'none', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '0.4rem' 
                }}
              >
                <Shield style={{ width: 14, height: 14 }} />
                ממשק ניהול
              </a>
            </>
          ) : (
            <a
              href="/"
              onClick={navigateToHome}
              className="btn-secondary"
              style={{ 
                fontSize: '0.85rem', 
                padding: '0.45rem 1rem', 
                textDecoration: 'none', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.4rem' 
              }}
            >
              חזרה לשאלון בשבושון
            </a>
          )}
        </div>

        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
          © שבושון - מערכת להתאמת ישיבות ומכינות
        </div>
      </footer>

      {/* Yeshiva Request Modal */}
      <YeshivaRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onOpenAdmin={() => {
          setIsRequestModalOpen(false);
          setViewState('admin');
          window.history.pushState({ view: 'admin' }, '', '/admin');
        }}
      />
    </div>
  );
}
