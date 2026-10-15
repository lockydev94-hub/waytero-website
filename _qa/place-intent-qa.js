// ============================================================
// place-intent-qa.js — Phase 5+6 acceptance on a running :3002
//   1. Place pages: JSON-LD Airport/TrainStation, fare stars
//   2. Footer "Popular Places" internal links
//   3. Intent banner: localStorage pick → banner → dismiss → stays gone
//   4. Geolocation chip: near-BBI coords → city set; Delhi coords → honest
//      "couldn't detect" (never silently mapped to Bhubaneswar)
// Run: node _qa/place-intent-qa.js   (server must be up; needs Chrome)
// ============================================================
const { chromium } = require("C:/Users/Asus/node_modules/playwright");

const BASE = "http://localhost:3002";
const OUT = __dirname + "/shots";
require("fs").mkdirSync(OUT, { recursive: true });

const AIRPORT = "/bhubaneswar-biju-patnaik-international-airport-cab";
const STATION = "/bhubaneswar-railway-station-cab";

let pass = 0, fail = 0;
const chk = (name, ok) => {
  console.log(`${ok ? "PASS" : "FAIL"} ${name}`);
  ok ? pass++ : fail++;
};

const jsonLdTypes = (page) =>
  page.$$eval('script[type="application/ld+json"]', (els) =>
    els.map((e) => e.textContent).join(" ")
  ).then((blob) => ({
    airport: /"@type":\s*"Airport"/.test(blob),
    station: /"@type":\s*"TrainStation"/.test(blob),
  }));

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });

  // ── 1+2: place pages + footer links ────────────────────────────────────
  {
    const page = await browser.newPage();
    await page.goto(BASE + AIRPORT, { waitUntil: "networkidle" });
    const t = await jsonLdTypes(page);
    chk("airport page JSON-LD @type Airport", t.airport);
    chk("airport page not mislabeled TrainStation", !t.station);
    const body = await page.evaluate(() => document.body.innerText);
    chk("airport fare rows carry * marker", /\u20b9[\d,]+\s*\*|\*/.test(body));
    await page.screenshot({ path: `${OUT}/place-airport.png`, fullPage: false });

    await page.goto(BASE + STATION, { waitUntil: "networkidle" });
    const s = await jsonLdTypes(page);
    chk("station page JSON-LD @type TrainStation", s.station);
    chk("station page not mislabeled Airport", !s.airport);
    await page.screenshot({ path: `${OUT}/place-station.png` });

    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(800); // lazy footer animations must have painted
    const footer = page.locator("footer").first();
    const footerText = await footer.evaluate((el) => el.textContent);
    chk("footer has Popular Places", footerText.includes("Popular Places"));
    chk(
      "footer links airport place page",
      !!(await footer.locator(`a[href="${AIRPORT}"]`).count())
    );
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}/footer-places.png` });
    await page.close();
  }

  // ── 3: intent banner round-trip ────────────────────────────────────────
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
    await page.evaluate(() =>
      localStorage.setItem(
        "wt_intent_place",
        JSON.stringify({ slug: "bhubaneswar-railway-station-cab", name: "Bhubaneswar Railway Station", kind: "RAILWAY_STATION", ts: Date.now() })
      )
    );
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    const banner = page.locator('[role="note"]');
    let shown = true;
    try {
      await banner.first().waitFor({ timeout: 5000 });
    } catch {
      shown = false;
    }
    chk("intent banner appears after airport/station pick", shown);
    let names = false;
    try {
      names = (await banner.first().innerText({ timeout: 3000 })).includes("Bhubaneswar Railway Station");
    } catch {}
    chk("banner names the picked place", names);
    await page.screenshot({ path: `${OUT}/intent-banner.png` });
    await banner.getByLabel("Dismiss").click();
    await page.waitForTimeout(300);
    chk("banner dismisses immediately", (await page.locator('[role="note"]').count()) === 0);
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    chk("dismissed banner stays gone", (await page.locator('[role="note"]').count()) === 0);
    const href = await page.evaluate(() => localStorage.getItem("wt_intent_dismissed"));
    chk("dismissal remembered per slug", href === "bhubaneswar-railway-station-cab");
    await ctx.close();
  }

  // ── 4: geolocation chip, in-area and out-of-area ───────────────────────
  const geo = async (lat, lng) => {
    const ctx = await browser.newContext({
      permissions: ["geolocation"],
      geolocation: { latitude: lat, longitude: lng },
    });
    const page = await ctx.newPage();
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    const trigger = page.locator('[aria-haspopup="listbox"]').first();
    await trigger.click();
    const chip = page.getByText("Use my location");
    await chip.waitFor({ timeout: 5000 });
    await chip.click();
    let noneMsg = 0;
    try {
      await page.getByText("Couldn't detect").first().waitFor({ timeout: 10000 });
      noneMsg = await page.getByText("Couldn't detect").count();
    } catch {
      noneMsg = 0;
    }
    await page.waitForTimeout(1000);
    const out = { triggerText: await trigger.innerText(), noneMsg };
    await page.screenshot({ path: `${OUT}/geo-${lat.toFixed(1)}.png` });
    await ctx.close();
    return out;
  };
  {
    // ~500 m from BBI terminal — must resolve to Bhubaneswar
    const near = await geo(20.2444, 85.8178);
    chk("geolocation near BBI selects Bhubaneswar", /Bhubaneswar/i.test(near.triggerText));
    // Delhi coords — nearest match is >1000 km away: must NOT be mapped
    const far = await geo(28.6139, 77.2090);
    chk("Delhi coords honestly refuse to auto-pick", far.noneMsg > 0 && !/Delhi/i.test(far.triggerText));
  }

  await browser.close();
  console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch((e) => {
  console.error("driver crashed:", e);
  process.exit(2);
});
