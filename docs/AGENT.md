# 🤖 Agent 快速接入指南（dsh-theme）

> 写给 AI Agent（如 DeepSeek Harness 里的 coding agent）的接入文档：如何在 **3 分钟**内把
> dsh-theme 装进你的 DSH web 界面、用程序化 API 换肤、自定义主题，以及踩坑清单。
> 本文所有命令均经过实测（macOS + DSH `0.1.0-rc.6`）。

---

## 1. 这是什么

`dsh-theme` 是一个 **DSH 原生客户端插件**：它把自己注册进 **设置 → 通用 →「主题包」**
（`settings.general.item` 槽位，与内置「外观」选择器并列），提供 30 款主题的色卡网格换肤。

- 零依赖：不引入任何 npm 依赖，React 用的是 DSH 平台 seed。
- 程序化：`window.dshTheme` 全局 API 可供 Agent / 控制台直接调用。
- 主题机制：`body[data-dsh-theme="<id>"]` + 注入主题 CSS 变量；深色变体跟随
  `body[data-ds-dark-theme]`。

## 2. 快速安装（三个必要条件，缺一不可）

DSH 的客户端插件**没有自动发现机制**。要让插件生效，必须同时满足：

| # | 条件 | 命令 / 文件 |
|---|------|------------|
| ① | 包装进 web profile 依赖 | `dsh plugin --profile web add <path>` |
| ② | 在 profile 补丁层注册 loader 条目 | `$DSH_HOME/profiles/web/cordis.patch.yml` |
| ③ | 重启 web profile | 重启 `dsh web` + 浏览器刷新 |

> 另外包本身必须满足两个前置，否则 loader 无法挂载：
> - `exports["."]` 指向可 import 的服务端入口（`lib/index.js`）——否则报 `ERR_PACKAGE_PATH_NOT_EXPORTED`；
> - 该入口导出一个合法的 cordis 插件（`{ name, apply }`）——否则 loader 建 fiber 失败。

### 捷径：一键安装脚本

仓库自带 `scripts/install.mjs`，把 ①② 一次做完（幂等、自动备份补丁文件）：

```bash
cd /path/to/dsh-theme
node scripts/install.mjs          # 默认装进 web profile；--profile <名> 指定其他 profile
```

跑完后只需重启 `dsh web`。脚本内部等价于下面的手动步骤。

### Step 1 — 构建并安装

```bash
cd /path/to/dsh-theme
npm run build                                   # 生成 lib/client.js（仓库已含构建产物，改过源码才需要）

# 用本地目录安装（推荐，无需发布 npm）：
dsh plugin --profile web add /Users/you/dsh-theme
```

**坑 A（corepack）**：若报 `EPERM: operation not permitted, open '.../package.json'`
（corepack 试图往项目外层写 `packageManager` 字段），加环境变量重试：

```bash
COREPACK_ENABLE_PROJECT_SPEC=0 dsh plugin --profile web add /Users/you/dsh-theme
```

**坑 B（安装路径要持久）**：别用 `/tmp` 之类的临时目录 —— 重启后链接断裂会导致
`dsh web` **启动失败**（loader entry import 失败会抛错）。放到用户目录，如 `/Users/you/dsh-theme`。

### Step 2 — 注册 loader 条目

编辑 `$DSH_HOME/profiles/web/cordis.patch.yml`（追加到顶部数组）：

```yaml
# dsh-theme — 30-theme client plugin (Settings → General).
- insert:
    - id: theme
      name: 'dsh-theme'
```

验证（合成配置树里应出现该条目）：

```bash
dsh --profile web --dump-config | grep -A1 "id: theme"
# → - id: theme
#   name: dsh-theme
```

### Step 3 — 重启并验证

```bash
# 重启方式任选其一：
# ① 在运行 dsh web 的终端 Ctrl+C 后重跑
# ② Agent 自己重启（注意：agent 通常运行在 dsh web 进程内，杀掉它会中断自身回合 ——
#    用 detach 方式：nohup + setsid/launchd，加锁文件防重入，sleep 几秒给回合收尾）
dsh web
```

重启后验证 boot manifest 已包含插件：

```bash
curl -s http://127.0.0.1:3080/ | grep -o '"id":"dsh-theme"[^}]*}'
# → "id":"dsh-theme","url":"/plugins/dsh-theme/client.js?rev=...","inject":["slots"],"immediately":true
```

浏览器刷新 → 左下角侧边栏 ⚙ **设置 → 通用** →「**主题包 · 30 款**」。

## 3. 程序化使用（Agent 直接调用）

插件 apply 后暴露全局 API（无需打开设置页）：

