import { useEffect, useState } from "react";
import type { GameState, LevelInfo, LeaderboardResult } from "../types";
import { loadChefName, saveChefName } from "../lib/profile";
import { fetchLeaderboard, submitToLeaderboard } from "../lib/leaderboard";

interface Props {
  game: GameState;
  level: LevelInfo;
  onClose: () => void;
}

export default function LeaderboardModal({ game, level, onClose }: Props) {
  const [name, setName] = useState(() => loadChefName());
  const [nameDraft, setNameDraft] = useState(name);
  const [result, setResult] = useState<LeaderboardResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreachable, setUnreachable] = useState(false);

  async function refresh(currentName: string) {
    setLoading(true);
    setUnreachable(false);
    if (currentName) {
      await submitToLeaderboard({
        name: currentName,
        xp: game.xp,
        level: level.level,
        cooked: game.cooked,
        badges: game.badges.length,
      });
    }
    const r = await fetchLeaderboard();
    if (r) setResult(r);
    else setUnreachable(true);
    setLoading(false);
  }

  useEffect(() => {
    void refresh(name);
    // one-shot on open — re-running this on every game/level change would spam the server
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleJoin() {
    saveChefName(nameDraft);
    const saved = loadChefName();
    setName(saved);
    if (saved) void refresh(saved);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal clay leaderboard-modal" onClick={(e) => e.stopPropagation()}>
        <h2>🥇 Kitchen Leaderboard</h2>
        <p>Anyone running SousChef on this network shows up here — challenge friends and family! 🏆</p>

        {!name && (
          <div className="leaderboard-name-prompt">
            <input
              className="query-input"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              placeholder="Pick a chef name to join…"
              maxLength={24}
              autoFocus
            />
            <button className="cook-btn" onClick={handleJoin}>Join</button>
          </div>
        )}

        {name && loading && <div className="share-loading">🏆 tallying scores…</div>}

        {name && !loading && unreachable && (
          <p className="empty-hint">Couldn't reach the kitchen leaderboard right now. Try again later.</p>
        )}

        {name && !loading && result && (
          <>
            <div className="leaderboard-you clay-pressed">
              <span>Your rank</span>
              <strong>{result.yourRank ? `#${result.yourRank} of ${result.total}` : "Not ranked yet"}</strong>
            </div>
            <div className="leaderboard-list">
              {result.entries.length === 0 && <p className="empty-hint">No chefs on the board yet — be the first!</p>}
              {result.entries.map((e, i) => (
                <div key={i} className={`leaderboard-row ${e.name === name ? "is-you" : ""}`}>
                  <span className="lb-rank">#{i + 1}</span>
                  <span className="lb-name">{e.name}{e.name === name ? " (you)" : ""}</span>
                  <span className="lb-level">Lv {e.level}</span>
                  <span className="lb-xp">{e.xp.toLocaleString()} XP</span>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="modal-actions">
          <button className="ghost-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
