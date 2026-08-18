# CHANGELOG

本项目的所有重要变更都会记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [1.0.0] - 2026-08-18

首个公开发布版本：面向 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) Web 界面的 30 款主题包，既是零依赖的 DSH 客户端插件，也附带 30 个独立 CSS 文件。

### 新功能

- 30 款主题（每款含 light + dark 双变体，共 60 套配色），完整映射 DSH 官方设计令牌（`--dsw-alias-*` 语义层、`--dsw-specific-*` 组件层、`--shiki-*` 代码高亮）
- DSH 原生集成：注册进「设置 → 通用 → 主题包」分区（`settings.general.item` 槽位，与内置「外观」选择器并列）
- 零依赖客户端插件：`platform: web`、`immediately: true`、`inject: ["slots"]`，遵循官方客户端插件打包契约
- 程序化 API：`window.dshTheme`（`list/get/set/cycle/reset/setMode/getMode`）与 `ctx.provide("dshTheme")` 服务注入
- 浅色 / 深色 / 跟随系统三态切换，深色变体跟随 DSH 内置 `data-ds-dark-theme` 自动切换
- 选择持久化到 `localStorage`（`dsh-theme:theme` / `dsh-theme:mode`），旧 `dsh-theme-pack:*` key 自动迁移
- 30 款主题色卡网格（渐变迷你预览 + 强调色圆点 + 色块 chips + 选中态高亮）
- 一键安装脚本 `scripts/install.mjs`（自动构建 + `dsh plugin add` + loader 条目写入，幂等、带备份）
- 纯 CSS 接入方式：`themes/<id>.css` 单文件或 `themes/index.css` 全量引入，仅需 `body[data-dsh-theme]` 属性
- Agent 快速接入指南 `docs/AGENT.md`（安装 / API / 自定义主题 / 排障清单）

### 修复

- 深色模式下主题色卡预览条保持浅色的问题
- 主题切换后设置行与主题 CSS 的样式隔离，任何切换/清空不破坏设置行样式

### 开发与验证

- 构建工具链 `scripts/build.mjs`：生成 `themes/*.css`、manifest、`lib/client.js`、`preview.html`，内置令牌名校验（每个变量名必须存在于 DSH 真实令牌集）
- 实时校验 `npm run verify:live`：抓取运行中 DSH 的样式资源比对令牌漂移
- 插件集成测试 `scripts/plugintest.mjs`：模拟 DSH loader 真实加载路径（`__ModuleLoader__.load` → `materialize` → `apply`）并断言 UI 行为
- 截图 / 像素校验开发工具（`screenshot.mjs` / `pixelcheck.mjs`）
- 自包含预览页 `preview.html`（file:// 直接打开，无需服务器）
