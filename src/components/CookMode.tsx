import { useCallback, useEffect, useRef, useState } from "react";
import type { Recipe } from "../types";
import { pop, timerDone } from "../lib/sfx";

interface Props {
  recipe: Recipe;
  onClose: () => void;
  onFinish: () => void;
}

/** Extract a timer duration (in minutes) from a step's text, if any. */
function stepMinutes(step: string): number | null {
  // "8–10 minutes", "10-12 min", "simmer 10 minutes", "90 seconds"
  const range = step.match(/(\d+)\s*[–-]\s*(\d+)\s*min/i);
  if (range) return parseInt(range[2]);
  const mins = step.match(/(\d+)\s*min/i);
  if (mins) return parseInt(mins[1]);
  const secs = step.match(/(\d+)\s*sec/i);
  if (secs) return parseInt(secs[1]) / 60;
  return null;
}

function fmt(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ---------- minimal Web Speech typings (not in lib.dom.d.ts) ----------

interface SpeechRecognitionResultLike {
  [index: number]: { transcript: string };
}
interface SpeechRecognitionResultListLike {
  [index: number]: SpeechRecognitionResultLike;
  length: number;
}
interface SpeechRecognitionEventLike extends Event {
  results: SpeechRecognitionResultListLike;
}
interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const RecognitionCtor = getSpeechRecognitionCtor();
const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;

function speak(text: string) {
  if (!canSpeak) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 0.98;
  window.speechSynthesis.speak(utter);
}

export default function CookMode({ recipe, onClose, onFinish }: Props) {
  const [idx, setIdx] = useState(0);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [ringing, setRinging] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const wakeLockRef = useRef<{ release: () => Promise<void> } | null>(null);
  const voiceOnRef = useRef(voiceOn);
  const commandRef = useRef<(transcript: string) => void>(() => {});

  const step = recipe.steps[idx];
  const minutes = stepMinutes(step);
  const isLast = idx === recipe.steps.length - 1;

  // Keep the screen awake while cooking
  useEffect(() => {
    let active = true;
    const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } };
    nav.wakeLock
      ?.request("screen")
      .then((lock) => {
        if (active) wakeLockRef.current = lock;
        else void lock.release();
      })
      .catch(() => {});
    return () => {
      active = false;
      void wakeLockRef.current?.release().catch(() => {});
    };
  }, []);

  const stopTimer = useCallback(() => {
    if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    intervalRef.current = null;
    setRemaining(null);
    setRinging(false);
  }, []);

  useEffect(() => () => stopTimer(), [stopTimer]);

  // Reset timer when the step changes
  useEffect(() => {
    stopTimer();
  }, [idx, stopTimer]);

  const startTimer = useCallback((mins: number) => {
    stopTimer();
    let secs = Math.round(mins * 60);
    setRemaining(secs);
    intervalRef.current = window.setInterval(() => {
      secs -= 1;
      if (secs <= 0) {
        if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
        intervalRef.current = null;
        setRemaining(0);
        setRinging(true);
        timerDone();
      } else {
        setRemaining(secs);
      }
    }, 1000);
  }, [stopTimer]);

  const go = useCallback(
    (delta: number) => {
      pop();
      setIdx((i) => Math.min(recipe.steps.length - 1, Math.max(0, i + delta)));
    },
    [recipe.steps.length],
  );

  // Read each step aloud when voice mode is on
  useEffect(() => {
    if (voiceOn) speak(recipe.steps[idx]);
  }, [idx, voiceOn, recipe.steps]);

  useEffect(() => {
    voiceOnRef.current = voiceOn;
    if (!voiceOn && canSpeak) window.speechSynthesis.cancel();
  }, [voiceOn]);

  // Always keep the voice-command handler pointed at fresh state
  useEffect(() => {
    commandRef.current = (transcript: string) => {
      const t = transcript.toLowerCase();
      if (t.includes("next")) go(1);
      else if (t.includes("back") || t.includes("previous")) go(-1);
      else if (t.includes("repeat")) speak(recipe.steps[idx]);
      else if (t.includes("cancel") && remaining !== null) stopTimer();
      else if (t.includes("timer") && minutes !== null && remaining === null && !ringing) startTimer(minutes);
      else if ((t.includes("finish") || t.includes("done")) && isLast) onFinish();
    };
  });

  // Start/stop the recognition session
  useEffect(() => {
    if (!voiceOn || !RecognitionCtor) return;
    const recognition = new RecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      const lastResult = event.results[event.results.length - 1];
      const transcript = lastResult?.[0]?.transcript;
      if (transcript) commandRef.current(transcript);
    };
    recognition.onerror = () => setVoiceOn(false);
    recognition.onend = () => {
      if (voiceOnRef.current) {
        try {
          recognition.start();
        } catch {
          /* already running */
        }
      }
    };
    try {
      recognition.start();
    } catch {
      /* already running */
    }
    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try {
        recognition.stop();
      } catch {
        /* already stopped */
      }
    };
  }, [voiceOn]);

  return (
    <div className="cookmode-overlay">
      <div className="cookmode clay">
        <div className="cookmode-top">
          <div className="cookmode-title">
            <span className="cookmode-emoji">{recipe.emoji}</span> {recipe.title}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {RecognitionCtor && (
              <button
                className={`icon-btn ${voiceOn ? "voice-active" : ""}`}
                onClick={() => setVoiceOn((v) => !v)}
                title={voiceOn ? "Voice control on — say 'next', 'back', 'timer', 'repeat'" : "Turn on hands-free voice control"}
                aria-label="Toggle voice control"
              >
                {voiceOn ? "🎙️" : "🎤"}
              </button>
            )}
            <button className="icon-btn" onClick={onClose} aria-label="Exit cook mode">✕</button>
          </div>
        </div>

        {voiceOn && <div className="voice-banner">🎙️ Listening — say "next", "back", "timer", "repeat", or "finish"</div>}

        <div className="cookmode-progress">
          {recipe.steps.map((_, i) => (
            <button
              key={i}
              className={`cm-dot ${i === idx ? "current" : ""} ${i < idx ? "past" : ""}`}
              onClick={() => setIdx(i)}
              aria-label={`Step ${i + 1}`}
            />
          ))}
        </div>

        <div className="cookmode-step-label">Step {idx + 1} of {recipe.steps.length}</div>
        <div className="cookmode-step">{step}</div>

        {minutes !== null && (
          <div className="cookmode-timer">
            {remaining === null && !ringing && (
              <button className="ghost-btn" onClick={() => startTimer(minutes)}>
                ⏲️ Start {minutes >= 1 ? `${minutes} min` : `${Math.round(minutes * 60)} sec`} timer
              </button>
            )}
            {remaining !== null && remaining > 0 && (
              <div className="timer-live clay-pressed">
                <span className="timer-digits">{fmt(remaining)}</span>
                <button className="chip" onClick={stopTimer}>cancel</button>
              </div>
            )}
            {ringing && (
              <button className="cook-btn ringing" onClick={stopTimer}>
                ⏰ Time's up! Tap to dismiss
              </button>
            )}
          </div>
        )}

        <div className="cookmode-nav">
          <button className="ghost-btn" onClick={() => go(-1)} disabled={idx === 0}>← Back</button>
          {isLast ? (
            <button className="cook-btn" onClick={onFinish}>Finish & claim XP 🏆</button>
          ) : (
            <button className="cook-btn" onClick={() => go(1)}>Next step →</button>
          )}
        </div>
      </div>
    </div>
  );
}
