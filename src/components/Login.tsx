import { useState } from "react";
import { signInWithApple, signInWithEmail, signInWithGoogle, signUpWithEmail } from "../lib/auth";

/** Full-screen sign-in/sign-up — there's no guest mode, this is the only thing rendered until a session exists. */
export default function Login() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<"email" | "google" | "apple" | null>(null);
  const [error, setError] = useState<string | null>(null);

  function friendlyError(err: unknown): string {
    const code = (err as { code?: string })?.code ?? "";
    if (code.includes("wrong-password") || code.includes("invalid-credential")) return "Wrong email or password.";
    if (code.includes("email-already-in-use")) return "That email already has an account — try signing in instead.";
    if (code.includes("weak-password")) return "Password should be at least 6 characters.";
    if (code.includes("invalid-email")) return "That doesn't look like a valid email.";
    if (code.includes("user-not-found")) return "No account with that email — try signing up instead.";
    if (code.includes("network")) return "Couldn't reach the kitchen — check your connection and try again.";
    return "Something went wrong. Give it another try.";
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy("email");
    try {
      if (mode === "signup") await signUpWithEmail(email, password);
      else await signInWithEmail(email, password);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(null);
    }
  }

  async function handleGoogle() {
    setError(null);
    setBusy("google");
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(null);
    }
  }

  async function handleApple() {
    setError(null);
    setBusy("apple");
    try {
      await signInWithApple();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(null);
    }
  }

  const busyAny = busy !== null;

  return (
    <div className="auth-screen">
      <div className="modal clay auth-card">
        <img src="/gio-face.svg" alt="Chef Gio" className="onboarding-avatar" />
        <h2>{mode === "signin" ? "Bentornato!" : "Ciao! Let's get cooking"}</h2>
        <p className="onboarding-text">
          {mode === "signin" ? "Sign in to pick up where you left off." : "Create an account — your recipes and progress will follow you everywhere."}
        </p>

        <div className="auth-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "signin"}
            className={`chip ${mode === "signin" ? "active" : ""}`}
            onClick={() => setMode("signin")}
          >
            Sign in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "signup"}
            className={`chip ${mode === "signup" ? "active" : ""}`}
            onClick={() => setMode("signup")}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleEmailSubmit} className="auth-form">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            minLength={6}
            required
          />
          <button type="submit" className="cook-btn" disabled={busyAny}>
            {busy === "email" ? "One moment…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        {error && <p className="auth-error">⚠️ {error}</p>}

        <div className="auth-divider"><span>or</span></div>

        <button type="button" className="ghost-btn auth-provider-btn" onClick={handleGoogle} disabled={busyAny}>
          {busy === "google" ? "One moment…" : "Continue with Google"}
        </button>
        <button type="button" className="ghost-btn auth-provider-btn" onClick={handleApple} disabled={busyAny}>
          {busy === "apple" ? "One moment…" : "Continue with Apple"}
        </button>
      </div>
    </div>
  );
}
