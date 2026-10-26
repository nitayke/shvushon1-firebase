import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  collection,
  writeBatch
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged
} from "firebase/auth";
import { getDb, getAuthInstance, authenticateAdminDB, saveYeshivaDB } from "./firebase";

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

// Creates a one-time registration invite for a yeshiva; assigns the yeshiva a numeric code if missing.
export const createManagerInviteDB = async (yeshiva, allYeshivot) => {
  await authenticateAdminDB();
  let code = yeshiva.code;
  if (!code) {
    code = Math.max(0, ...allYeshivot.map(y => Number(y.code) || 0)) + 1;
    await saveYeshivaDB({ ...yeshiva, code });
  }
  const token = randomToken();
  await setDoc(doc(getDb(), "invites", token), {
    yeshivaId: yeshiva.id,
    yeshivaName: yeshiva.name,
    code,
    used: false,
    created_at: new Date().toISOString()
  });
  return { token, code, url: `${window.location.origin}/manager/register?invite=${token}` };
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
      code: invite.code,
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

export const getYeshivaByIdDB = async (id) => {
  const snap = await getDoc(doc(getDb(), "yeshivot", id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const updateManagerPhoneDB = async (uid, phone) => {
  await updateDoc(doc(getDb(), "managers", uid), { phone, updated_at: new Date().toISOString() });
};