```js
// 浏览器控制台 / CDP evaluate / Agent 的浏览器工具：
window.dshTheme.list()              // 30 个主题元数据 [{id,name,nameZh,desc,tags}, ...]
window.dshTheme.set("aurora")       // 换肤：设置 body[data-dsh-theme] + 注入 CSS + 持久化
window.dshTheme.get()               // 当前主题 {id,name,nameZh} 或 null
window.dshTheme.cycle()             // 轮换到下一个
window.dshTheme.reset()             // 恢复 DSH 默认外观
window.dshTheme.setMode("dark")     // "light" | "dark" | "system"
window.dshTheme.getMode()
```

Agent 常见用法示例（CDP 或 console）：

```js
// 1) 给用户换一个护眼深色主题
window.dshTheme.set("ink"); window.dshTheme.setMode("dark");

// 2) 根据用户偏好随机推荐
const t = window.dshTheme.list()[Math.floor(Math.random()*30)];
window.dshTheme.set(t.id);

// 3) 其他插件协作：inject: ["dshTheme"] 后 ctx.dshTheme.set("aurora")
```

其他插件也可 `ctx.provide("dshTheme", api)` 的服务注入（`inject: ["dshTheme"]`）。

## 4. 架构原理（为什么必须三步）

```
boot manifest 生成链路：
  profile package.json 依赖 ──(loader 条目)──> cordis.patch.yml 的 insert
        ↓                                        ↓
  client-modules 扫描 loader entries → 读包 dsh.client 清单 → exports["./client"]
        ↓
  注入 window.__DSH_BOOT__ → 浏览器 ModuleLoader 加载 → apply(ctx)
        ↓
  ctx.slots.inject("settings.general.item", ...) → 设置页渲染「主题包」行
```

- `client-modules` 只遍历 **loader entries**（补丁层行），不会扫描 node_modules —— 所以必须有 Step 2。
- loader 会对每个条目 `import(pkgName)` 并构造 cordis fiber —— 所以包必须可 import（`.` 导出 + `lib/index.js`）。
- 包元数据（含"不是客户端包"的负缓存）**只在启动时扫描一次**，插件增删/改名必须重启。
- 设置行样式与主题 CSS 分属两个 `<style>` 元素，互不清空（这是此前"按钮掉到左下角"bug 的根因修复）。

## 5. 自定义 / 新增主题（给 Agent 的指令模板）

```text
1. 编辑 src/themes.json 的 themes 数组，追加主题对象（id 唯一、小写字母/数字/连字符；
   light/dark 各 16 个语义插槽：bg/surface/surfaceAlt/text/text2/text3/border/
   accent/accentText/accentHover/code/codeBanner/sidebar/warn/error/success）
2. npm run build     # 自动生成 themes/<id>.css、更新 manifest、重打 lib/client.js，并做令牌名校验
3. 重启 dsh web + 刷新     # 设置页立即出现新色卡
```

## 6. 排障清单

| 症状 | 原因 | 处理 |
|---|---|---|
| 设置页没有「主题包」行 | 插件没进 boot manifest | `curl -s :3080/ \| grep dsh-theme`；检查 Step 2 的 insert 是否在 `cordis.patch.yml`；重启 |
| `ERR_PACKAGE_PATH_NOT_EXPORTED` | 包 `exports` 缺 `.` 主入口 | package.json 加 `".": { "default": "./lib/index.js" }` |
| `ERR_MODULE_NOT_FOUND` | `lib/index.js` 缺失 | 补服务端入口（no-op cordis 插件 `{name, apply}`） |
| corepack `EPERM ... package.json` | corepack 写 `packageManager` 字段被拒 | `COREPACK_ENABLE_PROJECT_SPEC=0` 前缀重跑 |
| 插件样式/控件被清空、位置错乱 | 样式与主题 CSS 共用一个 `<style>` | 确保组件样式独立 `<style>` 元素，且 `applyTheme(null)` 只清主题样式 |
| 重启后 `dsh web` 启动失败 | 依赖链接断裂（如 /tmp 被清） | 插件放持久路径，`dsh plugin --profile web add` 重新安装 |
| `ctx.slots` 不可用 | DSH 版本无 `slots` seed / 未声明 inject | `dsh.client.inject` 必须含 `"slots"`；DSH ≥ 0.1.0-rc.6 |
| 国内直连 GitHub 超时（推代码时） | 网络封锁 | `export https_proxy=http://127.0.0.1:7897 http_proxy=http://127.0.0.1:7897` 后再 `git push` |

## 7. 安装后验证清单（Agent 自检）

- [ ] `curl -s http://127.0.0.1:3080/ | grep '"id":"dsh-theme"'` 命中
- [ ] `curl -s "http://127.0.0.1:3080/plugins/dsh-theme/client.js?rev=<rev>"` 返回 200 且含 `__ModuleLoader__.load`
- [ ] 打开设置 → 通用 → 出现「主题包」行，30 张色卡
- [ ] 点击色卡 → `body` 出现 `data-dsh-theme="<id>"`，`localStorage["dsh-theme:theme"]` 写入
- [ ] 刷新页面 → 主题保持；`window.dshTheme.get()` 返回当前主题
- [ ] 无浮动按钮残留（旧版控件已移除）
