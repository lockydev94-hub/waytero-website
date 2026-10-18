const { chromium } = require("C:/Users/Asus/node_modules/playwright");
const assert = require("node:assert/strict");
const BASE = "http://localhost:3002";
const API = "http://localhost:8000/api/v1/public";
const PAGES = ["", "about", "contact", "careers", "press", "support", "safety", "security", "privacy", "terms", "cookies", "refund", "sitemap", "booking-instructions", "partner", "track", "wallet"];
const normalize = (title) => title.replace(/\s*(?:[-–—|·:]\s*)?WayTero\s*$/i, "").trim();
const fabricated = /90000 00001|8480889870|1800-WAYTERO|(?:press|careers|security|privacy)@waytero\.com|CIN U63090|twitter\.com\/waytero|linkedin\.com\/company\/waytero|12,000\+ subscribers/;
let checks = 0;
function check(name, value) {
  assert.ok(value, name);
  checks++;
  console.log(`PASS ${name}`);
}

(async () => {
  const [profile, seo, home] = await Promise.all(
    ["platform-profile", "site-seo", "homepage"].map(async (route) => {
      const res = await fetch(`${API}/${route}`);
      assert.equal(res.status, 200);
      return res.json();
    })
  );
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const slug of PAGES) {
      const response = await page.goto(`${BASE}/${slug}`, { waitUntil: "networkidle", timeout: 120000 });
      check(`${slug || "home"}: HTTP 200`, response.status() === 200);
      const row = seo[slug.replaceAll("-", "_")];
      if (row?.title) {
        check(`${slug}: database title`, (await page.title()) === `${normalize(row.title)} | WayTero`);
      } else if (!slug) {
        check("home: database tagline", (await page.title()).includes(profile.tagline));
      }
      if (row?.description) {
        check(`${slug}: database description`, (await page.locator('meta[name="description"]').getAttribute("content")) === row.description);
      }
      check(`${slug || "home"}: database OG image`, (await page.locator('meta[property="og:image"]').first().getAttribute("content")) === profile.og_image_url);
      const content = await page.content();
      check(`${slug || "home"}: no fabricated contacts or social links`, !fabricated.test(content));
      const organization = await page.locator('script[type="application/ld+json"]').evaluateAll((els) =>
        els.flatMap((el) => {
          const data = JSON.parse(el.textContent);
          return data["@graph"] || [data];
        }).find((node) => node["@type"] === "Organization")
      );
      check(`${slug || "home"}: database organization socials`, JSON.stringify(organization.sameAs) === JSON.stringify(Object.values(profile.social_links)));
      if (slug === "contact") {
        // The contact hero carries a "Call <number>" CTA, so the first tel:
        // anchor is not the bare number — match any tel link that shows it.
        await page.waitForFunction(
          (phone) =>
            [...document.querySelectorAll('main a[href^="tel:"]')].some(
              (a) => a.textContent.includes(phone),
            ),
          profile.support_phone,
        );
        const main = page.locator("main");
        check("contact: database phone", (await main.innerText()).includes(profile.support_phone));
        check("contact: database email", (await main.innerText()).includes(profile.support_email));
        check("contact: database office", (await main.innerText()).includes(profile.office_address));
        check("contact: WhatsApp destination", await main.locator(`a[href="https://wa.me/91${profile.support_phone}"]`).count() > 0);
        await page.screenshot({ path: `${__dirname}/shots/brand-contact-desktop.png` });
        await page.getByRole("button", { name: "Send message", exact: true }).click();
        check("contact: empty form does not claim success", await page.getByText("Message sent!", { exact: true }).count() === 0);
      }
      if (slug === "careers") {
        // Round 6 rebuilt /careers: the honest empty state is now the section
        // title plus a "No open roles" card heading.
        check("careers: honest no-roles state", await page.getByText("Nothing is posted right now", { exact: true }).count() === 1 && await page.getByText("No open roles", { exact: true }).count() === 1);
      }
      if (!slug) {
        check("home: unsupported newsletter hidden", await page.locator("#newsletter").count() === 0);
        check("home: unsupported app-download hidden", await page.locator("#app").count() === 0);
        const links = home.footer.app_store_links || {};
        if (!links.android && !links.ios) {
          check("footer: empty app links render no badges", await page.locator('footer a[aria-label="App Store"], footer a[aria-label="Google Play"]').count() === 0);
        }
      }
    }
    check("all pages: no browser runtime errors", errors.length === 0);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE}/contact`, { waitUntil: "networkidle" });
    await page.waitForFunction(
      (phone) =>
        [...document.querySelectorAll('main a[href^="tel:"]')].some(
          (a) => a.textContent.includes(phone),
        ),
      profile.support_phone,
    );
    await page.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth);
    check("contact: mobile fits viewport", await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: `${__dirname}/shots/brand-contact-mobile.png` });
    // The "what if the API is down" checks used to live here, mocking
    // /public/platform-profile with page.route(). They could never work: the
    // contact page is a server component and the brand-master fallback is
    // applied on the server, so no browser mock reaches it — two of the three
    // passed only because the configured email and address happen to equal the
    // constants. That path is covered by _qa/offline-contact-qa.js.
    console.log(`RESULT: ${checks} passed`);
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
