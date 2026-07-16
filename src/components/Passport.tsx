interface Props {
  cookedCuisines: string[];
}

const WORLD: { name: string; emoji: string; aliases?: string[] }[] = [
  { name: "Italian", emoji: "🇮🇹" },
  { name: "French", emoji: "🇫🇷" },
  { name: "Spanish", emoji: "🇪🇸" },
  { name: "Greek", emoji: "🇬🇷" },
  { name: "Chinese", emoji: "🇨🇳", aliases: ["sichuan", "cantonese"] },
  { name: "Japanese", emoji: "🇯🇵" },
  { name: "Korean", emoji: "🇰🇷" },
  { name: "Thai", emoji: "🇹🇭" },
  { name: "Vietnamese", emoji: "🇻🇳" },
  { name: "Indian", emoji: "🇮🇳" },
  { name: "Mexican", emoji: "🇲🇽" },
  { name: "Middle Eastern", emoji: "🧆", aliases: ["lebanese", "turkish", "israeli", "persian"] },
  { name: "American", emoji: "🇺🇸" },
  { name: "Moroccan", emoji: "🇲🇦" },
  { name: "Peruvian", emoji: "🇵🇪" },
  { name: "Fusion", emoji: "🌈" },
];

export default function Passport({ cookedCuisines }: Props) {
  const cooked = cookedCuisines.map((c) => c.toLowerCase());
  const isStamped = (entry: (typeof WORLD)[number]) =>
    cooked.includes(entry.name.toLowerCase()) || (entry.aliases ?? []).some((a) => cooked.includes(a));

  const stampedCount = WORLD.filter(isStamped).length;
  const extras = cooked.filter(
    (c) => !WORLD.some((w) => w.name.toLowerCase() === c || (w.aliases ?? []).includes(c)),
  );

  return (
    <section className="shelf clay">
      <h3 className="section-title">
        🛂 Cuisine Passport{" "}
        <span style={{ fontSize: 13, color: "var(--ink-soft)", fontWeight: 700 }}>
          {stampedCount + extras.length} stamps
        </span>
      </h3>
      <div className="passport-grid">
        {WORLD.map((entry) => {
          const stamped = isStamped(entry);
          return (
            <div key={entry.name} className={`stamp ${stamped ? "stamped" : ""}`} title={entry.name}>
              <div className="stamp-emoji">{entry.emoji}</div>
              <div className="stamp-name">{entry.name}</div>
              {stamped && <div className="stamp-mark">✓</div>}
            </div>
          );
        })}
        {extras.map((c) => (
          <div key={c} className="stamp stamped" title={c}>
            <div className="stamp-emoji">🍴</div>
            <div className="stamp-name">{c}</div>
            <div className="stamp-mark">✓</div>
          </div>
        ))}
      </div>
      {stampedCount + extras.length === 0 && (
        <p className="empty-hint">Every cuisine you cook gets a stamp. Collect them all!</p>
      )}
    </section>
  );
}
