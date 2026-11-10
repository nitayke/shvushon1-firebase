# Project notes

## Firebase service account (admin access)
- The Firebase Admin SDK service account (SA) key is at `.secrets/firebase-service-account.json` (project `shvushon1`). The folder is gitignored - never commit it or print its contents.
- You may use it for admin tasks on Firestore/Auth (e.g. deleting a manager: remove `managers/{uid}`, `manager_contacts/{yeshivaId}`, the used `invites` doc, the manager's `events`, and the Auth user).
- `firebase-admin` is not a project dependency; install it in a temp dir (not the project) and run scripts from there with `cert(JSON.parse(fs.readFileSync(path)))` from `firebase-admin/app`.
- Do a read-only dry run first and confirm destructive changes with the user.
