import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import type { User } from "@capacitor-firebase/authentication";

/**
 * Thin wrapper over the Capacitor Firebase Authentication plugin — one API
 * that uses native SDKs on iOS/Android and the Firebase Web SDK on web, for
 * email/password + Google + Apple sign-in. No guest mode: every screen in
 * the app requires a signed-in user — see the AuthGate in src/main.tsx.
 */

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

function toAppUser(user: User | null): AppUser | null {
  if (!user) return null;
  return { uid: user.uid, email: user.email, displayName: user.displayName };
}

export async function signUpWithEmail(email: string, password: string): Promise<AppUser | null> {
  const { user } = await FirebaseAuthentication.createUserWithEmailAndPassword({ email, password });
  return toAppUser(user);
}

export async function signInWithEmail(email: string, password: string): Promise<AppUser | null> {
  const { user } = await FirebaseAuthentication.signInWithEmailAndPassword({ email, password });
  return toAppUser(user);
}

export async function signInWithGoogle(): Promise<AppUser | null> {
  const { user } = await FirebaseAuthentication.signInWithGoogle();
  return toAppUser(user);
}

export async function signInWithApple(): Promise<AppUser | null> {
  const { user } = await FirebaseAuthentication.signInWithApple();
  return toAppUser(user);
}

export async function signOut(): Promise<void> {
  await FirebaseAuthentication.signOut();
}

export async function getCurrentUser(): Promise<AppUser | null> {
  const { user } = await FirebaseAuthentication.getCurrentUser();
  return toAppUser(user);
}

/** The Firebase ID token to send as "Authorization: Bearer <token>" on every API request. */
export async function getIdToken(): Promise<string | null> {
  try {
    const { token } = await FirebaseAuthentication.getIdToken();
    return token;
  } catch {
    return null;
  }
}

/** Subscribe to auth state changes; returns an unsubscribe function. */
export function onAuthChange(callback: (user: AppUser | null) => void): () => void {
  let handle: { remove: () => Promise<void> } | null = null;
  let cancelled = false;
  void FirebaseAuthentication.addListener("authStateChange", (change) => callback(toAppUser(change.user))).then((h) => {
    if (cancelled) void h.remove();
    else handle = h;
  });
  return () => {
    cancelled = true;
    void handle?.remove();
  };
}
