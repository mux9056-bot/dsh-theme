/**
 * dsh-theme-pack — DeepSeek Harness client plugin (self-contained, zero deps)
 * ---------------------------------------------------------------------------
 * Packaging contract (mirrors @deepseek-ai/dsh-client-hmr):
 *   window.__ModuleLoader__.load({ id, factory })  with exports.inject = []
 *   and exports.apply(ctx). Declared via package.json:
 *   "dsh": { "client": { "inject": [], "platform": "web", "immediately": true } }
 *
 * Features:
 *   • 30 themes, each with light + dark variants driven by body[data-ds-dark-theme]
 *   • floating palette button (bottom-right) → theme picker panel
 *   • Ctrl/Cmd+Shift+T toggles the panel, Esc closes it
 *   • selection + mode persisted in localStorage
 *   • ctx.provide("themePack", api) + window.dshThemePack for programmatic use
 *
 * This file is a template: the build script inlines the generated theme data
 * at the THEME_DATA marker (in the const THEMES assignment below). Do not edit lib/client.js directly.
 */
window.__ModuleLoader__.load({
  id: "dsh-theme-pack",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

    /* inlined by scripts/build.mjs — array of
       { id, name, nameZh, desc, descZh, tags, swatch:{light:[bg,surface,accent,text],dark:[...]}, css } */
    const THEMES = __THEME_DATA__;

    const ATTR = "data-dsh-theme";
    const LS_THEME = "dsh-theme-pack:theme";
    const LS_MODE = "dsh-theme-pack:mode";

    let styleEl = null;
    let rootEl = null;
    let panelEl = null;
    let active = null; // { id, name }
    let mode = "system"; // system | light | dark
    let mounted = false;

    const zh = () => (document.documentElement.lang || "en").toLowerCase().startsWith("zh");

    function getSaved() {
      try {
        return { theme: localStorage.getItem(LS_THEME), mode: localStorage.getItem(LS_MODE) };
      } catch {
        return { theme: null, mode: null };
      }
    }

    function applyTheme(id) {
      active = THEMES.find((t) => t.id === id) || null;
      if (active) {
        document.body.setAttribute(ATTR, active.id);
        styleEl.textContent = active.css;
        try {
          localStorage.setItem(LS_THEME, active.id);
        } catch {}
      } else {
        document.body.removeAttribute(ATTR);
        styleEl.textContent = "";
        try {
          localStorage.removeItem(LS_THEME);
        } catch {}
      }
      syncPanel();
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
      syncPanel();
    }

    /* ------------------------------ widget ------------------------------ */

    const WIDGET_CSS = `
#dsh-theme-pack-fab{position:fixed;right:20px;bottom:20px;z-index:2147483000;width:44px;height:44px;
  border:1px solid var(--dsw-alias-border-l2);border-radius:50%;cursor:pointer;display:grid;place-items:center;
  background:var(--dsw-alias-bg-layer-2);box-shadow:var(--dsw-shadow-lv2);color:var(--dsw-alias-label-primary);
  font-size:20px;transition:transform .15s var(--ds-ease-in-out),background .15s}
#dsh-theme-pack-fab:hover{transform:scale(1.06);background:var(--dsw-alias-interactive-bg-hover)}
#dsh-theme-pack-panel{position:fixed;right:20px;bottom:76px;z-index:2147483001;width:340px;max-height:min(560px,70vh);
  display:none;flex-direction:column;box-sizing:border-box;padding:14px;gap:10px;overflow:hidden;
  background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-inverted);border-radius:16px;
  box-shadow:var(--dsw-shadow-lv3)}
#dsh-theme-pack-panel[data-open="true"]{display:flex}
#dsh-theme-pack-head{display:flex;align-items:center;justify-content:space-between;gap:8px}
#dsh-theme-pack-title{font-size:14px;font-weight:600;color:var(--dsw-alias-label-primary)}
#dsh-theme-pack-modes{display:flex;gap:2px;padding:2px;border-radius:8px;background:var(--dsw-alias-bg-layer-3)}
#dsh-theme-pack-modes button{border:none;background:transparent;cursor:pointer;font-size:12px;line-height:20px;
  padding:2px 8px;border-radius:6px;color:var(--dsw-alias-label-secondary)}
#dsh-theme-pack-modes button[data-on="true"]{background:var(--dsw-alias-bg-multi-select);
  color:var(--dsw-alias-label-primary);box-shadow:inset 0 0 0 1px var(--dsw-alias-border-l2)}
#dsh-theme-pack-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;overflow-y:auto;
  padding-right:4px;min-height:0}
#dsh-theme-pack-grid::-webkit-scrollbar{width:8px}
#dsh-theme-pack-grid::-webkit-scrollbar-thumb{border-radius:4px;background:var(--dsh-scrollbar-thumb)}
#dsh-theme-pack-grid::-webkit-scrollbar-thumb:hover{background:var(--dsh-scrollbar-thumb-hover)}
#dsh-theme-pack-item{display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px 6px;border-radius:12px;
  border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);cursor:pointer;color:inherit;font:inherit}
#dsh-theme-pack-item:hover{background:var(--dsw-alias-interactive-bg-hover)}
#dsh-theme-pack-item[data-on="true"]{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
#dsh-theme-pack-chips{display:flex;gap:4px}
#dsh-theme-pack-chips i{width:22px;height:14px;border-radius:4px;border:1px solid var(--dsw-alias-border-l2)}
#dsh-theme-pack-name{font-size:11px;line-height:14px;color:var(--dsw-alias-label-secondary);text-align:center;
  max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#dsh-theme-pack-item[data-on="true"] #dsh-theme-pack-name{color:var(--dsw-alias-label-primary)}
#dsh-theme-pack-foot{font-size:11px;color:var(--dsw-alias-label-tertiary)}
`;

    function mountWidget() {
      if (mounted) return;
      mounted = true;
      styleEl = document.createElement("style");
      styleEl.id = "dsh-theme-pack-style";
      document.head.appendChild(styleEl);
      styleEl.textContent = WIDGET_CSS;

      rootEl = document.createElement("div");
      rootEl.id = "dsh-theme-pack-root";

      const fab = document.createElement("button");
      fab.id = "dsh-theme-pack-fab";
      fab.title = zh() ? "切换主题 (Ctrl+Shift+T)" : "Switch theme (Ctrl+Shift+T)";
      fab.textContent = "🎨";
      fab.addEventListener("click", togglePanel);

      panelEl = document.createElement("div");
      panelEl.id = "dsh-theme-pack-panel";
      panelEl.setAttribute("data-open", "false");

      const head = document.createElement("div");
      head.id = "dsh-theme-pack-head";
      const title = document.createElement("div");
      title.id = "dsh-theme-pack-title";
      title.textContent = zh() ? "主题包 · " + THEMES.length + " 款" : "Theme Pack · " + THEMES.length;
      const modes = document.createElement("div");
      modes.id = "dsh-theme-pack-modes";
      const mk = (key, label) => {
        const b = document.createElement("button");
        b.textContent = label;
        b.dataset.key = key;
        b.addEventListener("click", () => applyMode(key));
        modes.appendChild(b);
        return b;
      };
      mk("system", zh() ? "自动" : "Auto");
      mk("light", zh() ? "浅色" : "Light");
      mk("dark", zh() ? "深色" : "Dark");
      head.append(title, modes);

      const grid = document.createElement("div");
      grid.id = "dsh-theme-pack-grid";
      for (const t of THEMES) {
        const item = document.createElement("button");
        item.id = "dsh-theme-pack-item";
        item.dataset.id = t.id;
        const chips = document.createElement("div");
        chips.id = "dsh-theme-pack-chips";
        const mkChip = (bg, fg) => {
          const i = document.createElement("i");
          i.style.background = bg;
          i.style.borderColor = fg;
          return i;
        };
        chips.append(mkChip(t.swatch.light[0], t.swatch.light[3]), mkChip(t.swatch.dark[0], t.swatch.dark[3]));
        const name = document.createElement("div");
        name.id = "dsh-theme-pack-name";
        name.textContent = zh() ? t.nameZh : t.name;
        item.append(chips, name);
        item.addEventListener("click", () => applyTheme(t.id));
        grid.appendChild(item);
      }

      const foot = document.createElement("div");
      foot.id = "dsh-theme-pack-foot";
      foot.textContent = zh() ? "Ctrl+Shift+T 呼出 · 选择即持久化" : "Ctrl+Shift+T to open · selection is saved";
      panelEl.append(head, grid, foot);

      rootEl.append(fab, panelEl);
      document.body.appendChild(rootEl);
    }

    function syncPanel() {
      if (!panelEl) return;
      for (const b of panelEl.querySelectorAll("#dsh-theme-pack-modes button")) {
        b.dataset.on = String(b.dataset.key === mode);
      }
      for (const item of panelEl.querySelectorAll("#dsh-theme-pack-item")) {
        item.dataset.on = String(active && item.dataset.id === active.id);
      }
    }

    function togglePanel() {
      const open = panelEl.getAttribute("data-open") !== "true";
      panelEl.setAttribute("data-open", String(open));
      syncPanel();
    }

    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "T" || e.key === "t")) {
        e.preventDefault();
        togglePanel();
      } else if (e.key === "Escape" && panelEl && panelEl.getAttribute("data-open") === "true") {
        panelEl.setAttribute("data-open", "false");
      }
    }

    /* ------------------------------ plugin ------------------------------ */

    function apply(ctx) {
      mountWidget();

      // restore persisted state
      const saved = getSaved();
      applyMode(saved.mode || "system");
      applyTheme(saved.theme || null);

      window.addEventListener("keydown", onKey);

      // avoid double-mounting on HMR re-apply
      if (rootEl && !rootEl.isConnected) document.body.appendChild(rootEl);

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

      window.dshThemePack = api;
      if (ctx && typeof ctx.provide === "function") {
        try {
          ctx.provide("themePack", api);
        } catch {}
      }
      if (ctx && typeof ctx.on === "function") {
        try {
          ctx.on("dispose", () => {
            window.removeEventListener("keydown", onKey);
            rootEl?.remove();
            styleEl?.remove();
            mounted = false;
          });
        } catch {}
      }
    }

    exports.apply = apply;
    exports.inject = [];
    return module.exports;
  },
});
