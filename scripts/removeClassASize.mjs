import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  updateDoc, 
  doc, 
  deleteField 
} from "firebase/firestore";

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

async function removeClassASize() {
  console.log("🧹 Removing 'class_a_size' field from all Firestore documents in 'yeshivot'...");

  try {
    const querySnapshot = await getDocs(collection(db, "yeshivot"));
    let count = 0;

    for (const docSnap of querySnapshot.docs) {
      const data = docSnap.data();

      const updates = {};
      if (data.class_a_size !== undefined) {
        updates.class_a_size = deleteField();
      }
      if (data.ratings && data.ratings.class_a_size !== undefined) {
        updates['ratings.class_a_size'] = deleteField();
      }

      if (Object.keys(updates).length > 0) {
        await updateDoc(doc(db, "yeshivot", docSnap.id), updates);
        count++;
        console.log(`✓ Cleaned class_a_size from ${data.name || docSnap.id}`);
      }
    }

    console.log(`\n🎉 Success! Cleaned 'class_a_size' field from ${count} yeshivot in Firebase Firestore!`);
  } catch (err) {
    console.error("❌ Error cleaning class_a_size:", err);
  }
}

removeClassASize();
