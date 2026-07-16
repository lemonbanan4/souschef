/** Tiny WebAudio sound effects — no assets, all synthesized. */

import { safeSet } from "./storage";

const SOUND_KEY = "souschef.sound";

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (!soundOn()) return null;
  try {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

export function soundOn(): boolean {
  return localStorage.getItem(SOUND_KEY) !== "0";
}

export function setSoundOn(on: boolean) {
  safeSet(SOUND_KEY, on ? "1" : "0");
}

function tone(freq: number, start: number, duration: number, type: OscillatorType = "sine", gain = 0.12) {
  const ac = audio();
  if (!ac) return;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, ac.currentTime + start);
  g.gain.linearRampToValueAtTime(gain, ac.currentTime + start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + start + duration);
  osc.connect(g).connect(ac.destination);
  osc.start(ac.currentTime + start);
  osc.stop(ac.currentTime + start + duration + 0.05);
}

/** Soft pop — XP gain, checking a step. */
export function pop() {
  tone(520, 0, 0.09, "triangle", 0.14);
  tone(780, 0.04, 0.08, "triangle", 0.1);
}

/** Two-note chime — badge unlocked, saved. */
export function chime() {
  tone(660, 0, 0.14, "sine", 0.12);
  tone(990, 0.12, 0.2, "sine", 0.12);
}

/** Rising arpeggio — level up, quest complete. */
export function fanfare() {
  tone(523, 0, 0.12, "triangle", 0.13);
  tone(659, 0.11, 0.12, "triangle", 0.13);
  tone(784, 0.22, 0.12, "triangle", 0.13);
  tone(1046, 0.33, 0.3, "triangle", 0.14);
}

/** Kitchen-timer beeps. */
export function timerDone() {
  for (let i = 0; i < 3; i++) {
    tone(880, i * 0.25, 0.12, "square", 0.09);
    tone(880, i * 0.25 + 0.13, 0.08, "square", 0.07);
  }
}

/** One-second sizzle while the chef starts cooking. */
export function sizzle() {
  const ac = audio();
  if (!ac) return;
  const len = ac.sampleRate * 1.1;
  const buffer = ac.createBuffer(1, len, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 3500;
  const g = ac.createGain();
  g.gain.value = 0.05;
  src.connect(filter).connect(g).connect(ac.destination);
  src.start();
}
