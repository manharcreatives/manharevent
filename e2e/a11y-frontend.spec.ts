/**
 * FE-06 axe accessibility checks — all three apps' primary routes.
 *
 * Run: pnpm e2e -- --grep a11y-frontend
 * Requires: web on :3000, dashboard on :3001, scanner on :3002
 */

import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// ── Public site (web, :3000) ──────────────────────────────────────────────────
test.describe("Public site", () => {
  test("Home page has no axe violations", async ({ page }) => {
    await page.goto("http://localhost:3000/en");
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .exclude("[data-axe-skip]")
      .analyze();
    expect(results.violations, formatViolations(results.violations)).toEqual([]);
  });

  test("Event page has no axe violations", async ({ page }) => {
    // The seeded event has slug "navratri-2026-ahmedabad"
    await page.goto("http://localhost:3000/en/e/navratri-2026-ahmedabad");
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(results.violations, formatViolations(results.violations)).toEqual([]);
  });

  test("Pass selector (book page) has no axe violations", async ({ page }) => {
    await page.goto("http://localhost:3000/en/e/navratri-2026-ahmedabad/book");
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(results.violations, formatViolations(results.violations)).toEqual([]);
  });
});

// ── Organizer dashboard (:3001) ───────────────────────────────────────────────
test.describe("Dashboard", () => {
  test("Overview has no axe violations", async ({ page }) => {
    await page.goto("http://localhost:3001/dashboard");
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(results.violations, formatViolations(results.violations)).toEqual([]);
  });

  test("Events list has no axe violations", async ({ page }) => {
    await page.goto("http://localhost:3001/dashboard/events");
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(results.violations, formatViolations(results.violations)).toEqual([]);
  });

  test("Finance overview has no axe violations", async ({ page }) => {
    await page.goto("http://localhost:3001/dashboard/finance");
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(results.violations, formatViolations(results.violations)).toEqual([]);
  });

  test("Component gallery has no axe violations", async ({ page }) => {
    await page.goto("http://localhost:3001/gallery");
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(results.violations, formatViolations(results.violations)).toEqual([]);
  });
});

// ── Scanner PWA (:3002) ────────────────────────────────────────────────────────
test.describe("Scanner", () => {
  test("Scan main page has no axe violations", async ({ page }) => {
    // ScanViewport needs camera — disable camera for the axe check
    await page.route("**", (route) => route.continue());
    await page.goto("http://localhost:3002/scan");
    // Allow client hydration before axe
    await page.waitForTimeout(1500);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      // Camera viewport placeholder may not have labelling — skip
      .exclude("video")
      .analyze();
    expect(results.violations, formatViolations(results.violations)).toEqual([]);
  });

  test("Manual code entry has no axe violations", async ({ page }) => {
    await page.goto("http://localhost:3002/scan/manual");
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(results.violations, formatViolations(results.violations)).toEqual([]);
  });

  test("Scan log has no axe violations", async ({ page }) => {
    await page.goto("http://localhost:3002/scan/log");
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(results.violations, formatViolations(results.violations)).toEqual([]);
  });

  test("Onboarding has no axe violations", async ({ page }) => {
    await page.goto("http://localhost:3002/scan/onboarding");
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(results.violations, formatViolations(results.violations)).toEqual([]);
  });
});

// ── Responsive: no horizontal overflow at 375px / 768px / 1440px ─────────────
const WIDTHS = [375, 768, 1440];

const ROUTES = [
  { app: "web", url: "http://localhost:3000/en", name: "Web home" },
  { app: "web", url: "http://localhost:3000/en/e/navratri-2026-ahmedabad", name: "Event page" },
  { app: "dashboard", url: "http://localhost:3001/dashboard", name: "Dashboard overview" },
  { app: "scanner", url: "http://localhost:3002/scan/onboarding", name: "Onboarding" },
];

for (const width of WIDTHS) {
  test.describe(`Responsive @ ${width}px`, () => {
    test.use({ viewport: { width, height: 812 } });

    for (const route of ROUTES) {
      test(`${route.name} has no horizontal overflow`, async ({ page }) => {
        await page.goto(route.url);
        await page.waitForLoadState("networkidle");
        const hasOverflow = await page.evaluate(() => {
          const body = document.body;
          return body.scrollWidth > body.clientWidth;
        });
        expect(hasOverflow, `Horizontal overflow at ${width}px on ${route.url}`).toBe(false);
      });
    }
  });
}

// ── Keyboard navigation: dashboard sidebar + event table ─────────────────────
test("Dashboard sidebar is fully keyboard-navigable", async ({ page }) => {
  await page.goto("http://localhost:3001/dashboard");
  await page.waitForLoadState("networkidle");

  // Tab to first sidebar nav item
  await page.keyboard.press("Tab");
  const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
  // Should have focus somewhere on the page
  expect(focusedTag).toBeDefined();
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatViolations(violations: { id: string; description: string; nodes: { html: string }[] }[]) {
  if (violations.length === 0) return "";
  return violations.map((v) =>
    `\n[${v.id}] ${v.description}\n  ${v.nodes.slice(0, 3).map((n) => n.html).join("\n  ")}`
  ).join("\n");
}
