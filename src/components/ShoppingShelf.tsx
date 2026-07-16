import type { ShoppingItem } from "../types";

interface Props {
  items: ShoppingItem[];
  onToggle: (id: string) => void;
  onClearDone: () => void;
  onClearAll: () => void;
  onCopy: () => void;
}

export default function ShoppingShelf({ items, onToggle, onClearDone, onClearAll, onCopy }: Props) {
  if (items.length === 0) return null;
  const open = items.filter((i) => !i.done).length;

  return (
    <section className="shelf clay">
      <div className="shelf-head">
        <h3 className="section-title">
          🛒 Shopping List{" "}
          <span style={{ fontSize: 13, color: "var(--ink-soft)", fontWeight: 700 }}>{open} to buy</span>
        </h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="chip" onClick={onCopy}>Copy 📋</button>
          <button className="chip" onClick={onClearDone}>Clear checked</button>
          <button className="chip" onClick={onClearAll}>Clear all</button>
        </div>
      </div>
      <div className="shopping-grid">
        {items.map((item) => (
          <button
            key={item.id}
            className={`shopping-item ${item.done ? "done" : ""}`}
            onClick={() => onToggle(item.id)}
          >
            <span className="shopping-check">{item.done ? "✓" : ""}</span>
            <span className="shopping-text">{item.text}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
