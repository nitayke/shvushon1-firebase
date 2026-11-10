# Project notes

## Firebase service account (admin access)
- The Firebase Admin SDK service account (SA) key is at `.secrets/firebase-service-account.json` (project `shvushon1`). The folder is gitignored - never commit it or print its contents.
- You may use it for admin tasks on Firestore/Auth (e.g. deleting a manager: remove `managers/{uid}`, `manager_contacts/{yeshivaId}`, the used `invites` doc, the manager's `events`, and the Auth user).
- `firebase-admin` is a project dependency only for `api/analytics.js` (Vercel function, uses env `FIREBASE_SERVICE_ACCOUNT`). For ad-hoc admin scripts install it in a temp dir (not the project) and run scripts from there with `cert(JSON.parse(fs.readFileSync(path)))` from `firebase-admin/app`.
- Analytics: `api/analytics.js` folds `all_test_results` into `stats/rollup` and deletes raw results older than 180 days (aggregates keep all-time totals). Don't read the whole `all_test_results` collection from the client.
- Do a read-only dry run first and confirm destructive changes with the user.
