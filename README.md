# Leaf & Letter — Phase 4

Phase 4 adds installable PWA support and prepares the React + Vite + Firebase app for HTTPS hosting on Vercel.

## A. Run locally

1. Extract the ZIP and open the `leaf-and-letter` folder in VS Code.
2. Create `.env` beside `package.json` by copying `.env.example` and entering the Firebase Web App values.
3. In PowerShell:

   ```powershell
   npm install
   npm run dev
   ```

4. For a production build test:

   ```powershell
   npm run build
   npm run preview
   ```

## B. Deploy using GitHub + Vercel

### 1. Create a GitHub repository

1. Sign in to GitHub and create a new **private** repository named `leaf-and-letter`.
2. Open the project folder in VS Code.
3. Confirm `.env` is not included. `.gitignore` already excludes `.env` and `.env.local`.
4. Use VS Code Source Control to initialize Git, commit the project, and publish/push it to the private GitHub repository. Alternatively, use GitHub Desktop.

Do not upload Firebase service-account JSON files or any private credentials. The Firebase Web App config used by this frontend is public client configuration; Firestore rules must enforce access control.

### 2. Import into Vercel

1. Open https://vercel.com/ and sign in with GitHub.
2. Choose **Add New → Project** and import `leaf-and-letter`.
3. Vercel should detect Vite. Confirm:
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Output directory: `dist`
   - Install command: `npm install`
4. Before deploying, open **Environment Variables** and add these six variables using the exact values from your local `.env`:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
5. Apply them to **Production**, **Preview**, and **Development** as needed, then click **Deploy**.

### 3. Authorize the production domain in Firebase

After Vercel gives you a deployment URL (for example, `your-project.vercel.app`):

1. Firebase Console → **Authentication → Settings → Authorized domains**.
2. Add the hostname only, e.g. `your-project.vercel.app` (no `https://` and no path).
3. Confirm **Authentication → Sign-in method** has Email/Password and Google enabled.
4. Open Firestore → **Rules**, publish the rules in this repository's `firestore.rules` file.
5. Open the Vercel URL and test registration, login, Google sign-in, adding a book, refresh, and sign-out.

If you later attach a custom domain, add that hostname to Firebase Authorized domains too.

## C. Install on iPhone

1. Open the deployed HTTPS Vercel URL in **Safari** on the iPhone.
2. Tap **Share** (square with upward arrow).
3. Choose **Add to Home Screen**.
4. Keep the suggested name `Leaf & Letter`, then tap **Add**.
5. Launch it from the new Home Screen icon.

The PWA shell and static assets are cacheable for repeat visits. Firebase authentication and Firestore operations still require an internet connection; this is not full offline book editing or offline synchronization.

## D. Updating the live website

After changing code:

1. Save the files.
2. Commit and push the changes to the connected GitHub branch.
3. Vercel automatically creates a new deployment.

## Firebase security

The `firestore.rules` file restricts each user's private library document to that authenticated user's UID. Publish these rules in Firebase before using the public site. Never use open rules such as `allow read, write: if true`.

## Current scope and limitations

- Firebase email/password and Google authentication.
- Per-user Firestore library persistence.
- Responsive layout and installable PWA metadata/icons/service worker.
- Static app shell and selected external assets are cached; cloud data is not available offline.
- No custom domain is included; Vercel provides a default `vercel.app` domain.
- Existing Phase 2 browser-only data is not automatically migrated to Firestore.
