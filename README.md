# 🎨 dsh-theme-pack

**DeepSeek Harness 主题插件 · 30 款即插即用主题**

一个面向 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) Web 界面的主题包：既是**零依赖的 DSH 客户端插件**（右下角悬浮换肤器 + 快捷键 + 持久化），也附带 **30 个独立 CSS 文件** 可任意方式接入。

每个主题都完整映射 DSH 官方设计令牌（`--dsw-alias-*` 语义层、`--dsw-specific-*` 组件层、`--shiki-*` 代码高亮），并同时提供**浅色 / 深色**两套变体——深色变体会跟随 DSH 内置的 `data-ds-dark-theme` 自动切换，无需额外设置。

| | |
|---|---|
| 插件类型 | DSH web 客户端插件（`platform: web`，`immediately: true`，零依赖） |
| 主题数量 | 30（每个含 light + dark 双变体，共 60 套配色） |
| 接入方式 | npm 包安装 / 本地路径 / 纯 CSS 三选一 |
| 交互 | 右下角 🎨 悬浮按钮、`Ctrl/⌘+Shift+T` 呼出、`Esc` 关闭 |
| 持久化 | `localStorage`（`dsh-theme-pack:theme` / `dsh-theme-pack:mode`） |

---

## 30 款主题目录

| # | id | 中文名 | English | 特点 | 描述 |
|---|----|--------|---------|------|------|
| 1 | `ocean` | 海洋 | Ocean | 浅色·冷·蓝 | 清凉的蓝，安静而深邃 |
| 2 | `midnight` | 午夜 | Midnight | 深色·冷·蓝 | 深夜藏蓝，缀以电光蓝 |
| 3 | `aurora` | 极光 | Aurora | 深色·紫·青 | 紫罗兰与青碧交融的夜空 |
| 4 | `lava` | 熔岩 | Lava | 深色·暖·橙 | 炭黑岩层，燃烧的橙红余烬 |
| 5 | `forest` | 森林 | Forest | 浅色·绿 | 松绿与柔软的苔藓 |
| 6 | `sakura` | 樱花 | Sakura | 浅色·粉 | 淡粉的春日，落樱如雨 |
| 7 | `sunset` | 日落 | Sunset | 浅色·暖·橙 | 暖桃色渐入黄昏 |
| 8 | `graphite` | 石墨 | Graphite | 中性·极简 | 柔和的暖灰，护眼耐看 |
| 9 | `ink` | 墨黑 | Ink | 深色·中性·极简 | 纯粹的黑与白，至简 |
| 10 | `paper` | 纸张 | Paper | 浅色·暖·米 | 暖奶油色，像一本翻旧了的笔记本 |
| 11 | `amber` | 琥珀 | Amber | 浅色·暖·金 | 蜂蜜般的金色，温暖透亮 |
| 12 | `mint` | 薄荷 | Mint | 浅色·绿·青 | 清新的青绿，脆爽清凉 |
| 13 | `violet` | 紫罗兰 | Violet | 浅色·紫 | 柔和的紫，带着一丝庄重 |
| 14 | `cyber` | 赛博 | Cyber | 深色·霓虹·蓝 | 近黑底上的霓虹青，赛博电路板 |
| 15 | `retro` | 复古 | Retro | 浅色·暖·复古 | 旧照片般的米褐与陶土红 |
| 16 | `terminal` | 终端 | Terminal | 深色·绿·CRT | CRT 黑底上的磷光绿（含 shiki 语法色） |
| 17 | `dune` | 沙丘 | Dune | 浅色·暖·沙 | 暖阳下的金色沙丘 |
| 18 | `glacier` | 冰川 | Glacier | 浅色·冷·蓝 | 清澈锐利的冰蓝 |
| 19 | `nebula` | 星云 | Nebula | 深色·靛·紫 | 靛蓝星云，缀满星光 |
| 20 | `coral` | 珊瑚 | Coral | 浅色·暖·橙 | 礁石珊瑚，明快而活泼 |
| 21 | `steel` | 钢铁 | Steel | 深色·冷·蓝灰 | 冷冽的蓝灰，工业般的沉静 |
| 22 | `autumn` | 秋日 | Autumn | 浅色·暖·金 | 丰收午后，满地金黄 |
| 23 | `matcha` | 抹茶 | Matcha | 浅色·绿·暖 | 苔绿间透着茶香 |
| 24 | `knight` | 骑士 | Knight | 深色·金·中性 | 暗色铠甲，缀以古金 |
| 25 | `pastel` | 粉彩 | Pastel | 浅色·柔和·紫 | 糖果般的柔彩，轻柔俏皮 |
| 26 | `lavender` | 薰衣草 | Lavender | 浅色·紫·冷 | 晨光里的薰衣草田 |
| 27 | `charcoal` | 煤灰 | Charcoal | 中性·极简·灰 | 诚实的灰，不打扰你的专注 |
| 28 | `rose` | 玫瑰 | Rose | 深色·粉·酒红 | 深酒红的天鹅绒，缀着浅绯花瓣 |
| 29 | `wave` | 碧波 | Wave | 浅色·青·冷 | 青碧的水波，清澈灵动 |
| 30 | `mono` | 极简 | Mono | 中性·极简·单色 | 严格单色，极致专注 |

