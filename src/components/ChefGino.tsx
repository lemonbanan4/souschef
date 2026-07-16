import { useEffect, useRef, useState } from "react";
import { FRIENDSHIP_MAX, friendshipTier } from "../lib/friendship";
import { extractCatchphrase, speakCatchphrase } from "../lib/ginoVoice";

/**
 * Chef Gino 🇮🇹 — the app's claymorphic Italian chef mascot.
 * Hand-built SVG with moods, a wobbling mustache, a stirring spoon,
 * cosmetic outfits unlocked by friendship, and a speech bubble.
 */

export type GinoMood = "happy" | "cooking" | "excited" | "proud";

export const GINO_LINES = {
  greeting: [
    "Buongiorno! Chef Gino, at your service! 👨‍🍳",
    "Ah, benvenuto back in la cucina!",
    "Ciao! Che cuciniamo oggi, eh?",
  ],
  cooking: [
    "Sto creando… un capolavoro! 🎨",
    "Pazienza, pazienza… perfection takes a momento!",
    "Hmm… a pinch of this, a pinch of that…",
  ],
  served: [
    "Ecco qua! Made with amore! ❤️",
    "Delizioso! Just like nonna used to make!",
    "Perfetto! Now go — cook, mangia!",
  ],
  cooked: [
    "Bravissimo! *chef's kiss* 💋",
    "Magnifico! You cook like a true italiano!",
    "Sì, sì, sì! That is how it is done!",
  ],
  levelup: [
    "MAMMA MIA! You leveled up! 🎉",
    "Incredibile! Soon you take Gino's job, eh?",
  ],
  badge: [
    "Ooh, a shiny new badge! Fantastico! 🏆",
    "Che bello! Nonna would be so proud!",
  ],
  quest: ["Missione compiuta! Double XP, amico mio! 🎯"],
  error: [
    "Ahia! Something went wrong in la cucina…",
    "Porca miseria! Try again, sì?",
  ],
  tips: [
    "Psst… cook every day to keep the streak alive! 🔥",
    "Save your pantry once — Gino remembers, capisce?",
    "Rate your dishes! Gino never forgets a palate.",
    "The daily quest pays DOUBLE XP. Just saying…",
    "Cook mode keeps your screen awake. Molto pratico!",
    "Every 7 dishes, you earn a streak freeze. 🧊",
    "Snap a photo of your fridge — Gino will read the ingredients! 📸",
    "Try a Mystery Basket for bonus XP. Gino loves a challenge!",
    "Cook the same dish 3 times to master it. 🌟",
    "The more we cook together, the more Gino dresses up. 😎",
  ],
  friendshipUp: [
    "Gino likes you more and more! 🤝",
    "We are becoming true amici, no?",
  ],
} as const;

export type GinoCategory = keyof typeof GINO_LINES;

export function ginoLine(category: GinoCategory): string {
  const lines = GINO_LINES[category];
  return lines[Math.floor(Math.random() * lines.length)];
}

export interface GinoMessage {
  text: string;
  id: number;
}

interface Props {
  mood: GinoMood;
  message: GinoMessage | null;
  friendship: number;
  activeEventId?: string | null;
  onPoke: () => void;
}

const EVENT_ACCESSORY: Record<string, string> = {
  "summer-grill": "🔥",
  harvest: "🍂",
  "winter-feast": "❄️",
  "amore-week": "💘",
};

