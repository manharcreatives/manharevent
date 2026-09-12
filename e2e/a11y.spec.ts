import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PAGES = [
  { name: "web home", url: "http://localhost:3000" },
  { name: "dashboard home", url: "http://localhost:3001" },
  { name: "gallery", url: "http://localhost:3001/gallery" },
  { name: "scanner home", url: "http://localhost:3002" },
];

for (const { name, url } of PAGES) {
  test(`${name} has no critical axe violations`, async ({ page }) => {
    await page.goto(url);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}
