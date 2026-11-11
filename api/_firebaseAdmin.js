// Shared Firebase Admin setup for the Vercel functions (files starting with "_" are not deployed as routes).
import { timingSafeEqual } from 'node:crypto';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const ADMIN_EMAIL = 'shvushon@gmail.com';

if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
}
export const db = getFirestore();

const safeEqual = (a, b) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

// The signed-in admin (Firebase ID token), or Vercel Cron (CRON_SECRET) when allowCron is set.
export const isAuthorized = async (req, { allowCron = false } = {}) => {
  const token = (req.headers.authorization || '').match(/^Bearer (.+)$/)?.[1];
  if (!token) return false;
  if (allowCron && process.env.CRON_SECRET && safeEqual(token, process.env.CRON_SECRET)) return true;
  try {
    const decoded = await getAuth().verifyIdToken(token);
    return decoded.email === ADMIN_EMAIL && decoded.firebase?.sign_in_provider === 'password';
  } catch {
    return false;
  }
};