export default function ChefGino({ mood, message, friendship, activeEventId, onPoke }: Props) {
  const [visibleLine, setVisibleLine] = useState<string | null>(null);
  const hideTimer = useRef<number | null>(null);
  const tier = friendshipTier(friendship);
  const eventAccessory = activeEventId ? EVENT_ACCESSORY[activeEventId] : null;

  useEffect(() => {
    if (!message) return;
    setVisibleLine(message.text);
    const phrase = extractCatchphrase(message.text);
    if (phrase) speakCatchphrase(phrase);
    if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setVisibleLine(null), 6000);
    return () => {
      if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);
    };
  }, [message]);

  const eyes = (() => {
    switch (mood) {
      case "excited":
        return (
          <>
            <circle cx="82" cy="88" r="7" fill="#3d3117" />
            <circle cx="118" cy="88" r="7" fill="#3d3117" />
            <circle cx="84.5" cy="85.5" r="2.4" fill="#fff" />
            <circle cx="120.5" cy="85.5" r="2.4" fill="#fff" />
          </>
        );
      case "proud":
        return (
          <>
            <path d="M74 88 Q82 80 90 88" stroke="#3d3117" strokeWidth="4.5" fill="none" strokeLinecap="round" />
            <path d="M110 88 Q118 80 126 88" stroke="#3d3117" strokeWidth="4.5" fill="none" strokeLinecap="round" />
          </>
        );
      case "cooking":
        return (
          <>
            <circle cx="82" cy="86" r="5.5" fill="#3d3117" />
            <circle cx="118" cy="86" r="5.5" fill="#3d3117" />
            <circle cx="84" cy="83.5" r="1.8" fill="#fff" />
            <circle cx="120" cy="83.5" r="1.8" fill="#fff" />
          </>
        );
      default:
        return (
          <>
            <circle cx="82" cy="88" r="5.5" fill="#3d3117" />
            <circle cx="118" cy="88" r="5.5" fill="#3d3117" />
            <circle cx="84" cy="85.5" r="1.8" fill="#fff" />
            <circle cx="120" cy="85.5" r="1.8" fill="#fff" />
          </>
        );
    }
  })();

  const brows = mood === "excited" || mood === "cooking" ? (
    <>
      <path d="M73 74 Q82 69 91 73" stroke="#8a6a4a" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M109 73 Q118 69 127 74" stroke="#8a6a4a" strokeWidth="4" fill="none" strokeLinecap="round" />
    </>
  ) : (
    <>
      <path d="M73 77 Q82 73 91 77" stroke="#8a6a4a" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M109 77 Q118 73 127 77" stroke="#8a6a4a" strokeWidth="4" fill="none" strokeLinecap="round" />
    </>
  );

  const mouth = (() => {
    switch (mood) {
      case "excited":
        return <ellipse cx="100" cy="116" rx="10" ry="7.5" fill="#8c3b2e" />;
      case "cooking":
        return <circle cx="100" cy="116" r="4.5" fill="#8c3b2e" />;
      default:
        return <path d="M89 113 Q100 122 111 113" stroke="#8c3b2e" strokeWidth="4.5" fill="none" strokeLinecap="round" />;
    }
  })();

  const hasShades = tier.outfit === "shades" || tier.outfit === "legend";
  const hasMedal = tier.outfit === "medal" || tier.outfit === "legend";
  const isLegend = tier.outfit === "legend";

  return (
    <div className={`gino-dock ${visibleLine ? "" : "gino-idle"}`}>
      {visibleLine && (
        <div className="gino-bubble clay" onClick={() => setVisibleLine(null)}>
          {visibleLine}
        </div>
      )}
      <button
        className={`gino gino-${mood}`}
        onClick={onPoke}
        title={`Chef Gino — ${tier.name} (${friendship}/${FRIENDSHIP_MAX} friendship). Click for a tip!`}
        aria-label="Chef Gino, click for a cooking tip"
      >
        {mood === "proud" && (
          <>
            <span className="gino-spark s1">✨</span>
            <span className="gino-spark s2">✨</span>
            <span className="gino-spark s3">⭐</span>
          </>
        )}
        {mood === "cooking" && (
          <>
            <span className="gino-steam st1">〜</span>
            <span className="gino-steam st2">〜</span>
          </>
        )}
        <svg viewBox="0 0 200 230" width="132" height="152" role="img" aria-hidden="true">
          <defs>
            <linearGradient id="gHat" x1="0" y1="0" x2="0.6" y2="1">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="1" stopColor="#f0e8d6" />
            </linearGradient>
            <linearGradient id="gSkin" x1="0" y1="0" x2="0.5" y2="1">
              <stop offset="0" stopColor="#ffe9cc" />
              <stop offset="1" stopColor="#f7cfa1" />
            </linearGradient>
            <linearGradient id="gJacket" x1="0" y1="0" x2="0.5" y2="1">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="1" stopColor="#ece4d2" />
            </linearGradient>
            <linearGradient id="gBand" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#ffdd66" />
              <stop offset="1" stopColor="#ffbe0b" />
            </linearGradient>
          </defs>

          {/* body / jacket */}
          <path d="M52 228 Q50 168 100 164 Q150 168 148 228 Z" fill="url(#gJacket)" />
          <path d="M52 228 Q50 168 100 164 Q150 168 148 228 Z" fill="none" stroke="#d9cdb4" strokeWidth="2" opacity="0.6" />
          {/* buttons */}
          <circle cx="88" cy="192" r="4.5" fill="#ffbe0b" />
          <circle cx="88" cy="210" r="4.5" fill="#ffbe0b" />
          <circle cx="112" cy="192" r="4.5" fill="#ffbe0b" />
          <circle cx="112" cy="210" r="4.5" fill="#ffbe0b" />

          {/* neckerchief — Italian tricolore */}
          <path d="M78 165 L100 184 L122 165 Q111 158 100 158 Q89 158 78 165 Z" fill="#3f9b4f" />
          <path d="M85 170 L100 184 L115 170 Q108 163 100 163 Q92 163 85 170 Z" fill="#fff" />
          <path d="M92 175 L100 184 L108 175 Q104 170 100 170 Q96 170 92 175 Z" fill="#d64545" />

          {/* friendship outfit: medal pinned to the jacket */}
          {hasMedal && (
            <g className="gino-medal">
              <path d="M118 178 L127 195 L109 195 Z" fill="#3f9b4f" opacity="0.9" />
              <path d="M112 178 L121 197 L103 195 Z" fill="#d64545" opacity="0.85" />
              <circle cx="115" cy="200" r="9.5" fill="url(#gBand)" stroke="#b8860b" strokeWidth="1.5" />
              <circle cx="115" cy="200" r="4" fill="#fff8e0" />
            </g>
          )}

          {/* left arm holding spoon (stirs while cooking) */}
          <g className="gino-arm">
            <path d="M58 185 Q34 176 30 150" stroke="url(#gJacket)" strokeWidth="17" fill="none" strokeLinecap="round" />
            <circle cx="30" cy="147" r="10" fill="url(#gSkin)" />
            <g className="gino-spoon">
              <rect x="26.5" y="98" width="7" height="52" rx="3.5" fill="#b0793f" />
              <ellipse cx="30" cy="94" rx="11" ry="13" fill="#c98d4e" />
              <ellipse cx="30" cy="92" rx="6.5" ry="8" fill="#a76e35" opacity="0.55" />
            </g>
          </g>
          {/* right arm on hip */}
          <path d="M142 185 Q166 176 164 154" stroke="url(#gJacket)" strokeWidth="17" fill="none" strokeLinecap="round" />
          <circle cx="163" cy="152" r="10" fill="url(#gSkin)" />

          {/* head */}
          <ellipse cx="100" cy="98" rx="46" ry="42" fill="url(#gSkin)" />
          {/* ears */}
          <circle cx="55" cy="100" r="8" fill="#f7cfa1" />
          <circle cx="145" cy="100" r="8" fill="#f7cfa1" />
          {/* cheeks */}
          <circle cx="70" cy="103" r="8" fill="#ffb3a1" opacity="0.55" />
          <circle cx="130" cy="103" r="8" fill="#ffb3a1" opacity="0.55" />

          {brows}
          {eyes}

          {/* friendship outfit: sunglasses (covers the eyes) */}
          {hasShades && (
            <g className="gino-shades">
              <rect x="69" y="81" width="27" height="15" rx="7.5" fill="#2b2b2b" />
              <rect x="104" y="81" width="27" height="15" rx="7.5" fill="#2b2b2b" />
              <rect x="96" y="85" width="8" height="4" rx="2" fill="#2b2b2b" />
              <rect x="72" y="83.5" width="9" height="4.5" rx="2.2" fill="#ffffff" opacity="0.35" />
              <rect x="107" y="83.5" width="9" height="4.5" rx="2.2" fill="#ffffff" opacity="0.35" />
            </g>
          )}

          {/* big Italian nose */}
          <ellipse cx="100" cy="101" rx="9.5" ry="12" fill="#f2b585" />
          <ellipse cx="97" cy="98" rx="3" ry="4" fill="#ffd9b3" opacity="0.7" />

          {/* mustache — the pride of the family */}
          <g className="gino-mustache">
            <path d="M100 108 Q80 104 68 111 Q60 116 64 122 Q72 128 84 124 Q95 120 100 112 Z" fill="#6b4a2f" />
            <path d="M100 108 Q120 104 132 111 Q140 116 136 122 Q128 128 116 124 Q105 120 100 112 Z" fill="#6b4a2f" />
            <path d="M100 108 Q84 105 72 111 Q78 114 88 113 Q96 111 100 110 Z" fill="#7d5a3c" opacity="0.8" />
            <path d="M100 108 Q116 105 128 111 Q122 114 112 113 Q104 111 100 110 Z" fill="#7d5a3c" opacity="0.8" />
          </g>

          {mouth}

          {/* toque (chef hat) */}
          <g className="gino-hat">
            <rect x="66" y="46" width="68" height="18" rx="9" fill="url(#gBand)" />
            <path d="M66 52 Q58 20 82 16 Q88 2 106 6 Q124 0 130 16 Q148 22 134 52 Z" fill="url(#gHat)" />
            <circle cx="80" cy="26" r="13" fill="#fff" />
            <circle cx="103" cy="18" r="15" fill="#fff" />
            <circle cx="124" cy="27" r="12" fill="#fff" />
            {/* tricolore pin on the band */}
            <rect x="92" y="50" width="5" height="10" rx="2" fill="#3f9b4f" />
            <rect x="97.5" y="50" width="5" height="10" rx="2" fill="#ffffff" />
            <rect x="103" y="50" width="5" height="10" rx="2" fill="#d64545" />
          </g>

          {/* legend tier: a little extra sparkle around the hat */}
          {isLegend && (
            <g className="gino-legend-sparkle">
              <text x="142" y="18" fontSize="16">✨</text>
              <text x="44" y="24" fontSize="14">✨</text>
            </g>
          )}

          {/* seasonal event accessory — a small badge for whichever event is live */}
          {eventAccessory && (
            <text x="152" y="45" fontSize="22" className="gino-event-accessory">{eventAccessory}</text>
          )}
        </svg>
      </button>
      <div
        className="gino-friendship"
        title={`Friendship with Gino: ${friendship}/${FRIENDSHIP_MAX} — ${tier.name}`}
      >
        <div className="gino-friendship-bar">
          <div
            className="gino-friendship-fill"
            style={{ width: `${Math.min(100, (friendship / FRIENDSHIP_MAX) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
