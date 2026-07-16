import type { LevelInfo } from "../types";

interface Props {
  level: LevelInfo;
  onClose: () => void;
}

export default function LevelUpOverlay({ level, onClose }: Props) {
  return (
    <div className="levelup-overlay" onClick={onClose}>
      <div className="levelup clay-yellow" onClick={(e) => e.stopPropagation()}>
        <div className="levelup-burst">🎉</div>
        <div className="levelup-kicker">LEVEL UP!</div>
        <div className="levelup-rank">Lv {level.level}</div>
        <div className="levelup-title">{level.title}</div>
        <p className="levelup-sub">
          {level.nextXp
            ? `Next rank at ${level.nextXp.toLocaleString()} XP — keep cooking!`
            : "You've reached the top of the kitchen. Incredibile!"}
        </p>
        <button className="cook-btn" onClick={onClose}>Grazie, Gio! 🙌</button>
      </div>
    </div>
  );
}
