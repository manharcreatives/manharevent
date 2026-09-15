import type { EventNight } from "@manhar-garba/domain";

/**
 * USR-52: the scanner used to boot with `night_id` hardcoded to "night-05"
 * forever — gate/zone already come from who signed in (scan/page.tsx), but
 * nothing derived which night it actually is. This matches today's IST date
 * against the event's real night dates.
 *
 * A rehearsal run outside the event's actual dates (the common case while
 * building/testing this) still needs *a* night to scan against, so when
 * there's no exact match this falls back to whichever night is calendar-
 * closest to today instead of getting stuck on a stale default.
 */
export function resolveActiveNight(nights: EventNight[]): EventNight | undefined {
  if (nights.length === 0) return undefined;

  const todayIST = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  const exact = nights.find((n) => n.date === todayIST);
  if (exact) return exact;

  const todayMs = new Date(`${todayIST}T00:00:00+05:30`).getTime();
  return [...nights].sort(
    (a, b) =>
      Math.abs(new Date(`${a.date}T00:00:00+05:30`).getTime() - todayMs) -
      Math.abs(new Date(`${b.date}T00:00:00+05:30`).getTime() - todayMs)
  )[0];
}
