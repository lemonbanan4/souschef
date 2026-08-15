import { initializeApp, type FirebaseOptions } from "firebase/app";

/**
 * Firebase app config for the web build. Native iOS/Android get their
 * config from google-services.json / GoogleService-Info.plist instead, via
 * the Capacitor Firebase plugins — this is only consulted on web (and by
 * the web SDK's Firestore client, which the Capacitor plugins don't cover).
 * Set these as VITE_FIREBASE_* env vars at build time; see Firebase Console
 * → Project Settings → your web app's config.
 */
const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseApp = initializeApp(firebaseConfig);
