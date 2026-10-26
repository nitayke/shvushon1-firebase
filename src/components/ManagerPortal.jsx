import React, { useState, useEffect } from 'react';
import AdminDashboard from './AdminDashboard';
import { UserCog, LogOut, Phone, KeyRound, Eye, EyeOff } from 'lucide-react';
import {
  getInviteDB,
  registerManagerDB,
  loginManagerDB,
  logoutManagerDB,
  resetManagerPasswordDB,
  isAdminUser,
  watchManagerAuth,
  getManagerProfileDB,
  getYeshivaByIdDB,
  updateManagerPhoneDB,
  isValidPhone
} from '../manager';
import { PARAM_DEFINITIONS, REGION_TRANSLATIONS, TYPE_TRANSLATIONS } from '../knn';

function PasswordInput({ value, onChange, autoComplete, minLength }) {
  const [show, setShow] = useState(false);
  return (
    <div className="password-wrap">
      <input
        type={show ? 'text' : 'password'}
        className="input-field"
        value={value}
        onChange={onChange}
        required
        minLength={minLength}
        dir="ltr"
        autoComplete={autoComplete}
      />
      <button type="button" className="password-toggle" onClick={() => setShow(s => !s)} aria-label={show ? 'הסתר סיסמה' : 'הצג סיסמה'}>
        {show ? <EyeOff style={{ width: 20, height: 20 }} /> : <Eye style={{ width: 20, height: 20 }} />}
      </button>
    </div>
  );
}

const labelStyle = { display: 'block', fontWeight: 500, marginBottom: '0.35rem', color: 'var(--text-primary)', fontSize: '0.95rem' };
const fieldWrap = { marginBottom: '0.3rem' };
const errorBox = { background: 'rgba(239, 68, 68, 0.12)', border: '1px solid #ef4444', color: '#b91c1c', padding: '0.7rem 1rem', borderRadius: 10, marginBottom: '1rem' };
const okBox = { background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#047857', padding: '0.7rem 1rem', borderRadius: 10, marginBottom: '1rem' };

function RegisterForm({ token, goToLogin }) {
  const [invite, setInvite] = useState(undefined); // undefined = loading, null = invalid
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getInviteDB(token)
      .then(inv => setInvite(inv && !inv.used ? inv : null))
      .catch(() => setInvite(null));
  }, [token]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!isValidPhone(phone)) return setError('מספר טלפון לא תקין');
    if (password.length < 6) return setError('הסיסמה חייבת להכיל לפחות 6 תווים');
    setBusy(true);
    try {
      await registerManagerDB({ token, email: email.trim(), phone: phone.trim(), password });
      goToLogin();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (invite === undefined) return <p style={{ textAlign: 'center' }}>בודק את הקישור...</p>;
  if (invite === null) {
    return <div style={errorBox}>הקישור להרשמה אינו תקף או שכבר נעשה בו שימוש. פנה למנהל האתר לקבלת קישור חדש.</div>;
  }

  return (
    <form onSubmit={submit}>
      <p style={{ marginBottom: '1.2rem', color: '#374151' }}>
        הרשמה כאחראי שבושים של <strong>{invite.yeshivaName}</strong> (קוד ישיבה: <strong>{invite.code}</strong>)
      </p>
      {error && <div style={errorBox}>{error}</div>}
      <div style={fieldWrap}>
        <label style={labelStyle}>אימייל</label>
        <input type="email" className="input-field" value={email} onChange={e => setEmail(e.target.value)} required dir="ltr" autoComplete="email" />
      </div>
      <div style={fieldWrap}>
        <label style={labelStyle}>מספר טלפון נוכחי</label>
        <input type="tel" className="input-field" value={phone} onChange={e => setPhone(e.target.value)} required dir="ltr" placeholder="050-1234567" autoComplete="tel" />
      </div>
      <div style={fieldWrap}>
        <label style={labelStyle}>סיסמה</label>
        <PasswordInput value={password} onChange={e => setPassword(e.target.value)} minLength={6} autoComplete="new-password" />
      </div>
      <button type="submit" className="btn-primary" disabled={busy} style={{ width: '100%' }}>
        {busy ? 'נרשם...' : 'הרשמה'}
      </button>
    </form>
  );
}

