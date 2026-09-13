"use client";

import { useEffect, useState } from "react";

/**
 * True once the component has mounted on the client.
 *
 * The dashboard store persists to localStorage, which the server can't see —
 * so on the server it only knows the seeded event. Anything that decides
 * "this event doesn't exist" must wait for this, or refreshing the page of an
 * event you created a minute ago would render a 404 from the server.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
