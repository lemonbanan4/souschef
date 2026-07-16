/**
 * Scale a human ingredient amount ("200 g", "1 1/2 tbsp", "1 can") by a factor.
 * Amounts without a leading number ("to taste", "plenty") pass through unchanged.
 */

function formatQty(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  const whole = Math.floor(rounded);
  const frac = rounded - whole;
  const NICE: [number, string][] = [
    [0.25, "1/4"],
    [0.33, "1/3"],
    [0.5, "1/2"],
    [0.66, "2/3"],
    [0.75, "3/4"],
  ];
  for (const [v, label] of NICE) {
    if (Math.abs(frac - v) < 0.05) return whole > 0 ? `${whole} ${label}` : label;
  }
  if (Math.abs(frac) < 0.05) return String(whole);
  return String(rounded);
}

export function scaleAmount(amount: string, factor: number): string {
  if (factor === 1) return amount;
  const m = amount.match(/^\s*(\d+(?:[.,]\d+)?)(?:\s+(\d+)\/(\d+))?|^\s*(\d+)\/(\d+)/);
  if (!m) return amount;

  let value: number;
  let matchedLen: number;
  if (m[4] && m[5]) {
    // bare fraction like "1/2"
    value = parseInt(m[4]) / parseInt(m[5]);
    matchedLen = m[0].length;
  } else {
    value = parseFloat(m[1].replace(",", "."));
    if (m[2] && m[3]) value += parseInt(m[2]) / parseInt(m[3]); // "1 1/2"
    matchedLen = m[0].length;
  }
  const rest = amount.slice(matchedLen);
  return `${formatQty(value * factor)}${rest}`;
}
