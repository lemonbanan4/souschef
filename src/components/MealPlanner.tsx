import type { MealPlan } from "../types";

interface Props {
  plan: MealPlan | null;
  loading: boolean;
  demo: boolean;
  onPlan: () => void;
  onCookDay: (title: string, pitch: string) => void;
  onAddListToShopping: () => void;
}

export default function MealPlanner({ plan, loading, demo, onPlan, onCookDay, onAddListToShopping }: Props) {
  return (
    <section className="shelf clay">
      <div className="shelf-head">
        <h3 className="section-title">🗓️ Weekly Meal Plan {demo && plan && <span className="meta-pill" style={{ fontSize: 11 }}>🧪 demo</span>}</h3>
        <button className="ghost-btn" onClick={onPlan} disabled={loading}>
          {loading ? "Planning…" : plan ? "Replan my week 🔄" : "Plan my week ✨"}
        </button>
      </div>

      {!plan && !loading && (
        <p className="empty-hint">
          One click, five weeknight dinners tuned to your pantry and taste — plus a single consolidated shopping list.
        </p>
      )}

      {loading && (
        <div style={{ textAlign: "center", padding: "26px 0" }}>
          <span className="pan-bounce" style={{ fontSize: 40 }}>🗓️</span>
          <div className="loader-text">Sketching your week of dinners…</div>
        </div>
      )}

      {plan && !loading && (
        <>
          <div className="plan-grid">
            {plan.days.map((d) => (
              <div key={d.day} className="plan-card">
                <div className="plan-day">{d.day}</div>
                <div className="plan-emoji">{d.emoji}</div>
                <div className="plan-title">{d.title}</div>
                <div className="plan-meta">{d.cuisine} · {d.timeMinutes} min · {d.difficulty}</div>
                <div className="plan-pitch">{d.pitch}</div>
                <button className="chip plan-cook" onClick={() => onCookDay(d.title, d.pitch)}>Cook this 🍳</button>
              </div>
            ))}
          </div>
          <div className="plan-footer">
            <span className="chip-label">🛒 Week's groceries: {plan.shoppingList.length} items</span>
            <button className="chip" onClick={onAddListToShopping}>Add all to shopping list ➕</button>
          </div>
        </>
      )}
    </section>
  );
}
