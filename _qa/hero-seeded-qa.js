// Phase 7 QA: hero slider with the 5 seeded offers — rotation, real images, links.
const { chromium } = require("C:/Users/Asus/node_modules/playwright");
const fs = require("fs");
const OUT = __dirname + "/shots";
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(5000);
  const hrefs = ["weekend-suv-deal","city-suv-flat-saver","grand-imperial-deluxe-escape","magical-odisha-tour-deal","smoke-grand-imperial-deluxe"];
  const seen = new Set();
  for (let i = 0; i < 8; i++) {
    for (const h of hrefs) if (await page.locator(`a[href="/offers/${h}"]`).count()) seen.add(h);
    await page.waitForTimeout(2600);
  }
  console.log("offers seen in rotation:", [...seen].join(", "));
  console.log("missing:", hrefs.filter(h => !seen.has(h)).join(",") || "none");
  const imgOk = await page.evaluate(() => {
    const img = document.querySelector('a[href^="/offers/"] img');
    return img ? { complete: img.complete, natural: img.naturalWidth } : null;
  });
  console.log("slider image:", JSON.stringify(imgOk));
  await page.screenshot({ path: `${OUT}/hero-seeded-desktop.png` });
  await ctx.close(); await browser.close();
})();
