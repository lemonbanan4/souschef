import { useEffect, useState } from "react";
import App from "../App";
import { onAuthChange, type AppUser } from "../lib/auth";
import { pullAndApply } from "../lib/sync";
import Login from "./Login";

type Status = "loading" | "signed-out" | "syncing" | "ready";

/**
 * Gates the whole app behind authentication — no guest mode. Once a user is
 * signed in, pulls their synced data down and applies it to localStorage
 * *before* mounting <App/>, since App's state is read synchronously on
 * mount (see src/App.tsx) — syncing after mount would arrive too late.
 */
export default function AuthGate() {
  const [status, setStatus] = useState<Status>("loading");
  const [user, setUser] = useState<AppUser | null>(null);

  useEffect(() => {
    let resolvedOnce = false;
    const unsubscribe = onAuthChange((nextUser: AppUser | null) => {
      resolvedOnce = true;
      setUser(nextUser);
      if (!nextUser) {
        setStatus("signed-out");
        return;
      }
      setStatus("syncing");
      pullAndApply(nextUser.uid)
        .catch((err) => console.error("[AuthGate] sync pull failed:", err))
        .finally(() => setStatus("ready"));
    });
    // Safety net: if the plugin never calls back, don't hang on the splash forever.
    const timeout = window.setTimeout(() => {
      if (!resolvedOnce) setStatus("signed-out");
    }, 8000);
    return () => {
      unsubscribe();
      window.clearTimeout(timeout);
    };
  }, []);

  if (status === "loading" || status === "syncing") {
    return (
      <div className="auth-screen">
        <div className="modal clay auth-card">
          <img src="/gio-face.svg" alt="Chef Gio" className="onboarding-avatar" />
          <p className="onboarding-text">{status === "syncing" ? "Setting the table…" : "Warming up the kitchen…"}</p>
        </div>
      </div>
    );
  }

  if (status === "signed-out" || !user) return <Login />;

  return <App uid={user.uid} />;
}
