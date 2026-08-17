/**
 * dsh-theme — DeepSeek Harness client plugin (self-contained, zero deps)
 * ----------------------------------------------------------------------
 * Packaging contract (mirrors @deepseek-ai/dsh-client-ui-theme):
 *   window.__ModuleLoader__.load({ id, factory })  with exports.inject = ["slots"]
 *   and exports.apply(ctx). Declared via package.json:
 *   "dsh": { "client": { "inject": ["slots"], "platform": "web", "immediately": true } }
 *
 * Integration model — DSH-native, no floating widgets:
 *   the plugin registers a "主题包 / Theme Pack" row into the built-in
 *   Settings → General item slot (settings.general.item), the same surface
 *   the stock Appearance row uses. Clicking a swatch applies the theme
 *   (body[data-dsh-theme] + the theme's CSS tokens), persisted to
 *   localStorage.
 *
 * Features:
 *   • 30 themes, each with light + dark variants driven by body[data-ds-dark-theme]
 *   • Settings → General row: swatch-card grid, mode toggle (auto/light/dark), reset
 *   • selection + mode persisted in localStorage
 *   • ctx.provide("dshTheme", api) + window.dshTheme for programmatic use
 *
 * This file is a template: the build script inlines the generated theme data
 * at the THEME_DATA marker (in the const THEMES assignment below). Do not edit lib/client.js directly.
 */
