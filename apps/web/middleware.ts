/**
 * Next resolves middleware from `src/middleware.ts` when a `src/` directory
 * exists, so this root copy is dead weight — it used to be a second, separately
 * maintained copy of the same next-intl middleware, which is how two versions
 * of the routing config drift apart. Re-exporting means both resolution orders
 * run identical code. Safe to delete this file outright.
 */
export { default, config } from "./src/middleware";
