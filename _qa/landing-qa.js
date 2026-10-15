const { chromium } = require("C:/Users/Asus/node_modules/playwright");

const BASE = "http://localhost:3002";
const OUT = __dirname + "/shots";
require("fs").mkdirSync(OUT, { recursive: true });

const PAGES = [
  ["hub", "/bhubaneswar"],
  ["cabs", "/cab-booking-in-bhubaneswar"],
  ["hotels-state", "/hotel-booking-in-odisha"],
  ["tours-city", "/tour-packages-in-bhubaneswar"],
];
const WIDTHS = [
  ["mobile", 390, 844],
  ["tablet", 768, 1024],
  ["laptop", 1024, 768],
  ["desktop", 1440, 900],
];

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const errors = [];

  for (const [name, w, h] of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    for (const [pageName, path] of PAGES) {
      const page = await ctx.newPage();
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(`[${name} ${path}] ${m.text()}`);
      });
      page.on("pageerror", (e) => errors.push(`[${name} ${path}] pageerror: ${e.message}`));
      const resp = await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 45000 });
      const status = resp.status();
      await page.waitForTimeout(900);
      await page.screenshot({ path: `${OUT}/${name}-${pageName}-top.png` });
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(900);
      await page.screenshot({ path: `${OUT}/${name}-${pageName}-bottom.png` });
      console.log(`${name.padEnd(7)} ${path.padEnd(32)} ${status}`);
      await page.close();
    }
    await ctx.close();
  }

  // Lightbox keyboard walk on the page most likely to have a gallery
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(`[lightbox] pageerror: ${e.message}`));
  for (const [, path] of PAGES) {
    await page.goto(BASE + path, { waitUntil: "networkidle" });
    const tiles = page.locator('[data-qa="gallery-tile"], button:has(img)').first();
    if (await tiles.count()) {
      await tiles.click();
      const dialog = page.locator('[role="dialog"][aria-modal="true"]');
      if (await dialog.count()) {
        await page.keyboard.press("ArrowRight");
        await page.waitForTimeout(300);
        await page.screenshot({ path: `${OUT}/lightbox-open.png` });
        await page.keyboard.press("Escape");
        await page.waitForTimeout(300);
        console.log(`lightbox OK on ${path} (opened, arrow, esc closed: ${!(await dialog.count())})`);
      } else {
        console.log(`no dialog on ${path}`);
      }
      break;
    }
  }
  await ctx.close();

  // Reduced motion: content still visible
  const rm = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const rp = await rm.newPage();
  await rp.goto(BASE + "/bhubaneswar", { waitUntil: "networkidle" });
  await rp.waitForTimeout(600);
  const heroVisible = await rp.locator("h1").first().isVisible();
  console.log(`reduced-motion h1 visible: ${heroVisible}`);
  await rp.screenshot({ path: `${OUT}/reduced-motion-hub.png` });
  await rm.close();

  await browser.close();
  console.log(`\nconsole errors: ${errors.length}`);
  errors.slice(0, 20).forEach((e) => console.log("  " + e));
})();
