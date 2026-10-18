// ============================================================
// WAYTERO — CUSTOMER ACCOUNT AREA QA (round 8)
//
// Covers the five pages a customer reaches after signing in:
// /profile /bookings /wallet /notifications /account-security.
//
//   WT_CUSTOMER_TOKEN=<jwt> node _qa/account-qa.js
//   (or WT_CUSTOMER_TOKEN_FILE=path/to/token; see .tmp-pw/mint_customer_token_for.py)
//
// Nothing here writes booking or wallet data. The two state changes it does
// make are deliberate and reversible: marking one notification read, and
// getting a 401 from a wrong current password.
//
// Logs are masked — no token and no digit run longer than 4 characters ever
// reaches stdout.
// ============================================================

const { chromium } = require("C:/Users/Asus/node_modules/playwright");
const fs = require("fs");
const assert = require("node:assert/strict");

const BASE = process.env.WT_WEB_BASE || "http://localhost:3002";
const OUT = __dirname + "/shots";
const TOKEN = resolveToken();

const ACCOUNT = [
  "/profile",
  "/bookings",
  "/wallet",
  "/notifications",
  "/account-security",
];

let checks = 0;
function check(name, value) {
  assert.ok(value, name);
  checks++;
  console.log(`PASS ${name}`);
}

function resolveToken() {
  if (process.env.WT_CUSTOMER_TOKEN) return process.env.WT_CUSTOMER_TOKEN.trim();
  const file = process.env.WT_CUSTOMER_TOKEN_FILE;
  if (file && fs.existsSync(file)) return fs.readFileSync(file, "utf8").trim();
  console.error("Set WT_CUSTOMER_TOKEN or WT_CUSTOMER_TOKEN_FILE (see .tmp-pw/mint_customer_token_for.py).");
  process.exit(1);
}

/** Keep secrets and PII out of the transcript. */
function safe(text) {
  const s = String(text);
  if (/token[=/ ]/i.test(s) || /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(s.trim())) {
    return "[redacted]";
  }
  return s.replace(/\d{5,}/g, "[masked]").slice(0, 160);
}

async function seedAuth(ctx) {
  await ctx.addInitScript(
    ({ tok }) => {
      localStorage.setItem("wt_customer_access", tok);
      localStorage.setItem(
        "wt_customer_auth",
        JSON.stringify({
          state: {
            mode: "mobile",
            user: { id: "qa-account", name: "QA Account Tester", phone: "9000000001" },
            accessToken: tok,
            refreshToken: null,
          },
          version: 0,
        }),
      );
    },
    { tok: TOKEN },
  );
}

/** Click a button by visible text — the design-system Button renders no test id. */
async function clickButton(page, re) {
  return page.evaluate((src) => {
    const b = Array.from(document.querySelectorAll("button")).find((x) =>
      new RegExp(src, "i").test(x.innerText.trim()),
    );
    if (!b) return false;
    b.click();
    return true;
  }, re);
}

function watchErrors(page, sink) {
  page.setDefaultNavigationTimeout(180_000);
  // Fail fast on a missing locator — the default 30s per action, multiplied
  // over ten pages, looks exactly like a hung run.
  page.setDefaultTimeout(45_000);
  page.on("pageerror", (e) => sink.push({ code: 0, text: "PAGEERROR " + safe(e) }));
  page.on("console", (m) => {
    if (m.type() === "error") {
      const t = m.text();
      // Chrome reports a rejected fetch as a console line without the URL, so
      // classify it by the status it does name.
      const m401 = t.match(/status of 401/);
      sink.push({ code: m401 ? 401 : 0, text: "CONSOLE " + safe(t) });
    }
  });
  page.on("response", (r) => {
    if (r.status() >= 400) {
      sink.push({
        code: r.status(),
        text: `HTTP ${r.status()} ${r.url().replace(BASE, "").split("?")[0].slice(0, 80)}`,
      });
    }
  });
}

