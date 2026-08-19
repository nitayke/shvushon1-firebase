import React, { useState, useEffect } from 'react';
import Questionnaire from './components/Questionnaire';
import ResultsView from './components/ResultsView';
import AdminDashboard from './components/AdminDashboard';
import YeshivaRequestModal from './components/YeshivaRequestModal';
import { getYeshivotDB } from './firebase';
import { calculateKNNMatches } from './knn';
import { Shield, PlusCircle, Compass } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);

  // Helper navigation functions
  const navigateToAdmin = (e) => {
    if (e) e.preventDefault();
    window.history.pushState({ view: 'admin' }, '', '/admin');
    setViewState('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  // Fetch Yeshivot list on load
  const loadYeshivot = async () => {
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

  useEffect(() => {
    loadYeshivot();
  }, []);

  const handleCalculateMatches = (preferences) => {
    setUserPreferences(preferences);
    const matches = calculateKNNMatches(preferences, yeshivotList, 3);
    setResults(matches);
    navigateToResults();
  };

  return (
    <div className="app-container">
      {/* Top App Header */}
      <header className="app-header">
        <h1 className="app-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
          <Compass style={{ width: 44, height: 44, color: '#818cf8' }} />
          <span>שבושון - מבחן התאמה לישיבות ומכינות</span>
        </h1>

        <p className="app-subtitle">
          שמיניסט יקר! דרג את העדפותיך וגלה מהן הישיבות והמכינות המתאימות ביותר עבורך, בהתבסס על נתונים שנאספו מתלמידים ומתעדכנים בזמן אמת במאגר.
        </p>
      </header>

      {/* Main View Router */}
      <main>
        {loading ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
            <h3 style={{ fontSize: '1.3rem', color: '#cbd5e1', marginBottom: '0.5rem' }}>
              טוען נתוני ישיבות מהמאגר...
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>אנא המתן מספר שניות</p>
          </div>
        ) : (
          <>
            {view === 'questionnaire' && (
              <Questionnaire
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
      <footer style={{ marginTop: '3.5rem', padding: '1.5rem 0', textAlign: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.8rem' }}>
          {view !== 'admin' ? (
            <>
              <button
                onClick={() => setIsRequestModalOpen(true)}
                className="btn-secondary"
                style={{ fontSize: '0.85rem', padding: '0.45rem 1rem' }}
              >
                <PlusCircle style={{ width: 15, height: 15 }} />
                בקשה להוספת ישיבה / מכינה
              </button>

              <a
                href="/admin"
                onClick={navigateToAdmin}
                className="btn-secondary"
                style={{ 
                  fontSize: '0.85rem', 
                  padding: '0.45rem 1rem', 
                  opacity: 0.7, 
                  textDecoration: 'none', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '0.4rem' 
                }}
              >
                <Shield style={{ width: 15, height: 15 }} />
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

        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
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
