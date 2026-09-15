/**
 * Browser stand-in for storage.ts (package.json's `browser` field remaps to
 * this file when webpack bundles for a client — e.g. apps/scanner, which
 * legitimately calls some repo.ts read functions straight from the browser
 * for its offline-first manifest sync, same as it always has).
 *
 * A browser tab was never going to read/write the shared JSON file anyway —
 * cross-process sync is a server-side, Node-process concern. Every consumer
 * here just falls back to whatever `createStore()` seeded from fixtures,
 * exactly the in-memory-only behaviour this package had before file
 * persistence existed.
 */

export function readStoreFile<T>(): { data: T; mtimeMs: number } | null {
  return null;
}

export function statStoreFile(): number | null {
  return null;
}

export function writeStoreFile(): Promise<void> {
  return Promise.resolve();
}
