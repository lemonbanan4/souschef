import { Capacitor } from "@capacitor/core";
import { firebaseApp } from "./firebase";
import { getAuth, indexedDBLocalPersistence, initializeAuth, type Auth } from "firebase/auth";

let authInstance: Auth | null = null;

/**
 * Firebase Auth JS instance — used for OAuth on web and to keep Firestore rules
 * in sync with the native Capacitor Firebase Authentication plugin on iOS/Android.
 * @see https://github.com/capawesome-team/capacitor-firebase/blob/main/packages/authentication/docs/firebase-js-sdk.md
 */
export function getFirebaseAuth(): Auth {
  if (authInstance) return authInstance;
  try {
    authInstance = Capacitor.isNativePlatform()
      ? initializeAuth(firebaseApp, { persistence: indexedDBLocalPersistence })
      : getAuth(firebaseApp);
  } catch {
    authInstance = getAuth(firebaseApp);
  }
  return authInstance;
}