function LoginForm({ notice }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState(notice || '');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setBusy(true);
    try {
      await loginManagerDB(email.trim(), password);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    setError('');
    setInfo('');
    if (!email.trim()) return setError('הכנס את כתובת המייל ואז לחץ על "שכחתי סיסמה"');
    try {
      await resetManagerPasswordDB(email.trim());
      setInfo('נשלח אליך מייל לאיפוס הסיסמה');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={submit}>
      {info && <div style={okBox}>{info}</div>}
      {error && <div style={errorBox}>{error}</div>}
      <div style={fieldWrap}>
        <label style={labelStyle}>אימייל</label>
        <input type="email" className="input-field" value={email} onChange={e => setEmail(e.target.value)} required dir="ltr" autoComplete="email" />
      </div>
      <div style={fieldWrap}>
        <label style={labelStyle}>סיסמה</label>
        <PasswordInput value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
      </div>
      <button type="submit" className="btn-primary" disabled={busy} style={{ width: '100%', marginBottom: '0.6rem' }}>
        {busy ? 'מתחבר...' : 'התחברות'}
      </button>
      <button type="button" className="btn-secondary" onClick={reset} style={{ width: '100%' }}>
        <KeyRound style={{ width: 14, height: 14 }} />
        שכחתי סיסמה
      </button>
    </form>
  );
}

function ManagerDashboard({ user }) {
  const [profile, setProfile] = useState(undefined);
  const [yeshiva, setYeshiva] = useState(null);
  const [phone, setPhone] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const p = await getManagerProfileDB(user.uid);
        setProfile(p);
        if (p) {
          setPhone(p.phone || '');
          setYeshiva(await getYeshivaByIdDB(p.yeshivaId));
        }
      } catch (err) {
        console.error('Manager profile load error:', err);
        setProfile(null);
      }
    })();
  }, [user.uid]);

  const savePhone = async (e) => {
    e.preventDefault();
    setMsg('');
    setError('');
    if (!isValidPhone(phone)) return setError('מספר טלפון לא תקין');
    try {
      await updateManagerPhoneDB(user.uid, phone.trim());
      setProfile({ ...profile, phone: phone.trim() });
      setMsg('מספר הטלפון עודכן');
    } catch (err) {
      console.error(err);
      setError('שגיאה בעדכון הטלפון');
    }
  };

  if (profile === undefined) return <p style={{ textAlign: 'center' }}>טוען...</p>;
  if (profile === null) {
    return (
      <div>
        <div style={errorBox}>המשתמש הזה אינו משויך לאף ישיבה. ההרשמה נעשית דרך קישור חד-פעמי מהמנהל.</div>
        <button className="btn-secondary" onClick={logoutManagerDB}><LogOut style={{ width: 14, height: 14 }} /> התנתקות</button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#111827' }}>{profile.yeshivaName}</h2>
          <div style={{ color: '#6b7280', fontSize: '0.9rem', marginTop: 2 }}>
            קוד ישיבה: <strong>{profile.code}</strong> • {profile.email}
          </div>
        </div>
        <button className="btn-secondary" onClick={logoutManagerDB}>
          <LogOut style={{ width: 14, height: 14 }} />
          התנתקות
        </button>
      </div>

      <form onSubmit={savePhone} style={{ marginBottom: '1.5rem' }}>
        {msg && <div style={okBox}>{msg}</div>}
        {error && <div style={errorBox}>{error}</div>}
        <label style={labelStyle}>מספר טלפון של האחראי</label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input type="tel" className="input-field" value={phone} onChange={e => setPhone(e.target.value)} required dir="ltr" style={{ flex: 1 }} />
          <button type="submit" className="btn-primary">
            <Phone style={{ width: 14, height: 14 }} />
            עדכון
          </button>
        </div>
      </form>

      {yeshiva && (
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: '#111827' }}>
            הנתונים של הישיבה במאגר
          </h3>
          <div style={{ color: '#6b7280', fontSize: '0.85rem', marginBottom: '0.7rem' }}>
            {TYPE_TRANSLATIONS[yeshiva.type] || yeshiva.type} • {REGION_TRANSLATIONS[yeshiva.region] || yeshiva.region} • מבוסס על {yeshiva.submissions_count || 1} דיווחים
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.4rem', fontSize: '0.88rem' }}>
            {PARAM_DEFINITIONS.map(p => (
              <div key={p.id}>{p.label || p.name || p.id}: <strong>{yeshiva.ratings?.[p.id] ?? '-'}</strong></div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ManagerPortal({ mode, inviteToken, onExit }) {
  const [user, setUser] = useState(undefined); // undefined = auth not resolved yet
  const [justRegistered, setJustRegistered] = useState(false);

  useEffect(() => {
    const unsub = watchManagerAuth(u => setUser(u && !u.isAnonymous ? u : null));
    return unsub;
  }, []);

  // After a successful registration the new user is already signed in, so show the dashboard.
  const showRegister = mode === 'register' && !user && !justRegistered;

  // The full admin console replaces the card layout for the site admin account.
  if (user && isAdminUser(user)) {
    return <AdminDashboard onExitAdmin={async () => { await logoutManagerDB(); onExit?.(); }} />;
  }

  return (
    <div className="glass-card" style={{ maxWidth: 560, margin: '0 auto' }}>
      <h2 className="section-title" style={{ marginBottom: '1.2rem' }}>
        <UserCog className="w-5 h-5" />
        {showRegister ? 'הרשמת אחראי שבושים' : 'כניסה לאחראים ולמנהל'}
      </h2>
      {user === undefined ? (
        <p style={{ textAlign: 'center' }}>טוען...</p>
      ) : user ? (
        <ManagerDashboard user={user} />
      ) : showRegister ? (
        <RegisterForm token={inviteToken} goToLogin={() => setJustRegistered(true)} />
      ) : (
        <>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '1.1rem' }}>
            אחראי ישיבה? היכנס עם המייל והסיסמה שבחרת בהרשמה. נרשמת דרך קישור חד־פעמי שקיבלת מהמנהל.
          </p>
          <LoginForm />
        </>
      )}
    </div>
  );
}
