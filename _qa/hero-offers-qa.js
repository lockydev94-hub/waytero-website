// Phase 4 QA: hero slider with live offers + /offers/[slug] page (desktop &
// mobile). Dev DB has one published HOTEL offer (smoke-grand-imperial-deluxe).
const { chromium } = require("C:/Users/Asus/node_modules/playwright");
const fs = require("fs");
const OUT = __dirname + "/shots";

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ channel: "chrome", headless: true });

  async function shoot(path, name, width, height, fullPage = false) {
    const ctx = await browser.newContext({ viewport: { width, height } });
    const page = await ctx.newPage();
    await page.goto("http://localhost:3000" + path, { waitUntil: "domcontentloaded", timeout: 90000 });
    await page.waitForTimeout(4500);
    if (fullPage) {
      // Trigger whileInView animations top→bottom, then return to top.
      await page.evaluate(async () => {
        const h = document.body.scrollHeight;
        for (let y = 0; y <= h; y += 400) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 120));
        }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(1200);
    }
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage });
    console.log(`OK ${name} (${path} ${width}px)`);
    await ctx.close();
  }

  // Hero with offers — expect the slider column on the right.
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(5000);
  const slider = await page.getByText("Live offers").count();
  const offerLink = await page.locator('a[href="/offers/smoke-grand-imperial-deluxe"]').count();
  console.log(`hero: slider=${slider} offer-link=${offerLink}`);
  await page.screenshot({ path: `${OUT}/hero-with-offers-1440.png` });
  await ctx.close();

  await shoot("/offers/smoke-grand-imperial-deluxe", "offer-page-desktop", 1440, 900, true);
  await shoot("/offers/smoke-grand-imperial-deluxe", "offer-page-mobile", 390, 844, true);

  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
