#!/usr/bin/env node
/**
 * dsh-theme build script
 * ---------------------------------
 * 1. Reads src/themes.json (30 themes, each with light/dark semantic slots)
 * 2. Maps slots -> real DSH CSS custom properties (--dsw-alias-* / --dsw-specific-* / --shiki-* / --dsw-linear-*)
 * 3. Emits:
 *      themes/<id>.css        one self-contained CSS file per theme (drop-in usable)
 *      themes/index.css       all 30 themes concatenated
 *      themes/manifest.json   machine-readable catalog (swatches + meta)
 *      lib/themes.data.json   runtime data for the client plugin
 *      lib/client.js          self-contained DSH client plugin (__ModuleLoader__ format)
 *
 * Usage:
 *   node scripts/build.mjs            full build
 *   node scripts/build.mjs --verify-only   re-validate emitted CSS tokens only
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src");
const THEMES_DIR = join(ROOT, "themes");
const LIB_DIR = join(ROOT, "lib");

/* ------------------------------------------------------------------ */
/* color helpers                                                       */
/* ------------------------------------------------------------------ */
function parseColor(c) {
  c = String(c).trim();
  if (c.startsWith("#")) {
    let h = c.slice(1);
    if (h.length === 3) h = h.split("").map((x) => x + x).join("");
    const n = parseInt(h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 };
  }
  const m = c.match(/rgba?\(([^)]+)\)/);
  if (!m) throw new Error(`cannot parse color: ${c}`);
  const parts = m[1].split(",").map((x) => parseFloat(x.trim()));
  return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
}
function rgb(c) {
  const p = parseColor(c);
  return `rgb(${Math.round(p.r)}, ${Math.round(p.g)}, ${Math.round(p.b)})`;
}
function alpha(c, a) {
  const p = parseColor(c);
  a = Math.max(0, Math.min(1, a));
  return `rgba(${Math.round(p.r)}, ${Math.round(p.g)}, ${Math.round(p.b)}, ${a.toFixed(3)})`;
}
function bumpAlpha(c, factor) {
  const p = parseColor(c);
  return alpha(c, Math.min(1, p.a * factor));
}
function mix(c, other, weightOfOther) {
  const a = parseColor(c);
  const b = parseColor(other);
  const w = Math.max(0, Math.min(1, weightOfOther));
  const m = (x, y) => Math.round(x + (y - x) * w);
  return `rgb(${m(a.r, b.r)}, ${m(a.g, b.g)}, ${m(a.b, b.b)})`;
}

