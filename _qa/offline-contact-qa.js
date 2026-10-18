// ============================================================
// WAYTERO — CONTACT PAGE FALLBACK QA (backend unreachable)
//
// The owner's rule is that no contact detail on the site may be invented,
// and that nothing may render as a blank phone/email/address slot when the
// admin has not configured one. publicCmsService applies the brand-master
// fallback on the SERVER, and /contact is a server component — so a
// Playwright page.route() mock can never reach that path. This renders the
// page for real against an unreachable API instead.
//
//   node _qa/offline-contact-qa.js
//
// Uses port 3011 so it does not collide with the dev server on 3002.
// ============================================================

const { spawn, execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const PORT = 3011;
const BASE = `http://localhost:${PORT}`;
// A port nothing listens on: the fetch fails instead of returning a status,
// which is the worse of the two cases.
const DEAD_API = "http://127.0.0.1:9/api/v1";
// Two `next dev` processes in the same project share .next and wreck each
// other's chunks, so this one renders into its own output directory.
const DIST_DIR = ".next-offline-qa";
const BRAND = {
  phone: "7978322649",
  email: "support@waytero.com",
  address: "Avinue Appartment, Gothapatana, Bhubaneswar - 751003",
};
// Anything that must never appear because no one configured it.
const FABRICATED =
  /90000 00001|8480889870|1800-WAYTERO|(?:press|careers|security|privacy)@waytero\.com|CIN U63090|xxxx|lorem ipsum/i;

let checks = 0;
function check(name, value) {
  assert.ok(value, name);
  checks++;
  console.log(`PASS ${name}`);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForServer(child, timeoutMs = 180_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`server exited early (${child.exitCode})`);
    try {
      const res = await fetch(`${BASE}/`, { signal: AbortSignal.timeout(4000) });
      if (res.status < 500) return;
    } catch {
      /* not listening yet */
    }
    await sleep(2000);
  }
  throw new Error(`dev server did not come up on ${BASE}`);
}

// next spawns a worker of its own, so take the whole tree rather than just the
// handle we hold — a leftover listener would fail the next run.
function stopServer(child) {
  if (child.exitCode !== null) return;
  try {
    if (process.platform === "win32") {
      execFileSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore" });
    } else {
      child.kill("SIGTERM");
    }
  } catch {
    /* already gone */
  }
}

(async () => {
  // next's own CLI entry, run with this node binary — spawning npx.cmd needs
  // a shell on Windows and EINVALs without one.
  const child = spawn(
    process.execPath,
    [require.resolve("next/dist/bin/next"), "dev", "-p", String(PORT)],
    {
      cwd: path.resolve(__dirname, ".."),
      env: { ...process.env, NEXT_PUBLIC_API_URL: DEAD_API, WAYTERO_DIST_DIR: DIST_DIR },
      stdio: "ignore",
      windowsHide: true,
    },
  );
  try {
    await waitForServer(child);
    const html = await (await fetch(`${BASE}/contact`)).text();

    check("contact renders against an unreachable API", html.length > 10_000 && !/Application error|__next_error__/.test(html));
    check("contact: brand-master phone shown", html.includes(BRAND.phone));
    check("contact: brand-master email shown", html.includes(BRAND.email));
    check("contact: brand-master address shown", html.includes(BRAND.address));
    check("contact: a dialable tel: link still exists", /href="tel:\+?\d+"/.test(html));
    check("contact: nothing fabricated", !FABRICATED.test(html));
    check("contact: no empty contact slot", !/>\s*(N\/A|—|-)\s*<\/(p|span|div)>/.test(html));

    console.log(`RESULT: ${checks} passed`);
  } finally {
    stopServer(child);
    try {
      fs.rmSync(path.resolve(__dirname, "..", DIST_DIR), { recursive: true, force: true, maxRetries: 5, retryDelay: 400 });
    } catch {
      /* Windows can hold the lock for a moment; it is git-ignored either way */
    }
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