window.__ModuleLoader__.load({
  id: "dsh-theme",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

    /* inlined by scripts/build.mjs — array of
       { id, name, nameZh, desc, descZh, tags, swatch:{light:[bg,surface,accent,text],dark:[...]}, css } */
    const THEMES = __THEME_DATA__;

    /* ----------------------- platform modules ----------------------- */
    // `react` is a platform seed; the slots service arrives on ctx via the
    // inject: ["slots"] declaration.
    let React = null;
    try {
      const mod = require("react");
      React = mod && mod.default ? mod.default : mod;
    } catch {}

    const ATTR = "data-dsh-theme";
    const LS_THEME = "dsh-theme:theme";
    const LS_MODE = "dsh-theme:mode";
    const LS_LEGACY_THEME = "dsh-theme-pack:theme";
    const LS_LEGACY_MODE = "dsh-theme-pack:mode";

    let themeStyleEl = null;
    let active = null; // { id, name, nameZh }
    let mode = "system"; // system | light | dark
    const listeners = new Set();

    const zh = () => (document.documentElement.lang || "en").toLowerCase().startsWith("zh");

    function getSaved() {
      try {
        let theme = localStorage.getItem(LS_THEME) ?? localStorage.getItem(LS_LEGACY_THEME);
        let m = localStorage.getItem(LS_MODE) ?? localStorage.getItem(LS_LEGACY_MODE);
        // migrate legacy keys from the dsh-theme-pack era
        if (localStorage.getItem(LS_LEGACY_THEME) !== null && localStorage.getItem(LS_THEME) === null && theme) {
          localStorage.setItem(LS_THEME, theme);
        }
        if (localStorage.getItem(LS_LEGACY_MODE) !== null && localStorage.getItem(LS_MODE) === null && m) {
          localStorage.setItem(LS_MODE, m);
        }
        localStorage.removeItem(LS_LEGACY_THEME);
        localStorage.removeItem(LS_LEGACY_MODE);
        return { theme, mode: m };
      } catch {
        return { theme: null, mode: null };
      }
    }

    function applyTheme(id) {
      active = THEMES.find((t) => t.id === id) || null;
      if (active) {
        document.body.setAttribute(ATTR, active.id);
        if (themeStyleEl) themeStyleEl.textContent = active.css;
        try {
          localStorage.setItem(LS_THEME, active.id);
        } catch {}
      } else {
        document.body.removeAttribute(ATTR);
        if (themeStyleEl) themeStyleEl.textContent = "";
        try {
          localStorage.removeItem(LS_THEME);
        } catch {}
      }
      notify();
    }

    function applyMode(m) {
      mode = m === "light" || m === "dark" ? m : "system";
      if (mode === "light") document.body.removeAttribute("data-ds-dark-theme");
      else if (mode === "dark") document.body.setAttribute("data-ds-dark-theme", "");
      // system: leave the attribute to the built-in appearance setting
      try {
        if (mode === "system") localStorage.removeItem(LS_MODE);
        else localStorage.setItem(LS_MODE, mode);
      } catch {}
      notify();
    }

    function notify() {
      for (const fn of [...listeners]) {
        try {
          fn();
        } catch {}
      }
    }

    function subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    }

    /* ---------------------- settings row widget ---------------------- */

    // Row styles live in their own <style> element, separate from the active
    // theme's CSS, so they are never wiped by theme changes.
    const ROW_CSS = `
.dsh-theme-set{border-bottom:1px solid var(--dsw-alias-border-l2);flex-direction:column;gap:12px;padding:16px 0;display:flex}
.dsh-theme-set-head{justify-content:space-between;align-items:center;gap:12px;display:flex}
.dsh-theme-set-title{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:500;line-height:22px;display:flex;align-items:center;gap:6px}
.dsh-theme-set-count{color:var(--dsw-alias-label-tertiary);font-size:12px;font-weight:400}
.dsh-theme-set-modes{flex:none;border-radius:9px;background:var(--dsw-alias-bg-layer-3);padding:2px;gap:2px;display:flex}
.dsh-theme-set-modes button{border:none;background:transparent;cursor:pointer;font-size:12px;line-height:22px;padding:2px 10px;border-radius:7px;color:var(--dsw-alias-label-secondary)}
.dsh-theme-set-modes button:hover{color:var(--dsw-alias-label-primary)}
.dsh-theme-set-modes button[data-on="true"]{background:var(--dsw-alias-bg-multi-select);color:var(--dsw-alias-label-primary);box-shadow:inset 0 0 0 1px var(--dsw-alias-border-l2)}
.dsh-theme-set-grid{display:flex;flex-wrap:wrap;gap:8px;max-height:360px;overflow-y:auto;padding:2px}
.dsh-theme-set-grid::-webkit-scrollbar{width:8px}
.dsh-theme-set-grid::-webkit-scrollbar-thumb{border-radius:4px;background:var(--dsw-alias-scrollbar-bg-l1)}
.dsh-theme-set-grid::-webkit-scrollbar-thumb:hover{background:var(--dsw-alias-scrollbar-hover-l1)}
.dsh-theme-set-card{position:relative;box-sizing:border-box;width:108px;flex-direction:column;gap:6px;padding:8px;border-radius:12px;cursor:pointer;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);color:inherit;font:inherit;text-align:left;transition:border-color .15s,background .15s,transform .12s;display:flex}
.dsh-theme-set-card:hover{background:var(--dsw-alias-interactive-bg-hover);border-color:var(--dsw-alias-border-l2);transform:translateY(-1px)}
.dsh-theme-set-card[data-on="true"]{border-color:var(--dsw-alias-brand-primary);box-shadow:inset 0 0 0 1px var(--dsw-alias-brand-primary)}
.dsh-theme-set-prev{position:relative;height:40px;border-radius:8px;overflow:hidden;border:1px solid var(--dsw-alias-border-l1)}
.dsh-theme-set-prev .bar{position:absolute;inset:0;background:linear-gradient(120deg,var(--dt-bg) 0%,var(--dt-surface) 78%)}
.dsh-theme-set-prev .bub{position:absolute;left:7px;top:50%;transform:translateY(-50%);width:56%;height:15px;border-radius:6px;background:var(--dt-surface);box-shadow:0 1px 2px rgba(0,0,0,.14),inset 0 0 0 1px var(--dt-border)}
.dsh-theme-set-prev .bub::after{content:"";position:absolute;right:4px;top:3px;width:28%;height:5px;border-radius:3px;background:var(--dt-text2)}
.dsh-theme-set-prev .dot{position:absolute;right:7px;top:50%;transform:translateY(-50%);width:12px;height:12px;border-radius:50%;background:var(--dt-accent);box-shadow:0 0 0 2px var(--dt-surface)}
.dsh-theme-set-prev .chips{position:absolute;left:7px;bottom:4px;gap:3px;display:flex}
.dsh-theme-set-prev .chips i{width:13px;height:6px;border-radius:2px;display:block}
.dsh-theme-set-nm{color:var(--dsw-alias-label-secondary);font-size:11px;line-height:14px;text-align:center;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsh-theme-set-card[data-on="true"] .dsh-theme-set-nm{color:var(--dsw-alias-label-primary);font-weight:600}
.dsh-theme-set-foot{justify-content:space-between;align-items:center;gap:8px;display:flex}
.dsh-theme-set-hint{color:var(--dsw-alias-label-tertiary);font-size:11px}
.dsh-theme-set-reset{border:none;background:transparent;cursor:pointer;font-size:11px;color:var(--dsw-alias-label-tertiary);padding:2px 8px;border-radius:6px;transition:background .15s,color .15s}
.dsh-theme-set-reset:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
`;

    function ensureRowCss() {
      if (document.getElementById("dsh-theme-set-style")) return;
      const el = document.createElement("style");
      el.id = "dsh-theme-set-style";
      el.dataset.plugin = "dsh-theme";
      el.textContent = ROW_CSS;
      document.head.appendChild(el);
    }

    /**
     * React component rendered into Settings → General (settings.general.item).
     * Built with createElement (no JSX); state is local React state synced
     * through the plugin's tiny pub/sub so window.dshTheme.set() also
     * refreshes the row.
     */
    function ThemePackRow() {
      const [snap, setSnap] = React.useState({ theme: active ? active.id : null, mode, dark: document.body.hasAttribute("data-ds-dark-theme") });
      React.useEffect(() => {
        const update = () => setSnap({ theme: active ? active.id : null, mode, dark: document.body.hasAttribute("data-ds-dark-theme") });
        const unsub = subscribe(update);
        // Dark mode can be driven by our own toggle, the built-in Appearance
        // setting, or the OS scheme — observe the attribute so the card
        // previews follow the resolved state either way.
        const mo = new MutationObserver(update);
        mo.observe(document.body, { attributes: true, attributeFilter: ["data-ds-dark-theme", "data-dsh-theme"] });
        return () => {
          unsub();
          mo.disconnect();
        };
      }, []);
      const h = React.createElement;
      const on = (key) => snap.mode === key;
      const modeBtn = (key, label) =>
        h("button", { type: "button", "data-on": String(on(key)), onClick: () => applyMode(key) }, label);
      const card = (t) => {
        // Preview swatches follow the resolved dark state (not just our mode
        // preference), so the mini previews stop looking white in dark mode.
        const sw = snap.dark ? t.swatch.dark : t.swatch.light;
        const [bg, surface, accent, text] = sw;
        const border = snap.dark ? t.swatch.light[3] : t.swatch.dark[3];
        const selected = snap.theme === t.id;
        const prev = h("span", { className: "dsh-theme-set-prev", style: { "--dt-bg": bg, "--dt-surface": surface, "--dt-accent": accent, "--dt-text2": text, "--dt-border": border } }, [
          h("span", { className: "bar" }),
          h("span", { className: "bub" }),
          h("span", { className: "dot" }),
          h("span", { className: "chips" }, [bg, surface, accent].map((c) => h("i", { style: { background: c } }))),
        ]);
        return h(
          "button",
          { key: t.id, type: "button", className: "dsh-theme-set-card", "data-on": String(selected), title: `${t.nameZh} · ${t.name}`, onClick: () => applyTheme(t.id) },
          [prev, h("span", { className: "dsh-theme-set-nm" }, zh() ? t.nameZh : t.name)]
        );
      };
      return h("div", { className: "dsh-theme-set" }, [
        h("div", { className: "dsh-theme-set-head" }, [
          h("div", { className: "dsh-theme-set-title" }, [
            zh() ? "主题包" : "Theme Pack",
            h("span", { className: "dsh-theme-set-count" }, `${THEMES.length} ${zh() ? "款" : "themes"}`),
          ]),
          h("div", { className: "dsh-theme-set-modes" }, [modeBtn("system", zh() ? "自动" : "Auto"), modeBtn("light", zh() ? "浅色" : "Light"), modeBtn("dark", zh() ? "深色" : "Dark")]),
        ]),
        h("div", { className: "dsh-theme-set-grid" }, THEMES.map(card)),
        h("div", { className: "dsh-theme-set-foot" }, [
          h("span", { className: "dsh-theme-set-hint" }, zh() ? "选择即保存" : "Selection is saved automatically"),
          h("button", { type: "button", className: "dsh-theme-set-reset", onClick: () => applyTheme(null) }, zh() ? "恢复默认" : "Reset"),
        ]),
      ]);
    }

    /* ------------------------------ plugin ------------------------------ */

    function apply(ctx) {
      ensureRowCss();

      // active-theme styles — swapped on applyTheme()
      themeStyleEl = document.createElement("style");
      themeStyleEl.id = "dsh-theme-active-style";
      document.head.appendChild(themeStyleEl);

      // restore persisted state
      const saved = getSaved();
      applyMode(saved.mode || "system");
      applyTheme(saved.theme || null);

      const api = {
        list: () => THEMES.map((t) => ({ id: t.id, name: t.name, nameZh: t.nameZh, desc: t.desc, descZh: t.descZh, tags: t.tags })),
        get: () => (active ? { id: active.id, name: active.name, nameZh: active.nameZh } : null),
        set: (id) => {
          if (THEMES.some((t) => t.id === id)) applyTheme(id);
          else throw new Error(`unknown theme id: ${id}`);
        },
        reset: () => applyTheme(null),
        cycle: () => {
          const ids = THEMES.map((t) => t.id);
          const idx = active ? ids.indexOf(active.id) : -1;
          applyTheme(ids[(idx + 1) % ids.length]);
        },
        setMode: (m) => applyMode(m),
        getMode: () => mode,
      };

      window.dshTheme = api;
      // backward-compat alias from the dsh-theme-pack era
      window.dshThemePack = api;

      // DSH-native surface: register into Settings → General, next to the
      // stock Appearance row. React is a platform seed, so no dependencies.
      if (React && ctx && ctx.slots && typeof ctx.slots.inject === "function") {
        try {
          ctx.slots.inject("settings.general.item", () =>
            ctx.slots.register(
              {
                name: "settings.general.item",
                id: "theme-pack",
                order: 20,
              },
              ThemePackRow
            )
          );
        } catch (error) {
          console.error("[dsh-theme] settings row registration failed:", error);
        }
      } else {
        console.warn("[dsh-theme] slots service unavailable — theme row not registered; use window.dshTheme");
      }

      if (ctx && typeof ctx.provide === "function") {
        try {
          ctx.provide("dshTheme", api);
        } catch {}
      }
      if (ctx && typeof ctx.on === "function") {
        try {
          ctx.on("dispose", () => {
            themeStyleEl?.remove();
            document.getElementById("dsh-theme-set-style")?.remove();
            listeners.clear();
          });
        } catch {}
      }
    }

    exports.apply = apply;
    exports.inject = ["slots"];
    return module.exports;
  },
});
