/**
 * Realtime anti-passback stub — function signatures are final; bodies land in P-12.
 *
 * In P-12, this connects to Supabase Realtime to broadcast check-ins across
 * all gate devices so that a pass scanned at gate 1 shows "already_in" at gate 2
 * within ~5 seconds when both devices are online.
 */

export type RealtimeHandler = (passCode: string, direction: "in" | "out") => void;

/** Subscribes to cross-device check-in events for the event. Stub: no-op. */
export function subscribeToCheckIns(
  _eventId: string,
  _nightId: string,
  _onCheckin: RealtimeHandler
): () => void {
  // P-12: subscribe to supabase realtime channel `check_ins:${eventId}:${nightId}`
  return () => { /* unsubscribe */ };
}

/** Broadcasts a check-in to all other devices. Stub: no-op. */
export async function broadcastCheckIn(
  _eventId: string,
  _nightId: string,
  _passCode: string,
  _direction: "in" | "out"
): Promise<void> {
  // P-12: supabase.channel(...).send({ type: "broadcast", event: "checkin", payload: ... })
}
