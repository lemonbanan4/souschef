import type { SeasonalEvent } from "../types";

/** Limited-time seasonal events — cook anything while one is live to earn its badge. */

export interface EventDef extends SeasonalEvent {
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
}

const EVENTS: EventDef[] = [
  {
    id: "summer-grill",
    name: "Summer Grilling Fest",
    emoji: "🔥",
    badgeName: "Grill Master",
    badgeDescription: "Cooked during Summer Grilling Fest",
    startMonth: 7,
    startDay: 1,
    endMonth: 7,
    endDay: 31,
  },
  {
    id: "harvest",
    name: "Autumn Harvest",
    emoji: "🍂",
    badgeName: "Harvest Hero",
    badgeDescription: "Cooked during Autumn Harvest",
    startMonth: 9,
    startDay: 15,
    endMonth: 10,
    endDay: 15,
  },
  {
    id: "winter-feast",
    name: "Winter Feast",
    emoji: "❄️",
    badgeName: "Feast Champion",
    badgeDescription: "Cooked during Winter Feast",
    startMonth: 12,
    startDay: 15,
    endMonth: 1,
    endDay: 5,
  },
  {
    id: "amore-week",
    name: "Amore Week",
    emoji: "💘",
    badgeName: "Amore Chef",
    badgeDescription: "Cooked during Amore Week",
    startMonth: 2,
    startDay: 10,
    endMonth: 2,
    endDay: 16,
  },
];

function inRange(month: number, day: number, def: EventDef): boolean {
  const cur = month * 100 + day;
  const start = def.startMonth * 100 + def.startDay;
  const end = def.endMonth * 100 + def.endDay;
  if (start <= end) return cur >= start && cur <= end;
  return cur >= start || cur <= end; // wraps the new year (e.g. Winter Feast)
}

export function currentEvent(): EventDef | null {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  return EVENTS.find((e) => inRange(month, day, e)) ?? null;
}

export function allEvents(): EventDef[] {
  return EVENTS;
}
