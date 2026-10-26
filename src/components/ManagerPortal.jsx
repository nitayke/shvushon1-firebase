import React, { useState, useEffect, Suspense, lazy } from 'react';
const AdminDashboard = lazy(() => import('./AdminDashboard'));
import { UserCog, LogOut, Phone, KeyRound, Eye, EyeOff, CalendarPlus, Trash2 } from 'lucide-react';
import {
  getInviteDB,
  registerManagerDB,
  loginManagerDB,
  logoutManagerDB,
  resetManagerPasswordDB,
  isAdminUser,
  watchManagerAuth,
  getManagerProfileDB,
  updateManagerContactDB,
  acceptPrivacyDB,
  isValidPhone,
  EVENT_TYPES,
  getManagerEventsDB,
  addEventDB,
  deleteEventDB,
  toDateKey,
  parseDateKey
} from '../manager';

function PasswordInput({ value, onChange, autoComplete, minLength }) {
  const [show, setShow] = useState(false);
  return (
    <div className="password-wrap">
      <input
        type={show ? 'text' : 'password'}
        name="password"
        id="password"
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

// Asks the browser to offer saving the login (Credential Management API, Chromium); other browsers use the form heuristics.
const storeCredentials = (id, password) => {
  try {
    if (window.PasswordCredential && navigator.credentials?.store) {
      navigator.credentials.store(new window.PasswordCredential({ id, password })).catch(() => {});
    }
  } catch { /* optional */ }
};

const labelStyle = { display: 'block', fontWeight: 500, marginBottom: '0.35rem', color: 'var(--text-primary)', fontSize: '0.95rem' };
const fieldWrap = { marginBottom: '0.3rem' };
const checkRow = { display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.8rem', cursor: 'pointer', fontSize: '0.92rem' };
const errorBox = { background: 'rgba(239, 68, 68, 0.12)', border: '1px solid #ef4444', color: '#b91c1c', padding: '0.7rem 1rem', borderRadius: 10, marginBottom: '1rem' };
const okBox = { background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#047857', padding: '0.7rem 1rem', borderRadius: 10, marginBottom: '1rem' };

function PrivacyConsent({ agreed, setAgreed }) {
  return (
    <label style={checkRow}>
      <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ marginTop: 4 }} />
      <span>
        קראתי ואני מאשר את <a href="/privacy" target="_blank" rel="noopener noreferrer">מדיניות הפרטיות</a>:
        הטלפון שלי יוצג בלוח האירועים הציבורי, ושבושון רשאי ליצור איתי קשר בווצאפ, בטלפון ובאימייל.
      </span>
    </label>
  );
}

// Managers who registered before the policy existed must approve it before using the dashboard.
function PrivacyGate({ user, profile, onAccepted }) {
  const [agreed, setAgreed] = useState(false);
  const [hasWhatsapp, setHasWhatsapp] = useState(!!profile.hasWhatsapp);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!agreed) return setError('יש לאשר את מדיניות הפרטיות כדי להמשיך');
    setBusy(true);
    try {
      const at = await acceptPrivacyDB(user.uid, hasWhatsapp);
      onAccepted({ ...profile, hasWhatsapp, privacyAccepted: true, privacyAcceptedAt: at });
    } catch (err) {
      console.error(err);
      setError('שגיאה בשמירת האישור');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <p style={{ marginBottom: '1rem' }}>כדי להמשיך יש לאשר את מדיניות הפרטיות ולעדכן אם יש לך ווצאפ במספר <span dir="ltr">{profile.phone}</span>.</p>
      {error && <div style={errorBox}>{error}</div>}
      <label style={checkRow}>
        <input type="checkbox" checked={hasWhatsapp} onChange={e => setHasWhatsapp(e.target.checked)} style={{ marginTop: 4 }} />
        <span>יש לי ווצאפ במספר הזה</span>
      </label>
      <PrivacyConsent agreed={agreed} setAgreed={setAgreed} />
      <button type="submit" className="btn-primary" disabled={busy} style={{ width: '100%', marginBottom: '0.6rem' }}>
        {busy ? 'שומר...' : 'אישור והמשך'}
      </button>
      <button type="button" className="btn-secondary" onClick={logoutManagerDB} style={{ width: '100%' }}>
        <LogOut style={{ width: 14, height: 14 }} /> התנתקות
      </button>
    </form>
  );
}

function RegisterForm({ token, goToLogin }) {
  const [invite, setInvite] = useState(undefined); // undefined = loading, null = invalid
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [hasWhatsapp, setHasWhatsapp] = useState(true);
  const [agreed, setAgreed] = useState(false);
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
    if (!agreed) return setError('יש לאשר את מדיניות הפרטיות');
    setBusy(true);
    try {
      await registerManagerDB({ token, email: email.trim(), phone: phone.trim(), hasWhatsapp, password });
      storeCredentials(email.trim(), password);
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
    <form onSubmit={submit} method="post">
      <p style={{ marginBottom: '1.2rem', color: '#374151' }}>
        הרשמה כאחראי שבושים של <strong>{invite.yeshivaName}</strong>
      </p>
      {error && <div style={errorBox}>{error}</div>}
      <div style={fieldWrap}>
        <label style={labelStyle}>אימייל</label>
        <input type="email" name="email" id="email" className="input-field" value={email} onChange={e => setEmail(e.target.value)} required dir="ltr" autoComplete="username" />
      </div>
      <div style={fieldWrap}>
        <label style={labelStyle}>מספר טלפון נוכחי</label>
        <input type="tel" className="input-field" value={phone} onChange={e => setPhone(e.target.value)} required dir="ltr" placeholder="050-1234567" autoComplete="tel" />
      </div>
      <label style={{ ...checkRow, marginTop: '0.4rem' }}>
        <input type="checkbox" checked={hasWhatsapp} onChange={e => setHasWhatsapp(e.target.checked)} style={{ marginTop: 4 }} />
        <span>יש לי ווצאפ במספר הזה</span>
      </label>
      <div style={fieldWrap}>
        <label style={labelStyle}>סיסמה</label>
        <PasswordInput value={password} onChange={e => setPassword(e.target.value)} minLength={6} autoComplete="new-password" />
      </div>
      <PrivacyConsent agreed={agreed} setAgreed={setAgreed} />
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
      storeCredentials(email.trim(), password);
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
    <form onSubmit={submit} method="post">
      {info && <div style={okBox}>{info}</div>}
      {error && <div style={errorBox}>{error}</div>}
      <div style={fieldWrap}>
        <label style={labelStyle}>אימייל</label>
        <input type="email" name="email" id="email" className="input-field" value={email} onChange={e => setEmail(e.target.value)} required dir="ltr" autoComplete="username" />
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

const WEEKDAY_LETTERS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

// Month grid for picking an event date. With onlySaturday, every other day is disabled; past days always are.
function DatePicker({ value, onChange, min, onlySaturday }) {
  const start = value ? parseDateKey(value) : new Date();
  const [month, setMonth] = useState(new Date(start.getFullYear(), start.getMonth(), 1));
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const minMonth = parseDateKey(min);
  const atMin = month.getFullYear() === minMonth.getFullYear() && month.getMonth() === minMonth.getMonth();
  const title = new Intl.DateTimeFormat('he-IL', { month: 'long', year: 'numeric' }).format(month);
  const cells = [...Array(first.getDay()).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const navBtn = { background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem', padding: '0 0.6rem', color: 'var(--primary-accent)' };

  return (
    <div style={{ border: '1px solid var(--border-strong)', borderRadius: 10, padding: '0.6rem', background: 'var(--bg-sand)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
        <button type="button" style={{ ...navBtn, opacity: 1 }} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="החודש הבא">›</button>
        <strong>{title}</strong>
        <button type="button" disabled={atMin} style={{ ...navBtn, opacity: atMin ? 0.3 : 1, cursor: atMin ? 'default' : 'pointer' }} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="החודש הקודם">‹</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, textAlign: 'center' }}>
        {WEEKDAY_LETTERS.map(l => <div key={l} style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{l}</div>)}
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} />;
          const d = new Date(month.getFullYear(), month.getMonth(), day);
          const key = toDateKey(d);
          const enabled = (!onlySaturday || d.getDay() === 6) && key >= min;
          const selected = key === value;
          return (
            <button
              key={key}
              type="button"
              disabled={!enabled}
              onClick={() => onChange(key)}
              style={{
                minHeight: 38,
                borderRadius: 8,
                border: selected ? '2px solid var(--primary-accent)' : '1px solid transparent',
                background: selected ? 'var(--primary-accent)' : enabled ? 'rgba(180, 120, 40, 0.16)' : 'transparent',
                color: selected ? '#fff' : enabled ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: enabled ? 700 : 400,
                opacity: enabled ? 1 : 0.35,
                cursor: enabled ? 'pointer' : 'not-allowed'
              }}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ManagerDashboard({ user }) {
  const [profile, setProfile] = useState(undefined);
  const [events, setEvents] = useState([]);
  const [evType, setEvType] = useState('open_day');
  const [evDate, setEvDate] = useState('');
  const [evTime, setEvTime] = useState('');
  const [evMsg, setEvMsg] = useState('');
  const [evError, setEvError] = useState('');
  const [evBusy, setEvBusy] = useState(false);
  const [phone, setPhone] = useState('');
  const [hasWhatsapp, setHasWhatsapp] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const p = await getManagerProfileDB(user.uid);
        setProfile(p);
        if (p) {
          setPhone(p.phone || '');
          setHasWhatsapp(!!p.hasWhatsapp);
          setEvents(await getManagerEventsDB(user.uid));
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
      await updateManagerContactDB(user.uid, phone.trim(), hasWhatsapp);
      setProfile({ ...profile, phone: phone.trim(), hasWhatsapp });
      setMsg('פרטי הקשר עודכנו');
    } catch (err) {
      console.error(err);
      setError('שגיאה בעדכון הטלפון');
    }
  };

  const addEvent = async (e) => {
    e.preventDefault();
    setEvMsg('');
    setEvError('');
    if (!evDate) return setEvError('בחר תאריך');
    if (evDate < toDateKey(new Date())) return setEvError('לא ניתן להוסיף אירוע בתאריך שעבר');
    setEvBusy(true);
    try {
      const created = await addEventDB(profile, { type: evType, date: evDate, time: evTime });
      setEvents(list => [...list, created].sort((a, b) => a.date.localeCompare(b.date)));
      setEvDate(''); setEvTime('');
      setEvMsg('האירוע נוסף ללוח של שבושון');
    } catch (err) {
      console.error(err);
      setEvError(err.message || 'שגיאה בהוספת האירוע');
    } finally {
      setEvBusy(false);
    }
  };

  const removeEvent = async (ev) => {
    if (!window.confirm('למחוק את האירוע מהלוח?')) return;
    setEvMsg('');
    setEvError('');
    try {
      await deleteEventDB(ev.id);
      setEvents(list => list.filter(x => x.id !== ev.id));
    } catch (err) {
      console.error(err);
      setEvError('שגיאה במחיקת האירוע');
    }
  };

  const formatDate = (key) => new Intl.DateTimeFormat('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(parseDateKey(key));
  const today = toDateKey(new Date());

  if (profile === undefined) return <p style={{ textAlign: 'center' }}>טוען...</p>;
  if (profile === null) {
    return (
      <div>
        <div style={errorBox}>המשתמש הזה אינו משויך לאף ישיבה. ההרשמה נעשית דרך קישור חד-פעמי מהמנהל.</div>
        <button className="btn-secondary" onClick={logoutManagerDB}><LogOut style={{ width: 14, height: 14 }} /> התנתקות</button>
      </div>
    );
  }

  if (!profile.privacyAccepted) {
    return <PrivacyGate user={user} profile={profile} onAccepted={(p) => { setProfile(p); setHasWhatsapp(!!p.hasWhatsapp); }} />;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#111827' }}>{profile.yeshivaName}</h2>
          <div style={{ color: '#6b7280', fontSize: '0.9rem', marginTop: 2 }}>
            {profile.email}
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
        <label style={{ ...checkRow, marginTop: '0.6rem', marginBottom: 0 }}>
          <input type="checkbox" checked={hasWhatsapp} onChange={e => setHasWhatsapp(e.target.checked)} style={{ marginTop: 4 }} />
          <span>יש לי ווצאפ במספר הזה</span>
        </label>
      </form>

      <form onSubmit={addEvent} style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.7rem', color: '#111827' }}>
          הוספת יום פתוח / שבת שבושים
        </h3>
        {evMsg && <div style={okBox}>{evMsg}</div>}
        {evError && <div style={errorBox}>{evError}</div>}
        <div style={fieldWrap}>
          <label style={labelStyle}>סוג האירוע</label>
          <select className="input-field" value={evType} onChange={e => { setEvType(e.target.value); setEvDate(''); }}>
            {Object.entries(EVENT_TYPES).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
          </select>
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>{evType === 'shabbat' ? 'תאריך (יום שבת)' : 'תאריך'}</label>
          <DatePicker value={evDate} onChange={setEvDate} min={today} onlySaturday={evType === 'shabbat'} />
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
            {evDate ? formatDate(evDate) : evType === 'shabbat' ? 'ניתן לבחור רק ימי שבת' : 'בחר תאריך'}
          </div>
        </div>
        {evType === 'open_day' && (
          <div style={fieldWrap}>
            <label style={labelStyle}>שעת התחלה (לא חובה)</label>
            <input type="time" className="input-field" value={evTime} onChange={e => setEvTime(e.target.value)} dir="ltr" />
          </div>
        )}
        <button type="submit" className="btn-primary" disabled={evBusy} style={{ width: '100%', marginTop: '0.5rem' }}>
          <CalendarPlus style={{ width: 16, height: 16 }} />
          {evBusy ? 'מוסיף...' : 'הוספה ללוח'}
        </button>
      </form>

      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.6rem', color: '#111827' }}>
          האירועים שהוספתם
        </h3>
        {events.length === 0 ? (
          <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>עוד לא הוספתם אירועים.</div>
        ) : events.map(ev => (
          <div key={ev.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0', borderTop: '1px solid var(--border-color)', opacity: ev.date < today ? 0.6 : 1 }}>
            <div>
              <div style={{ fontWeight: 700 }}>{EVENT_TYPES[ev.type] || ev.type}</div>
              <div style={{ fontSize: '0.88rem', color: '#4b5563' }}>
                {formatDate(ev.date)}{ev.time ? ` · ${ev.time}` : ''}
              </div>
            </div>
            <button className="btn-secondary" onClick={() => removeEvent(ev)} aria-label="מחיקת אירוע" title="מחיקה">
              <Trash2 style={{ width: 14, height: 14 }} />
            </button>
          </div>
        ))}
      </div>
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
    return (
      <Suspense fallback={<p style={{ textAlign: 'center', padding: '2rem' }}>טוען...</p>}>
        <AdminDashboard onExitAdmin={async () => { await logoutManagerDB(); onExit?.(); }} />
      </Suspense>
    );
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