> 打开 `preview.html`（构建产物，双击即可，无需服务器）可浏览全部 30 款主题的实时预览。

---

## 目录结构

```
dsh-theme-pack/
├── package.json            # DSH 插件清单：dsh.client { inject:[], platform:"web", immediately:true }
├── README.md
├── preview.html            # 构建生成：30 主题自包含预览页（file:// 直接打开）
├── src/
│   ├── themes.json         # ★ 30 个主题的唯一数据源（16 个语义插槽 × light/dark）
│   └── client.template.js  # 客户端插件运行时模板（__THEME_DATA__ 由构建内联）
├── scripts/
│   ├── build.mjs           # 构建：生成 themes/*.css、manifest、client.js、preview.html（含令牌校验）
│   ├── screenshot.mjs      # 开发工具：对运行中的 DSH 界面截图验证主题
│   ├── plugintest.mjs      # 开发工具：模拟 DSH loader 对插件做集成测试
│   └── pixelcheck.mjs      # 开发工具：PNG 像素校验（截图非空 + 主色命中）
├── themes/                 # 构建生成：每主题一个独立 CSS（可直接用）
│   ├── ocean.css
│   ├── ...
│   ├── index.css           # 全部 30 个主题合一的样式
│   └── manifest.json       # 机器可读目录（含色板 swatch）
├── lib/
│   ├── client.js           # ★ 构建生成：自包含 DSH 客户端插件（308KB，内联全部主题）
│   └── themes.data.json    # 运行时数据
└── shots/                  # 开发工具产出的效果截图
```

---

## 快速接入

### 方式 A：作为 DSH 客户端插件（推荐）

`lib/client.js` 遵循 DSH 官方客户端插件打包契约（与 `@deepseek-ai/dsh-client-hmr` 一致）：

```jsonc
// package.json —— 本项目的 dsh.client 清单
"dsh": { "client": { "inject": [], "platform": "web", "immediately": true } },
"exports": { "./client": { "default": "./lib/client.js" } }
```

DSH 的 web profile 通过 `dsh plugin`（内部转发 pnpm）管理树外插件，插件包名写入 profile 的
`package.json`，启动时其 `client.js` 会被加载进 boot manifest 并以 `apply(ctx)` 实例化。

**① 本地目录安装（不发布 npm 也能用）：**

```bash
# 在 DSH web profile 目录下（$DSH_HOME/profiles/web）
dsh plugin --profile web add /absolute/path/to/dsh-theme-pack
```

**② 或先构建再以 npm 包方式安装：**

```bash
npm run build
# 发布或使用本地 tarball
npm pack            # 生成 dsh-theme-pack-1.0.0.tgz
dsh plugin --profile web add ./dsh-theme-pack-1.0.0.tgz
```

