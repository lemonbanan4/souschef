import { useState } from "react";
import { safeSet } from "../lib/storage";

const SEEN_KEY = "souschef.onboarded";

export function shouldShowOnboarding(cooked: number): boolean {
  try {
    return !localStorage.getItem(SEEN_KEY) && cooked === 0;
  } catch {
    return false;
  }
}

export function markOnboarded() {
  safeSet(SEEN_KEY, "1");
}

interface Step {
  emoji?: string;
  image?: string;
  title: string;
  text: string;
}

const STEPS: Step[] = [
  {
    image: "/gio-icon.svg",
    title: "Ciao! I'm Chef Gio",
    text: "Tell me what you're craving — or what's in your pantry — and I'll invent a recipe just for you. No idea? Brave a 🎲 Mystery Basket!",
  },
  {
    emoji: "🔥",
    title: "Cook & level up",
    text: "Cook Mode walks you through every step with timers and voice control. Every dish you finish earns XP, keeps your daily streak alive, and unlocks badges.",
  },
  {
    emoji: "🎯",
    title: "Make it yours",
    text: "Set a diet goal (Cut, Maintain or Bulk), save your pantry staples, and rate what you cook — I learn your taste and get better every time. Andiamo!",
  },
];

interface Props {
  onDone: () => void;
}

export default function Onboarding({ onDone }: Props) {
  const [step, setStep] = useState(0);
  const s = STEPS[step];
  const last = step === STEPS.length - 1;

  function finish() {
    markOnboarded();
    onDone();
  }

  return (
    <div className="modal-overlay onboarding-overlay">
      <div className="modal clay onboarding-card">
        {s.image ? (
          <img src={s.image} alt="Chef Gio" className="onboarding-avatar" />
        ) : (
          <div className="onboarding-emoji">{s.emoji}</div>
        )}
        <h2>{s.title}</h2>
        <p className="onboarding-text">{s.text}</p>
        <div className="onboarding-dots" aria-hidden="true">
          {STEPS.map((_, i) => (
            <span key={i} className={`onboarding-dot ${i === step ? "active" : ""}`} />
          ))}
        </div>
        <div className="onboarding-actions">
          {step > 0 ? (
            <button className="ghost-btn" onClick={() => setStep(step - 1)}>Back</button>
          ) : (
            <button className="ghost-btn" onClick={finish}>Skip</button>
          )}
          <button className="cook-btn" onClick={() => (last ? finish() : setStep(step + 1))}>
            {last ? "Let's cook! 🍳" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}
