import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  doc, 
  setDoc, 
  deleteDoc 
} from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

// Read Firebase keys from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.projectId && 
  firebaseConfig.projectId !== "YOUR_PROJECT_ID"
);

let app = null;
let db = null;
let auth = null;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    console.log("🔥 Live Firebase Firestore connected successfully!");
  } catch (err) {
    console.error("Firebase Initialization Error:", err);
  }
}

// Admin Authentication function to get valid Firebase token for security rules
export const authenticateAdminDB = async () => {
  if (isFirebaseConfigured && auth) {
    try {
      if (!auth.currentUser) {
        await signInAnonymously(auth);
        console.log("🔒 Firebase Admin session authenticated successfully!");
      }
    } catch (err) {
      console.warn("Notice: Firebase Anonymous Auth is not enabled in Firebase Console. Proceeding directly with Firestore queries:", err?.message || err);
    }
  }
};

// Local Storage Fallback keys
const LOCAL_YESHIVOT_KEY = 'shvushon_yeshivot_v2';
const LOCAL_SUBMISSIONS_KEY = 'shvushon_submissions_v2';
const LOCAL_REQUESTS_KEY = 'shvushon_requests_v2';

const getLocalYeshivot = () => {
  const saved = localStorage.getItem(LOCAL_YESHIVOT_KEY);
  return saved ? JSON.parse(saved) : [];
};

// 1. Get all Yeshivot directly from Firebase Firestore
export const getYeshivotDB = async () => {
  if (isFirebaseConfigured && db) {
    try {
      const querySnapshot = await getDocs(collection(db, "yeshivot"));
      const list = [];
      querySnapshot.forEach(docSnap => list.push({ id: docSnap.id, ...docSnap.data() }));
      
      if (list.length > 0) {
        localStorage.setItem(LOCAL_YESHIVOT_KEY, JSON.stringify(list));
      }
      return list;
    } catch (err) {
      console.error("Firestore getYeshivot error, using cached local data:", err);
      return getLocalYeshivot();
    }
  }
  return getLocalYeshivot();
};

// 2. Save Student Submission
export const saveStudentSubmissionDB = async (submission) => {
  const dataToSave = {
    ...submission,
    processed: false,
    created_at: new Date().toISOString()
  };

  if (isFirebaseConfigured && db) {
    try {
      await addDoc(collection(db, "student_submissions"), dataToSave);
      console.log("Saved student submission to Firestore!");
    } catch (err) {
      console.error("Firestore save submission error:", err);
    }
  }

  const existing = JSON.parse(localStorage.getItem(LOCAL_SUBMISSIONS_KEY) || '[]');
  existing.push({ id: 'sub_' + Date.now(), ...dataToSave });
  localStorage.setItem(LOCAL_SUBMISSIONS_KEY, JSON.stringify(existing));
  return true;
};

// 3. Save Yeshiva Addition Request
export const saveYeshivaRequestDB = async (request) => {
  const dataToSave = {
    ...request,
    status: 'pending',
    created_at: new Date().toISOString()
  };

  if (isFirebaseConfigured && db) {
    try {
      const docRef = await addDoc(collection(db, "yeshiva_requests"), dataToSave);
      console.log("Saved yeshiva request to Firestore!");
      return { id: docRef.id, ...dataToSave };
    } catch (err) {
      console.error("Firestore save request error:", err);
    }
  }

  const existing = JSON.parse(localStorage.getItem(LOCAL_REQUESTS_KEY) || '[]');
  const newReq = { id: 'req_' + Date.now(), ...dataToSave };
  existing.push(newReq);
  localStorage.setItem(LOCAL_REQUESTS_KEY, JSON.stringify(existing));
  return newReq;
};

// 4. Get Student Submissions (For Admin)
export const getStudentSubmissionsDB = async () => {
  await authenticateAdminDB();
  if (isFirebaseConfigured && db) {
    try {
      const querySnapshot = await getDocs(collection(db, "student_submissions"));
      const list = [];
      querySnapshot.forEach(docSnap => list.push({ id: docSnap.id, ...docSnap.data() }));
      return list;
    } catch (err) {
      console.error("Firestore getSubmissions error:", err);
    }
  }
  return JSON.parse(localStorage.getItem(LOCAL_SUBMISSIONS_KEY) || '[]');
};

// 5. Get Yeshiva Addition Requests (For Admin)
export const getYeshivaRequestsDB = async () => {
  await authenticateAdminDB();
  if (isFirebaseConfigured && db) {
    try {
      const querySnapshot = await getDocs(collection(db, "yeshiva_requests"));
      const list = [];
      querySnapshot.forEach(docSnap => list.push({ id: docSnap.id, ...docSnap.data() }));
      return list;
    } catch (err) {
      console.error("Firestore getRequests error:", err);
    }
  }
  return JSON.parse(localStorage.getItem(LOCAL_REQUESTS_KEY) || '[]');
};

// 6. Approve Yeshiva Request (For Admin)
export const approveYeshivaRequestDB = async (request) => {
  await authenticateAdminDB();
  const newYeshiva = {
    id: 'y_' + Date.now(),
    name: request.yeshiva_name,
    type: request.type,
    region: request.region,
    ratings: request.ratings,
    submissions_count: 1
  };

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, "yeshivot", newYeshiva.id), newYeshiva);
      if (request.id) {
        await setDoc(doc(doc(db, "yeshiva_requests", request.id)), { status: 'approved' }, { merge: true });
      }
    } catch (err) {
      console.error("Firestore approve request error:", err);
    }
  }

  const yeshivot = await getYeshivotDB();
  yeshivot.push(newYeshiva);
  localStorage.setItem(LOCAL_YESHIVOT_KEY, JSON.stringify(yeshivot));
  return newYeshiva;
};

