import React, { useState, useEffect, Suspense, lazy } from 'react';
import { ShieldCheck, Plus, Check, RefreshCw, Trash2, Edit3, LogOut, Inbox, Users, Database, TrendingUp, Link2, Copy, UserCheck } from 'lucide-react';
import { 
  getYeshivotDB, 
  getYeshivaRequestsDB, 
  getStudentSubmissionsDB, 
  approveYeshivaRequestDB, 
  recalculateYeshivaAveragesDB, 
  saveYeshivaDB, 
  deleteYeshivaDB,
  deleteYeshivaRequestDB,
  deleteStudentSubmissionDB
} from '../firebase';
import { PARAM_DEFINITIONS, REGIONS, YESHIVA_TYPES, REGION_TRANSLATIONS, TYPE_TRANSLATIONS } from '../knn';
import { createManagerInviteDB, getManagersDB } from '../manager';
import CustomSelect from './CustomSelect';
// Charts (recharts) are heavy: load them only when the analytics tab is opened
const AnalyticsTab = lazy(() => import('./AnalyticsTab'));

export default function AdminDashboard({ onExitAdmin }) {

  const [activeTab, setActiveTab] = useState('requests'); // requests, submissions, yeshivot, analytics
  const [submissionFilter, setSubmissionFilter] = useState('pending'); // 'pending' or 'all'
  const [requests, setRequests] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [yeshivot, setYeshivot] = useState([]);
  const [analyticsTick, setAnalyticsTick] = useState(0);
  const [managers, setManagers] = useState([]);
  const [inviteResult, setInviteResult] = useState(null); // { yeshivaName, url }
  const [onlyWithManager, setOnlyWithManager] = useState(false);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  // Editing state for yeshivot
  const [editingYeshiva, setEditingYeshiva] = useState(null);

  const loadActiveTabData = async (tabToLoad = activeTab, force = false) => {
    setLoading(true);
    try {
      if (tabToLoad === 'requests' && (force || requests.length === 0)) {
        setRequests(await getYeshivaRequestsDB().catch(() => []));
      } else if (tabToLoad === 'submissions' && (force || submissions.length === 0)) {
        setSubmissions(await getStudentSubmissionsDB().catch(() => []));
      } else if (tabToLoad === 'yeshivot' && (force || yeshivot.length === 0)) {
        setYeshivot(await getYeshivotDB().catch(() => []));
        setManagers(await getManagersDB().catch(() => []));
      } else if (tabToLoad === 'analytics' && force) {
        setAnalyticsTick(t => t + 1);
      }
    } catch (err) {
      console.error("Error loading tab data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActiveTabData(activeTab, false);
  }, [activeTab]);

  const handleApproveRequest = async (request) => {
    setLoading(true);
    try {
      const added = await approveYeshivaRequestDB(request);
      setMsg(`✓ הישיבה/מכינה "${added.name}" אושרה ונוספה למאגר הראשי בהצלחה!`);
      await loadActiveTabData(activeTab, true);
    } catch (err) {
      console.error("Error approving request:", err);
      setMsg("שגיאה באישור הבקשה.");
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRequest = async (request) => {
    if (!window.confirm(`האם אתה בטוח שברצונך לסרב ולמחוק את הבקשה להוספת "${request.yeshiva_name}"?`)) {
      return;
    }
    setLoading(true);
    try {
      await deleteYeshivaRequestDB(request.id);
      setMsg(`✓ הבקשה להוספת "${request.yeshiva_name}" נדחתה ונמחקה.`);
      await loadActiveTabData(activeTab, true);
    } catch (err) {
      console.error("Error deleting request:", err);
      setMsg("שגיאה במחיקת הבקשה.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubmission = async (submission) => {
    if (!window.confirm(`האם אתה בטוח שברצונך למחוק את הדיווח של התלמיד עבור "${submission.yeshiva_name}"?`)) {
      return;
    }
    setLoading(true);
    try {
      await deleteStudentSubmissionDB(submission.id);
      setMsg(`✓ הדיווח עבור "${submission.yeshiva_name}" נמחק מהמאגר.`);
      await loadActiveTabData(activeTab, true);
    } catch (err) {
      console.error("Error deleting submission:", err);
      setMsg("שגיאה במחיקת הדיווח.");
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculateAverages = async () => {
    setLoading(true);
    try {
      await recalculateYeshivaAveragesDB();
      setMsg("✓ ממוצעי הדירוגים של כל הישיבות/מכינות עודכנו ושוקללו במאגר לפי כל דיווחי התלמידים!");
      await loadActiveTabData(activeTab, true);
    } catch (err) {
      console.error("Error recalculating averages:", err);
      setMsg("שגיאה בשקלול הממוצעים.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvite = async (y) => {
    setLoading(true);
    try {
      const invite = await createManagerInviteDB(y);
      setInviteResult({ yeshivaName: y.name, url: invite.url });
      await loadActiveTabData('yeshivot', true);
    } catch (err) {
      console.error('Error creating manager invite:', err);
      setMsg('שגיאה ביצירת קישור הרשמה לאחראי.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEditingYeshiva = async (e) => {
    e.preventDefault();
    if (!editingYeshiva.name) return;

    setLoading(true);
    try {
      await saveYeshivaDB(editingYeshiva);
      setMsg(`✓ הישיבה/מכינה "${editingYeshiva.name}" שנערכה נשמרה במאגר.`);
      setEditingYeshiva(null);
      await loadActiveTabData(activeTab, true);
    } catch (err) {
      console.error("Error saving yeshiva:", err);
      setMsg("שגיאה בשמירת הישיבה/מכינה.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteYeshiva = async (yeshivaId, yeshivaName) => {
    if (!window.confirm(`האם אתה בטוח שברצונך למחוק את הישיבה/מכינה "${yeshivaName}" מהמאגר הראשי?`)) {
      return;
    }
    setLoading(true);
    try {
      await deleteYeshivaDB(yeshivaId);
      setMsg(`✓ הישיבה/מכינה "${yeshivaName}" נמחקה מהמאגר.`);
      await loadActiveTabData(activeTab, true);
    } catch (err) {
      console.error("Error deleting yeshiva:", err);
      setMsg("שגיאה במחיקת הישיבה/מכינה.");
    } finally {
      setLoading(false);
    }
  };

  const regionOptions = REGIONS.map(r => ({ value: r.id, label: r.label }));
  const typeOptions = YESHIVA_TYPES.map(t => ({ value: t.id, label: t.label }));

  return (
    <div className="admin-container">
      {/* Admin Header */}
      <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <ShieldCheck style={{ width: 32, height: 32, color: '#10b981' }} />
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>ממשק ניהול שבושון</h1>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>מחובר לניהול המאגר הראשי</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.8rem' }}>
          <button onClick={() => loadActiveTabData(activeTab, true)} disabled={loading} className="btn-secondary">
            <RefreshCw style={{ width: 16, height: 16 }} />
            רענן נתונים
          </button>
          <button onClick={onExitAdmin} className="btn-secondary">
            <LogOut style={{ width: 16, height: 16 }} />
            יציאה מאדמין
          </button>
        </div>
      </div>

      {msg && (
        <div style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#34d399', padding: '0.8rem 1.2rem', borderRadius: 10, marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{msg}</span>
          <button onClick={() => setMsg('')} style={{ background: 'none', border: 'none', color: '#34d399', cursor: 'pointer', fontWeight: 700 }}>✕</button>
        </div>
      )}

      {/* Admin Tabs */}
      <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button
          className={`btn-secondary ${activeTab === 'requests' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          <Inbox style={{ width: 18, height: 18 }} />
          בקשות לישיבות חדשות
        </button>

        <button
          className={`btn-secondary ${activeTab === 'submissions' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('submissions')}
        >
          <Users style={{ width: 18, height: 18 }} />
          דיווחי תלמידים כיום
        </button>

        <button
          className={`btn-secondary ${activeTab === 'yeshivot' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('yeshivot')}
        >
          <Database style={{ width: 18, height: 18 }} />
          ניהול מאגר הישיבות
        </button>

        <button
          className={`btn-secondary ${activeTab === 'analytics' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <TrendingUp style={{ width: 18, height: 18 }} />
          אנליטיקות ומגמות
        </button>
      </div>

      {/* TAB 1: YESHIVA ADDITION REQUESTS */}
      {activeTab === 'requests' && (
        <div className="glass-card">
          <h2 className="section-title" style={{ color: '#111827' }}>
            <Inbox className="w-5 h-5 text-amber-700" />
            בקשות שהוגשו ע"י משתמשים להוספת ישיבות/מכינות חדשות
          </h2>

          {loading && requests.length === 0 ? (
            <p style={{ color: '#4b5563' }}>טוען נתונים...</p>
          ) : requests.length === 0 ? (
            <p style={{ color: '#4b5563' }}>אין כרגע בקשות ממתינות במערכת.</p>
          ) : (
            requests.map(req => (
              <div key={req.id} className="yeshiva-result-card" style={{ opacity: req.status === 'approved' ? 0.6 : 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: '#111827' }}>{req.yeshiva_name}</h3>
                      {req.status === 'approved' && (
                        <span style={{ background: '#059669', color: 'white', fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: 4, fontWeight: 700 }}>
                          ✓ אושר ונוסף
                        </span>
                      )}
                    </div>
                    <div style={{ color: '#4b5563', fontSize: '0.9rem', marginTop: 4 }}>
                      סוג: {TYPE_TRANSLATIONS[req.type] || req.type} | אזור: {REGION_TRANSLATIONS[req.region] || req.region}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '0.82rem', marginTop: 2 }}>
                      אימייל מגיש: {req.submitter_email || 'לא צוין'} | הערות: {req.notes || 'אין'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {req.status !== 'approved' && (
                      <button
                        onClick={() => handleApproveRequest(req)}
                        disabled={loading}
                        className="btn-gold"
                        style={{ padding: '0.55rem 1.1rem', fontSize: '0.88rem' }}
                      >
                        <Check style={{ width: 16, height: 16 }} />
                        אשר והוסף למאגר
                      </button>
                    )}

                    <button
                      onClick={() => handleRejectRequest(req)}
                      disabled={loading}
                      className="btn-secondary"
                      style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)', padding: '0.55rem 1.1rem', fontSize: '0.88rem' }}
                    >
                      <Trash2 style={{ width: 15, height: 15 }} />
                      סרב ומחק בקשה
                    </button>
                  </div>
                </div>

                {req.ratings && (
                  <div style={{ marginTop: '0.8rem', background: '#f8f4ec', padding: '0.8rem', borderRadius: 8, border: '1px solid #e2d9c8' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#52341d', marginBottom: 4 }}>
                      פרמטרים שהציע המשתמש עבור הישיבה/מכינה:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.4rem', fontSize: '0.8rem' }}>
                      {PARAM_DEFINITIONS.map(p => (
                        <div key={p.id} style={{ color: '#374151' }}>
                          {p.label}: <strong>{req.ratings[p.id] || 3}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: STUDENT SUBMISSIONS & RECALCULATE */}
      {activeTab === 'submissions' && (() => {
        const pendingSubmissions = submissions.filter(s => s.processed !== true);
        const displayedSubmissions = submissionFilter === 'pending' ? pendingSubmissions : submissions;

        return (
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 className="section-title" style={{ margin: 0, color: '#111827' }}>
                  <Users className="w-5 h-5 text-emerald-600" />
                  תשובות שנאספו מתלמידים כיום
                </h2>
                <p style={{ color: '#4b5563', fontSize: '0.9rem', marginTop: 4 }}>
                  מציג דיווחי תלמידים מאומתים ({pendingSubmissions.length} תשובות ממתינות לעדכון ממוצעים)
                </p>
              </div>

              <button
                onClick={handleRecalculateAverages}
                disabled={loading || pendingSubmissions.length === 0}
                className="btn-gold"
              >
                <RefreshCw style={{ width: 18, height: 18 }} />
                {pendingSubmissions.length > 0 
                  ? `עדכן ממוצעים במאגר (${pendingSubmissions.length} תשובות חדשות)` 
                  : 'כל התשובות כבר עודכנו במאגר ✓'}
              </button>
            </div>

            {/* Filter Toggle Buttons */}
            <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.2rem' }}>
              <button
                type="button"
                className={`btn-secondary ${submissionFilter === 'pending' ? 'btn-primary' : ''}`}
                onClick={() => setSubmissionFilter('pending')}
                style={{ fontSize: '0.85rem', padding: '0.4rem 0.9rem' }}
              >
                ⏳ תשובות שעוד לא עודכנו במאגר ({pendingSubmissions.length})
              </button>
              <button
                type="button"
                className={`btn-secondary ${submissionFilter === 'all' ? 'btn-primary' : ''}`}
                onClick={() => setSubmissionFilter('all')}
                style={{ fontSize: '0.85rem', padding: '0.4rem 0.9rem' }}
              >
                📜 כל הדיווחים ({submissions.length})
              </button>
            </div>

            {loading && displayedSubmissions.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#4b5563', background: '#f8f4ec', borderRadius: 8 }}>
                טוען נתונים...
              </div>
            ) : displayedSubmissions.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#4b5563', background: '#f8f4ec', borderRadius: 8 }}>
                {submissionFilter === 'pending' 
                  ? '✓ כל תשובות התלמידים במערכת כבר חושבו ועודכנו בממוצעי הישיבות/מכינות!' 
                  : 'טרם התקבלו דיווחי תלמידים כיום במערכת.'}
              </div>
            ) : (
              displayedSubmissions.map((sub, idx) => (
                <div key={sub.id || idx} className="yeshiva-result-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: 4 }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#111827' }}>{sub.yeshiva_name}</h3>
                        {sub.processed === true ? (
                          <span className="tag" style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>עודכן במאגר ✓</span>
                        ) : (
                          <span className="tag" style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>חדש - ממתין לעדכון ⏳</span>
                        )}
                      </div>
                      <div style={{ color: '#4b5563', fontSize: '0.85rem' }}>
                        תאריך דיווח: {new Date(sub.created_at || Date.now()).toLocaleDateString('he-IL')}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                      <span style={{ background: '#ecfdf5', color: '#047857', padding: '0.3rem 0.7rem', borderRadius: 999, fontSize: '0.8rem', fontWeight: 700 }}>
                        תלמיד מאומת ✓
                      </span>

                      <button
                        onClick={() => handleDeleteSubmission(sub)}
                        disabled={loading}
                        className="btn-secondary"
                        style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)', padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}
                      >
                        <Trash2 style={{ width: 14, height: 14 }} />
                        מחק דיווח
                      </button>
                    </div>
                  </div>

                  {sub.ratings && (
                    <div style={{ marginTop: '0.8rem', background: '#f8f4ec', padding: '0.8rem', borderRadius: 8, border: '1px solid #e2d9c8' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.4rem', fontSize: '0.82rem' }}>
                        {PARAM_DEFINITIONS.map(p => (
                          <div key={p.id} style={{ color: '#374151' }}>
                            {p.label}: <strong>{sub.ratings[p.id] || 3}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        );
      })()}

      {/* TAB 3: MANAGE YESHIVOT */}
      {activeTab === 'yeshivot' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 className="section-title" style={{ margin: 0 }}>
              <Database className="w-5 h-5 text-purple-400" />
              ניהול מאגר הישיבות והמכינות
            </h2>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setOnlyWithManager(v => !v)}
              className={onlyWithManager ? 'btn-primary' : 'btn-secondary'}
            >
              <UserCheck style={{ width: 18, height: 18 }} />
              רק עם אחראי רשום
            </button>
            <button
              onClick={() => setEditingYeshiva({
                id: 'y_' + Date.now(),
                name: '',
                type: 'hesder',
                region: 'center',
                ratings: PARAM_DEFINITIONS.reduce((acc, p) => ({ ...acc, [p.id]: 3 }), {}),
                submissions_count: 1
              })}
              className="btn-primary"
            >
              <Plus style={{ width: 18, height: 18 }} />
              הוסף ישיבה/מכינה ידנית
            </button>
            </div>
          </div>

          {loading && yeshivot.length === 0 ? (
            <p style={{ color: '#94a3b8' }}>טוען נתונים...</p>
          ) : yeshivot.length === 0 ? (
            <p style={{ color: '#94a3b8' }}>אין ישיבות/מכינות במאגר.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
              {yeshivot.filter(y => !onlyWithManager || managers.some(m => m.yeshivaId === y.id)).map(y => (
                <div key={y.id} className="yeshiva-result-card" style={{ margin: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>{y.name}</h3>
                      <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: 2 }}>
                        {TYPE_TRANSLATIONS[y.type] || y.type} • {REGION_TRANSLATIONS[y.region] || y.region}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        onClick={() => handleCreateInvite(y)}
                        className="btn-secondary"
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
                        title="יצירת קישור הרשמה חד-פעמי לאחראי שבושים"
                      >
                        <Link2 style={{ width: 14, height: 14 }} />
                      </button>
                      <button
                        onClick={() => setEditingYeshiva(y)}
                        className="btn-secondary"
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
                      >
                        <Edit3 style={{ width: 14, height: 14 }} />
                      </button>
                      <button
                        onClick={() => handleDeleteYeshiva(y.id, y.name)}
                        className="btn-secondary"
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                      >
                        <Trash2 style={{ width: 14, height: 14 }} />
                      </button>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.82rem', color: '#cbd5e1', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '0.6rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem' }}>
                    <div>גמרא: <strong>{y.ratings?.gemara || 3}</strong></div>
                    <div>ליברליות: <strong>{y.ratings?.liberalism || 3}</strong></div>
                    <div>גודל: <strong>{y.ratings?.overall_size || 3}</strong></div>
                    <div>תנאים: <strong>{y.ratings?.conditions || 3}</strong></div>
                  </div>
                  {managers.filter(m => m.yeshivaId === y.id).map(m => (
                    <div key={m.id} style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                      אחראי: {m.name ? `${m.name} • ` : ''}{m.email} • {m.phone}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: Analytics */}
      {activeTab === 'analytics' && (
        <Suspense fallback={<div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>טוען נתונים...</div>}>
          <AnalyticsTab refreshTick={analyticsTick} />
        </Suspense>
      )}

      {/* ONE-TIME MANAGER INVITE LINK */}
      {inviteResult && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-card" style={{ maxWidth: 560, width: '100%', background: '#ffffff', border: '1px solid #e2d9c8' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.6rem', color: '#111827' }}>
              קישור הרשמה לאחראי שבושים – {inviteResult.yeshivaName}
            </h2>
            <p style={{ color: '#374151', marginBottom: '0.8rem' }}>
              הקישור חד-פעמי – אחרי שהאחראי נרשם הוא יפסיק לעבוד.
            </p>
            <input readOnly className="input-field" dir="ltr" value={inviteResult.url} onFocus={(e) => e.target.select()} style={{ marginBottom: '1rem' }} />
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <button
                className="btn-primary"
                onClick={() => navigator.clipboard?.writeText(inviteResult.url).then(() => setMsg('✓ הקישור הועתק'))}
              >
                <Copy style={{ width: 16, height: 16 }} />
                העתק קישור
              </button>
              <a
                className="btn-secondary"
                style={{ textDecoration: 'none' }}
                target="_blank"
                rel="noreferrer"
                href={`https://wa.me/?text=${encodeURIComponent(`הרשמה כאחראי שבושים של ${inviteResult.yeshivaName}: ${inviteResult.url}`)}`}
              >
                שליחה בווטסאפ
              </a>
              <button className="btn-secondary" onClick={() => setInviteResult(null)}>סגור</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT / CREATE YESHIVA MODAL */}
      {editingYeshiva && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-card" style={{ maxWidth: 650, width: '100%', maxHeight: '90vh', overflowY: 'auto', background: '#ffffff', border: '1px solid #e2d9c8' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.2rem', color: '#111827' }}>
              {editingYeshiva.name ? `עריכת ישיבה/מכינה: ${editingYeshiva.name}` : 'הוספת ישיבה/מכינה חדשה למאגר'}
            </h2>

            <form onSubmit={handleSaveEditingYeshiva}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', color: '#111827' }}>שם הישיבה / המכינה</label>
                <input
                  type="text"
                  className="input-field"
                  value={editingYeshiva.name}
                  onChange={(e) => setEditingYeshiva({ ...editingYeshiva, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', color: '#111827' }}>סוג המוסד</label>
                  <CustomSelect
                    options={typeOptions}
                    value={editingYeshiva.type}
                    onChange={(val) => setEditingYeshiva({ ...editingYeshiva, type: val })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', color: '#111827' }}>אזור גאוגרפי</label>
                  <CustomSelect
                    options={regionOptions}
                    value={editingYeshiva.region}
                    onChange={(val) => setEditingYeshiva({ ...editingYeshiva, region: val })}
                  />
                </div>
              </div>

              {/* 11 Parameters Ratings Editors */}
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.8rem', color: '#52341d' }}>
                דירוגי 11 הפרמטרים במאגר (1 עד 5):
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.8rem', marginBottom: '1.5rem' }}>
                {PARAM_DEFINITIONS.map(p => (
                  <div key={p.id} className="slider-group" style={{ margin: 0, padding: '0.7rem' }}>
                    <div className="slider-header" style={{ marginBottom: '0.2rem' }}>
                      <span className="slider-title" style={{ fontSize: '0.85rem' }}>{p.label}</span>
                      <span className="slider-value-badge" style={{ fontSize: '0.8rem', padding: '0.1rem 0.5rem' }}>
                        {editingYeshiva.ratings[p.id] || 3}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="0.1"
                      value={editingYeshiva.ratings[p.id] || 3}
                      onChange={(e) => setEditingYeshiva({
                        ...editingYeshiva,
                        ratings: { ...editingYeshiva.ratings, [p.id]: Number(e.target.value) }
                      })}
                      className="custom-range"
                    />
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setEditingYeshiva(null)} className="btn-secondary">
                  ביטול
                </button>
                <button type="submit" disabled={loading} className="btn-primary">
                  שמור שינויים במאגר
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
