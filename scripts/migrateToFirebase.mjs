import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
import fs from 'fs';

const firebaseConfig = {
  apiKey: "AIzaSyAA9tFri7uyF3pluml1Q0fpQqsXOfgrEBQ",
  authDomain: "shvushon1.firebaseapp.com",
  projectId: "shvushon1",
  storageBucket: "shvushon1.firebasestorage.app",
  messagingSenderId: "820289694427",
  appId: "1:820289694427:web:1f8ac1855dc4a3e9187afe",
  measurementId: "G-TK3VVNVLRG"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const yeshivotData = JSON.parse(fs.readFileSync('./src/data/initialYeshivot.json', 'utf-8'));

async function seedYeshivot() {
  console.log(`Starting migration of ${yeshivotData.length} yeshivot to Live Firebase Firestore (shvushon1)...`);
  
  try {
    await signInAnonymously(auth);
    console.log("🔒 Authenticated anonymously for migration...");
  } catch (authErr) {
    console.warn("Auth warning:", authErr.message);
  }

  let count = 0;
  for (const yeshiva of yeshivotData) {
    try {
      await setDoc(doc(db, "yeshivot", yeshiva.id), yeshiva, { merge: true });
      count++;
      console.log(`✓ Seeded [${count}/${yeshivotData.length}]: ${yeshiva.name}`);
    } catch (err) {
      console.error(`X Failed to seed ${yeshiva.name}:`, err);
    }
  }
  
  console.log(`🎉 Firestore migration complete! Uploaded ${count} yeshivot.`);
  process.exit(0);
}

seedYeshivot();
