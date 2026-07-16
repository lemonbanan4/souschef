import type { GameState, LevelInfo } from "../types";

/**
 * Shareable chef cards — canvas-rendered in three social formats:
 *  story  1080×1920  (TikTok / Instagram & WhatsApp stories)
 *  square 1080×1080  (Instagram feed)
 *  wide   1200×675   (X / Twitter)
 */

export type CardFormat = "story" | "square" | "wide";

export const CARD_FORMATS: { id: CardFormat; label: string; hint: string }[] = [
  { id: "story", label: "9:16 Story", hint: "1080×1920 — TikTok & Instagram stories" },
  { id: "square", label: "1:1 Post", hint: "1080×1080 — Instagram feed" },
  { id: "wide", label: "16:9 Wide", hint: "1200×675 — X / Twitter" },
];

const DIMS: Record<CardFormat, [number, number]> = {
  story: [1080, 1920],
  square: [1080, 1080],
  wide: [1200, 675],
};

const INK = "#3d3117";
const INK_SOFT = "#8a7a52";
const GOLD = "#7a5c04";

function roundedRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
}

function clayCard(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string) {
  c.save();
  roundedRect(c, x, y, w, h, r);
  c.fillStyle = fill;
  c.shadowColor = "rgba(214,164,26,0.35)";
  c.shadowBlur = 30;
  c.shadowOffsetY = 12;
  c.fill();
  c.restore();
}

