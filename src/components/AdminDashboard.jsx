import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Check, RefreshCw, Trash2, Edit3, Lock, LogOut, Inbox, Users, Database } from 'lucide-react';
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
import { PARAM_DEFINITIONS, REGIONS, TYPES, REGION_TRANSLATIONS, TYPE_TRANSLATIONS } from '../knn';
import CustomSelect from './CustomSelect';

export default function AdminDashboard({ onExitAdmin }) {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');

  const [activeTab, setActiveTab] = useState('requests'); // requests, submissions, yeshivot
  const [requests, setRequests] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [yeshivot, setYeshivot] = useState([]);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  // Editing state for yeshivot
  const [editingYeshiva, setEditingYeshiva] = useState(null);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'Nitayke1') {
      setIsAuthenticated(true);
      setAuthError('');
      loadAdminData();
    } else {
      setAuthError('סיסמה שגויה!');
    }
  };

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [reqs, subs, yeshList] = await Promise.all([
        getYeshivaRequestsDB(),
        getStudentSubmissionsDB(),
        getYeshivotDB()
      ]);
      setRequests(reqs);
      setSubmissions(subs);
      setYeshivot(yeshList);
    } catch (err) {
      console.error("Load admin data error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true') {
      setIsAuthenticated(true);
      loadAdminData();
    }
  }, []);

  const handleApproveRequest = async (request) => {
    setLoading(true);
    try {
      await approveYeshivaRequestDB(request);
      setMsg(`הישיבה "${request.yeshiva_name}" אושרה ונוספה בהצלחה למאגר הישיבות!`);
      await loadAdminData();
    } catch (err) {
      console.error("Approve request error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRequest = async (request) => {
    if (!window.confirm(`האם למחוק ולסרב לבקשת הוספת הישיבה "${request.yeshiva_name}"?`)) return;
    setLoading(true);
    try {
      await deleteYeshivaRequestDB(request.id);
      setMsg(`הבקשה להוספת "${request.yeshiva_name}" נדחתה ונמחקה מהמערכת.`);
      await loadAdminData();
    } catch (err) {
      console.error("Delete request error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubmission = async (submission) => {
    if (!window.confirm(`האם למחוק את דיווח התלמיד עבור הישיבה "${submission.yeshiva_name}"?`)) return;
    setLoading(true);
    try {
      await deleteStudentSubmissionDB(submission.id);
      setMsg(`דיווח התלמיד עבור "${submission.yeshiva_name}" נמחק בהצלחה.`);
      await loadAdminData();
    } catch (err) {
      console.error("Delete submission error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculateAverages = async () => {
    setLoading(true);
    try {
      const updated = await recalculateYeshivaAveragesDB();
      setYeshivot(updated);
      setMsg(`ממוצעי הישיבות חודשו ועודכנו במאגר בהצלחה על סמך ${submissions.length} דיווחי תלמידים!`);
    } catch (err) {
      console.error("Recalculate error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteYeshiva = async (id, name) => {
    if (!window.confirm(`האם אתה בטוח שברצונך למחוק את הישיבה "${name}"?`)) return;
    setLoading(true);
    try {
      await deleteYeshivaDB(id);
      setMsg(`הישיבה "${name}" נמחקה בהצלחה.`);
      await loadAdminData();
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEditingYeshiva = async (e) => {
    e.preventDefault();
    if (!editingYeshiva) return;
    setLoading(true);
    try {
      await saveYeshivaDB(editingYeshiva);
      setMsg(`הישיבה "${editingYeshiva.name}" עודכנה בהצלחה!`);
      setEditingYeshiva(null);
      await loadAdminData();
    } catch (err) {
      console.error("Save yeshiva error:", err);
    } finally {
      setLoading(false);
    }
  };

  const typeOptions = TYPES.filter(t => t.id !== 'all').map(t => ({ value: t.id, label: t.label }));
  const regionOptions = REGIONS.filter(r => r.id !== 'all').map(r => ({ value: r.id, label: r.label }));

  if (!isAuthenticated) {
    return (
      <div className="glass-card" style={{ maxWidth: 450, margin: '4rem auto', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', padding: '1rem', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.2)', color: '#6366f1', marginBottom: '1rem' }}>
          <Lock style={{ width: 40, height: 40 }} />
        </div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          כניסה לממשק הניהול של שבושון
        </h2>
        <p style={{ color: '#94a3b8', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
          ממשק זה מיועד לאדמין בלבד לצפייה בבקשות, דיווחי תלמידים וניהול המאגר.
        </p>

        <form onSubmit={handleLogin}>
          <input
            type="password"
            className="input-field"
            placeholder="הכנס סיסמת אדמין"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {authError && <div style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '1rem' }}>{authError}</div>}

          <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center' }}>
            <button type="button" onClick={onExitAdmin} className="btn-secondary">
              חזרה לאתר
            </button>
            <button type="submit" className="btn-primary">
              התחבר לאדמין
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-container">
      {/* Admin Header */}
      <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <ShieldCheck className="w-8 h-8 text-emerald-400" />
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>ממשק ניהול שבושון</h1>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>מחובר לניהול המאגר הראשי</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.8rem' }}>
          <button onClick={loadAdminData} disabled={loading} className="btn-secondary">
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
          בקשות להוספת ישיבה ({requests.length})
        </button>

        <button
          className={`btn-secondary ${activeTab === 'submissions' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('submissions')}
        >
          <Users style={{ width: 18, height: 18 }} />
          דיווחי תלמידים כיום ({submissions.length})
        </button>

        <button
          className={`btn-secondary ${activeTab === 'yeshivot' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('yeshivot')}
        >
          <Database style={{ width: 18, height: 18 }} />
          ניהול מאגר הישיבות ({yeshivot.length})
        </button>
      </div>

      {/* TAB 1: YESHIVA ADDITION REQUESTS */}
      {activeTab === 'requests' && (
        <div className="glass-card">
          <h2 className="section-title">
            <Inbox className="w-5 h-5 text-indigo-400" />
            בקשות שהוגשו ע"י משתמשים להוספת ישיבות חדשות
          </h2>

          {requests.length === 0 ? (
            <p style={{ color: '#94a3b8' }}>אין כרגע בקשות ממתינות במערכת.</p>
          ) : (
            requests.map(req => (
              <div key={req.id} className="yeshiva-result-card" style={{ opacity: req.status === 'approved' ? 0.6 : 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>{req.yeshiva_name}</h3>
                      {req.status === 'approved' && (
                        <span style={{ background: '#10b981', color: 'white', fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: 4, fontWeight: 700 }}>
                          ✓ אושר ונוסף
                        </span>
                      )}
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: 4 }}>
                      סוג: {TYPE_TRANSLATIONS[req.type] || req.type} | אזור: {REGION_TRANSLATIONS[req.region] || req.region}
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.82rem', marginTop: 2 }}>
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
                  <div style={{ marginTop: '0.8rem', background: 'rgba(15, 23, 42, 0.4)', padding: '0.8rem', borderRadius: 8 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#a5b4fc', marginBottom: 4 }}>
                      פרמטרים שהציע המשתמש עבור הישיבה:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.4rem', fontSize: '0.8rem' }}>
                      {PARAM_DEFINITIONS.map(p => (
                        <div key={p.id} style={{ color: '#cbd5e1' }}>
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
      {activeTab === 'submissions' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 className="section-title" style={{ margin: 0 }}>
                <Users className="w-5 h-5 text-emerald-400" />
                תשובות שנאספו מתלמידים כיום
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: 4 }}>
                רק תשובות של ביינישים ותלמידים נשמרות כאן במאגר
              </p>
            </div>

            <button
              onClick={handleRecalculateAverages}
              disabled={loading || submissions.length === 0}
              className="btn-gold"
            >
              <RefreshCw style={{ width: 18, height: 18 }} />
              עדכן ממוצעים במאגר לפי כל הדיווחים
            </button>
          </div>

          {submissions.length === 0 ? (
            <p style={{ color: '#94a3b8' }}>טרם התקבלו דיווחי תלמידים כיום במערכת.</p>
          ) : (
            submissions.map((sub, idx) => (
              <div key={sub.id || idx} className="yeshiva-result-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>{sub.yeshiva_name}</h3>
                    <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: 4 }}>
                      תאריך: {new Date(sub.created_at).toLocaleDateString('he-IL')}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '0.3rem 0.7rem', borderRadius: 999, fontSize: '0.8rem', fontWeight: 700 }}>
                      תלמיד מאומת ✓
                    </span>

                    <button
                      onClick={() => handleDeleteSubmission(sub)}
                      disabled={loading}
                      className="btn-secondary"
                      style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)', padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}
                    >
                      <Trash2 style={{ width: 14, height: 14 }} />
                      סרב ומחק דיווח
                    </button>
                  </div>
                </div>

                {sub.ratings && (
                  <div style={{ marginTop: '0.8rem', background: 'rgba(15, 23, 42, 0.4)', padding: '0.8rem', borderRadius: 8 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.4rem', fontSize: '0.8rem' }}>
                      {PARAM_DEFINITIONS.map(p => (
                        <div key={p.id} style={{ color: '#cbd5e1' }}>
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
      )}

      {/* TAB 3: MANAGE YESHIVOT */}
      {activeTab === 'yeshivot' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 className="section-title" style={{ margin: 0 }}>
              <Database className="w-5 h-5 text-purple-400" />
              ניהול מאגר הישיבות
            </h2>

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
              הוסף ישיבה ידנית
            </button>
          </div>

          {yeshivot.length === 0 ? (
            <p style={{ color: '#94a3b8' }}>אין ישיבות במאגר.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
              {yeshivot.map(y => (
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
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* EDIT / CREATE YESHIVA MODAL */}
      {editingYeshiva && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-card" style={{ maxWidth: 650, width: '100%', maxHeight: '90vh', overflowY: 'auto', background: '#0f172a', border: '1px solid rgba(99, 102, 241, 0.4)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.2rem' }}>
              {editingYeshiva.name ? `עריכת ישיבה: ${editingYeshiva.name}` : 'הוספת ישיבה חדשה למאגר'}
            </h2>

            <form onSubmit={handleSaveEditingYeshiva}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem' }}>שם הישיבה / המכינה</label>
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
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem' }}>סוג המוסד</label>
                  <CustomSelect
                    options={typeOptions}
                    value={editingYeshiva.type}
                    onChange={(val) => setEditingYeshiva({ ...editingYeshiva, type: val })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem' }}>אזור גאוגרפי</label>
                  <CustomSelect
                    options={regionOptions}
                    value={editingYeshiva.region}
                    onChange={(val) => setEditingYeshiva({ ...editingYeshiva, region: val })}
                  />
                </div>
              </div>

              {/* 11 Parameters Ratings Editors */}
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.8rem', color: '#a5b4fc' }}>
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
