# 🎨 dsh-theme

**DeepSeek Harness 主题插件 · 30 款即插即用主题 · DSH 原生集成**

一个面向 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) Web 界面的主题包：既是**零依赖的 DSH 客户端插件**（注册进「设置 → 通用」，与内置「外观」选择器并列），也附带 **30 个独立 CSS 文件** 可任意方式接入。

每个主题都完整映射 DSH 官方设计令牌（`--dsw-alias-*` 语义层、`--dsw-specific-*` 组件层、`--shiki-*` 代码高亮），并同时提供**浅色 / 深色**两套变体——深色变体会跟随 DSH 内置的 `data-ds-dark-theme` 自动切换，无需额外设置。

| | |
|---|---|
| 插件类型 | DSH web 客户端插件（`platform: web`、`immediately: true`、`inject: ["slots"]`、零依赖） |
| 主题数量 | 30（每个含 light + dark 双变体，共 60 套配色） |
| 集成方式 | **设置 → 通用 →「主题包」**（`settings.general.item` 槽位，React 组件经平台 seed 渲染） |
| 程序化接入 | `window.dshTheme` / `ctx.provide("dshTheme")`（Agent 可直接调用） |
| 持久化 | `localStorage`（`dsh-theme:theme` / `dsh-theme:mode`，旧 `dsh-theme-pack:*` key 自动迁移） |

> 🤖 你是 AI Agent / 想快速接入？直接看 **[docs/AGENT.md](docs/AGENT.md)（Agent 快速接入指南）**。

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
dsh-theme/
├── package.json            # DSH 插件清单：dsh.client { inject:["slots"], platform:"web", immediately:true }
├── README.md
├── docs/
│   └── AGENT.md            # ★ Agent 快速接入指南（安装/API/自定义主题/排障）
├── preview.html            # 构建生成：30 主题自包含预览页（file:// 直接打开）
├── src/
│   ├── themes.json         # ★ 30 个主题的唯一数据源（16 个语义插槽 × light/dark）
│   └── client.template.js  # 客户端插件模板（__THEME_DATA__ 由构建内联；设置页 React 行）
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
│   ├── index.js            # ★ 服务端入口（no-op cordis 插件，loader 挂载必需）
│   ├── client.js           # ★ 构建生成：自包含 DSH 客户端插件（内联全部主题）
│   └── themes.data.json    # 运行时数据
└── shots/                  # 开发工具产出的效果截图
```

---

## 快速安装（三选一）

### 方式 0：一键安装脚本（推荐给普通用户 / Agent）

克隆仓库后直接运行（自动完成构建 + `dsh plugin add` + loader 条目写入，幂等、带备份）：

```bash
git clone https://github.com/mux9056-bot/dsh-theme ~/dsh-theme
cd ~/dsh-theme
node scripts/install.mjs          # 可选：--profile <名字> 装到其他 profile；--no-build 跳过构建
```

脚本跑完只需**重启 `dsh web`** 并刷新页面。详细说明见 [docs/AGENT.md](docs/AGENT.md)。

### 通过 Agent 安装（3 分钟）

如果你用 DeepSeek Harness 或其他 AI Agent，把下面这段指令**直接复制发给你的 Agent**，
它会照着 [docs/AGENT.md](docs/AGENT.md) 自动完成安装、重启与验证：

> **📋 给 Agent 的安装指令（可直接复制）**
>
> 请帮我把 dsh-theme 主题插件安装到 DSH web 界面（仓库：https://github.com/mux9056-bot/dsh-theme ）：
> 1. clone 仓库到持久路径（如 `~/dsh-theme`，不要用 /tmp）；若无 `lib/client.js` 先执行 `npm run build`
> 2. 安装进 web profile：`COREPACK_ENABLE_PROJECT_SPEC=0 dsh plugin --profile web add ~/dsh-theme`
>    （若报 corepack 权限错就用这个前缀重试）
> 3. **必须**在 `$DSH_HOME/profiles/web/cordis.patch.yml` 追加 loader 条目：
>    `- insert: [{ id: theme, name: 'dsh-theme' }]` —— 客户端插件没有自动发现，漏掉就不生效
> 4. 重启 `dsh web`（注意：agent 通常运行在 dsh web 进程内，需用 detach 方式重启并留出收尾时间；或让用户手动重启）
> 5. 验证：`curl -s http://127.0.0.1:3080/ | grep '"id":"dsh-theme"'` 命中；
>    并打开「设置 → 通用」确认出现「主题包 · 30 款」色卡行
> 6. 完成后告诉我，我刷新页面即可使用