/** Mini canvas Gio — hat, face, mustache, tricolore pin. */
function drawGio(c: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
  // face
  c.fillStyle = "#ffe3c1";
  c.beginPath();
  c.ellipse(cx, cy, 52 * s, 48 * s, 0, 0, Math.PI * 2);
  c.fill();
  // cheeks
  c.fillStyle = "rgba(255,179,161,0.55)";
  c.beginPath();
  c.arc(cx - 32 * s, cy + 8 * s, 9 * s, 0, Math.PI * 2);
  c.arc(cx + 32 * s, cy + 8 * s, 9 * s, 0, Math.PI * 2);
  c.fill();
  // eyes
  c.fillStyle = INK;
  c.beginPath();
  c.arc(cx - 19 * s, cy - 8 * s, 6 * s, 0, Math.PI * 2);
  c.arc(cx + 19 * s, cy - 8 * s, 6 * s, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#fff";
  c.beginPath();
  c.arc(cx - 17 * s, cy - 10 * s, 2 * s, 0, Math.PI * 2);
  c.arc(cx + 21 * s, cy - 10 * s, 2 * s, 0, Math.PI * 2);
  c.fill();
  // nose
  c.fillStyle = "#f2b585";
  c.beginPath();
  c.ellipse(cx, cy + 6 * s, 10 * s, 13 * s, 0, 0, Math.PI * 2);
  c.fill();
  // mustache
  c.fillStyle = "#6b4a2f";
  c.beginPath();
  c.moveTo(cx, cy + 14 * s);
  c.quadraticCurveTo(cx - 24 * s, cy + 8 * s, cx - 38 * s, cy + 18 * s);
  c.quadraticCurveTo(cx - 44 * s, cy + 26 * s, cx - 34 * s, cy + 30 * s);
  c.quadraticCurveTo(cx - 16 * s, cy + 32 * s, cx, cy + 20 * s);
  c.quadraticCurveTo(cx + 16 * s, cy + 32 * s, cx + 34 * s, cy + 30 * s);
  c.quadraticCurveTo(cx + 44 * s, cy + 26 * s, cx + 38 * s, cy + 18 * s);
  c.quadraticCurveTo(cx + 24 * s, cy + 8 * s, cx, cy + 14 * s);
  c.fill();
  // smile
  c.strokeStyle = "#8c3b2e";
  c.lineWidth = 4 * s;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(cx - 9 * s, cy + 30 * s);
  c.quadraticCurveTo(cx, cy + 37 * s, cx + 9 * s, cy + 30 * s);
  c.stroke();
  // hat band
  const bandGrad = c.createLinearGradient(cx - 40 * s, 0, cx + 40 * s, 0);
  bandGrad.addColorStop(0, "#ffdd66");
  bandGrad.addColorStop(1, "#ffbe0b");
  c.fillStyle = bandGrad;
  roundedRect(c, cx - 40 * s, cy - 52 * s, 80 * s, 20 * s, 9 * s);
  c.fill();
  // hat puffs
  c.fillStyle = "#ffffff";
  c.beginPath();
  c.arc(cx - 24 * s, cy - 62 * s, 17 * s, 0, Math.PI * 2);
  c.arc(cx, cy - 74 * s, 20 * s, 0, Math.PI * 2);
  c.arc(cx + 24 * s, cy - 61 * s, 16 * s, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.rect(cx - 30 * s, cy - 66 * s, 60 * s, 16 * s);
  c.fill();
  // tricolore pin
  const pw = 6 * s;
  c.fillStyle = "#3f9b4f";
  c.fillRect(cx - 9 * s, cy - 48 * s, pw, 12 * s);
  c.fillStyle = "#ffffff";
  c.fillRect(cx - 3 * s, cy - 48 * s, pw, 12 * s);
  c.fillStyle = "#d64545";
  c.fillRect(cx + 3 * s, cy - 48 * s, pw, 12 * s);
}

function drawStatChip(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  emoji: string,
  value: string,
  label: string,
) {
  clayCard(c, x, y, w, h, h * 0.24, "#fff7e0");
  c.textAlign = "center";
  c.fillStyle = INK;
  c.font = `${h * 0.32}px serif`;
  c.fillText(emoji, x + w / 2, y + h * 0.38);
  c.font = `800 ${h * 0.26}px 'Baloo 2', 'Nunito', sans-serif`;
  c.fillText(value, x + w / 2, y + h * 0.66);
  c.fillStyle = INK_SOFT;
  c.font = `700 ${h * 0.15}px 'Nunito', sans-serif`;
  c.fillText(label, x + w / 2, y + h * 0.87);
}

export function renderChefCard(
  format: CardFormat,
  game: GameState,
  level: LevelInfo,
  badgeTotal: number,
  chefName?: string,
): HTMLCanvasElement {
  const subtitle = chefName ? `${chefName.toUpperCase()}'S KITCHEN CARD` : "M Y   K I T C H E N   C A R D";
  const [W, H] = DIMS[format];
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const c = canvas.getContext("2d");
  if (!c) return canvas;

  // backdrop
  const bg = c.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#fff7e0");
  bg.addColorStop(0.55, "#ffe9a8");
  bg.addColorStop(1, "#ffd97a");
  c.fillStyle = bg;
  c.fillRect(0, 0, W, H);

  // decorative floating emoji
  c.globalAlpha = 0.14;
  c.font = `${Math.round(W * 0.06)}px serif`;
  const deco = ["🍋", "🍝", "🍅", "🧄", "🌿", "🥖"];
  deco.forEach((e, i) => {
    c.fillText(e, (W / 6) * i + W * 0.05, H * 0.08 + (i % 2) * H * 0.03);
    c.fillText(deco[(i + 3) % 6], (W / 6) * i + W * 0.1, H * 0.96 - (i % 2) * H * 0.02);
  });
  c.globalAlpha = 1;

  // main clay card
  const m = Math.round(W * 0.055);
  clayCard(c, m, m, W - m * 2, H - m * 2, Math.round(W * 0.06), "#ffffff");

  const stats: [string, string, string][] = [
    ["🍽️", String(game.cooked), "cooked"],
    ["🔥", `${game.streak}d`, "streak"],
    ["🏆", `${game.badges.length}/${badgeTotal}`, "badges"],
    ["🌍", String(game.cuisines.length), "cuisines"],
  ];

  const centerX = W / 2;
  c.textAlign = "center";

  const drawXpBar = (bx: number, by: number, bw: number, bh: number, textSize: number) => {
    roundedRect(c, bx, by, bw, bh, bh / 2);
    c.fillStyle = "#fff1c2";
    c.fill();
    const fillW = Math.max(bh, bw * level.progress);
    const grad = c.createLinearGradient(bx, 0, bx + fillW, 0);
    grad.addColorStop(0, "#ffd234");
    grad.addColorStop(1, "#ffbe0b");
    roundedRect(c, bx, by, fillW, bh, bh / 2);
    c.fillStyle = grad;
    c.fill();
    c.fillStyle = INK_SOFT;
    c.font = `800 ${textSize}px 'Nunito', sans-serif`;
    c.fillText(
      `${game.xp.toLocaleString()}${level.nextXp ? ` / ${level.nextXp.toLocaleString()}` : ""} XP`,
      centerX,
      by + bh + textSize * 1.5,
    );
  };

  if (format === "wide") {
    // horizontal layout
    drawGio(c, 235, 250, 1.55);
    c.fillStyle = INK;
    c.font = "800 52px 'Baloo 2', 'Nunito', sans-serif";
    c.fillText("Cook with Gio", 235, 435);
    c.fillStyle = INK_SOFT;
    c.font = "800 19px 'Nunito', sans-serif";
    c.fillText(subtitle, 235, 470);

    c.save();
    c.textAlign = "center";
    const rx = 760;
    c.fillStyle = INK;
    c.font = "800 120px 'Baloo 2', 'Nunito', sans-serif";
    c.fillText(`Lv ${level.level}`, rx, 250);
    c.font = "800 46px 'Baloo 2', 'Nunito', sans-serif";
    c.fillText(level.title, rx, 320);
    c.restore();

    const bx = 430;
    const bw = 660;
    c.textAlign = "center";
    const oldCenter = centerX;
    // temporarily center xp text over the bar
    const barCenter = bx + bw / 2;
    c.save();
    c.translate(barCenter - oldCenter, 0);
    drawXpBar(bx - (barCenter - oldCenter), 360, bw, 24, 22);
    c.restore();

    const cw = 150;
    const ch = 105;
    const gap = 14;
    let x0 = bx + bw / 2 - (cw * 4 + gap * 3) / 2;
    stats.forEach(([e, v, l]) => {
      drawStatChip(c, x0, 430, cw, ch, e, v, l);
      x0 += cw + gap;
    });

    c.fillStyle = GOLD;
    c.font = "700 24px 'Nunito', sans-serif";
    c.textAlign = "center";
    c.fillText("Cooked with amore 🇮🇹 · souschef.app", W / 2, 610);
  } else {
    const story = format === "story";
    const gy = story ? 330 : 235;
    drawGio(c, centerX, gy, story ? 2.1 : 1.55);

    c.fillStyle = INK;
    c.font = `800 ${story ? 86 : 68}px 'Baloo 2', 'Nunito', sans-serif`;
    c.fillText("Cook with Gio", centerX, story ? 580 : 400);
    c.fillStyle = INK_SOFT;
    c.font = `800 ${story ? 30 : 24}px 'Nunito', sans-serif`;
    c.fillText(subtitle, centerX, story ? 632 : 442);

    c.fillStyle = INK;
    c.font = `800 ${story ? 220 : 150}px 'Baloo 2', 'Nunito', sans-serif`;
    c.fillText(`Lv ${level.level}`, centerX, story ? 890 : 620);
    c.font = `800 ${story ? 72 : 54}px 'Baloo 2', 'Nunito', sans-serif`;
    c.fillText(level.title, centerX, story ? 985 : 692);

    const bw = W - 380;
    drawXpBar(centerX - bw / 2, story ? 1050 : 735, bw, story ? 34 : 26, story ? 34 : 26);

    if (story) {
      const cw = 340;
      const ch = 160;
      const xs = [centerX - cw - 12, centerX + 12];
      const ys = [1250, 1430];
      stats.forEach(([e, v, l], i) => {
        drawStatChip(c, xs[i % 2], ys[Math.floor(i / 2)], cw, ch, e, v, l);
      });
      c.fillStyle = GOLD;
      c.font = "700 36px 'Nunito', sans-serif";
      c.fillText("Cooked with amore 🇮🇹", centerX, 1750);
      c.font = "700 30px 'Nunito', sans-serif";
      c.fillStyle = INK_SOFT;
      c.fillText("souschef.app", centerX, 1800);
    } else {
      const cw = 212;
      const ch = 132;
      const gap = 18;
      let x0 = centerX - (cw * 4 + gap * 3) / 2;
      stats.forEach(([e, v, l]) => {
        drawStatChip(c, x0, 830, cw, ch, e, v, l);
        x0 += cw + gap;
      });
      c.fillStyle = GOLD;
      c.font = "700 28px 'Nunito', sans-serif";
      c.fillText("Cooked with amore 🇮🇹 · souschef.app", centerX, 1022);
    }
  }

  return canvas;
}

// ---------- output actions ----------

function cardBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png");
  });
}

export function downloadCard(canvas: HTMLCanvasElement, filename: string) {
  const a = document.createElement("a");
  a.download = filename;
  a.href = canvas.toDataURL("image/png");
  a.click();
}

/** Native share sheet (mobile → TikTok/X/Instagram directly). */
export async function shareCard(canvas: HTMLCanvasElement, filename: string): Promise<"shared" | "unsupported"> {
  if (!navigator.share) return "unsupported";
  const blob = await cardBlob(canvas);
  const file = new File([blob], filename, { type: "image/png" });
  const payload = { files: [file], title: "My Cook with Gio kitchen card" };
  if (navigator.canShare && !navigator.canShare(payload)) return "unsupported";
  try {
    await navigator.share(payload);
    return "shared";
  } catch {
    return "unsupported"; // user cancelled or share failed — caller falls back
  }
}

export async function copyCard(canvas: HTMLCanvasElement): Promise<boolean> {
  try {
    const blob = await cardBlob(canvas);
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    return true;
  } catch {
    return false;
  }
}