/* ------------------------------------------------------------------ */
/* slot -> token mapping (mirrors the real DSH alias/specific layer)   */
/* ------------------------------------------------------------------ */
function buildTokens(s, dark) {
  const hover = dark ? 0.1 : 0.06;
  const active = dark ? 0.16 : 0.1;
  return {
    // backgrounds
    "--dsw-alias-bg-base": s.bg,
    "--dsw-alias-bg-layer-1": s.surface,
    "--dsw-alias-bg-layer-2": s.surface,
    "--dsw-alias-bg-layer-3": s.surfaceAlt,
    "--dsw-alias-bg-overlay": s.surfaceAlt,
    "--dsw-alias-bg-module-platform": s.surfaceAlt,
    "--dsw-alias-bg-multi-select": s.surfaceAlt,
    "--dsw-alias-bg-skeleton": alpha(s.text, dark ? 0.08 : 0.06),
    // borders
    "--dsw-alias-border-l1": bumpAlpha(s.border, 0.55),
    "--dsw-alias-border-l2": s.border,
    "--dsw-alias-border-l2-darkmode-thin": s.border,
    "--dsw-alias-border-l3": bumpAlpha(s.border, 1.6),
    "--dsw-alias-border-l4": bumpAlpha(s.border, 2.2),
    "--dsw-alias-border-inverted": alpha(s.text, dark ? 0.12 : 0.08),
    "--dsw-alias-border-inverted2": alpha(s.text, dark ? 0.12 : 0.08),
    // brand / buttons
    "--dsw-alias-brand-primary": s.accent,
    "--dsw-alias-brand-primary-invert": s.text,
    "--dsw-alias-brand-text": s.text,
    "--dsw-alias-button-primary-fill": s.accent,
    "--dsw-alias-button-primary-hover": s.accentHover,
    "--dsw-alias-button-primary-dimmed": alpha(s.accent, 0.14),
    "--dsw-alias-button-info-fill": s.accent,
    "--dsw-alias-button-info-hover": s.accentHover,
    "--dsw-alias-button-contrast-fill": s.text,
    "--dsw-alias-button-elevated-fill": s.surface,
    "--dsw-alias-button-floating-fill": s.surface,
    "--dsw-alias-button-floating-hover": s.surfaceAlt,
    "--dsw-alias-button-ghost-active-fill": s.surfaceAlt,
    "--dsw-alias-button-ghost-active-hover": s.surfaceAlt,
    "--dsw-alias-button-ghost-active-border": s.text3,
    "--dsw-alias-button-tool-bar-fill": alpha(s.text, 0.18),
    "--dsw-alias-button-tool-bar-fill-invisible": alpha(s.text, 0.1),
    "--dsw-alias-button-tool-bar-hover": alpha(s.text, 0.28),
    // labels
    "--dsw-alias-label-primary": s.text,
    "--dsw-alias-label-secondary": s.text2,
    "--dsw-alias-label-tertiary": s.text3,
    "--dsw-alias-label-caption": s.text3,
    "--dsw-alias-label-dimmed": alpha(s.text, 0.45),
    "--dsw-alias-label-primary-bluish": s.text,
    "--dsw-alias-label-primary-dimmed": s.text,
    "--dsw-alias-label-primary-foreground": s.accentText,
    "--dsw-alias-label-primary-inverted": s.accentText,
    // interactive
    "--dsw-alias-interactive-bg-hover": alpha(s.text, hover),
    "--dsw-alias-interactive-bg-active": alpha(s.text, active),
    "--dsw-alias-interactive-bg-hover-accent": alpha(s.accent, 0.12),
    "--dsw-alias-interactive-bg-hover-danger": alpha(s.error, 0.08),
    "--dsw-alias-interactive-bg-hover-solid": s.surfaceAlt,
    // markdown
    "--dsw-alias-markdown-code-block": s.code,
    "--dsw-alias-markdown-code-block-banner": s.codeBanner,
    "--dsw-alias-markdown-inline-code": s.code,
    "--dsw-alias-markdown-code-segment-selected": s.codeBanner,
    "--dsw-alias-markdown-code-segment-unselected": s.code,
    "--dsw-alias-markdown-citation": s.surfaceAlt,
    "--dsw-alias-markdown-placeholder": s.surfaceAlt,
    "--dsw-alias-markdown-tag": s.surfaceAlt,
    // states
    "--dsw-alias-state-business-primary": s.accent,
    "--dsw-alias-state-business-tertiary": alpha(s.accent, 0.14),
    "--dsw-alias-state-error-primary": s.error,
    "--dsw-alias-state-error-secondary": alpha(s.error, 0.75),
    "--dsw-alias-state-success-primary": s.success,
    "--dsw-alias-state-success-secondary": s.success,
    "--dsw-alias-state-success-tertiary": alpha(s.success, 0.14),
    "--dsw-alias-state-warn-primary": s.warn,
    "--dsw-alias-state-warn-secondary": s.warn,
    "--dsw-alias-state-warn-tertiary": alpha(s.warn, 0.16),
    "--dsw-alias-state-warn-label": s.warn,
    // misc alias
    "--dsw-alias-scrollbar-bg-l1": alpha(s.text, 0.12),
    "--dsw-alias-scrollbar-bg-l2": alpha(s.text, 0.12),
    "--dsw-alias-scrollbar-hover-l1": alpha(s.text, 0.22),
    "--dsw-alias-scrollbar-hover-l2": alpha(s.text, 0.22),
    "--dsw-alias-toast-bg": s.text,
    "--dsw-alias-tooltip-bg": s.text,
    // component-specific
    "--dsw-specific-bubble": s.code,
    "--dsw-specific-bubble-highlight": alpha(s.accent, 0.12),
    "--dsw-specific-input-major": s.surface,
    "--dsw-specific-login-input": s.surfaceAlt,
    "--dsw-specific-menu": s.surface,
    "--dsw-specific-selector": s.surfaceAlt,
    "--dsw-specific-sidebar-fill": s.sidebar,
    "--dsw-specific-sidebar-nav-item-active": alpha(s.text, 0.06),
    "--dsw-specific-sidebar-nav-item-active-accent": alpha(s.accent, 0.14),
    "--dsw-specific-sidebar-nav-item-hover": alpha(s.text, 0.05),
    "--dsw-specific-tip": s.surfaceAlt,
    // gradients
    "--dsw-linear-gradient-think": `linear-gradient(180deg, ${rgb(s.bg)} 20.19%, rgba(${parseColor(s.bg).r}, ${parseColor(s.bg).g}, ${parseColor(s.bg).b}, 0) 100%)`,
    "--dsw-linear-think-select": `linear-gradient(180deg, ${rgb(s.surfaceAlt)} 20.19%, rgba(${parseColor(s.surfaceAlt).r}, ${parseColor(s.surfaceAlt).g}, ${parseColor(s.surfaceAlt).b}, 0) 100%)`,
  };
}

