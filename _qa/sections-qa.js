const { chromium } = require("C:/Users/Asus/node_modules/playwright");
const OUT = __dirname + "/shots";

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });

  async function shoot(path, selector, name, width, height) {
    const ctx = await browser.newContext({ viewport: { width, height } });
    const page = await ctx.newPage();
    await page.goto("http://localhost:3002" + path, { waitUntil: "networkidle" });
    const el = page.locator(selector).locator("visible=true").first();
    if (await el.count()) {
      await el.scrollIntoViewIfNeeded({ timeout: 8000 }).catch(() => {});
      await page.waitForTimeout(700);
      await page.screenshot({ path: `${OUT}/${name}.png` });
      console.log(`OK  ${name} (${path} ${width}px) selector=${selector}`);
      await ctx.close();
      return true;
    } else {
      console.log(`MISS ${name} (${path} ${width}px) selector=${selector}`);
      await ctx.close();
      return false;
    }
  }

  // fare matrix
  await shoot("/cab-booking-in-bhubaneswar", "table", "fare-table-desktop", 1440, 900);
  await shoot("/cab-booking-in-bhubaneswar", "text=/Base ₹/", "fare-cards-mobile", 390, 844);
  // vehicle grid
  await shoot("/cab-booking-in-bhubaneswar", "text=/seats/i", "vehicle-grid-desktop", 1440, 900);
  // hotel grid
  await shoot("/hotel-booking-in-bhubaneswar", "text=/\\/night|per night/i", "hotel-grid-desktop", 1440, 900);
  await shoot("/hotel-booking-in-odisha", "text=/\\/night|per night/i", "hotel-grid-state", 1440, 900);
  // tour grid
  await shoot("/tour-packages-in-bhubaneswar", "text=/from ₹|On request/i", "tour-grid-desktop", 1440, 900);
  // steps + faq (FAQ renders only when the DB has FAQ content — no placeholders)
  await shoot("/cab-booking-in-bhubaneswar", "text=/How it works|Step/i", "steps-desktop", 1440, 900);
  {
    const res = await fetch("http://localhost:8000/api/v1/public/landing-pages/bhubaneswar").then(r => r.json()).catch(() => null);
    const hasDbFaqs = !!(res && Array.isArray(res.faqs) && res.faqs.length);
    const got = await shoot("/bhubaneswar", "text=/Frequently asked|FAQ/i", "faq-hub", 1440, 900);
    console.log(`${hasDbFaqs === !!got ? "PASS" : "FAIL"} faq-hub matches DB (db_faqs=${hasDbFaqs} rendered=${!!got})`);
  }

  // gallery lightbox if present on any page
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  let lb = false;
  for (const p of ["/bhubaneswar", "/cab-booking-in-bhubaneswar", "/tour-packages-in-bhubaneswar"]) {
    await page.goto("http://localhost:3002" + p, { waitUntil: "networkidle" });
    const tile = page.locator("section img").first();
    if (!(await tile.count())) continue;
    const btn = page.locator("button:has(img)").first();
    if (await btn.count()) {
      await btn.scrollIntoViewIfNeeded();
      await btn.click().catch(() => {});
      await page.waitForTimeout(400);
      if (await page.locator('[role="dialog"]').count()) {
        await page.screenshot({ path: `${OUT}/lightbox.png` });
        const focused = await page.evaluate(() => document.activeElement && document.activeElement.tagName);
        await page.keyboard.press("Escape");
        await page.waitForTimeout(300);
        const closed = !(await page.locator('[role="dialog"]').count());
        console.log(`lightbox on ${p}: focus=${focused} esc-closed=${closed}`);
        lb = true;
        break;
      }
    }
  }
  if (!lb) console.log("no gallery lightbox found (gallery may be empty on all pages)");
  await ctx.close();
  await browser.close();
})();
