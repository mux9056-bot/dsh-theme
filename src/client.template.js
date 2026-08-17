/**
 * dsh-theme — DeepSeek Harness client plugin (self-contained, zero deps)
 * ----------------------------------------------------------------------
 * Packaging contract (mirrors @deepseek-ai/dsh-client-hmr):
 *   window.__ModuleLoader__.load({ id, factory })  with exports.inject = []
 *   and exports.apply(ctx). Declared via package.json:
 *   "dsh": { "client": { "inject": [], "platform": "web", "immediately": true } }
 *
 * Features:
 *   • 30 themes, each with light + dark variants driven by body[data-ds-dark-theme]
 *   • right-edge floating 🎨 button; click opens a slide-in swatch panel
 *   • Ctrl/Cmd+Shift+T toggles the panel, Esc / click-outside closes it
 *   • selection + mode persisted in localStorage
 *   • ctx.provide("dshTheme", api) + window.dshTheme for programmatic use
 *
 * This file is a template: the build script inlines the generated theme data
 * at the THEME_DATA marker (in the const THEMES assignment below). Do not edit lib/client.js directly.
 *
 * Widget CSS lives in its own <style> element that is never rewritten; the
 * active theme's CSS lives in a second <style> element (cleared when no theme
 * is selected). Keeping them separate is what keeps the widget styled even
 * when no theme is active.
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

    const ATTR = "data-dsh-theme";
    const LS_THEME = "dsh-theme:theme";
    const LS_MODE = "dsh-theme:mode";
    const LS_LEGACY_THEME = "dsh-theme-pack:theme";
    const LS_LEGACY_MODE = "dsh-theme-pack:mode";

    let widgetStyleEl = null;
    let themeStyleEl = null;
    let rootEl = null;
    let panelEl = null;
    let active = null; // { id, name }
    let mode = "system"; // system | light | dark
    let mounted = false;

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
        themeStyleEl.textContent = active.css;
        try {
          localStorage.setItem(LS_THEME, active.id);
        } catch {}
      } else {
        document.body.removeAttribute(ATTR);
        themeStyleEl.textContent = "";
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
#dsh-theme-root{position:fixed;inset:0;z-index:2147483000;pointer-events:none}
#dsh-theme-fab{position:fixed;right:10px;top:50%;transform:translateY(-50%);width:44px;height:44px;
  box-sizing:border-box;border-radius:50%;border:1px solid var(--dsw-alias-border-l2);
  background:var(--dsw-alias-bg-layer-2);box-shadow:0 6px 20px rgba(0,0,0,.16),0 0 0 0 rgba(0,0,0,0);
  cursor:pointer;display:grid;place-items:center;font-size:20px;line-height:1;color:var(--dsw-alias-label-primary);
  pointer-events:auto;user-select:none;transition:transform .28s cubic-bezier(.34,1.45,.64,1),background .2s,box-shadow .25s,opacity .3s}
#dsh-theme-fab:hover{transform:translateY(-50%) scale(1.1);background:var(--dsw-alias-interactive-bg-hover);
  box-shadow:0 10px 28px rgba(0,0,0,.22),0 0 0 4px var(--dsw-alias-interactive-bg-hover-accent)}
#dsh-theme-fab[data-open="true"]{transform:translateY(-50%) scale(1.02)}
#dsh-theme-fab[data-open="true"] .dsh-theme-fab-icon{transform:rotate(135deg)}
.dsh-theme-fab-icon{transition:transform .3s cubic-bezier(.34,1.45,.64,1)}
#dsh-theme-panel{position:fixed;right:64px;top:50%;width:372px;max-width:calc(100vw - 88px);
  max-height:min(660px,82vh);box-sizing:border-box;padding:16px 16px 12px;display:flex;flex-direction:column;gap:12px;
  background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l2);border-radius:18px;
  box-shadow:0 24px 64px rgba(0,0,0,.3);pointer-events:auto;
  transform:translateY(-50%) translateX(24px) scale(.96);opacity:0;visibility:hidden;
  transition:transform .3s cubic-bezier(.3,1.35,.55,1),opacity .22s ease,visibility .22s}
#dsh-theme-panel[data-open="true"]{transform:translateY(-50%) translateX(0) scale(1);opacity:1;visibility:visible}
#dsh-theme-head{display:flex;align-items:center;justify-content:space-between;gap:10px}
#dsh-theme-title{font-size:14px;font-weight:600;color:var(--dsw-alias-label-primary);display:flex;align-items:center;gap:6px}
#dsh-theme-title .dsh-theme-count{font-size:11px;font-weight:400;color:var(--dsw-alias-label-tertiary)}
#dsh-theme-close{border:none;background:transparent;cursor:pointer;color:var(--dsw-alias-label-tertiary);
  font-size:15px;line-height:1;padding:4px;border-radius:6px;display:grid;place-items:center;transition:background .15s,color .15s}
#dsh-theme-close:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
#dsh-theme-modes{display:flex;gap:2px;padding:2px;border-radius:9px;background:var(--dsw-alias-bg-layer-3)}
#dsh-theme-modes button{border:none;background:transparent;cursor:pointer;font-size:12px;line-height:22px;
  padding:2px 10px;border-radius:7px;color:var(--dsw-alias-label-secondary);transition:background .15s,color .15s}
#dsh-theme-modes button:hover{color:var(--dsw-alias-label-primary)}
#dsh-theme-modes button[data-on="true"]{background:var(--dsw-alias-bg-multi-select);
  color:var(--dsw-alias-label-primary);box-shadow:inset 0 0 0 1px var(--dsw-alias-border-l2)}
#dsh-theme-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;overflow-y:auto;min-height:0;padding:2px 4px 2px 2px}
#dsh-theme-grid::-webkit-scrollbar{width:8px}
#dsh-theme-grid::-webkit-scrollbar-thumb{border-radius:4px;background:var(--dsw-alias-scrollbar-bg-l1)}
#dsh-theme-grid::-webkit-scrollbar-thumb:hover{background:var(--dsw-alias-scrollbar-hover-l1)}
#dsh-theme-card{display:flex;flex-direction:column;gap:5px;padding:8px;border-radius:12px;cursor:pointer;
  border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);color:inherit;font:inherit;
  text-align:left;transition:border-color .15s,background .15s,transform .12s}
#dsh-theme-card:hover{background:var(--dsw-alias-interactive-bg-hover);border-color:var(--dsw-alias-border-l2);transform:translateY(-1px)}
#dsh-theme-card[data-on="true"]{border-color:var(--dsw-alias-brand-primary);box-shadow:inset 0 0 0 1px var(--dsw-alias-brand-primary)}
.dsh-theme-prev{position:relative;height:34px;border-radius:8px;overflow:hidden;border:1px solid var(--dsw-alias-border-l1)}
.dsh-theme-prev .bar{position:absolute;inset:0;background:linear-gradient(120deg,var(--dt-bg) 0%,var(--dt-surface) 78%)}
.dsh-theme-prev .bub{position:absolute;left:7px;top:50%;transform:translateY(-50%);width:52%;height:14px;border-radius:6px;
  background:var(--dt-surface);box-shadow:0 1px 2px rgba(0,0,0,.14),inset 0 0 0 1px var(--dt-border)}
.dsh-theme-prev .bub::after{content:"";position:absolute;right:4px;top:3px;width:26%;height:5px;border-radius:3px;background:var(--dt-text2)}
.dsh-theme-prev .dot{position:absolute;right:7px;top:50%;transform:translateY(-50%);width:11px;height:11px;border-radius:50%;
  background:var(--dt-accent);box-shadow:0 0 0 2px color-mix(in srgb, var(--dt-surface) 80%, transparent)}
.dsh-theme-prev .chips{position:absolute;left:7px;bottom:4px;display:flex;gap:3px}
.dsh-theme-prev .chips i{width:12px;height:6px;border-radius:2px;display:block}
#dsh-theme-card[data-on="true"] .dsh-theme-check{position:absolute;right:4px;top:4px;width:16px;height:16px;border-radius:50%;
  background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary-foreground);display:grid;place-items:center;
  font-size:10px;font-weight:700;box-shadow:0 2px 6px rgba(0,0,0,.25);z-index:1}
.dsh-theme-check{display:none}
#dsh-theme-card[data-on="true"] .dsh-theme-check{display:grid}
.dsh-theme-nm{font-size:11px;line-height:14px;color:var(--dsw-alias-label-secondary);text-align:center;
  max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#dsh-theme-card[data-on="true"] .dsh-theme-nm{color:var(--dsw-alias-label-primary);font-weight:600}
#dsh-theme-foot{display:flex;align-items:center;justify-content:space-between;gap:8px;padding-top:2px}
#dsh-theme-hint{font-size:11px;color:var(--dsw-alias-label-tertiary)}
#dsh-theme-reset{border:none;background:transparent;cursor:pointer;font-size:11px;color:var(--dsw-alias-label-tertiary);
  padding:2px 8px;border-radius:6px;transition:background .15s,color .15s}
#dsh-theme-reset:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
`;

    function mountWidget() {
      if (mounted) return;
      mounted = true;

      // widget styles — never rewritten after mount
      widgetStyleEl = document.createElement("style");
      widgetStyleEl.id = "dsh-theme-style";
      widgetStyleEl.dataset.plugin = "dsh-theme";
      widgetStyleEl.textContent = WIDGET_CSS;
      document.head.appendChild(widgetStyleEl);

      // active-theme styles — swapped on applyTheme()
      themeStyleEl = document.createElement("style");
      themeStyleEl.id = "dsh-theme-active-style";
      document.head.appendChild(themeStyleEl);

      rootEl = document.createElement("div");
      rootEl.id = "dsh-theme-root";

      const fab = document.createElement("button");
      fab.id = "dsh-theme-fab";
      fab.type = "button";
      fab.title = zh() ? "切换主题 (Ctrl+Shift+T)" : "Switch theme (Ctrl+Shift+T)";
      fab.setAttribute("aria-label", fab.title);
      const icon = document.createElement("span");
      icon.className = "dsh-theme-fab-icon";
      icon.textContent = "🎨";
      fab.appendChild(icon);
      fab.addEventListener("click", togglePanel);

      panelEl = document.createElement("div");
      panelEl.id = "dsh-theme-panel";
      panelEl.setAttribute("data-open", "false");

      const head = document.createElement("div");
      head.id = "dsh-theme-head";
      const title = document.createElement("div");
      title.id = "dsh-theme-title";
      title.textContent = zh() ? "主题" : "Themes";
      const count = document.createElement("span");
      count.className = "dsh-theme-count";
      count.textContent = THEMES.length + " 款";
      title.appendChild(count);
      const close = document.createElement("button");
      close.id = "dsh-theme-close";
      close.type = "button";
      close.textContent = "✕";
      close.title = zh() ? "关闭 (Esc)" : "Close (Esc)";
      close.addEventListener("click", () => setPanelOpen(false));
      head.append(title, close);

      const modes = document.createElement("div");
      modes.id = "dsh-theme-modes";
      const mk = (key, label) => {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = label;
        b.dataset.key = key;
        b.addEventListener("click", () => applyMode(key));
        modes.appendChild(b);
        return b;
      };
      mk("system", zh() ? "自动" : "Auto");
      mk("light", zh() ? "浅色" : "Light");
      mk("dark", zh() ? "深色" : "Dark");

      const grid = document.createElement("div");
      grid.id = "dsh-theme-grid";
      for (const t of THEMES) {
        const [bg, surface, accent, text] = t.swatch.light;
        const [, , , textDark] = t.swatch.dark;
        const item = document.createElement("button");
        item.id = "dsh-theme-card";
        item.type = "button";
        item.dataset.id = t.id;
        item.title = `${t.nameZh} · ${t.name}`;
        item.style.setProperty("--dt-bg", bg);
        item.style.setProperty("--dt-surface", surface);
        item.style.setProperty("--dt-accent", accent);
        item.style.setProperty("--dt-text2", text);
        item.style.setProperty("--dt-border", textDark);

        const prev = document.createElement("span");
        prev.className = "dsh-theme-prev";
        const bar = document.createElement("span");
        bar.className = "bar";
        const bub = document.createElement("span");
        bub.className = "bub";
        const dot = document.createElement("span");
        dot.className = "dot";
        const chips = document.createElement("span");
        chips.className = "chips";
        for (const c of [bg, surface, accent]) {
          const i = document.createElement("i");
          i.style.background = c;
          chips.appendChild(i);
        }
        const check = document.createElement("span");
        check.className = "dsh-theme-check";
        check.textContent = "✓";
        prev.append(bar, bub, dot, chips, check);

        const name = document.createElement("div");
        name.className = "dsh-theme-nm";
        name.textContent = zh() ? t.nameZh : t.name;
        item.append(prev, name);
        item.addEventListener("click", () => applyTheme(t.id));
        grid.appendChild(item);
      }

      const foot = document.createElement("div");
      foot.id = "dsh-theme-foot";
      const hint = document.createElement("span");
      hint.id = "dsh-theme-hint";
      hint.textContent = zh() ? "Ctrl+Shift+T · 选择即保存" : "Ctrl+Shift+T · saved automatically";
      const reset = document.createElement("button");
      reset.id = "dsh-theme-reset";
      reset.type = "button";
      reset.textContent = zh() ? "恢复默认" : "Reset";
      reset.addEventListener("click", () => applyTheme(null));
      foot.append(hint, reset);

      panelEl.append(head, modes, grid, foot);
      rootEl.append(fab, panelEl);
      document.body.appendChild(rootEl);
    }

    function syncPanel() {
      if (!panelEl) return;
      for (const b of panelEl.querySelectorAll("#dsh-theme-modes button")) {
        b.dataset.on = String(b.dataset.key === mode);
      }
      for (const item of panelEl.querySelectorAll("#dsh-theme-card")) {
        item.dataset.on = String(active && item.dataset.id === active.id);
      }
      fabOpenState();
    }

    function setPanelOpen(open) {
      if (!panelEl) return;
      panelEl.setAttribute("data-open", String(open));
      syncPanel();
    }

    function togglePanel() {
      setPanelOpen(panelEl.getAttribute("data-open") !== "true");
    }

    function fabOpenState() {
      const fab = document.getElementById("dsh-theme-fab");
      if (fab) fab.dataset.open = String(panelEl?.getAttribute("data-open") === "true");
    }

    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "T" || e.key === "t")) {
        e.preventDefault();
        togglePanel();
      } else if (e.key === "Escape" && panelEl && panelEl.getAttribute("data-open") === "true") {
        setPanelOpen(false);
      }
    }

    function onDocClick(e) {
      if (panelEl && panelEl.getAttribute("data-open") === "true" && rootEl && !rootEl.contains(e.target)) {
        setPanelOpen(false);
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
      document.addEventListener("click", onDocClick);

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

      window.dshTheme = api;
      // backward-compat alias from the dsh-theme-pack era
      window.dshThemePack = api;
      if (ctx && typeof ctx.provide === "function") {
        try {
          ctx.provide("dshTheme", api);
        } catch {}
      }
      if (ctx && typeof ctx.on === "function") {
        try {
          ctx.on("dispose", () => {
            window.removeEventListener("keydown", onKey);
            document.removeEventListener("click", onDocClick);
            rootEl?.remove();
            widgetStyleEl?.remove();
            themeStyleEl?.remove();
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
