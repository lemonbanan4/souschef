import { useEffect, useState } from "react";
import { PACKAGE_TYPE, getOfferings, purchasePackage, restorePurchases } from "../lib/subscription";
import type { PurchasesPackage } from "../lib/subscription";

interface Props {
  onClose: () => void;
  onPurchased: () => void;
}

export default function Paywall({ onClose, onPurchased }: Props) {
  const [packages, setPackages] = useState<PurchasesPackage[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getOfferings()
      .then((offering) => setPackages(offering?.availablePackages ?? []))
      .catch(() => setError("Couldn't load plans — check your connection and try again."));
  }, []);

  async function handlePurchase(pkg: PurchasesPackage) {
    setError(null);
    setBusy(pkg.identifier);
    try {
      const isPro = await purchasePackage(pkg);
      if (isPro) onPurchased();
    } catch (err) {
      const cancelled = (err as { userCancelled?: boolean })?.userCancelled;
      if (!cancelled) setError("The purchase didn't go through. Give it another try.");
    } finally {
      setBusy(null);
    }
  }

  async function handleRestore() {
    setError(null);
    setBusy("restore");
    try {
      const isPro = await restorePurchases();
      if (isPro) onPurchased();
      else setError("No previous purchase found for this account.");
    } catch {
      setError("Couldn't restore purchases — check your connection and try again.");
    } finally {
      setBusy(null);
    }
  }

  const monthly = packages?.find((p) => p.packageType === PACKAGE_TYPE.MONTHLY);
  const yearly = packages?.find((p) => p.packageType === PACKAGE_TYPE.ANNUAL);

  return (
    <div className="modal-overlay">
      <div className="modal clay paywall-card">
        <button className="icon-btn paywall-close" onClick={onClose} aria-label="Close">✕</button>
        <img src="/gio-face.svg" alt="Chef Gio" className="onboarding-avatar" />
        <h2>Cook with Gio Pro</h2>
        <p className="onboarding-text">30x the recipes, chats, meal plans and fridge scans every month.</p>

        {!packages && !error && <p className="onboarding-text">Loading plans…</p>}
        {error && <p className="auth-error">⚠️ {error}</p>}

        {yearly && (
          <button className="cook-btn paywall-plan-btn" onClick={() => handlePurchase(yearly)} disabled={busy !== null}>
            {busy === yearly.identifier ? "One moment…" : (
              <>
                Yearly — {yearly.product.priceString}
                {yearly.product.introPrice && <span className="paywall-trial-badge">Free trial</span>}
              </>
            )}
          </button>
        )}
        {monthly && (
          <button className="ghost-btn paywall-plan-btn" onClick={() => handlePurchase(monthly)} disabled={busy !== null}>
            {busy === monthly.identifier ? "One moment…" : `Monthly — ${monthly.product.priceString}`}
          </button>
        )}

        <button className="ghost-btn paywall-restore-btn" onClick={handleRestore} disabled={busy !== null}>
          {busy === "restore" ? "One moment…" : "Restore purchases"}
        </button>
      </div>
    </div>
  );
}