/** Booking tiles and the status filter share aria-pressed; tiles carry a number. */
const TILE_COUNT = `Array.from(document.querySelectorAll("button[aria-pressed]")).filter(b => /WT-[A-Z]{3}-\\d{4}-\\d{6}/.test(b.innerText)).length`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const allErrors = [];
  let expected401 = 0;
  let seen401 = 0;
  // A failed check must not leave Chrome holding the process open — that
  // turns one bad assertion into a run that appears to hang forever.
  try {
  // ── 1. Guests must not reach the booking list ─────────────────────────
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    page.setDefaultNavigationTimeout(180_000);
    let bookingCalls = 0;
    page.on("request", (r) => {
      if (r.url().includes("/me/bookings")) bookingCalls += 1;
    });
    await page.goto(`${BASE}/bookings`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(6000);
    const text = await page.evaluate(() => document.body.innerText);
    check("/bookings as guest shows the sign-in card", /sign in/i.test(text) && !/RECENT|No bookings yet/i.test(text));
    check("/bookings as guest never calls the bookings API", bookingCalls === 0);
    await ctx.close();
  }

  // ── 2. Authed passes ──────────────────────────────────────────────────
  for (const [width, height] of [[1440, 900], [390, 844]]) {
    const ctx = await browser.newContext({ viewport: { width, height } });
    await seedAuth(ctx);

    for (const path of ACCOUNT) {
      const page = await ctx.newPage();
      const sink = [];
      watchErrors(page, sink);
      await page.goto(BASE + path, { waitUntil: "domcontentloaded" });
      // Dev-mode compiles make a fixed sleep either too short or wasteful.
      // Wait for the tab shell specifically — a guard page simply has no nav,
      // and the next check reports that rather than a wrong anchor count.
      const hasShell = await page
        .waitForFunction(() => !!document.querySelector("nav[aria-label='Account sections']"), null, { timeout: 45_000 })
        .then(() => true)
        .catch(() => false);
      await page.waitForTimeout(2500);

      check(
        `${path} @${width} renders the account tabs${hasShell ? "" : " (no tab shell at all — guard page?)"}`,
        hasShell && (await page.evaluate(() => document.querySelectorAll("nav[aria-label='Account sections'] a").length)) === 5,
      );
      check(`${path} @${width} shows the signed-in customer, not a guard`, await page.evaluate(
        () => !/sign in to (view|manage|check)/i.test(document.body.innerText),
      ));
      check(`${path} @${width} fits the viewport`, await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ));

      if (path === "/profile") {
        // The old card painted an absolute gradient cover and hung the avatar
        // off the bottom edge under overflow-hidden, which clipped it.
        const geo = await page.evaluate(() => {
          const avatar = document.querySelector("main div[aria-label].rounded-full, aside div[aria-label].rounded-full");
          if (!avatar) return null;
          const card = avatar.closest("div[class*='rounded']")?.parentElement ?? avatar.parentElement;
          const host = card.getBoundingClientRect();
          const a = avatar.getBoundingClientRect();
          const covers = Array.from(
            (card ?? avatar.parentElement).querySelectorAll("*"),
          ).filter((el) => {
            const s = getComputedStyle(el);
            return s.position === "absolute" && /gradient/.test(s.backgroundImage) && el.offsetHeight > 0;
          }).length;
          return {
            inside: a.top >= host.top - 1 && a.left >= host.left - 1 && a.bottom <= host.bottom + 1 && a.right <= host.right + 1,
            covers,
          };
        });
        check("/profile avatar is fully inside its card", !!geo && geo.inside);
        check("/profile identity card has no absolute gradient cover", !!geo && geo.covers === 0);
        check("/profile mobile number is not prefixed with a hardcoded +91", await page.evaluate(
          () => !/\+91\s*\+?\d/.test(document.body.innerText),
        ));
      }

      if (path === "/bookings") {
        check("/bookings has no 320px rail grid", await page.evaluate(
          () => !/grid-cols-\[320px_1fr\]/.test(document.documentElement.innerHTML),
        ));
        const tiles = await page.evaluate(TILE_COUNT);
        check(`/bookings lists bookings (${tiles} selectable tiles)`, tiles > 0);

        // Search narrows the grid to the booking whose number you type.
        const firstNumber = await page.evaluate(() => {
          const m = document.body.innerText.match(/WT-[A-Z]{3}-\d{4}-\d{6}/);
          return m ? m[0] : null;
        });
        if (firstNumber) {
          await page.fill('input[aria-label="Search bookings"]', firstNumber);
          await page.waitForTimeout(900);
          const shown = await page.evaluate(TILE_COUNT);
          check(`/bookings search by a known number narrows the grid (${tiles} → ${shown})`, shown >= 1 && shown <= tiles);
          await page.fill('input[aria-label="Search bookings"]', "");
          await page.waitForTimeout(700);
          check("/bookings clearing the search restores the grid", await page.evaluate(TILE_COUNT) === tiles);
        }

        // The cancel flow must not be confirmable before a reason is typed.
        await page.evaluate(() => {
          const t = Array.from(document.querySelectorAll("button[aria-pressed]")).find((b) =>
            /WT-[A-Z]{3}-\d{4}-\d{6}/.test(b.innerText),
          );
          t?.click();
        });
        await page.waitForTimeout(1500);
        const cancelOpen = await clickButton(page, "^Cancel booking$");
        if (cancelOpen) {
          await page.waitForTimeout(1200);
          // More than one cancellable service opens a chooser first.
          if (await page.evaluate(() => /What would you like to cancel/.test(document.body.innerText))) {
            await clickButton(page, "^Entire booking$");
            await page.waitForTimeout(1500);
          }
          const gate = await page.evaluate(() => {
            const confirm = Array.from(document.querySelectorAll("button")).find((b) =>
              /Confirm & cancel/i.test(b.innerText),
            );
            return { found: !!confirm, disabled: confirm?.disabled ?? null, hasReason: !!document.querySelector("textarea") };
          });
          check("/bookings opens the cancellation confirm with a reason field", gate.found && gate.hasReason);
          check("/bookings confirm is disabled with no reason typed", gate.disabled === true);
          await page.evaluate(() => {
            const ta = document.querySelector("textarea");
            const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set;
            setter.call(ta, "QA probe — not submitting");
            ta.dispatchEvent(new Event("input", { bubbles: true }));
          });
          await page.waitForTimeout(500);
          check("/bookings confirm enables once a reason is typed", await page.evaluate(
            () => Array.from(document.querySelectorAll("button")).find((b) => /Confirm & cancel/i.test(b.innerText))?.disabled === false,
          ));
          await clickButton(page, "^Keep booking$");
          await page.waitForTimeout(700);
          check("/bookings backs out without cancelling anything", await page.evaluate(
            () => !/Confirm & cancel/i.test(document.body.innerText),
          ));
        } else {
          console.log(`     (/bookings @${width}: nothing cancellable to probe)`);
        }
      }

      if (path === "/wallet") {
        const body = await page.evaluate(() => document.body.innerText);
        check("/wallet has no invented transfer SLA", !/1[–-]3 business days/i.test(body));
        check("/wallet has no invented instant-use claim", !/instantly usable/i.test(body));
        check("/wallet shows the wallet status badge", await page.evaluate(
          () => /Active|Suspended/i.test(document.body.innerText) &&
            Array.from(document.querySelectorAll("span")).some((s) => /active|suspended/i.test(s.innerText) && /rounded-full/.test(s.className)),
        ));
      }

      if (path === "/notifications") {
        // Each unread row carries a dot with aria-label="Unread"; clicking a
        // row marks it read and deep-links to the booking, so go back after.
        const unreadOf = () => page.evaluate(() => document.querySelectorAll('[aria-label="Unread"]').length);
        const bellOf = () => page.evaluate(() => {
          const el = document.querySelector("header a[aria-label*='otifications']");
          if (!el) return null;
          const m = el.getAttribute("aria-label").match(/(\d+)/);
          return m ? Number(m[1]) : 0;
        });
        const unreadBefore = await unreadOf();
        const bellBefore = await bellOf();
        check(
          `/notifications renders the inbox (${unreadBefore} unread row(s), header badge ${bellBefore ?? "n/a"})`,
          await page.evaluate(() => /My Notifications|Inbox/i.test(document.body.innerText)),
        );
        if (unreadBefore > 0) {
          await page.evaluate(() => {
            const dot = document.querySelector('[aria-label="Unread"]');
            dot?.closest("button")?.click();
          });
          await page.waitForTimeout(2500);
          await page.goto(BASE + "/notifications", { waitUntil: "domcontentloaded" });
          await page.waitForTimeout(4000);
          const unreadAfter = await unreadOf();
          const bellAfter = await bellOf();
          check(`/notifications clicking a row marks it read (${unreadBefore} → ${unreadAfter} unread)`, unreadAfter === unreadBefore - 1);
          if (bellBefore !== null && bellAfter !== null) {
            check(`/notifications the header bell follows the read (${bellBefore} → ${bellAfter})`, bellAfter === bellBefore - 1);
          }
        } else {
          console.log(`     (/notifications @${width}: nothing unread to mark)`);
        }
      }

      if (path === "/account-security") {
        const s = await page.evaluate(() => {
          const rows = Array.from(document.querySelectorAll("li")).filter((li) =>
            /This device|Revoke|signed in here/i.test(li.innerText),
          );
          const here = rows.find((li) => /THIS DEVICE/i.test(li.innerText));
          return {
            rows: rows.length,
            thisDevice: (document.body.innerText.match(/THIS DEVICE/gi) || []).length,
            hereHasRevoke: here ? /Revoke/.test(here.innerText) : null,
            lastActive: /last active/i.test(document.body.innerText),
          };
        });
        check("/account-security marks exactly one current device", s.thisDevice === 1);
        check("/account-security offers no revoke on the current device", s.hereHasRevoke === false);
        check("/account-security shows one date, not created + last used", s.lastActive === false);
        check(`/account-security lists ${s.rows} session row(s)`, s.rows >= 1);

        // Client-side gate: a short new password cannot be submitted.
        const pw = page.locator("input[type='password']");
        if ((await pw.count()) >= 3) {
          await pw.nth(1).fill("short");
          await pw.nth(2).fill("short");
          await page.waitForTimeout(400);
          check("/account-security blocks submit on a short password", await page.evaluate(
            () => Array.from(document.querySelectorAll("button")).find((b) => /change password/i.test(b.innerText))?.disabled === true,
          ));

          // Server-side answer: a wrong current password must be shown, and
          // must NOT sign the customer out (the axios interceptor used to eat
          // this 401 as a dead session).
          await pw.nth(0).fill("definitely-not-the-current-password");
          await pw.nth(1).fill("Str0ng!Passphrase#1");
          await pw.nth(2).fill("Str0ng!Passphrase#1");
          await page.waitForTimeout(400);
          await clickButton(page, "change password");
          await page.waitForTimeout(3500);
          const err = await page.evaluate(() => {
            const box = Array.from(document.querySelectorAll("div")).find((d) => d.className.includes("bg-danger-soft"));
            return box ? box.innerText.replace(/\s+/g, " ").trim().slice(0, 80) : null;
          });
          check(`/account-security surfaces the wrong-password answer ("${safe(err ?? "")}")`, !!err && err.length > 0);
          // That probe is the only thing in this run allowed to 401: the
          // browser logs it twice (the response and a console line).
          expected401 += 2;
          check("/account-security stays signed in after a wrong password", await page.evaluate(
            () => !!localStorage.getItem("wt_customer_access"),
          ));
        }
      }

      seen401 += sink.filter((e) => e.code === 401).length;
      const real = sink.filter((e) => e.code !== 401);
      if (real.length) allErrors.push(`${path} @${width}: ${real.slice(0, 3).map((e) => e.text).join(" | ")}`);
      await page.screenshot({ path: `${OUT}/account-${path.slice(1)}-${width}.png`, fullPage: width === 1440 });
      await page.close();
    }
    await ctx.close();
  }

  check(`no unexpected page/console errors across the account area — ${allErrors.length ? safe(allErrors[0]) : "clean"}`, allErrors.length === 0);
  check(
    `the only rejected requests are the deliberate wrong-password probes (${seen401} seen / ${expected401} expected)`,
    seen401 === expected401,
  );
  console.log(`RESULT: ${checks} passed`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(String(error.message ?? error).replace(/\d{5,}/g, "[masked]"));
  process.exitCode = 1;
});