/* default shiki syntax palettes (same as the shipped DSH defaults) */
const DEFAULT_SHIKI = {
  light: {
    constant: "#1c7ed6", string: "#2f9e44", comment: "#868e96", keyword: "#d6336c",
    parameter: "#e8590c", function: "#6741d9", "string-expression": "#2b8a3e",
    punctuation: "#495057", link: "#1971c2",
  },
  dark: {
    constant: "#4dabf7", string: "#69db7c", comment: "#adb5bd", keyword: "#faa2c1",
    parameter: "#ffa94d", function: "#b197fc", "string-expression": "#8ce99a",
    punctuation: "#ced4da", link: "#74c0fc",
  },
};

function shikiTokens(theme, dark) {
  const base = DEFAULT_SHIKI[dark ? "dark" : "light"];
  const over = (theme.shiki && theme.shiki[dark ? "dark" : "light"]) || {};
  const map = {
    constant: "--shiki-token-constant",
    string: "--shiki-token-string",
    comment: "--shiki-token-comment",
    keyword: "--shiki-token-keyword",
    parameter: "--shiki-token-parameter",
    function: "--shiki-token-function",
    "string-expression": "--shiki-token-string-expression",
    punctuation: "--shiki-token-punctuation",
    link: "--shiki-token-link",
  };
  const out = {};
  for (const [k, token] of Object.entries(map)) out[token] = over[k] || base[k];
  return out;
}

/* ------------------------------------------------------------------ */
/* per-theme CSS                                                       */
/* ------------------------------------------------------------------ */
function themeCss(t) {
  const light = buildTokens(t.light, false);
  const dark = buildTokens(t.dark, true);
  const shikiLight = shikiTokens(t, false);
  const shikiDark = shikiTokens(t, true);
  const block = (sel, toks) =>
    `${sel}{\n${Object.entries(toks)
      .map(([k, v]) => `  ${k}: ${v};`)
      .join("\n")}\n}`;
  return (
    `/* ${t.name} (${t.nameZh}) — dsh-theme */\n` +
    block(`body[data-dsh-theme="${t.id}"]`, light) +
    "\n" +
    block(`body[data-dsh-theme="${t.id}"][data-ds-dark-theme]`, dark) +
    "\n" +
    block(`body[data-dsh-theme="${t.id}"]`, shikiLight) +
    "\n" +
    block(`body[data-dsh-theme="${t.id}"][data-ds-dark-theme]`, shikiDark) +
    "\n"
  );
}

/* ------------------------------------------------------------------ */
/* runtime data for the client plugin                                  */
/* ------------------------------------------------------------------ */
function runtimeData(t) {
  const swatch = (s) => [s.bg, s.surface, s.accent, s.text];
  return {
    id: t.id,
    name: t.name,
    nameZh: t.nameZh,
    desc: t.desc,
    descZh: t.descZh,
    tags: t.tags,
    swatch: { light: swatch(t.light), dark: swatch(t.dark) },
    css: themeCss(t),
  };
}

