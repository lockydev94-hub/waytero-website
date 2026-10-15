// Phase 3 verification: /offers/{slug} URL params must ride through the hotel
// booking flow — coupon auto-applies in the review modal, booking succeeds,
// server stamps offer attribution. Drives the dev server on :3000.
const { chromium } = require("C:/Users/Asus/node_modules/playwright");
const fs = require("fs");

const TOKEN = process.env.WT_CUSTOMER_TOKEN || fs.readFileSync("/tmp/wt_customer_token", "utf8").trim();
const BASE = "http://localhost:3000";
const OUT = __dirname + "/shots";
const URL_PATH =
  "/hotels/grand-imperial-hotel-bhubaneswar-bhubaneswar" +
  "?offer=smoke-grand-imperial-deluxe&coupon=STAYTEST10" +
  "&offer_name=Smoke%20Grand%20Imperial%20Deluxe";

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  // Logged-in state = zustand-persisted wt_customer_auth (auth.user gates the
  // review flow) + wt_customer_access (read by the axios interceptor).
  await ctx.addInitScript(
    ({ tok }) => {
      localStorage.setItem("wt_customer_access", tok);
      localStorage.setItem(
        "wt_customer_auth",
        JSON.stringify({
          state: {
            mode: "mobile",
            user: { id: "qa-offer-tester", name: "QA Offer Tester", phone: "9000000002" },
            accessToken: tok,
            refreshToken: null,
          },
          version: 0,
        }),
      );
    },
    { tok: TOKEN },
  );
  const page = await ctx.newPage();
  const log = (m) => console.log(m);

  await page.goto(BASE + URL_PATH, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(4000);

  // Click the Book now button; the review modal must show the room summary.
  const books = page.getByRole("button", { name: /Book now/i });
  const n = await books.count();
  log(`Book-now buttons: ${n}`);
  if (!n) { log("FAIL: no Book now button"); await browser.close(); process.exit(1); }
  await books.first().click();
  try {
    await page.getByText("Confirm your stay").waitFor({ timeout: 15000 });
  } catch {
    log("FAIL: review modal did not open");
    await page.screenshot({ path: `${OUT}/ride-fail.png` });
    await browser.close(); process.exit(1);
  }
  const modalText = await page.locator("div.fixed.inset-0.z-\\[600\\]").last().innerText().catch(() => "");
  log(`modal room line: ${/Deluxe King Room/.test(modalText) ? "Deluxe King Room" : "NOT FOUND — " + modalText.slice(0, 200)}`);

  // Seeded coupon must auto-apply (input pre-filled + "You save" line).
  const couponInput = page.locator('input[placeholder="Enter coupon code"]');
  const val = await couponInput.inputValue();
  log(`coupon input: "${val}"`);
  const viaChip = await page.getByText(/Via Offer:/).count();
  log(`via-offer chip present: ${viaChip > 0}`);
  await page.getByText(/You save/).first().waitFor({ timeout: 15000 }).then(
    async () => log("PASS: coupon auto-applied — " + (await page.getByText(/You save/).first().innerText()))
  ).catch(async () => {
    const err = await page.getByText(/Coupon not valid|valid only for/).first().innerText().catch(() => "(no error text found)");
    log(`FAIL: coupon did not apply. Inline error: ${err}`);
    await page.screenshot({ path: `${OUT}/ride-fail.png`, fullPage: false });
    await browser.close(); process.exit(1);
  });
  await page.screenshot({ path: `${OUT}/ride-hotel-modal.png` });

  // Fill guest + confirm.
  await page.locator('input[placeholder="Full name as per ID"]').fill("QA Offer Tester");
  await page.getByRole("button", { name: /Confirm & book/i }).click();
  await page.waitForTimeout(6000);
  const bodyText = await page.locator("body").innerText();
  const m = bodyText.match(/(HB-\S+|MB-\S+|booking [A-Z0-9-]+)/i);
  log(m ? `success reference: ${m[0]}` : "no booking ref matched — dumping modal area");
  const successVisible = await page.getByText(/Booking (Confirmed|Placed|created)|success/i).count();
  log(`success modal markers: ${successVisible}`);
  await page.screenshot({ path: `${OUT}/ride-hotel-success.png` });

  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
