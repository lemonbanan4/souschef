import { useMemo, useState } from "react";

interface Props {
  cookedDates: Set<string>;
}

interface Cell {
  day: number | null;
  key: string | null;
}

function dateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const DOW = ["S", "M", "T", "W", "T", "F", "S"];

export default function StreakCalendar({ cookedDates }: Props) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();
  const todayKey = dateKey(today.getFullYear(), today.getMonth(), today.getDate());

  const cells = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const list: Cell[] = [];
    for (let i = 0; i < startWeekday; i++) list.push({ day: null, key: null });
    for (let d = 1; d <= daysInMonth; d++) list.push({ day: d, key: dateKey(viewYear, viewMonth, d) });
    while (list.length % 7 !== 0) list.push({ day: null, key: null });
    return list;
  }, [viewYear, viewMonth]);

  const cookedCount = cells.filter((c) => c.key && cookedDates.has(c.key)).length;

  function goPrev() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function goNext() {
    if (isCurrentMonth) return;
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <div className="cal">
      <div className="cal-head">
        <button className="icon-btn cal-nav" onClick={goPrev} aria-label="Previous month">‹</button>
        <span className="cal-month">{monthLabel}</span>
        <button className="icon-btn cal-nav" onClick={goNext} disabled={isCurrentMonth} aria-label="Next month">›</button>
      </div>
      <div className="cal-dow">
        {DOW.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="cal-grid">
        {cells.map((cell, i) => (
          <div
            key={i}
            className={`cal-cell ${cell.day === null ? "empty" : ""} ${cell.key && cookedDates.has(cell.key) ? "cooked" : ""} ${cell.key === todayKey ? "today" : ""}`}
          >
            {cell.day ?? ""}
          </div>
        ))}
      </div>
      <p className="profile-hint" style={{ marginBottom: 0 }}>
        🔥 {cookedCount} cooked day{cookedCount === 1 ? "" : "s"} this month
      </p>
    </div>
  );
}
