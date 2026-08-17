#!/usr/bin/env node
/**
 * Dev tool: integration-test the built client plugin (lib/client.js) against
 * the live DeepSeek Harness GUI via CDP.
 *
 * Simulates exactly what DSH's plugin loader does at boot:
 *   modules.materialize(id) -> module.exports.apply(ctx)
 * (the package.json "dsh.client" manifest + exports["./client"] entry is what
 *  makes DSH's server include this bundle in the boot manifest and call apply.)
 *
 * Usage: node scripts/plugintest.mjs
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const GUI = process.env.DSH_URL || "http://127.0.0.1:3080";
const clientJs = readFileSync(join(ROOT, "lib", "client.js"), "utf8");
const SHELL = join(
  process.env.HOME,
  "Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell"
);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const port = 9200 + Math.floor(Math.random() * 200);
  const proc = spawn(SHELL, [
    `--remote-debugging-port=${port}`, "--remote-allow-origins=*", "--headless",
    "--no-sandbox", "--in-process-gpu", "--disable-gpu", "--disable-software-rasterizer",
    "--no-first-run", "--no-default-browser-check", `--user-data-dir=/tmp/dsh-pt-${process.pid}`, "about:blank",
  ], { stdio: "ignore" });

  let version = null;
  for (let i = 0; i < 60; i++) {
    try { version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); break; }
    catch { await sleep(250); }
  }
  if (!version) throw new Error("shell did not start");

  let id = 0;
  const pending = new Map();
  const ws = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
  };
  const send = (method, params = {}, sessionId) => new Promise((res) => {
    const mid = ++id;
    pending.set(mid, res);
    ws.send(JSON.stringify({ id: mid, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
  const { targetId } = await send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
  const S = (m, p) => send(m, p, sessionId);
  const evalJs = async (expression) => {
    const r = await S("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || "eval error");
    return r.result?.value;
  };
  await S("Page.enable");
  await S("Runtime.enable");
  await S("Page.navigate", { url: GUI });
  await sleep(3500);

  // 1. register the bundle the way the boot manifest loader does
  const loaded = await evalJs(`new Promise((resolve) => {
    const s = document.createElement('script');
    s.textContent = ${JSON.stringify(clientJs)};
    s.onerror = () => resolve('script-error');
    document.head.appendChild(s);
    setTimeout(() => {
      try {
        const mod = window.__DSH_MODULES__.materialize('dsh-theme-pack');
        resolve({ factory: typeof mod.exports.apply === 'function', inject: Array.isArray(mod.exports.inject) });
      } catch (e) { resolve('materialize-error: ' + e.message); }
    }, 1500);
  })`);
  console.log("1. module registered + materialized:", JSON.stringify(loaded));

  // 2. call apply with a minimal ctx (DSH calls this at boot; provide/on are optional)
  const applied = await evalJs(`(() => {
    const mod = window.__DSH_MODULES__.materialize('dsh-theme-pack');
    let provided = null;
    const ctx = { provide: (k, v) => { provided = k; }, on: () => {} };
    mod.exports.apply(ctx);
    return {
      provided,
      fab: !!document.getElementById('dsh-theme-pack-fab'),
      items: document.querySelectorAll('#dsh-theme-pack-item').length,
      api: typeof window.dshThemePack,
    };
  })()`);
  console.log("2. apply(ctx):", JSON.stringify(applied));

  // 3. switch theme via API
  const setAurora = await evalJs(`(() => {
    window.dshThemePack.set('aurora');
    const cs = getComputedStyle(document.body);
    return { attr: document.body.getAttribute('data-dsh-theme'), bg: cs.backgroundColor, saved: localStorage.getItem('dsh-theme-pack:theme') };
  })()`);
  console.log("3. set('aurora'):", JSON.stringify(setAurora));

  // 4. dark mode via API
  const dark = await evalJs(`(() => {
    window.dshThemePack.setMode('dark');
    const cs = getComputedStyle(document.body);
    return { darkAttr: document.body.hasAttribute('data-ds-dark-theme'), bg: cs.backgroundColor, mode: window.dshThemePack.getMode() };
  })()`);
  console.log("4. setMode('dark'):", JSON.stringify(dark));

  // 5. cycle + reset
  const cyc = await evalJs(`(() => { const before = window.dshThemePack.get().id; window.dshThemePack.cycle(); return { before, after: window.dshThemePack.get().id }; })()`);
  console.log("5. cycle:", JSON.stringify(cyc));
  const reset = await evalJs(`(() => { window.dshThemePack.reset(); return { attr: document.body.getAttribute('data-dsh-theme'), cssLen: document.getElementById('dsh-theme-pack-style')?.textContent.length }; })()`);
  console.log("5b. reset:", JSON.stringify(reset));

  // 6. persistence: saved theme + re-apply after reload (plugin re-injected, as DSH would)
  await evalJs(`window.dshThemePack.set('sakura')`);
  const ls = await evalJs(`localStorage.getItem('dsh-theme-pack:theme')`);
  await S("Page.reload");
  await sleep(3500);
  const restored = await evalJs(`new Promise((resolve) => {
    const s = document.createElement('script');
    s.textContent = ${JSON.stringify(clientJs)};
    document.head.appendChild(s);
    setTimeout(() => {
      try {
        window.__DSH_MODULES__.materialize('dsh-theme-pack').exports.apply({ provide(){}, on(){} });
        resolve({ attr: document.body.getAttribute('data-dsh-theme'), cssLen: document.getElementById('dsh-theme-pack-style')?.textContent.length, fab: !!document.getElementById('dsh-theme-pack-fab') });
      } catch (e) { resolve('error: ' + e.message); }
    }, 1500);
  })`);
  console.log("6. after reload (persistence):", JSON.stringify(restored));

  proc.kill();
  const pass =
    loaded.factory === true && loaded.inject === true &&
    applied.fab === true && applied.items === 30 && applied.api === "object" && applied.provided === "themePack" &&
    setAurora.attr === "aurora" && setAurora.saved === "aurora" &&
    dark.darkAttr === true && dark.mode === "dark" &&
    cyc.after !== cyc.before && reset.attr === null &&
    ls === "sakura" && restored.attr === "sakura" && restored.fab === true;
  console.log(pass ? "\n✔ ALL PLUGIN TESTS PASSED" : "\n✘ SOME TESTS FAILED");
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error("plugintest failed:", e.message); process.exit(1); });
