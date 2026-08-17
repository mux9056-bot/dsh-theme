#!/usr/bin/env node
/**
 * Dev tool: screenshot the live DeepSeek Harness GUI with a theme applied.
 * Uses Chrome DevTools Protocol over a raw WebSocket (Node >= 22 has global WebSocket).
 *
 * Usage:
 *   node scripts/screenshot.mjs <themeId> <light|dark> [out.png]
 * Example:
 *   node scripts/screenshot.mjs ocean light shots/ocean-light.png
 *
 * Requires the DSH web GUI to be running (default http://127.0.0.1:3080).
 */
import { readFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const [themeId = "ocean", mode = "light", outArg] = process.argv.slice(2);
const out = outArg || join(ROOT, "shots", `${themeId}-${mode}.png`);
const GUI = process.env.DSH_URL || "http://127.0.0.1:3080";

const css = readFileSync(join(ROOT, "themes", `${themeId}.css`), "utf8");

const SHELL = join(
  process.env.HOME,
  "Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell"
);

function cdp(wsUrl) {
  let id = 0;
  const pending = new Map();
  const ws = new WebSocket(wsUrl);
  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
    }
  });
  const send = (method, params = {}, sessionId) =>
    new Promise((resolve, reject) => {
      const mid = ++id;
      pending.set(mid, { resolve, reject });
      ws.send(JSON.stringify({ id: mid, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
  const ready = new Promise((res, rej) => {
    ws.addEventListener("open", res);
    ws.addEventListener("error", rej);
  });
  return { send, ready, ws };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const port = 9200 + Math.floor(Math.random() * 200);
  console.log(`launching headless shell on :${port}…`);
  const proc = spawn(
    SHELL,
    [
      `--remote-debugging-port=${port}`,
      "--remote-allow-origins=*",
      "--headless",
      "--no-sandbox",
      "--in-process-gpu",
      "--disable-gpu",
      "--disable-software-rasterizer",
      "--disable-dev-shm-usage",
      "--no-first-run",
      "--no-default-browser-check",
      `--user-data-dir=/tmp/dsh-shot-${process.pid}`,
      "about:blank",
    ],
    { stdio: ["ignore", "ignore", "pipe"] }
  );
  proc.stderr.on("data", (d) => process.env.DSH_SHOT_DEBUG && process.stderr.write(d));

  // wait for the debugger endpoint
  let version = null;
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/json/version`);
      version = await r.json();
      break;
    } catch {
      await sleep(250);
    }
  }
  if (!version) {
    proc.kill();
    throw new Error(`chrome headless shell did not start on :${port}`);
  }

  const { send, ready } = cdp(version.webSocketDebuggerUrl);
  await ready;

  const { targetId } = await send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
  const S = (m, p) => send(m, p, sessionId);

  await S("Page.enable");
  await S("Runtime.enable");
  await S("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  await S("Page.navigate", { url: GUI });
  await sleep(3500); // let the SPA boot and paint

  // apply theme
  const apply = `
    (() => {
      const s = document.createElement('style');
      s.id = 'dsh-shot-style';
      s.textContent = ${JSON.stringify(css)};
      document.head.appendChild(s);
      document.body.setAttribute('data-dsh-theme', ${JSON.stringify(themeId)});
      ${mode === "dark" ? `document.body.setAttribute('data-ds-dark-theme','');` : `document.body.removeAttribute('data-ds-dark-theme');`}
      return { title: document.title, theme: document.body.getAttribute('data-dsh-theme'), dark: document.body.hasAttribute('data-ds-dark-theme') };
    })()
  `;
  const r = await S("Runtime.evaluate", { expression: apply, returnByValue: true });
  console.log("applied:", JSON.stringify(r.result?.value));

  // probe computed styles to prove the cascade really applies
  if (process.env.DSH_SHOT_PROBE) {
    const probe = await S("Runtime.evaluate", {
      expression: `(() => {
        const cs = getComputedStyle(document.body);
        const pick = (sel) => { const el = document.querySelector(sel); return el ? getComputedStyle(el).backgroundColor : null; };
        return {
          bodyBg: cs.backgroundColor,
          bodyColor: cs.color,
          tokenBg: cs.getPropertyValue('--dsw-alias-bg-base').trim(),
          tokenAccent: cs.getPropertyValue('--dsw-alias-brand-primary').trim(),
          tokenCode: cs.getPropertyValue('--dsw-alias-markdown-code-block').trim(),
          sidebar: pick('[class*="sidebar"], aside, nav'),
          input: pick('input, textarea'),
        };
      })()`,
      returnByValue: true,
    });
    console.log("probe:", JSON.stringify(probe.result?.value, null, 2));
  }
  await sleep(1200);

  const shot = await S("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  mkdirSync(dirname(out), { recursive: true });
  const { writeFileSync } = await import("node:fs");
  writeFileSync(out, Buffer.from(shot.data, "base64"));
  console.log("saved:", out);

  proc.kill();
  process.exit(0);
}

main().catch((e) => {
  console.error("screenshot failed:", e.message);
  process.exit(1);
});