Agent 会自行处理所有已知坑（corepack 权限、loader 条目、重启时机、manifest 验证）；
遇到异常可直接让它查阅 [docs/AGENT.md](docs/AGENT.md) 的排障清单。手动安装见下节。

---

## 快速接入（DSH 原生方案）

> ⚠️ **重要**：DSH 的客户端插件（`dsh.client` 清单）**没有自动发现机制**。光把包装进 profile 的
> `node_modules` 还不够 —— 必须**同时满足三个条件**插件才会出现在 boot manifest 里：
> ① 依赖装入 profile；② 在 profile 补丁层注册 loader 条目；③ 重启 `dsh web`。
> 并且包的 `exports` 必须提供 `.` 主入口（`lib/index.js`），因为 loader 会 `import()` 整个包。

### 方式 A：作为 DSH 客户端插件（推荐）

`lib/client.js` 遵循 DSH 官方客户端插件打包契约（与 `@deepseek-ai/dsh-client-ui-theme` 同款）：

```jsonc
// package.json —— 本项目的 dsh.client 清单
"dsh": { "client": { "inject": ["slots"], "platform": "web", "immediately": true } },
"exports": {
  ".":        { "default": "./lib/index.js" },   // 服务端入口（loader import 必需）
  "./client": { "default": "./lib/client.js" }   // 浏览器 bundle
}
```

**第 1 步：构建并安装依赖**（本地目录即可，无需发布 npm）：

```bash
npm run build                                  # 生成 lib/client.js 等构建产物
dsh plugin --profile web add /absolute/path/to/dsh-theme
```

> 若遇到 corepack 报 `EPERM ... package.json`（它会试图往项目外层写 `packageManager` 字段），
> 加环境变量重试：`COREPACK_ENABLE_PROJECT_SPEC=0 dsh plugin --profile web add <path>`。

**第 2 步：在 profile 补丁层注册 loader 条目**（`$DSH_HOME/profiles/web/cordis.patch.yml`）：

```yaml
- insert:
    - id: theme
      name: 'dsh-theme'
```

**第 3 步：重启 web profile 并刷新页面**

```bash
dsh web        # 重启（或在你原来的终端里 Ctrl+C 后重跑）
```

刷新后：左下角侧边栏 → **⚙ 设置 → 通用** → 找到「**主题包 · 30 款**」分区即可换肤。
（也可在浏览器控制台用 `window.dshTheme` API，见下文。）

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
| 🎨 设置页集成 | 「设置 → 通用」新增「主题包」分区（`settings.general.item` 槽位，`order: 20`，在内置「外观」行之下） |
| 色卡网格 | 30 张主题色卡（渐变迷你预览 + 强调色圆点 + 色块 chips + 名称），选中态高亮边框 + 加粗名称 |
| 浅/深/自动 | 行内三态切换；「自动」跟随 DSH 内置外观设置 |
| 恢复默认 | 行尾「恢复默认」按钮，移除 `data-dsh-theme` 并清空主题 CSS |
| 持久化 | 选择写入 `localStorage`（`dsh-theme:theme` / `dsh-theme:mode`），刷新/重启后自动恢复 |
| 程序化 API | `window.dshTheme`（Agent / 控制台可直接调用，见下） |
| 服务注入 | `ctx.provide("dshTheme", api)`，其他插件可 `inject: ["dshTheme"]` 使用 |

