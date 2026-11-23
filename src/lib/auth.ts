import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import type { SignInResult, User } from "@capacitor-firebase/authentication";
import { Capacitor } from "@capacitor/core";
import {
  GoogleAuthProvider,
  OAuthProvider,
  onAuthStateChanged,
  getRedirectResult,
  signInWithCredential,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseWebSignOut,
  type User as WebUser,
} from "firebase/auth";
import { getFirebaseAuth } from "./firebaseAuth";

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

function toAppUser(user: User | WebUser | null | undefined): AppUser | null {
  if (!user) return null;
  return { uid: user.uid, email: user.email, displayName: user.displayName };
}

async function mirrorOAuthOnWebLayer(result: SignInResult, provider: "google" | "apple"): Promise<void> {
  const auth = getFirebaseAuth();
  if (provider === "google") {
    const idToken = result.credential?.idToken;
    if (!idToken) throw new Error("Google sign-in did not return an ID token.");
    await signInWithCredential(
      auth,
      GoogleAuthProvider.credential(idToken, result.credential?.accessToken ?? undefined),
    );
    return;
  }
  const idToken = result.credential?.idToken;
  if (!idToken) throw new Error("Apple sign-in did not return an ID token.");
  const apple = new OAuthProvider("apple.com");
  await signInWithCredential(
    auth,
    apple.credential({ idToken, rawNonce: result.credential?.nonce }),
  );
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
  if (!Capacitor.isNativePlatform()) {
    const auth = getFirebaseAuth();
    const { user } = await signInWithPopup(auth, new GoogleAuthProvider());
    return toAppUser(user);
  }
  const result = await FirebaseAuthentication.signInWithGoogle();
  await mirrorOAuthOnWebLayer(result, "google");
  if (result.user) return toAppUser(result.user);
  const { user } = await FirebaseAuthentication.getCurrentUser();
  return toAppUser(user);
}

function appleOAuthProvider(): OAuthProvider {
  const provider = new OAuthProvider("apple.com");
  provider.addScope("email");
  provider.addScope("name");
  return provider;
}

/** Call once on web load after an Apple/Google redirect sign-in. */
export async function completeOAuthRedirectIfNeeded(): Promise<AppUser | null> {
  if (Capacitor.isNativePlatform()) return null;
  try {
    const cred = await getRedirectResult(getFirebaseAuth());
    return toAppUser(cred?.user ?? null);
  } catch {
    return null;
  }
}

export async function signInWithApple(): Promise<AppUser | null> {
  if (!Capacitor.isNativePlatform()) {
    const auth = getFirebaseAuth();
    const provider = appleOAuthProvider();
    const prefersRedirect =
      typeof navigator !== "undefined" &&
      /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (prefersRedirect) {
      await signInWithRedirect(auth, provider);
      return null;
    }
    try {
      const { user } = await signInWithPopup(auth, provider);
      return toAppUser(user);
    } catch (err) {
      const msg = String((err as Error)?.message ?? "");
      if (msg.includes("invalid_client") || (err as { code?: string })?.code === "auth/popup-blocked") {
        await signInWithRedirect(auth, provider);
        return null;
      }
      throw err;
    }
  }
  const result = await FirebaseAuthentication.signInWithApple();
  await mirrorOAuthOnWebLayer(result, "apple");
  if (result.user) return toAppUser(result.user);
  const { user } = await FirebaseAuthentication.getCurrentUser();
  return toAppUser(user);
}

export async function signOut(): Promise<void> {
  await FirebaseAuthentication.signOut();
  try {
    await firebaseWebSignOut(getFirebaseAuth());
  } catch {
    /* web auth may never have been initialized */
  }
}

export async function getCurrentUser(): Promise<AppUser | null> {
  const { user } = await FirebaseAuthentication.getCurrentUser();
  return toAppUser(user);
}

/** The Firebase ID token to send as "Authorization: Bearer <token>" on every API request. */
export async function getIdToken(): Promise<string | null> {
  try {
    const { token } = await FirebaseAuthentication.getIdToken();
    if (token) return token;
  } catch {
    /* fall through to web auth */
  }
  const webUser = getFirebaseAuth().currentUser;
  if (webUser) {
    try {
      return await webUser.getIdToken();
    } catch {
      return null;
    }
  }
  return null;
}

/** Subscribe to auth state changes; returns an unsubscribe function. */
export function onAuthChange(callback: (user: AppUser | null) => void): () => void {
  let lastUid: string | null | undefined;
  const emit = (user: AppUser | null) => {
    const uid = user?.uid ?? null;
    if (uid === lastUid) return;
    lastUid = uid;
    callback(user);
  };

  const unWeb = onAuthStateChanged(getFirebaseAuth(), (u) => emit(toAppUser(u)));

  let pluginHandle: { remove: () => Promise<void> } | null = null;
  let cancelled = false;
  void FirebaseAuthentication.addListener("authStateChange", (change) => emit(toAppUser(change.user))).then((h) => {
    if (cancelled) void h.remove();
    else pluginHandle = h;
  });

  return () => {
    cancelled = true;
    unWeb();
    void pluginHandle?.remove();
  };
}