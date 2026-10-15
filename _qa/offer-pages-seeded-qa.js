const fs = require("fs");
const { chromium } = require("C:/Users/Asus/node_modules/playwright");
fs.mkdirSync(__dirname + "/shots", { recursive: true });
const PAGES = ["weekend-suv-deal", "city-suv-flat-saver", "grand-imperial-deluxe-escape", "magical-odisha-tour-deal"];
(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  for (const slug of PAGES) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`http://localhost:3000/offers/${slug}`, { waitUntil: "domcontentloaded", timeout: 90000 });
    await page.waitForTimeout(3500);
    const body = await page.evaluate(() => document.body.innerText);
    const checks = {
      title: body.includes(slug.split("-").slice(0, 2).join(" ").replace(/\b\w/g, c => c.toUpperCase())) || body.length > 500,
      coupon: /HERO10|CABSURPRISE|STAY20/.test(body),
      terms: /Terms|T&C|cannot be combined|Cannot be combined/i.test(body),
      cta: /Book/i.test(body),
      target: slug.includes("suv") ? /SUV/i.test(body) : slug.includes("tour") ? /Odisha Heritage Tour/i.test(body) : /Grand Imperial/i.test(body),
      paused: /no longer|not available|expired/i.test(body),
    };
    console.log(slug, JSON.stringify(checks));
    await page.screenshot({ path: `${__dirname}/shots/offerpage-${slug}.png`, fullPage: true });
    await ctx.close();
  }
  await browser.close();
})();
