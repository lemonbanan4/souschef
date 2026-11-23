import { initializeApp, type FirebaseOptions } from "firebase/app";

/**
 * Firebase app config for the web build. Native iOS/Android get their
 * config from google-services.json / GoogleService-Info.plist instead, via
 * the Capacitor Firebase plugins — this is only consulted on web (and by
 * the web SDK's Firestore client, which the Capacitor plugins don't cover).
 * Set these as VITE_FIREBASE_* env vars at build time; see Firebase Console
 * → Project Settings → your web app's config.
 */
// Web app "Cook with Gio Web" (`firebase apps:sdkconfig WEB …`).
// Native iOS/Android use google-services.json / GoogleService-Info.plist via Capacitor.
// VITE_FIREBASE_* overrides at build time when set.
const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "AIzaSyByrDCBQGbJLiysAR3ckHva6Wrtj3K9U_c",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "cookwithgio.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "cookwithgio",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "cookwithgio.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "600120662842",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "1:600120662842:web:e0bcfaaf3ee4875bac8e03",
};

export const firebaseApp = initializeApp(firebaseConfig);
