const { chromium } = require("C:/Users/Asus/node_modules/playwright");

const SIZES = [
  { name: "desktop-1440x900", width: 1440, height: 900 },
  { name: "laptop-1366x768", width: 1366, height: 768 },
  { name: "small-1280x720", width: 1280, height: 720 },
  { name: "tablet-768x1024", width: 768, height: 1024 },
  { name: "mobile-390x844", width: 390, height: 844 },
];

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  for (const size of SIZES) {
    const ctx = await browser.newContext({ viewport: { width: size.width, height: size.height } });
    const page = await ctx.newPage();
    await page.goto("http://localhost:3002/", { waitUntil: "domcontentloaded", timeout: 90000 });
    await page.waitForTimeout(3500);

    const stats = await page.evaluate(() => {
      const q = (sel) => document.querySelector(sel);
      const rect = (el) => (el ? el.getBoundingClientRect() : null);
      const bar = q("[data-announcement-bar]") || q("body > div > div:first-child");
      const header = q("header");
      const hero = q("section");
      const h1 = q("h1");
      const form = q('[role="tablist"][aria-label="Search service"]');
      const card = form?.closest("div.relative.rounded-\\[28px\\]") || form?.parentElement;
      const out = {
        viewport: { w: innerWidth, h: innerHeight },
        barH: bar ? Math.round(rect(bar).height) : null,
        headerH: header ? Math.round(rect(header).height) : null,
        headerTop: header ? Math.round(rect(header).top) : null,
        heroTop: hero ? Math.round(rect(hero).top) : null,
        heroH: hero ? Math.round(rect(hero).height) : null,
        h1Font: h1 ? getComputedStyle(h1).fontSize : null,
        h1H: h1 ? Math.round(rect(h1).height) : null,
        cardTop: card ? Math.round(rect(card).top) : null,
        cardH: card ? Math.round(rect(card).height) : null,
        cardBottom: card ? Math.round(rect(card).bottom) : null,
        cardW: card ? Math.round(rect(card).width) : null,
      };
      const fieldLabels = Array.from(document.querySelectorAll('[role="tablist"][aria-label="Search service"] ~ * *'))
        .filter((el) => /uppercase/.test(el.className) && el.textContent.trim().length < 26)
        .slice(0, 12)
        .map((el) => ({
          label: el.textContent.trim(),
          w: Math.round(el.getBoundingClientRect().width),
          h: Math.round(el.getBoundingClientRect().height),
          wrapped: el.getBoundingClientRect().height > 20,
        }));
      return { ...out, fieldLabels };
    });
    console.log(JSON.stringify(stats));

    for (const tab of ["Hotels", "Tours", "Cabs"]) {
      const btn = page.getByRole("tab", { name: tab });
      if (await btn.count()) {
        await btn.first().click();
        await page.waitForTimeout(700);
        const m = await page.evaluate(() => {
          const form = document.querySelector('[role="tablist"][aria-label="Search service"]');
          const card = form?.closest("div.relative.rounded-\\[28px\\]") || form?.parentElement;
          const r = card.getBoundingClientRect();
          const panels = Array.from(card.querySelectorAll("form, .space-y-4")).map((p) => {
            const pr = p.getBoundingClientRect();
            return {
              h: Math.round(pr.height),
              cols: getComputedStyle(p).gridTemplateColumns,
              w: Math.round(pr.width),
            };
          });
          return {
            cardH: Math.round(r.height),
            cardBottom: Math.round(r.bottom),
            fits: Math.round(r.bottom) <= innerHeight,
            panels,
          };
        });
        console.log(`  ${tab}: ${JSON.stringify(m)}`);
      }
    }
    await ctx.close();
  }
  await browser.close();
})();