// 7. Save / Edit Yeshiva (For Admin)
export const saveYeshivaDB = async (yeshivaData) => {
  await authenticateAdminDB();
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, "yeshivot", yeshivaData.id), yeshivaData, { merge: true });
    } catch (err) {
      console.error("Firestore save yeshiva error:", err);
    }
  }

  const yeshivot = await getYeshivotDB();
  const idx = yeshivot.findIndex(y => y.id === yeshivaData.id);
  if (idx >= 0) {
    yeshivot[idx] = yeshivaData;
  } else {
    yeshivot.push(yeshivaData);
  }
  localStorage.setItem(LOCAL_YESHIVOT_KEY, JSON.stringify(yeshivot));
  return yeshivaData;
};

// 8. Delete Yeshiva (For Admin)
export const deleteYeshivaDB = async (yeshivaId) => {
  await authenticateAdminDB();
  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, "yeshivot", yeshivaId));
    } catch (err) {
      console.error("Firestore delete yeshiva error:", err);
    }
  }

  let yeshivot = await getYeshivotDB();
  yeshivot = yeshivot.filter(y => y.id !== yeshivaId);
  localStorage.setItem(LOCAL_YESHIVOT_KEY, JSON.stringify(yeshivot));
  return true;
};

// 9. Recalculate Yeshiva Averages based on all Student Submissions (For Admin)
export const recalculateYeshivaAveragesDB = async () => {
  await authenticateAdminDB();
  const [yeshivotList, submissionsList] = await Promise.all([
    getYeshivotDB(),
    getStudentSubmissionsDB()
  ]);

  // Filter only UNPROCESSED submissions (whose averages have not yet been incorporated)
  const pendingSubs = submissionsList.filter(s => s.processed !== true);

  if (pendingSubs.length === 0) return yeshivotList;

  const grouped = {};
  pendingSubs.forEach(sub => {
    const name = sub.yeshiva_name;
    if (!grouped[name]) grouped[name] = [];
    grouped[name].push(sub);
  });

  const updatedYeshivot = [...yeshivotList];

  for (const [yeshivaName, subs] of Object.entries(grouped)) {
    const targetYeshiva = updatedYeshivot.find(y => y.name === yeshivaName);
    if (targetYeshiva) {
      const paramSums = {};
      const count = subs.length;

      subs.forEach(s => {
        if (s.ratings) {
          Object.entries(s.ratings).forEach(([paramKey, score]) => {
            paramSums[paramKey] = (paramSums[paramKey] || 0) + Number(score);
          });
        }
      });

      const newRatings = { ...targetYeshiva.ratings };
      const currentCount = targetYeshiva.submissions_count || 1;
      const totalCount = currentCount + count;

      Object.keys(paramSums).forEach(paramKey => {
        const oldSum = (targetYeshiva.ratings[paramKey] || 3) * currentCount;
        const newSum = oldSum + paramSums[paramKey];
        newRatings[paramKey] = Number((newSum / totalCount).toFixed(1));
      });

      targetYeshiva.ratings = newRatings;
      targetYeshiva.submissions_count = totalCount;

      await saveYeshivaDB(targetYeshiva);
    }
  }

  // Mark all processed submissions as processed: true in Firestore & LocalStorage
  if (isFirebaseConfigured && db) {
    try {
      for (const sub of pendingSubs) {
        if (sub.id && !sub.id.startsWith('sub_')) {
          await setDoc(doc(db, "student_submissions", sub.id), { processed: true }, { merge: true });
        }
      }
    } catch (err) {
      console.error("Firestore mark processed submissions error:", err);
    }
  }

  // Update LocalStorage cache as well
  const allSubmissions = JSON.parse(localStorage.getItem(LOCAL_SUBMISSIONS_KEY) || '[]');
  const updatedLocal = allSubmissions.map(s => {
    if (pendingSubs.some(p => p.id === s.id || (p.yeshiva_name === s.yeshiva_name && p.created_at === s.created_at))) {
      return { ...s, processed: true };
    }
    return s;
  });
  localStorage.setItem(LOCAL_SUBMISSIONS_KEY, JSON.stringify(updatedLocal));

  return updatedYeshivot;
};

// 10. Delete Yeshiva Request (Reject request)
export const deleteYeshivaRequestDB = async (requestId) => {
  await authenticateAdminDB();
  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, "yeshiva_requests", requestId));
    } catch (err) {
      console.error("Firestore delete request error:", err);
    }
  }

  let reqs = JSON.parse(localStorage.getItem(LOCAL_REQUESTS_KEY) || '[]');
  reqs = reqs.filter(r => r.id !== requestId);
  localStorage.setItem(LOCAL_REQUESTS_KEY, JSON.stringify(reqs));
  return true;
};

// 11. Delete Student Submission (Reject/Remove submission)
export const deleteStudentSubmissionDB = async (submissionId) => {
  await authenticateAdminDB();
  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, "student_submissions", submissionId));
    } catch (err) {
      console.error("Firestore delete submission error:", err);
    }
  }

  let subs = JSON.parse(localStorage.getItem(LOCAL_SUBMISSIONS_KEY) || '[]');
  subs = subs.filter(s => s.id !== submissionId);
  localStorage.setItem(LOCAL_SUBMISSIONS_KEY, JSON.stringify(subs));
  return true;
};
