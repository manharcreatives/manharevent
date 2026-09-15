import fs from "node:fs";
import path from "node:path";

/**
 * File-backed persistence for the mock store — cross-process sync (2026-09-15).
 *
 * `apps/web`, `apps/dashboard`, `apps/scanner` and `apps/marketing` are four
 * separate Next.js processes; each bundles its own copy of `packages/mock-data`
 * with its own `globalThis`-pinned in-memory store (see repo.ts's comment on
 * `MockStore`). Before this, an organizer approved on :3001 was invisible to a
 * login attempt on :3003 — two different processes' memory, never touching.
 *
 * This is still not a database: one JSON file, read on demand, written after
 * every mutation, no query engine, no transactions across unrelated writes.
 * It exists purely so the demo loop (register → approve → login → publish →
 * buy → scan) can be clicked through across all four dev servers without a
 * real backend. `packages/mock-data`'s public API (every exported function
 * signature) is unchanged — only where the data physically lives moved.
 *
 * FE-07 handoff: this whole file goes away — Supabase IS the shared store,
 * every process already reads/writes the same database.
 */

// All four apps run `next dev`/`next build`/`next start` with the app's own
// directory as cwd (`apps/web`, `apps/dashboard`, ...), one level under a
// common `apps/` at the repo root — so this resolves to the same absolute
// path regardless of which app is running it.
function resolveStorePath(): string {
  if (process.env.MOCK_DATA_STORE_PATH) return process.env.MOCK_DATA_STORE_PATH;
  return path.resolve(process.cwd(), "..", "..", "packages", "mock-data", ".data", "store.json");
}

const STORE_PATH = resolveStorePath();
const TMP_PATH = `${STORE_PATH}.tmp`;

/** Cheap in-process serialization for writes — JSON.stringify itself is sync
 * and fast at this data size, but queuing avoids two overlapping writes
 * (e.g. two mutations in the same request tick) interleaving their renames. */
let writeQueue: Promise<void> = Promise.resolve();

export function readStoreFile<T>(): { data: T; mtimeMs: number } | null {
  try {
    const stat = fs.statSync(STORE_PATH);
    const raw = fs.readFileSync(STORE_PATH, "utf8");
    return { data: JSON.parse(raw) as T, mtimeMs: stat.mtimeMs };
  } catch {
    return null;
  }
}

export function statStoreFile(): number | null {
  try {
    return fs.statSync(STORE_PATH).mtimeMs;
  } catch {
    return null;
  }
}

/** Atomic write: temp file + rename, so a reader never sees a half-written file. */
export function writeStoreFile(data: unknown): Promise<void> {
  writeQueue = writeQueue.then(() => {
    fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
    fs.writeFileSync(TMP_PATH, JSON.stringify(data), "utf8");
    fs.renameSync(TMP_PATH, STORE_PATH);
  });
  return writeQueue;
}