/* ------------------------------------------------------------------ */
/* build                                                               */
/* ------------------------------------------------------------------ */
/**
* Fetch the token set of a RUNNING DSH web instance (index → asset CSS).
* Lets `--live` verify catch token drift against the actual deployment
* instead of the checked-in KNOWN_TOKENS snapshot.
*/
async function fetchLiveTokens() {
	const base = process.env.DSH_LIVE_URL || "http://127.0.0.1:3080";
	const index = await (await fetch(base + "/")).text();
	const assets = [...index.matchAll(/href="([^"]*\.css[^"]*)"/g)].map((m) => m[1]);
	let css = "";
	for (const asset of assets) {
		try {
			css += await (await fetch(base + asset)).text();
		} catch {}
	}
	if (!css) throw new Error(`no CSS assets fetched from ${base}`);
	return new Set(css.match(/--[a-z0-9-]+/g) ?? []);
}

/** Tokens referenced by the client plugin's own UI (ROW_CSS + previews). */
function clientPluginTokens() {
	const template = readFileSync(join(SRC, "client.template.js"), "utf8");
	const names = [...template.matchAll(/var\((--[a-z0-9-]+)/g)].map((m) => m[1]);
	return [...new Set(names)].filter((n) => n.startsWith("--dsw-") || n.startsWith("--shiki-"));
}

async function main() {
  const onlyVerify = process.argv.includes("--verify-only");
  const live = process.argv.includes("--live");
  const themes = JSON.parse(readFileSync(join(SRC, "themes.json"), "utf8")).themes;

  let tokenSet = KNOWN_TOKENS;
  if (live) {
    try {
      tokenSet = await fetchLiveTokens();
      console.log(`✔ --live: verified against running DSH CSS (${tokenSet.size} tokens)`);
    } catch (error) {
      console.warn(`⚠ --live fetch failed (${error.message}) — falling back to KNOWN_TOKENS`);
    }
  }

  if (onlyVerify) {
    const ok = verify(themes, tokenSet);
    process.exit(ok ? 0 : 1);
  }

  mkdirSync(THEMES_DIR, { recursive: true });
  mkdirSync(LIB_DIR, { recursive: true });

  // 1. per-theme css + all-in-one
  const all = [];
  for (const t of themes) {
    const css = themeCss(t);
    writeFileSync(join(THEMES_DIR, `${t.id}.css`), css);
    all.push(`/* ===== ${t.id} · ${t.name} (${t.nameZh}) ===== */\n${css}`);
  }
  writeFileSync(join(THEMES_DIR, "index.css"), all.join("\n"));

  // 2. manifest
  const manifest = themes.map((t) => ({
    id: t.id,
    name: t.name,
    nameZh: t.nameZh,
    desc: t.desc,
    descZh: t.descZh,
    tags: t.tags,
    swatch: {
      light: [t.light.bg, t.light.surface, t.light.accent, t.light.text],
      dark: [t.dark.bg, t.dark.surface, t.dark.accent, t.dark.text],
    },
  }));
  writeFileSync(join(THEMES_DIR, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

  // 3. runtime data
  const data = themes.map(runtimeData);
  writeFileSync(join(LIB_DIR, "themes.data.json"), JSON.stringify(data) + "\n");

  // 4. client plugin
  const template = readFileSync(join(SRC, "client.template.js"), "utf8");
  const client = template.replaceAll("__THEME_DATA__", () => JSON.stringify(data));
  writeFileSync(join(LIB_DIR, "client.js"), client);

  // 5. self-contained preview gallery (openable via file://)
  writeFileSync(join(ROOT, "preview.html"), buildPreviewHtml(themes, manifest));

  // 6. verify what we just emitted
  const ok = verify(themes);
  if (!ok) process.exit(1);

  console.log(
    `✔ built ${themes.length} themes → themes/*.css, themes/manifest.json, lib/themes.data.json, lib/client.js, preview.html`
  );
}

/* ------------------------------------------------------------------ */
/* self-contained preview gallery                                       */
/* ------------------------------------------------------------------ */
function buildPreviewHtml(themes, manifest) {
  const cards = manifest
    .map(
      (t, i) => `<button class="card" data-id="${t.id}" data-i="${i}">
        <span class="chips">
          ${t.swatch.light
            .map((c, k) => `<i style="background:${c}${k === 3 ? ';border:1px solid ' + t.swatch.light[3] : ''}"></i>`)
            .join("")}
          ${t.swatch.dark
            .map((c, k) => `<i style="background:${c}${k === 3 ? ';border:1px solid ' + t.swatch.dark[3] : ''}"></i>`)
            .join("")}
        </span>
        <span class="nm">${t.nameZh} <em>${t.name}</em></span>
        <span class="ds">${t.descZh}</span>
      </button>`
    )
    .join("");
  const opts = themes.map((t) => `<option value="${t.id}">${t.nameZh} · ${t.name}</option>`).join("");
  const css = themes.map(themeCss).join("\n");
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>dsh-theme · 30 主题预览</title>
<style>
  :root{color-scheme:light dark}
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"PingFang SC","Microsoft YaHei",sans-serif;
    margin:0;padding:32px 24px 80px;background:#f4f6f8;color:#1c2430;transition:background .2s,color .2s}
  body.dark{background:#14161a;color:#e8ecf2}
  header{max-width:1080px;margin:0 auto 20px}
  h1{font-size:24px;margin:0 0 4px}
  p.sub{color:#7b8694;margin:0 0 16px;font-size:14px}
  .bar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;max-width:1080px;margin:0 auto 20px}
  select{padding:8px 12px;border-radius:10px;border:1px solid #d4dae2;background:#fff;font-size:14px}
  .seg{display:inline-flex;border-radius:10px;overflow:hidden;border:1px solid #d4dae2}
  .seg button{border:none;padding:8px 16px;font-size:13px;cursor:pointer;background:#fff;color:#444}
  .seg button.on{background:#2563eb;color:#fff}
  .grid{max-width:1080px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px}
  .card{display:flex;flex-direction:column;gap:8px;padding:14px;border:1px solid #dde3ea;border-radius:14px;
    background:#fff;cursor:pointer;text-align:left;font:inherit;transition:transform .15s,box-shadow .15s}
  .card:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.08)}
  .card.on{outline:2px solid #2563eb}
  .chips{display:flex;gap:4px;flex-wrap:wrap}
  .chips i{width:34px;height:20px;border-radius:5px;display:inline-block}
  .nm{font-size:14px;font-weight:600}
  .nm em{font-weight:400;color:#8a93a0;font-style:normal;font-size:12px}
  .ds{font-size:12px;color:#8a93a0;line-height:1.5}
  /* live preview mock (uses the theme's own --dsw-* tokens) */
  .stage{max-width:1080px;margin:28px auto 0}
  .stage h2{font-size:15px;color:#7b8694;margin:0 0 10px}
  .mock{display:flex;border-radius:16px;overflow:hidden;border:1px solid var(--dsw-alias-border-l2);
    background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);box-shadow:0 16px 48px rgba(0,0,0,.18)}
  .m-side{flex:none;width:180px;background:var(--dsw-specific-sidebar-fill);padding:14px;display:flex;flex-direction:column;gap:8px}
  .m-side i{height:10px;border-radius:5px;background:var(--dsw-specific-sidebar-nav-item-active);display:block}
  .m-side i:first-child{background:var(--dsw-alias-brand-primary);height:14px;width:60%}
  .m-main{flex:1;padding:16px;display:flex;flex-direction:column;gap:10px;min-width:0}
  .m-row{display:flex;gap:8px}
  .m-ava{flex:none;width:26px;height:26px;border-radius:50%;background:var(--dsw-alias-button-info-fill)}
  .m-bubble{flex:1;padding:10px 12px;border-radius:12px;font-size:13px;line-height:1.6;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1)}
  .m-bubble.user{background:var(--dsw-specific-bubble);border-color:transparent}
  .m-code{margin-top:8px;padding:10px 12px;border-radius:10px;background:var(--dsw-alias-markdown-code-block);
    font:12px/1.7 ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--dsw-alias-label-primary);overflow-x:auto}
  .m-code b{color:var(--shiki-token-keyword);font-weight:400}
  .m-code s{color:var(--shiki-token-string);text-decoration:none}
  .m-in{display:flex;gap:8px;margin-top:4px}
  .m-in i{flex:1;height:34px;border-radius:10px;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l2)}
  .m-in b{flex:none;width:70px;border-radius:10px;background:var(--dsw-alias-button-primary-fill);
    color:var(--dsw-alias-label-primary-foreground);display:grid;place-items:center;font-size:12px}
  .tag{display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;background:var(--dsw-alias-interactive-bg-hover-accent);color:var(--dsw-alias-label-secondary);margin-top:2px}
</style>
</head>
<body data-dsh-theme="${themes[0].id}">
<header>
  <h1>🎨 dsh-theme — DeepSeek Harness 30 主题</h1>
  <p class="sub">点击卡片预览；浅色/深色即时切换。所有主题均直接映射 DSH 官方 CSS 变量（--dsw-alias-* / --dsw-specific-* / --shiki-*）。</p>
</header>
<div class="bar">
  <select id="sel">${opts}</select>
  <span class="seg" id="seg">
    <button data-m="light" class="on">浅色</button>
    <button data-m="dark">深色</button>
  </span>
  <span class="tag">已选：<span id="cur">${themes[0].nameZh} · ${themes[0].name}</span></span>
</div>
<div class="grid" id="grid">${cards}</div>
<div class="stage">
  <h2>实时预览（模拟 DSH 会话界面）</h2>
  <div class="mock">
    <div class="m-side"><i></i><i></i><i></i><i></i><i></i></div>
    <div class="m-main">
      <div class="m-row"><span class="m-ava"></span><div class="m-bubble user">帮我写一个 <b>DeepSeek Harness</b> 主题插件</div></div>
      <div class="m-row"><span class="m-ava"></span><div class="m-bubble">
        好的，这是一个 30 主题包，全部映射到 DSH 的设计令牌：
        <div class="m-code"><b>const</b> theme = <s>"aurora"</s>;<br>document.body.<b>setAttribute</b>(<s>'data-dsh-theme'</s>, theme);</div>
      </div></div>
      <div class="m-in"><i></i><b>发送</b></div>
    </div>
  </div>
</div>
<style id="theme-css">${css}</style>
<script>
  const MANIFEST = ${JSON.stringify(manifest)};
  const seg = document.getElementById('seg');
  const sel = document.getElementById('sel');
  const grid = document.getElementById('grid');
  function apply(id, dark){
    document.body.setAttribute('data-dsh-theme', id);
    document.body.classList.toggle('dark', dark);
    document.body.toggleAttribute('data-ds-dark-theme', dark);
    document.querySelectorAll('.card').forEach(c => c.classList.toggle('on', c.dataset.id === id));
    const t = MANIFEST.find(m => m.id === id);
    document.getElementById('cur').textContent = (t.nameZh + ' · ' + t.name);
    seg.querySelectorAll('button').forEach(b => b.classList.toggle('on', (b.dataset.m === 'dark') === dark));
  }
  sel.addEventListener('change', () => apply(sel.value, seg.querySelector('button.on').dataset.m === 'dark'));
  grid.addEventListener('click', e => { const c = e.target.closest('.card'); if(c){ sel.value = c.dataset.id; apply(c.dataset.id, seg.querySelector('button.on').dataset.m === 'dark'); } });
  seg.addEventListener('click', e => { const b = e.target.closest('button'); if(b) apply(sel.value, b.dataset.m === 'dark'); });
  apply('${themes[0].id}', false);
</script>
</body>
</html>
`;
}

/* ------------------------------------------------------------------ */
/* verification: every emitted token must be a real DSH token          */
/* ------------------------------------------------------------------ */
const KNOWN_TOKENS = new Set(`
--dsw-alias-bg-base --dsw-alias-bg-layer-1 --dsw-alias-bg-layer-2 --dsw-alias-bg-layer-3
--dsw-alias-bg-overlay --dsw-alias-bg-module-platform --dsw-alias-bg-multi-select --dsw-alias-bg-skeleton
--dsw-alias-border-l1 --dsw-alias-border-l2 --dsw-alias-border-l2-darkmode-thin --dsw-alias-border-l3 --dsw-alias-border-l4
--dsw-alias-border-inverted --dsw-alias-border-inverted2
--dsw-alias-brand-primary --dsw-alias-brand-primary-invert --dsw-alias-brand-text
--dsw-alias-button-primary-fill --dsw-alias-button-primary-hover --dsw-alias-button-primary-dimmed
--dsw-alias-button-info-fill --dsw-alias-button-info-hover --dsw-alias-button-contrast-fill
--dsw-alias-button-elevated-fill --dsw-alias-button-floating-fill --dsw-alias-button-floating-hover
--dsw-alias-button-ghost-active-fill --dsw-alias-button-ghost-active-hover --dsw-alias-button-ghost-active-border
--dsw-alias-button-tool-bar-fill --dsw-alias-button-tool-bar-fill-invisible --dsw-alias-button-tool-bar-hover
--dsw-alias-label-primary --dsw-alias-label-secondary --dsw-alias-label-tertiary --dsw-alias-label-caption
--dsw-alias-label-dimmed --dsw-alias-label-primary-bluish --dsw-alias-label-primary-dimmed
--dsw-alias-label-primary-foreground --dsw-alias-label-primary-inverted
--dsw-alias-interactive-bg-hover --dsw-alias-interactive-bg-active --dsw-alias-interactive-bg-hover-accent
--dsw-alias-interactive-bg-hover-danger --dsw-alias-interactive-bg-hover-solid
--dsw-alias-markdown-code-block --dsw-alias-markdown-code-block-banner --dsw-alias-markdown-inline-code
--dsw-alias-markdown-code-segment-selected --dsw-alias-markdown-code-segment-unselected
--dsw-alias-markdown-citation --dsw-alias-markdown-placeholder --dsw-alias-markdown-tag
--dsw-alias-state-business-primary --dsw-alias-state-business-tertiary
--dsw-alias-state-error-primary --dsw-alias-state-error-secondary
--dsw-alias-state-success-primary --dsw-alias-state-success-secondary --dsw-alias-state-success-tertiary
--dsw-alias-state-warn-primary --dsw-alias-state-warn-secondary --dsw-alias-state-warn-tertiary --dsw-alias-state-warn-label
--dsw-alias-scrollbar-bg-l1 --dsw-alias-scrollbar-bg-l2 --dsw-alias-scrollbar-hover-l1 --dsw-alias-scrollbar-hover-l2
--dsw-alias-toast-bg --dsw-alias-tooltip-bg
--dsw-specific-bubble --dsw-specific-bubble-highlight --dsw-specific-input-major --dsw-specific-login-input
--dsw-specific-menu --dsw-specific-selector --dsw-specific-sidebar-fill
--dsw-specific-sidebar-nav-item-active --dsw-specific-sidebar-nav-item-active-accent --dsw-specific-sidebar-nav-item-hover
--dsw-specific-tip
--dsw-linear-gradient-think --dsw-linear-think-select
--shiki-token-constant --shiki-token-string --shiki-token-comment --shiki-token-keyword --shiki-token-parameter
--shiki-token-function --shiki-token-string-expression --shiki-token-punctuation --shiki-token-link
`.trim().split(/\s+/));

function verify(themes, tokenSet = KNOWN_TOKENS) {
  let bad = 0;
  const checkNames = (label, names) => {
    const unknown = [...new Set(names)].filter((n) => !tokenSet.has(n));
    if (unknown.length) {
      bad++;
      console.error(`✘ ${label}: unknown tokens → ${unknown.join(", ")}`);
    }
  };
  for (const t of themes) {
    const css = themeCss(t);
    const names = [...css.matchAll(/(--[a-z0-9-]+)/g)].map((m) => m[1]);
    checkNames(t.id, names);
    // brace balance
    const open = (css.match(/\{/g) || []).length;
    const close = (css.match(/\}/g) || []).length;
    if (open !== close) {
      bad++;
      console.error(`✘ ${t.id}: unbalanced braces (${open} vs ${close})`);
    }
  }
  // the client plugin's own UI tokens must exist in the DSH token set too
  checkNames("client.template.js (settings row)", clientPluginTokens());
  if (!bad) console.log("✔ token verification passed for all themes + client UI");
  else console.error(`✘ verification failed for ${bad} item(s)`);
  return bad === 0;
}

await main();
