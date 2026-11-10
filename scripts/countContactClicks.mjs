// Usage: node --env-file=.env scripts/countContactClicks.mjs
// Signs in as the admin (password typed in the terminal) and prints, per yeshiva, how many
// test takers clicked the "contact the manager" button (all_test_results.contact_clicks).
import readline from 'readline';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const env = process.env;
const email = env.VITE_ADMIN_EMAIL || 'shvushon@gmail.com';

const askHidden = (prompt) => new Promise(resolve => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  rl._writeToOutput = (s) => { if (s.includes(prompt)) rl.output.write(s); };
  rl.question(prompt, (answer) => { rl.close(); process.stdout.write('\n'); resolve(answer); });
});

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  appId: env.VITE_FIREBASE_APP_ID
});
const db = getFirestore(app);

const password = await askHidden(`Password for ${email}: `);
await signInWithEmailAndPassword(getAuth(app), email, password);

const [resultsSnap, yeshivotSnap] = await Promise.all([
  getDocs(collection(db, 'all_test_results')),
  getDocs(collection(db, 'yeshivot'))
]);
const names = Object.fromEntries(yeshivotSnap.docs.map(d => [d.id, d.data().name]));

const clicks = {};   // yeshivaId -> number of test takers who clicked
const shown = {};    // yeshivaId -> number of test takers who saw it in their top matches
let withClicks = 0;
resultsSnap.docs.forEach(d => {
  const data = d.data();
  (data.top_matches || []).forEach(m => { shown[m.id] = (shown[m.id] || 0) + 1; });
  const ids = data.contact_clicks || [];
  if (ids.length) withClicks++;
  ids.forEach(id => { clicks[id] = (clicks[id] || 0) + 1; });
});

const rows = Object.keys(clicks).map(id => ({
  name: names[id] || `(unknown ${id})`,
  clicks: clicks[id],
  shown: shown[id] || 0,
  'click%': shown[id] ? Number((100 * clicks[id] / shown[id]).toFixed(1)) : null
})).sort((a, b) => b.clicks - a.clicks);

console.log(`\nTotal tests: ${resultsSnap.size}, with at least one contact click: ${withClicks}\n`);
console.table(rows);