安装后重启 web profile，右下角出现 🎨 悬浮按钮即可换肤。

### 方式 B：纯 CSS（零依赖，任何部署都适用）

每款主题是一个自包含的 CSS 文件，选择器基于 `body` 上的属性：

```css
/* themes/ocean.css 的生效选择器 */
body[data-dsh-theme="ocean"] { /* 浅色令牌 */ }
body[data-dsh-theme="ocean"][data-ds-dark-theme] { /* 深色令牌 */ }
```

使用只需两步：

```js
// 1. 引入主题 CSS（任一方式：<link>、注入 <style>、构建时合并）
// 2. 给 body 打上属性
document.body.setAttribute("data-dsh-theme", "ocean");
```

- 想一次性引入全部：用 `themes/index.css`，然后只需切换 `data-dsh-theme` 属性值（`ocean` / `midnight` / …）。
- 深色变体由 DSH 自己的 `body[data-ds-dark-theme]` 控制（设置 → 外观 → 深色/浅色/跟随系统），**无需额外处理**。
- 也可以直接粘贴到浏览器 DevTools 的 Console 里即时预览：
  ```js
  fetch('/themes/aurora.css').then(r=>r.text()).then(css=>{
    const s=document.createElement('style'); s.textContent=css;
    document.head.appendChild(s); document.body.setAttribute('data-dsh-theme','aurora');
  })
  ```

### 方式 C：完整源码集成

若你在 deepseek-harness 完整源码中开发，可将 `src/client.template.js` 作为客户端插件包
（仿照 `packages/client/ui-theme` 布局），`npm run build` 后产出 `lib/client.js` 即符合
`packages/client/*` 的构建产物格式（`__ModuleLoader__.load` + `exports.inject/apply`）。

---

## 插件功能

| 功能 | 说明 |
|---|---|
| 🎨 悬浮按钮 | 右下角，点击展开 30 主题网格 |
| 快捷键 | `Ctrl/⌘ + Shift + T` 呼出面板，`Esc` 关闭 |
| 浅/深/自动 | 面板顶部三态切换；「自动」跟随 DSH 内置外观设置 |
| 持久化 | 选择写入 `localStorage`，刷新/重启后自动恢复 |
| 程序化 API | `window.dshThemePack`（见下） |
| 服务注入 | `ctx.provide("themePack", api)`，其他插件可 `inject: ["themePack"]` 使用 |

```js
window.dshThemePack.list()                       // [{id,name,nameZh,desc,descZh,tags}, ...] 共 30 项
window.dshThemePack.get()                        // {id,name,nameZh} 或 null
window.dshThemePack.set("aurora")                // 切换主题（无效 id 抛错）
window.dshThemePack.cycle()                      // 轮换到下一个主题
window.dshThemePack.reset()                      // 恢复 DSH 默认外观
window.dshThemePack.setMode("light"|"dark"|"system")
window.dshThemePack.getMode()
```

---

## 主题机制：语义插槽 → DSH 设计令牌

每个主题在 `src/themes.json` 中只定义 **16 个语义插槽 × 2 种模式**，构建时自动展开为 94 个
DSH 真实令牌（全部经过与 DSH 实际 CSS 的差集校验，无拼写错误）：

| 插槽 | 作用 | 主要映射到的令牌（节选） |
|---|---|---|
| `bg` | 应用底色 | `--dsw-alias-bg-base` |
| `surface` | 抬升表面（卡片/输入） | `--dsw-alias-bg-layer-1/2`、`--dsw-specific-menu` |
| `surfaceAlt` | 次级表面（悬停/标签） | `--dsw-alias-bg-layer-3`、`--dsw-specific-selector` |
| `text` / `text2` / `text3` | 主/次/三级文字 | `--dsw-alias-label-primary/secondary/tertiary/caption` |
| `border` | 边框 | `--dsw-alias-border-l1~l4`（自动派生透明度梯度） |
| `accent` / `accentHover` / `accentText` | 品牌色 | `--dsw-alias-brand-primary`、`--dsw-alias-button-primary-fill/-hover`、`--dsw-alias-state-business-primary` |
| `code` / `codeBanner` | 代码块 | `--dsw-alias-markdown-code-block/-banner` |
| `sidebar` | 侧边栏 | `--dsw-specific-sidebar-fill` |
| `warn` / `error` / `success` | 状态色 | `--dsw-alias-state-warn-*/error-*/success-*` |
| （派生） | 交互态、滚动条、toast、渐变 | `--dsw-alias-interactive-bg-*`、`--dsw-alias-scrollbar-*`、`--dsw-linear-gradient-think` 等 |

