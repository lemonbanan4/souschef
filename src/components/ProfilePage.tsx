import { useMemo, useState } from "react";
import type { DietGoalType, GameState, LevelInfo } from "../types";
import { BADGES } from "../lib/game";
import { MASTERY_THRESHOLD, loadAllMasteries } from "../lib/mastery";
import { VERDICTS, loadRatings } from "../lib/taste";
import { FRIENDSHIP_MAX, friendshipTier, nextFriendshipTier } from "../lib/friendship";
import { loadChefName, saveChefName } from "../lib/profile";
import { GOAL_DEFAULTS, clearDietGoal, loadDietGoal, setGoalType, updateGoalTargets } from "../lib/goals";
import { getTodayNutrition } from "../lib/nutritionLog";
import { loadCookDates } from "../lib/cookCalendar";
import StreakCalendar from "./StreakCalendar";

interface Props {
  game: GameState;
  level: LevelInfo;
  onClose: () => void;
  onShare: () => void;
  onGoalChange: () => void;
}

const OUTFIT_LABEL: Record<string, string> = {
  shades: "sunglasses 😎",
  medal: "a medal 🎖️",
  legend: "legend status ✨",
};

export default function ProfilePage({ game, level, onClose, onShare, onGoalChange }: Props) {
  const [name, setName] = useState(() => loadChefName());
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(name);
  const [goal, setGoal] = useState(() => loadDietGoal());
  const [editingGoal, setEditingGoal] = useState(false);
  const [calorieDraft, setCalorieDraft] = useState(goal?.calorieTarget ?? 2200);
  const [proteinDraft, setProteinDraft] = useState(goal?.proteinTarget ?? 110);
  const todayNutrition = useMemo(() => getTodayNutrition(), []);
  const cookedDates = useMemo(() => loadCookDates(), []);

  const tier = friendshipTier(game.ginoFriendship);
  const next = nextFriendshipTier(game.ginoFriendship);
  const masteries = useMemo(
    () => Object.entries(loadAllMasteries()).sort((a, b) => b[1] - a[1]),
    // recomputed each time the profile opens — mastery lives outside React state
    [],
  );
  const ratings = useMemo(() => loadRatings(), []);
  const verdictCounts = useMemo(
    () => VERDICTS.map((v) => ({ ...v, count: ratings.filter((r) => r.verdict === v.id).length })).filter((v) => v.count > 0),
    [ratings],
  );

  function saveName() {
    saveChefName(nameDraft);
    setName(loadChefName());
    setEditingName(false);
  }

  function pickGoal(type: DietGoalType) {
    const g = setGoalType(type);
    setGoal(g);
    setCalorieDraft(g.calorieTarget);
    setProteinDraft(g.proteinTarget);
    onGoalChange();
  }

  function saveGoalTargets() {
    const g = updateGoalTargets(calorieDraft, proteinDraft);
    setGoal(g);
    setEditingGoal(false);
    onGoalChange();
  }

  function removeGoal() {
    clearDietGoal();
    setGoal(null);
    setEditingGoal(false);
    onGoalChange();
  }

  return (
    <div className="profile-overlay" onClick={onClose}>
      <div className="profile-page clay" onClick={(e) => e.stopPropagation()}>
        <div className="profile-top">
          <h2 style={{ margin: 0 }}>👤 My Profile</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close profile">✕</button>
        </div>

        <div className="profile-hero">
          <div className="profile-avatar">🧑‍🍳</div>
          {editingName ? (
            <div className="profile-name-edit">
              <input
                className="query-input"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveName()}
                placeholder="Your chef name…"
                maxLength={24}
                autoFocus
              />
              <button className="chip" onClick={saveName}>Save</button>
            </div>
          ) : (
            <button className="profile-name" onClick={() => { setNameDraft(name); setEditingName(true); }}>
              {name || "Add your chef name"} <span className="edit-hint">✏️</span>
            </button>
          )}
          <div className="profile-level">Lv {level.level} · {level.title}</div>
          <div className="xp-bar profile-xp-bar">
            <div className="xp-fill" style={{ width: `${Math.max(4, level.progress * 100)}%` }} />
          </div>
          <div className="profile-xp-label">{game.xp}{level.nextXp ? ` / ${level.nextXp}` : ""} XP</div>
        </div>

        <div className="profile-stats-grid">
          <div className="profile-stat"><div className="ps-num">{game.cooked}</div><div className="ps-label">🍽️ cooked</div></div>
          <div className="profile-stat"><div className="ps-num">{game.streak}</div><div className="ps-label">🔥 streak</div></div>
          <div className="profile-stat"><div className="ps-num">{game.cuisines.length}</div><div className="ps-label">🌍 cuisines</div></div>
          <div className="profile-stat"><div className="ps-num">{game.badges.length}/{BADGES.length}</div><div className="ps-label">🏆 badges</div></div>
          <div className="profile-stat"><div className="ps-num">{game.masteredDishes}</div><div className="ps-label">🌟 mastered</div></div>
          <div className="profile-stat"><div className="ps-num">{game.freezes}</div><div className="ps-label">🧊 freezes</div></div>
        </div>

        <div className="profile-section">
          <h3 className="section-title">📅 Cooking Calendar</h3>
          <StreakCalendar cookedDates={cookedDates} />
        </div>

        <div className="profile-section">
          <h3 className="section-title">🤝 Gino Friendship</h3>
          <div className="friendship-detail">
            <div className="gino-friendship-bar profile-friendship-bar">
              <div className="gino-friendship-fill" style={{ width: `${Math.min(100, (game.ginoFriendship / FRIENDSHIP_MAX) * 100)}%` }} />
            </div>
            <span className="chip-label">{game.ginoFriendship}/{FRIENDSHIP_MAX}</span>
          </div>
          <p className="profile-hint">
            {tier.name}
            {next
              ? ` — ${next.min - game.ginoFriendship} more friendship to unlock ${OUTFIT_LABEL[next.outfit] ?? next.outfit}`
              : " — max friendship reached! Gino considers you famiglia. 🎉"}
          </p>
        </div>

        <div className="profile-section">
          <h3 className="section-title">🎯 Diet Goal</h3>
          {!goal ? (
            <>
              <p className="profile-hint" style={{ marginTop: 0, marginBottom: 10 }}>
                Pick a goal and Gino will track your cooked calories against it — and lean recipe suggestions that way too.
              </p>
              <div className="goal-type-row">
                {(Object.keys(GOAL_DEFAULTS) as DietGoalType[]).map((t) => (
                  <button key={t} className="goal-type-btn" onClick={() => pickGoal(t)}>
                    <span className="goal-emoji">{GOAL_DEFAULTS[t].emoji}</span>
                    <span className="goal-label">{GOAL_DEFAULTS[t].label}</span>
                    <span className="goal-blurb">{GOAL_DEFAULTS[t].blurb}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="goal-current">
                <span className="chip active">{GOAL_DEFAULTS[goal.type].emoji} {GOAL_DEFAULTS[goal.type].label}</span>
                <button className="chip" onClick={() => setEditingGoal((v) => !v)}>{editingGoal ? "Cancel" : "Edit targets"}</button>
                <button className="chip" onClick={removeGoal}>Clear goal</button>
              </div>

              {editingGoal ? (
                <div className="goal-edit-row">
                  <label className="goal-field">
                    Calories/day
                    <input type="number" value={calorieDraft} onChange={(e) => setCalorieDraft(Number(e.target.value))} />
                  </label>
                  <label className="goal-field">
                    Protein (g)/day
                    <input type="number" value={proteinDraft} onChange={(e) => setProteinDraft(Number(e.target.value))} />
                  </label>
                  <button className="chip" onClick={saveGoalTargets}>Save</button>
                </div>
              ) : (
                <>
                  <div className="goal-progress">
                    <div className="goal-progress-row">
                      <span className="goal-progress-label">🔥 {todayNutrition.calories} / {goal.calorieTarget} kcal</span>
                      <div className="quota-bar"><div className="quota-fill" style={{ width: `${Math.min(100, (todayNutrition.calories / goal.calorieTarget) * 100)}%` }} /></div>
                    </div>
                    <div className="goal-progress-row">
                      <span className="goal-progress-label">🥩 {todayNutrition.protein} / {goal.proteinTarget} g protein</span>
                      <div className="quota-bar"><div className="quota-fill" style={{ width: `${Math.min(100, (todayNutrition.protein / goal.proteinTarget) * 100)}%` }} /></div>
                    </div>
                  </div>
                  <p className="profile-hint">Based on what you've cooked today (one serving per dish).</p>
                </>
              )}
            </>
          )}
        </div>

        <div className="profile-section">
          <h3 className="section-title">👅 Taste Profile</h3>
          {verdictCounts.length === 0 ? (
            <p className="empty-hint">Rate a few dishes after cooking and Gino will learn your palate.</p>
          ) : (
            <div className="chip-row" style={{ marginTop: 0 }}>
              {verdictCounts.map((v) => (
                <span key={v.id} className="chip">{v.emoji} {v.label}: {v.count}</span>
              ))}
            </div>
          )}
        </div>

        <div className="profile-section">
          <h3 className="section-title">🌟 Recipe Mastery</h3>
          {masteries.length === 0 ? (
            <p className="empty-hint">Cook the same dish 3 times to master it.</p>
          ) : (
            <div className="mastery-list">
              {masteries.slice(0, 10).map(([title, count]) => (
                <div key={title} className="mastery-row-item">
                  <span className="mastery-row-title">{title}</span>
                  <span className="mastery-row-stars">
                    {count >= MASTERY_THRESHOLD ? "🌟 Mastered" : "⭐".repeat(count) + "☆".repeat(MASTERY_THRESHOLD - count)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button className="cook-btn profile-share-btn" onClick={onShare}>Share my chef card 📤</button>
      </div>
    </div>
  );
}
