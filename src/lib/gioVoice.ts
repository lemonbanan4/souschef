import { soundOn } from "./sfx";

/**
 * Chef Gio's catchphrases get spoken aloud in Italian via the browser's
 * speech synthesis — the same free, built-in tech Cook Mode uses to read
 * steps. Only the short Italian exclamation is voiced, never the full
 * (mostly English) dialog line.
 */

const CATCHPHRASES = [
  "Buongiorno",
  "Perfetto",
  "Delizioso",
  "Bravissimo",
  "Magnifico",
  "Fantastico",
  "Incredibile",
  "Mamma mia",
  "Ecco qua",
  "Che bello",
  "Missione compiuta",
];

/** Find the first catchphrase present in a Gio dialog line, if any. */
export function extractCatchphrase(line: string): string | null {
  const lower = line.toLowerCase();
  for (const phrase of CATCHPHRASES) {
    if (lower.includes(phrase.toLowerCase())) return phrase;
  }
  return null;
}

function italianVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  return voices.find((v) => v.lang.toLowerCase().startsWith("it")) ?? null;
}

/** Speak a short Italian catchphrase, respecting the kitchen-sounds toggle. */
export function speakCatchphrase(phrase: string) {
  if (!soundOn()) return;
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const utter = new SpeechSynthesisUtterance(`${phrase}!`);
  utter.lang = "it-IT";
  utter.rate = 0.9;
  utter.pitch = 1.1;
  const voice = italianVoice();
  if (voice) utter.voice = voice;
  window.speechSynthesis.speak(utter);
}
