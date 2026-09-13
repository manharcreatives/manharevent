/**
 * Cross-device anti-passback.
 *
 * ## What this actually does now
 *
 * `BroadcastChannel`, scoped to `${eventId}:${nightId}`. That is genuinely
 * useful and genuinely limited: every scanner context on *this device* — a
 * second tab, the installed PWA alongside the browser, the manual screen in
 * another window — now sees each other's admits within a tick, so a pass cannot
 * be walked from one open scanner window to another on the same phone.
 *
 * ## What it cannot do without a server
 *
 * Two *different* phones, both offline, cannot see each other at all. There is
 * no transport between them. This is the real limit of the offline promise and
 * it is a product decision, not a bug: the gate keeps working with no network,
 * and the price is that the same pass can admit once per offline device until
 * the rows meet on the server. P-12 keeps this exact signature and swaps the
 * channel for a Supabase Realtime channel, which closes the gap whenever the
 * devices happen to be online — and the server's unique constraint on
 * (pass_id, night_id, admit_index) closes it permanently on sync.
 */

export interface CheckInEvent {
  passCode: string;
  direction: "in" | "out";
  /** Which device claimed it — so a subscriber can ignore its own echo. */
  deviceId: string;
  at: string;
}

export type RealtimeHandler = (event: CheckInEvent) => void;

function channelName(eventId: string, nightId: string): string {
  return `manhar-checkins:${eventId}:${nightId}`;
}

function openChannel(eventId: string, nightId: string): BroadcastChannel | null {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return null;
  try {
    return new BroadcastChannel(channelName(eventId, nightId));
  } catch {
    return null;
  }
}

/** Subscribes to check-in events for this event + night. Returns an unsubscribe. */
export function subscribeToCheckIns(
  eventId: string,
  nightId: string,
  onCheckin: RealtimeHandler
): () => void {
  const channel = openChannel(eventId, nightId);
  if (!channel) return () => undefined;

  const listener = (message: MessageEvent<CheckInEvent>) => {
    const payload = message.data;
    if (!payload || typeof payload.passCode !== "string") return;
    onCheckin(payload);
  };

  channel.addEventListener("message", listener);
  return () => {
    channel.removeEventListener("message", listener);
    channel.close();
  };
}

/** Broadcasts a check-in to every other scanner context that can hear it. */
export async function broadcastCheckIn(
  eventId: string,
  nightId: string,
  passCode: string,
  direction: "in" | "out",
  deviceId: string
): Promise<void> {
  const channel = openChannel(eventId, nightId);
  if (!channel) return;
  try {
    channel.postMessage({ passCode, direction, deviceId, at: new Date().toISOString() });
  } finally {
    channel.close();
  }
}
