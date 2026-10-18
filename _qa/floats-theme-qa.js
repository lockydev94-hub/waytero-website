// Round 7 QA — theme-correct floats, navy chat, smart invitation, header chip,
// utility strip, footer logo. Run against the dev server on :3002.
const fs = require("node:fs");
const { chromium } = require("C:/Users/Asus/node_modules/playwright");
const assert = require("node:assert/strict");
const BASE = "http://localhost:3002";
const API = "http://localhost:8000/api/v1/public";

let checks = 0;
// The strip's hrefs embed the live support number — never print it.
const mask = (s) => String(s).replace(/\+?\d[\d\s-]{4,}/g, "[number]");
const pass = (name, detail) => {
  checks++;
  console.log(`PASS ${name}${detail ? ` — ${mask(detail)}` : ""}`);
};
const WHITE = "rgb(255, 255, 255)";
const NAVY = "rgb(11, 27, 59)"; // ink-900
const FLOAT_CALL = 'a.fixed[aria-label^="Call now"]';
const FLOAT_CHAT = 'button[aria-label="Chat with support"]';
const CHIP = "header a[aria-label^='Call now']";
const STRIP = 'nav[aria-label="Support shortcuts"]';

(async () => {
  const footerCms = await (await fetch(`${API}/homepage`)).json();
  const footerLogo = footerCms?.footer?.logo_url || "";
  const errors = [];
  const known = new Set();
  const browser = await chromium.launch({ channel: "chrome", headless: true });

  const mkPage = async (width, height, mock) => {
    const ctx = await browser.newContext({ viewport: { width, height } });
    const page = await ctx.newPage();
    // The dev server recompiles on demand and a cold `GET /` has taken 38s here.
    page.setDefaultNavigationTimeout(180_000);
    page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
    page.on("console", (m) => {
      const t = m.text();
      // Resource failures are reported by the response listener below, with URLs.
      if (m.type() === "error" && !/favicon|React DevTools|net::ERR_|Failed to load resource/i.test(t)) {
        errors.push(`console: ${t.slice(0, 160)}`);
      }
    });
    page.on("response", (res) => {
      // The availability route is deliberately mocked to 500 in check 8.
      if (res.status() < 400 || /\/chat\/availability/.test(res.url())) return;
      const where = res.url().replace(BASE, "").replace(API, "/public");
      // Known pre-existing gaps, reported as WARN below rather than failing
      // this round: publicBlog.ts:104 calls a tags endpoint the backend has
      // never had.
      if (/\/public\/blog\/tags/.test(where)) known.add(`http ${res.status()} ${where}`);
      else errors.push(`http ${res.status()} ${where}`);
    });
    if (mock) {
      await page.route("**/chat/availability", (r) =>
        r.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, message: "", data: { support_online: mock } }),
        }),
      );
    }
    return { ctx, page };
  };
  const color = (page, sel) =>
    page.$eval(sel, (el) => getComputedStyle(el).color);
  const box = (page, sel) =>
    page.$eval(sel, (el) => {
      const r = el.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, w: r.width, h: r.height };
    });

  // ── 1. White text on brand surfaces (the @layer base cascade fix) ──────────
  {
    const { ctx, page } = await mkPage(1440, 900, true);
    await page.goto(`${BASE}/partner`, { waitUntil: "domcontentloaded" });
    const cta = await color(page, "header a[href='/partner'] >> visible=true");
    assert.equal(cta, WHITE, `header partner CTA colour is ${cta}`);
    pass("header 'Become a Partner' renders white at 1440", cta);

    const call = await color(page, FLOAT_CALL);
    assert.equal(call, WHITE, `call float colour is ${call}`);
    pass("call float icon renders white at 1440", call);

    const bg = await page.$eval(FLOAT_CALL, (el) => getComputedStyle(el).backgroundImage);
    assert.match(bg, /240,\s*90,\s*34/, `call float bg is ${bg}`);
    pass("call float uses the accent orange", bg.slice(0, 60));
    ctx.close();
  }

  // ── 2. Below 1024px: no float, but a header chip beside the logo ───────────
  for (const w of [390, 768, 800]) {
    const { ctx, page } = await mkPage(w, 860, true);
    await page.goto(`${BASE}/safety`, { waitUntil: "domcontentloaded" });
    const floatVisible = await page.isVisible(FLOAT_CALL);
    assert.ok(!floatVisible, `call float visible at ${w}px`);
    const chipVisible = await page.isVisible(CHIP);
    assert.ok(chipVisible, `header call chip hidden at ${w}px`);
    pass(`call float hidden / header chip shown at ${w}px`);
    if (w === 800) {
      const c = await color(page, CHIP);
      assert.equal(c, WHITE, `header chip colour is ${c}`);
      pass("header call chip renders white at 800", c);
    }
    const geo = await box(page, CHIP);
    assert.equal(Math.round(geo.w), 36, `chip width ${geo.w}`);
    const row = await page.$eval("header > div", (el) => el.scrollWidth <= el.clientWidth + 1);
    assert.ok(row, "header row overflows");
    pass(`chip is 36px and the header row does not overflow at ${w}px`);
    ctx.close();
  }

  // ── 3. Vertical stack geometry at 1440 ────────────────────────────────────
  {
    const { ctx, page } = await mkPage(1440, 900, true);
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    const call = await box(page, FLOAT_CALL);
    const chat = await box(page, FLOAT_CHAT);
    assert.ok(call.bottom < chat.top, `call ${call.bottom} not above chat ${chat.top}`);
    assert.ok(Math.abs((call.left + call.right) / 2 - (chat.left + chat.right) / 2) <= 1, "stack not centred");
    assert.ok(Math.abs(call.right - chat.right) <= 1, `right edges off: ${call.right} vs ${chat.right}`);
    pass(`floats stack vertically — call ${Math.round(call.bottom)}px sits above chat ${Math.round(chat.top)}px, flush right`);

    const radii = await page.evaluate(
      ([c, ch]) => {
        const a = getComputedStyle(document.querySelector(c));
        const b = getComputedStyle(document.querySelector(ch));
        return [parseFloat(a.borderRadius), parseFloat(b.borderRadius)];
      },
      [FLOAT_CALL, FLOAT_CHAT],
    );
    assert.ok(radii[0] >= 999, `call radius ${radii[0]} — expected a circle`);
    assert.equal(radii[1], 16, `chat radius ${radii[1]} — expected a 16px square`);
    pass("call is a circle, chat launcher is a square", radii.join(" / "));
    ctx.close();
  }

  // ── 4. Chat panel is premium dark navy and clears the taller stack ─────────
  {
    const { ctx, page } = await mkPage(1440, 900, true);
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await page.click(FLOAT_CHAT);
    await page.waitForSelector('[role="dialog"]');
    const panel = await page.$eval('[role="dialog"]', (el) => {
      const cs = getComputedStyle(el);
      const bar = getComputedStyle(el.firstElementChild);
      const whites = [...el.querySelectorAll("*")].filter(
        (n) => getComputedStyle(n).backgroundColor === "rgb(255, 255, 255)",
      ).length;
      const grays = el.querySelectorAll('[class*="gray-"], [class*="blue-"]').length;
      return { bg: cs.backgroundColor, bar: bar.backgroundImage, whites, grays };
    });
    assert.equal(panel.bg, NAVY, `panel body is ${panel.bg}`);
    assert.match(panel.bar, /27,\s*53,\s*96/, `header bar is ${panel.bar}`);
    assert.match(panel.bar, /18,\s*41,\s*79/, `header bar is ${panel.bar}`);
    assert.equal(panel.whites, 0, `${panel.whites} white panels left inside the dialog`);
    assert.equal(panel.grays, 0, `${panel.grays} gray-/blue- classes left inside the dialog`);
    pass("chat panel is ink-900 with a navy header bar and no light-theme leftovers", panel.bg);

    const [dlg, call] = await Promise.all([
      box(page, '[role="dialog"]'),
      box(page, FLOAT_CALL),
    ]);
    assert.ok(dlg.bottom <= call.top + 1, `panel ${dlg.bottom} overlaps the call float ${call.top}`);
    pass(`open panel clears the float stack (${Math.round(dlg.bottom)} ≤ ${Math.round(call.top)})`);

    // Typing/identity surface stays legible: the topic chips are not dark-on-dark.
    const chipInk = await page.$eval(
      '[role="dialog"] button:has-text("Booking help")',
      (el) => getComputedStyle(el).color,
    );
    assert.equal(chipInk, WHITE, `topic chip text is ${chipInk}`);
    pass("topic chips are white on the navy plate", chipInk);
    ctx.close();
  }

  // ── 5. Smart invitation: once per session, scroll-triggered, never auto-opens
  {
    const scrollDeep = (page) =>
      page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight * 0.7));

    const { ctx, page } = await mkPage(1280, 800, true);
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await scrollDeep(page);
    await page.waitForSelector('div[role="status"]', { timeout: 5000 });
    const text = await page.$eval('div[role="status"]', (el) => el.innerText);
    assert.match(text, /Need a hand\?/, text);
    pass("invitation appears after the scroll trigger", text.replace(/\s+/g, " ").slice(0, 70));
    assert.equal(await page.$('[role="dialog"]'), null, "chat opened itself");
    pass("chat stays closed until the customer clicks", "no dialog");
    assert.equal(await page.isVisible(FLOAT_CHAT), true, "launcher hidden by the bubble");
    await page.keyboard.press("Escape");
    await page.waitForSelector('div[role="status"]', { state: "detached", timeout: 3000 });
    pass("Escape dismisses the invitation");

    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await scrollDeep(page);
    await page.waitForTimeout(1200);
    assert.equal(await page.$('div[role="status"]'), null, "nudged twice in one session");
    pass("no second invitation in the same session (reload)");
    ctx.close();

    // Clicking it opens the widget.
    const { ctx: c2, page: p2 } = await mkPage(1280, 800, true);
    await p2.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await p2.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight * 0.7));
    await p2.waitForSelector('div[role="status"]', { timeout: 5000 });
    await p2.click('div[role="status"] button:not([aria-label="Dismiss invitation"])');
    await p2.waitForSelector('[role="dialog"]', { timeout: 5000 });
    pass("clicking the invitation opens the chat");
    await p2.waitForSelector('div[role="status"]', { state: "detached", timeout: 3000 });
    pass("opening the chat retires the invitation");
    c2.close();
  }

  // ── 6. Footer logo actually shows ──────────────────────────────────────────
  {
    const { ctx, page } = await mkPage(1440, 900, true);
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    if (footerLogo) {
      const shot = await page.$eval("footer img", (el) => ({
        filter: getComputedStyle(el).filter,
        plate: getComputedStyle(el.parentElement).backgroundColor,
        alt: el.getAttribute("alt"),
        h: el.getBoundingClientRect().height,
      }));
      assert.equal(shot.filter, "none", `footer logo filter is ${shot.filter}`);
      assert.equal(shot.plate, WHITE, `logo plate is ${shot.plate}`);
      assert.equal(shot.alt, "WayTero", `alt is ${shot.alt}`);
      assert.ok(shot.h >= 32, `logo height ${shot.h}`);
      pass("footer logo renders unfiltered on a white plate", `${shot.alt}, ${Math.round(shot.h)}px`);
    } else {
      const wordmark = await page.$eval("footer a", (el) => el.innerText);
      assert.match(wordmark, /WayTero/, wordmark);
      pass("footer has no logo uploaded — brand wordmark fallback renders", wordmark.trim().slice(0, 20));
    }
    ctx.close();
  }

  // ── 7. Utility strip: calm navy bar, real values, no duplicates ────────────
  {
    const src = fs.readFileSync(
      `${__dirname}/../src/components/layout/HeaderPro.tsx`,
      "utf8",
    );
    assert.equal((src.match(/#F5713A/gi) || []).length, 0, "hardcoded #F5713A left in HeaderPro");
    assert.equal(/animation:\s*"shimmer"/.test(src), false, "shimmer animation still declared");
    pass("strip uses theme tokens and dropped its shimmer");

    for (const [w, want] of [[390, 32], [768, 36], [1440, 36]]) {
      const { ctx, page } = await mkPage(w, 860, true);
      await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
      const geo = await page.$eval(
        'nav[aria-label="Support shortcuts"]',
        (el) => {
          // nav  ->  Container row (carries the height)  ->  strip div (carries the navy)
          const row = el.parentElement;
          const strip = row.parentElement;
          const animating = [strip, ...strip.querySelectorAll("*")].filter(
            (n) => getComputedStyle(n).animationName !== "none",
          ).length;
          return {
            h: Math.round(row.getBoundingClientRect().height),
            bg: getComputedStyle(strip).backgroundColor,
            border: getComputedStyle(strip).borderBottomColor,
            animating,
            allHrefs: [...strip.querySelectorAll("a")].map((a) => a.getAttribute("href")),
            navHrefs: [...el.querySelectorAll("a")].map((a) => a.getAttribute("href")),
          };
        },
      );
      assert.equal(geo.h, want, `strip height ${geo.h} at ${w}px`);
      assert.equal(geo.bg, NAVY, `strip bg ${geo.bg}`);
      assert.notEqual(geo.border, "rgba(0, 0, 0, 0)", "strip has no bottom hairline");
      assert.equal(geo.animating, 0, `${geo.animating} animated nodes in the strip`);
      assert.ok(!geo.allHrefs.some((h) => h === "/track" || h === "/partner"), `duplicate link in strip: ${geo.allHrefs}`);
      pass(`strip is ${geo.h}px ink-900, static, no Track/Partner duplicates at ${w}px`, geo.allHrefs.join(" "));
      if (w === 1440) {
        assert.equal(geo.navHrefs.length, 2, `right cluster: ${geo.navHrefs}`);
        assert.ok(geo.navHrefs.some((h) => h.startsWith("https://wa.me/")), geo.navHrefs.join(" "));
        assert.ok(geo.navHrefs.includes("/support"), geo.navHrefs.join(" "));
        assert.ok(geo.allHrefs.some((h) => h.startsWith("tel:")), "no tap-to-call number in the strip");
        pass("right cluster is WhatsApp + Help & support, phone link present", geo.navHrefs.join(" + "));
      }
      ctx.close();
    }
  }

  // ── 8. Desk presence: only real data, nothing claimed on failure ───────────
  {
    for (const [mode, expect] of [["true", "Desk online"], ["false", "Desk offline"], ["error", null]]) {
      const { ctx, page } = await mkPage(1440, 900);
      await page.route("**/chat/availability", (r) =>
        mode === "error"
          ? r.fulfill({ status: 500, body: "{}" })
          : r.fulfill({
              status: 200,
              contentType: "application/json",
              body: JSON.stringify({
                success: true,
                message: "",
                data: { support_online: mode === "true" },
              }),
            }),
      );
      await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
      // The dev server hydrates slowly; wait for the request instead of guessing.
      await page.waitForResponse((r) => /\/chat\/availability/.test(r.url()), { timeout: 30000 });
      await page.waitForTimeout(500);
      const body = await page.$eval("body", (el) => el.innerText);
      if (expect) {
        assert.ok(body.includes(expect), `expected "${expect}" with availability ${mode}`);
        pass(`availability ${mode} → "${expect}"`);
      } else {
        assert.ok(!/Desk (online|offline)/.test(body), "claimed presence without data");
        pass("availability 500 → no status claim in the strip");
      }
      // Scoped to the strip: the homepage body still carries the owner's CMS
      // "24/7" copy, which is a separate pending content decision.
      const stripText = await page.$eval(
        'nav[aria-label="Support shortcuts"]',
        (el) => el.parentElement.parentElement.innerText,
      );
      assert.ok(!/24\/7/i.test(stripText), `the strip claims 24/7: ${mask(stripText)}`);
      pass(`strip text stays free of availability claims (${mask(stripText).replace(/\s+/g, " ").slice(0, 60)})`);
      ctx.close();
    }
  }

  // ── 9. No horizontal overflow anywhere, no uncaught errors ─────────────────
  {
    const routes = ["", "/safety", "/press", "/support", "/hotels", "/blog", "/partner", "/cabs"];
    const widths = [390, 768, 1440, 2560];
    const { ctx, page } = await mkPage(1440, 900, true);
    for (const route of routes) {
      for (const w of widths) {
        await page.setViewportSize({ width: w, height: 860 });
        await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded" });
        const over = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        );
        assert.ok(over <= 1, `overflow ${over}px on ${route || "/"} at ${w}px`);
      }
      pass(`${route || "/"} fits at 390 / 768 / 1440 / 2560`);
    }
    ctx.close();
  }

  // ── 10. The full-bleed hero stops at the header, not above it ──────────────
  // HeroSection pulls itself up behind the transparent header. It used to bleed
  // by strip+header (104px), which buried the utility strip on the homepage.
  {
    for (const w of [390, 768, 1440]) {
      const { ctx, page } = await mkPage(w, 860, true);
      await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
      const geo = await page.evaluate(() => {
        const strip = document.querySelector(".bg-ink-900.border-b");
        const header = document.querySelector("header");
        const hero = document.querySelector("main > section");
        const r = (el) => el.getBoundingClientRect();
        return {
          heroMedia: !!(hero.querySelector("img, video")),
          stripBottom: r(strip).bottom,
          headerTop: r(header).top,
          heroTop: r(hero).top,
          headerH: r(header).height,
        };
      });
      assert.ok(geo.heroMedia, `homepage hero has no media at ${w}px — nothing to assert`);
      assert.ok(Math.abs(geo.heroTop - geo.headerTop) <= 1, `hero starts at ${geo.heroTop}, header at ${geo.headerTop} (${w}px)`);
      assert.ok(geo.stripBottom <= geo.headerTop + 1, `hero covers the utility strip at ${w}px`);
      pass(`hero bleeds behind the ${geo.headerH}px header only at ${w}px`, `strip bottom ${geo.stripBottom} ≤ header top ${geo.headerTop}`);
      ctx.close();
    }
  }

  for (const k of known) console.log(`WARN (pre-existing) ${mask(k)}`);
  assert.deepEqual(errors, [], `browser errors:\n  ${mask(errors.join("\n  "))}`);
  pass("zero uncaught page errors or console errors across every route", `${errors.length}`);

  await browser.close();
  console.log(`\nALL PASS — ${checks} checks`);
})().catch((e) => {
  console.error("FAIL", e.message);
  process.exit(1);
});

