import { soundOn } from "./sfx";

/**
 * Chef Gio's catchphrases get spoken aloud in Italian — preferring a
 * recorded clip (Massimo, the voice used in the app's videos) if one
 * exists at /audio/gio/<slug>.mp3, and falling back to the browser's
 * free speech synthesis otherwise. Only the short Italian exclamation
 * is voiced, never the full (mostly English) dialog line.
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

function slugify(phrase: string): string {
  return phrase.toLowerCase().replace(/\s+/g, "-");
}

/** Recorded clips confirmed missing this session — stop re-requesting them. */
const missingClips = new Set<string>();

/** Try the recorded Massimo clip for a phrase; resolves false if it's not there. */
function playClip(slug: string): Promise<boolean> {
  if (missingClips.has(slug)) return Promise.resolve(false);
  return new Promise((resolve) => {
    const audio = new Audio(`/audio/gio/${slug}.mp3`);
    audio.addEventListener(
      "canplaythrough",
      () => {
        void audio.play();
        resolve(true);
      },
      { once: true },
    );
    audio.addEventListener(
      "error",
      () => {
        missingClips.add(slug);
        resolve(false);
      },
      { once: true },
    );
  });
}

function italianVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  return voices.find((v) => v.lang.toLowerCase().startsWith("it")) ?? null;
}

function speakWithBrowserVoice(phrase: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const utter = new SpeechSynthesisUtterance(`${phrase}!`);
  utter.lang = "it-IT";
  utter.rate = 0.9;
  utter.pitch = 1.1;
  const voice = italianVoice();
  if (voice) utter.voice = voice;
  window.speechSynthesis.speak(utter);
}

/** Speak a short Italian catchphrase, respecting the kitchen-sounds toggle. */
export async function speakCatchphrase(phrase: string) {
  if (!soundOn()) return;
  const played = await playClip(slugify(phrase));
  if (!played) speakWithBrowserVoice(phrase);
}