代码高亮：默认使用 DSH 内置 shiki 配色（浅/深各一套，自动适配）；个别主题可覆写
（如 `terminal` 的磷光绿语法色），在 `src/themes.json` 中加 `shiki.light/dark` 字段即可。

---

## 自定义 / 新增主题

1. 在 `src/themes.json` 的 `themes` 数组里追加一个对象（`id` 唯一、小写字母/数字/连字符）：
   ```jsonc
   {
     "id": "mytheme",
     "name": "My Theme", "nameZh": "我的主题",
     "desc": "…", "descZh": "…",
     "tags": ["light", "blue"],
     "light": { "bg": "#f5f8fc", "surface": "#ffffff", "surfaceAlt": "#e9f0f8", "text": "#12283f",
                "text2": "#4a637c", "text3": "#7c93a8", "border": "rgba(18,40,63,0.10)",
                "accent": "#1d6fb8", "accentText": "#ffffff", "accentHover": "#175a94",
                "code": "#eaf2fa", "codeBanner": "#e1ecf6", "sidebar": "#eaf2f9",
                "warn": "#b45309", "error": "#dc2626", "success": "#15803d" },
     "dark": { /* 同结构，深色插槽 */ }
   }
   ```
2. `npm run build` —— 自动产出该主题的 `themes/<id>.css`、更新 manifest、重打 `lib/client.js`，
   并执行令牌名校验（每个变量名都必须存在于 DSH 真实令牌集，防止拼错）。

---

## 开发与验证

```bash
npm run build        # 全量构建 + 令牌校验
npm run verify       # 仅校验（令牌名 ∈ DSH 令牌集、花括号配平）
node scripts/plugintest.mjs    # 对运行中的 DSH (http://127.0.0.1:3080) 做插件集成测试
node scripts/screenshot.mjs ocean light shots/ocean-light.png   # 截图验证某主题
node scripts/pixelcheck.mjs shots/ocean-light.png eef5fb        # 像素级校验主色
```

集成测试会模拟 DSH loader 的真实加载路径：`__ModuleLoader__.load` 注册 → `__DSH_MODULES__.materialize(id)`
→ `apply(ctx)`，并断言：30 个色块、主题切换后 computed style 命中插槽色、深浅色切换、轮换/重置、
刷新后持久化恢复。

---

## 已知限制与说明

- **模式切换**：面板里的「浅色/深色」会直接设置 `body[data-ds-dark-theme]`（persist 到
  `localStorage`），此时 DSH 内置「外观」设置页的显示可能与实际不一致；点「自动」即可恢复跟随内置设置。
- **设置页集成**：本包通过悬浮按钮 + API 提供换肤入口，未占用「设置 → 通用」插槽
  （`settings.general.item`）。如需接入设置页，可参考 `@deepseek-ai/dsh-client-ui-theme` 的
  `ctx.slots.inject("settings.general.item", ...)` 模式扩展。
- **主题标识**：主题通过 `body[data-dsh-theme="<id>"]` 生效，与 DSH 内置外观（浅/深）正交，
  二者可自由组合。
- **兼容性**：令牌名取自 DSH `0.1.0-rc.6` 的 Web 产物；DSH 升级若改动令牌名，用
  `npm run verify` 复检。

## License

[Apache License 2.0](LICENSE)
