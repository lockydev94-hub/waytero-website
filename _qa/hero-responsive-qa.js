const fs = require("fs");
const { chromium } = require("C:/Users/Asus/node_modules/playwright");

fs.mkdirSync(__dirname + "/shots", { recursive: true });

const TABS = ["Cabs", "Hotels", "Tours"];

async function shoot(page, tag) {
  const m = await page.evaluate(() => {
    const hero = document.querySelector("section");
    const form = document.querySelector('[role="tablist"][aria-label="Search service"]');
    const card = form.closest("div.relative");
    const r = card.getBoundingClientRect();
    const wrapped = Array.from(card.querySelectorAll("div"))
      .filter(
        (el) =>
          /uppercase/.test(el.className) &&
          el.children.length === 0 &&
          el.textContent.trim().length > 0 &&
          el.textContent.trim().length < 28,
      )
      .map((el) => ({
        label: el.textContent.trim(),
        h: Math.round(el.getBoundingClientRect().height),
      }))
      .filter((x) => x.h > 18);
    return {
      heroH: Math.round(hero.getBoundingClientRect().height),
      vh: innerHeight,
      fits: hero.getBoundingClientRect().height <= innerHeight + 1,
      cardBottom: Math.round(r.bottom),
      cardVisible: r.bottom <= innerHeight,
      wrappedLabels: wrapped,
    };
  });
  console.log(`${tag}: ${JSON.stringify(m)}`);
  await page.screenshot({ path: `${__dirname}/shots/hero-${tag}.png` });
}

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });

  for (const size of [
    { w: 1440, h: 900 },
    { w: 1280, h: 720 },
    { w: 390, h: 844 },
  ]) {
    const ctx = await browser.newContext({ viewport: { width: size.w, height: size.h } });
    const page = await ctx.newPage();
    await page.goto("http://localhost:3002/", { waitUntil: "domcontentloaded", timeout: 90000 });
    await page.waitForTimeout(4000);
    const slider = page.getByRole("tablist", { name: "Offer slides" });
    if (await slider.count()) await slider.hover();
    for (const tab of TABS) {
      await page.getByRole("tab", { name: tab }).first().click();
      await page.waitForTimeout(600);
      await shoot(page, `${size.w}x${size.h}-${tab.toLowerCase()}`);
    }
    // Cab round-trip = the widest row (From + To + date + return + pax + Go)
    const rt = page.getByRole("button", { name: /Round Trip|Return/i }).first();
    if (await rt.count()) {
      await rt.click();
      await page.waitForTimeout(600);
      await shoot(page, `${size.w}x${size.h}-cabs-roundtrip`);
    }
    await ctx.close();
  }
  await browser.close();
})();