```js
window.dshTheme.list()                       // [{id,name,nameZh,desc,descZh,tags}, ...] 共 30 项
window.dshTheme.get()                        // {id,name,nameZh} 或 null
window.dshTheme.set("aurora")                // 切换主题（无效 id 抛错）
window.dshTheme.cycle()                      // 轮换到下一个主题
window.dshTheme.reset()                      // 恢复 DSH 默认外观
window.dshTheme.setMode("light"|"dark"|"system")
window.dshTheme.getMode()
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
npm run build              # 全量构建 + 令牌校验
npm run verify             # 仅校验（令牌名 ∈ 内置 DSH 令牌集、花括号配平）
npm run verify:live        # ★ 校验时对比「运行中的 DSH」真实 CSS（DSH 升级后用它复检令牌漂移）
node scripts/plugintest.mjs    # 对运行中的 DSH (http://127.0.0.1:3080) 做插件集成测试
node scripts/screenshot.mjs ocean light shots/ocean-light.png   # 截图验证某主题
node scripts/pixelcheck.mjs shots/ocean-light.png eef5fb        # 像素级校验主色
```

`verify:live` 会抓取运行中 DSH 的样式资源并提取全部 `--dsw-*` / `--shiki-*` 令牌，把 30 个主题
**以及设置行的 UI 令牌**一并与真实令牌集比对 —— 这是 DSH 升级后最可靠的适配自检。
（`DSH_LIVE_URL` 环境变量可指定别的实例地址。）

集成测试会模拟 DSH loader 的真实加载路径：`__ModuleLoader__.load` 注册 → `__DSH_MODULES__.materialize(id)`
→ `apply(ctx)`，并断言：30 个色块、主题切换后 computed style 命中插槽色、深浅色切换、轮换/重置、
刷新后持久化恢复。

---

## 开源 / 发布

- **npm 发布**：包名 `dsh-theme` 在 npm 上未被占用，可 `npm publish`；用户随后只需
  `dsh plugin --profile web add dsh-theme` + loader 条目 + 重启（见上）。
- **⚠️ 旧包 `dsh-theme-pack@1.0.0`**（已存在于 npm）是早期版本：缺少服务端入口（`exports["."]` /
  `lib/index.js`），装进 DSH 会报 `ERR_PACKAGE_PATH_NOT_EXPORTED`，**不要**用它；请用本仓库的新包名。
- **发布前检查清单**：`npm run verify:live` 通过 → `npm run build` → `npm pack` 确认产物包含
  `lib/`、`themes/`、`scripts/`、`docs/`。

---

## 已知限制与说明

- **设置页集成**：主题入口在「设置 → 通用 → 主题包」，与内置「外观」选择器并列；没有页面级浮动控件
  （DSH 理念：插件应注册进宿主 UI 槽位，而不是独立悬浮组件）。
- **模式切换**：行内「浅色/深色」会直接设置 `body[data-ds-dark-theme]`（persist 到 `localStorage`），
  此时 DSH 内置「外观」设置页的显示可能与实际不一致；点「自动」即可恢复跟随内置设置。
- **loader 条目是硬性要求**：DSH 的 `client-modules` 只扫描 loader entries（补丁层里的行），
  不会自动发现 `node_modules` 里的 `dsh.client` 包；漏掉 `cordis.patch.yml` 的 `insert` 会导致插件不进
  boot manifest。参见 [docs/AGENT.md](docs/AGENT.md) 的排障章节。
- **服务端入口必需**：loader 会 `import()` 插件包，因此 `exports["."]` 与 `lib/index.js` 缺一不可；
  漏掉会报 `ERR_PACKAGE_PATH_NOT_EXPORTED` 或 `ERR_MODULE_NOT_FOUND`。
- **样式隔离**：设置行样式与当前主题 CSS 分属两个 `<style>` 元素，任何主题切换/清空都不会破坏行样式；
  深色模式下色卡预览条跟随 `body[data-ds-dark-theme]` 切换为对应深色 swatch。
- **主题标识**：主题通过 `body[data-dsh-theme="<id>"]` 生效，与 DSH 内置外观（浅/深）正交，二者可自由组合。
- **兼容性**：令牌名取自 DSH `0.1.0-rc.6` 的 Web 产物；DSH 升级后请用 `npm run verify:live` 复检。
- **依赖平台 seed**：设置行用 `react` + `slots` 服务（DSH 平台 seed，`inject: ["slots"]`），
  需要 DSH 版本提供这两个 seed（`0.1.0-rc.6` 起包含）；缺失时插件优雅降级（仅保留 `window.dshTheme` API）。

## License

[Apache License 2.0](LICENSE)
