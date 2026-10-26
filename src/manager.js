import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  collection,
  writeBatch,
  addDoc,
  deleteDoc,
  query,
  where
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged
} from "firebase/auth";
import { getDb, getAuthInstance, authenticateAdminDB } from "./firebase";

export const ADMIN_EMAIL = 'shvushon@gmail.com';

const randomToken = () => {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
};

export const isValidPhone = (phone) => /^0\d{1,2}-?\d{7}$/.test(String(phone || '').replace(/[\s()]/g, ''));

const authErrorMessage = (err) => {
  switch (err?.code) {
    case 'auth/email-already-in-use': return 'כתובת המייל כבר רשומה במערכת';
    case 'auth/invalid-email': return 'כתובת מייל לא תקינה';
    case 'auth/weak-password': return 'הסיסמה חלשה מדי (לפחות 6 תווים)';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found': return 'מייל או סיסמה שגויים';
    case 'auth/too-many-requests': return 'יותר מדי ניסיונות, נסה שוב בעוד כמה דקות';
    case 'auth/operation-not-allowed': return 'הרשמה באימייל וסיסמה לא מופעלת בפיירבייס';
    default: return err?.message || 'שגיאה לא ידועה';
  }
};

// ---------- Admin side ----------

// Creates a one-time registration invite for a yeshiva.
export const createManagerInviteDB = async (yeshiva) => {
  await authenticateAdminDB();
  const token = randomToken();
  await setDoc(doc(getDb(), "invites", token), {
    yeshivaId: yeshiva.id,
    yeshivaName: yeshiva.name,
    used: false,
    created_at: new Date().toISOString()
  });
  return { token, url: `${window.location.origin}/manager/register?invite=${token}` };
};

export const getManagersDB = async () => {
  await authenticateAdminDB();
  const snap = await getDocs(collection(getDb(), "managers"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// ---------- Manager side ----------

export const getInviteDB = async (token) => {
  if (!token) return null;
  const snap = await getDoc(doc(getDb(), "invites", token));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

// Registers via Firebase Auth, then atomically consumes the invite and creates the manager profile.
export const registerManagerDB = async ({ token, email, phone, password }) => {
  const db = getDb();
  const auth = getAuthInstance();
  const invite = await getInviteDB(token);
  if (!invite || invite.used) throw new Error('הקישור אינו תקף או שכבר נעשה בו שימוש');

  let cred;
  try {
    cred = await createUserWithEmailAndPassword(auth, email, password);
  } catch (err) {
    throw new Error(authErrorMessage(err));
  }
  const uid = cred.user.uid;
  try {
    const batch = writeBatch(db);
    batch.update(doc(db, "invites", token), { used: true, used_by: uid, used_at: new Date().toISOString() });
    batch.set(doc(db, "managers", uid), {
      uid,
      email,
      phone,
      yeshivaId: invite.yeshivaId,
      yeshivaName: invite.yeshivaName,
      inviteToken: token,
      created_at: new Date().toISOString()
    });
    await batch.commit();
  } catch (err) {
    // Invite was consumed in the meantime or rules rejected it: don't leave an orphan account
    try { await cred.user.delete(); } catch { await signOut(auth); }
    throw new Error('הקישור אינו תקף או שכבר נעשה בו שימוש');
  }
  return uid;
};

export const loginManagerDB = async (email, password) => {
  try {
    await signInWithEmailAndPassword(getAuthInstance(), email, password);
  } catch (err) {
    throw new Error(authErrorMessage(err));
  }
};

export const isAdminUser = (user) => user?.email?.toLowerCase() === ADMIN_EMAIL;

export const logoutManagerDB = () => signOut(getAuthInstance());

export const resetManagerPasswordDB = async (email) => {
  try {
    await sendPasswordResetEmail(getAuthInstance(), email);
  } catch (err) {
    throw new Error(authErrorMessage(err));
  }
};

export const watchManagerAuth = (cb) => onAuthStateChanged(getAuthInstance(), cb);

export const getManagerProfileDB = async (uid) => {
  const snap = await getDoc(doc(getDb(), "managers", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

// ---------- Events (open days / Shabbatot) ----------

export const EVENT_TYPES = {
  open_day: 'יום פתוח',
  shabbat: 'שבת שבושים'
};

const pad = (n) => String(n).padStart(2, '0');
export const toDateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseDateKey = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

// Events from today onward, soonest first. Public.
export const getUpcomingEventsDB = async () => {
  const q = query(collection(getDb(), "events"), where("date", ">=", toDateKey(new Date())));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''));
};

export const getManagerEventsDB = async (uid) => {
  const snap = await getDocs(query(collection(getDb(), "events"), where("created_by", "==", uid)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.date.localeCompare(b.date));
};

export const addEventDB = async (profile, { type, date, time, notes }) => {
  if (!EVENT_TYPES[type]) throw new Error('סוג אירוע לא תקין');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('תאריך לא תקין');
  if (type === 'shabbat' && parseDateKey(date).getDay() !== 6) throw new Error('שבת שבושים חייבת להיות ביום שבת');
  const data = {
    yeshivaId: profile.yeshivaId,
    yeshivaName: profile.yeshivaName,
    type,
    date,
    time: type === 'open_day' ? (time || '') : '',
    notes: (notes || '').trim().slice(0, 300),
    created_by: profile.uid,
    created_at: new Date().toISOString()
  };
  const ref = await addDoc(collection(getDb(), "events"), data);
  return { id: ref.id, ...data };
};

export const deleteEventDB = async (id) => {
  await deleteDoc(doc(getDb(), "events", id));
};

export const updateManagerPhoneDB = async (uid, phone) => {
  await updateDoc(doc(getDb(), "managers", uid), { phone, updated_at: new Date().toISOString() });
};
