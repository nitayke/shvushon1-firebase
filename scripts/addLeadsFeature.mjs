import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAA9tFri7uyF3pluml1Q0fpQqsXOfgrEBQ",
  authDomain: "shvushon1.firebaseapp.com",
  projectId: "shvushon1",
  storageBucket: "shvushon1.firebasestorage.app",
  messagingSenderId: "820289694427",
  appId: "1:820289694427:web:1f8ac1855dc4a3e9187afe"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

import { getAuth, signInAnonymously } from "firebase/auth";
const auth = getAuth(app);

async function run() {
  await signInAnonymously(auth);
  console.log("Fetching yeshivot...");
  const snapshot = await getDocs(collection(db, "yeshivot"));
  const yeshivot = [];
  snapshot.forEach(docSnap => yeshivot.push({ id: docSnap.id, ...docSnap.data() }));
  
const targetYeshivot = [
    // הרשימה המפורשת שביקשת
    "גבעת זאב (שלוחת כרם ביבנה)",
    "אבנר עכו",
    "מכינת צור משה פסגת זאב",
    "נצרת עילית",
    "עטרת מרדכי – צפת",
    "עטרת נחמיה",
    "קשת יהודה",
    "מכינת רוח השדה",
    
    // 10 האקראיות מהפעם הקודמת (אלו שלא חופפות עם הרשימה למעלה)
    "עצמונה",
    "תפוח – אבינעם",
    "יפו – שירת משה",
    "עתניאל",
    "שדרות",
    "ברכת יוסף – אלון מורה",
    "מצפה רמון – מדברה כעדן"
  ];

  console.log("Setting has_leads for target yeshivot...");
  let count = 0;
  for (const y of yeshivot) {
    if (targetYeshivot.includes(y.name.trim())) {
      console.log("- Enabled for: " + y.name);
      await setDoc(doc(db, "yeshivot", y.id), { has_leads: true }, { merge: true });
      count++;
    } else if (y.has_leads) {
      // Clean up others that might have been set randomly before
      await setDoc(doc(db, "yeshivot", y.id), { has_leads: false }, { merge: true });
    }
  }
  
  console.log(`Done! Enabled leads for ${count} yeshivot.`);
  process.exit(0);
}

run().catch(console.error);
