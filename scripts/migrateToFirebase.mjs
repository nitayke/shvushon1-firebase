import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const initialYeshivotPath = path.join(__dirname, '../src/data/initialYeshivot.json');
const yeshivot = JSON.parse(fs.readFileSync(initialYeshivotPath, 'utf8'));

const PROJECT_ID = "shvushon1";
const API_KEY = "AIzaSyAA9tFri7uyF3pluml1Q0fpQqsXOfgrEBQ";

// Helper to convert JS value to Firestore REST Value format
function toFirestoreValue(val) {
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return { integerValue: val.toString() };
    return { doubleValue: val };
  }
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'object' && val !== null) {
    const fields = {};
    for (const [k, v] of Object.entries(val)) {
      fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { nullValue: null };
}

async function runMigration() {
  console.log(`🚀 Starting Migration of ${yeshivot.length} yeshivot to Firebase Firestore (${PROJECT_ID})...`);

  let count = 0;
  for (const yeshiva of yeshivot) {
    const docId = yeshiva.id;
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/yeshivot/${docId}?key=${API_KEY}`;

    const fields = {};
    for (const [key, value] of Object.entries(yeshiva)) {
      fields[key] = toFirestoreValue(value);
    }

    try {
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields })
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`❌ Failed to upload ${yeshiva.name} (${docId}):`, errText);
      } else {
        count++;
        console.log(`✓ Uploaded [${count}/${yeshivot.length}]: ${yeshiva.name}`);
      }
    } catch (err) {
      console.error(`❌ Error uploading ${yeshiva.name}:`, err);
    }
  }

  console.log(`\n🎉 Migration Complete! Successfully uploaded ${count} yeshivot to Firebase Firestore!`);
}

runMigration();
