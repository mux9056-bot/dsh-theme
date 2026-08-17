#!/usr/bin/env node
/**
 * dsh-theme — one-command installer for a local DeepSeek Harness web profile.
 * --------------------------------------------------------------------------
 * Usage:
 *   node scripts/install.mjs                      # install into the default web profile
 *   node scripts/install.mjs --profile tui        # install into another profile
 *   node scripts/install.mjs --no-build           # skip npm run build (repo ships artifacts)
 *
 * What it does (all three conditions DSH needs, idempotent):
 *   1. builds the client bundle if needed
 *   2. `dsh plugin --profile <p> add <this-repo>` (retries with
 *      COREPACK_ENABLE_PROJECT_SPEC=0 on the corepack EPERM gotcha)
 *   3. appends the loader entry to $DSH_HOME/profiles/<p>/cordis.patch.yml
 *      (backup first, never duplicates)
 *   4. prints restart + verification instructions
 *
 * Requires: Node >= 18, the `dsh` CLI on PATH, and a booted web profile
 * ($DSH_HOME/profiles/<p> with package.json).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const profile = args.includes("--profile") ? args[args.indexOf("--profile") + 1] : "web";
const noBuild = args.includes("--no-build");
const dshHome = process.env.DSH_HOME || join(homedir(), ".dsh");

function run(cmd, cargs, opts = {}) {
  console.log(`\n$ ${cmd} ${cargs.join(" ")}`);
  return execFileSync(cmd, cargs, { stdio: "inherit", ...opts });
}

function fail(msg) {
  console.error(`\n✘ ${msg}`);
  process.exit(1);
}

console.log(`🎨 dsh-theme installer\n   profile: ${profile}\n   repo:    ${ROOT}\n   DSH_HOME: ${dshHome}`);

/* 1 ── build ─────────────────────────────────────────────────────────── */
const clientJs = join(ROOT, "lib", "client.js");
if (noBuild) {
  if (!existsSync(clientJs)) fail("lib/client.js missing — run `npm run build` or drop --no-build");
} else {
  try {
    run(process.execPath, [join(ROOT, "scripts", "build.mjs")]);
  } catch {
    if (!existsSync(clientJs)) fail("build failed and lib/client.js is missing");
    console.log("   (build failed but built artifacts exist — continuing)");
  }
}

/* 2 ── dsh plugin add ────────────────────────────────────────────────── */
const pluginArgs = ["plugin", "--profile", profile, "add", ROOT];
try {
  run("dsh", pluginArgs);
} catch (error) {
  // corepack EPERM gotcha: retry with project-spec disabled
  try {
    console.log("   retrying with COREPACK_ENABLE_PROJECT_SPEC=0 …");
    run("dsh", pluginArgs, { env: { ...process.env, COREPACK_ENABLE_PROJECT_SPEC: "0" } });
  } catch {
    fail("`dsh plugin --profile " + profile + " add " + ROOT + "` failed — is the dsh CLI on PATH and the profile initialized?");
  }
}

/* 3 ── loader entry in cordis.patch.yml ──────────────────────────────── */
const profileDir = join(dshHome, "profiles", profile);
const patchFile = join(profileDir, "cordis.patch.yml");
const ENTRY_MARKER = "name: 'dsh-theme'";
const PATCH_BLOCK = `
# dsh-theme — 30-theme client plugin (Settings → General). Managed by scripts/install.mjs
- insert:
    - id: theme
      name: 'dsh-theme'
`;

if (!existsSync(patchFile)) fail(`cordis.patch.yml not found at ${patchFile} — is profile "${profile}" initialized?`);
const before = readFileSync(patchFile, "utf8");
if (before.includes(ENTRY_MARKER)) {
  console.log(`\n✓ loader entry already present in ${patchFile}`);
} else {
  copyFileSync(patchFile, patchFile + ".bak");
  const trimmed = before.trim();
  const next = trimmed === "[]" || trimmed === "" ? PATCH_BLOCK.trim() + "\n" : before.replace(/\s*$/, "") + "\n" + PATCH_BLOCK;
  writeFileSync(patchFile, next);
  console.log(`\n✓ loader entry added to ${patchFile} (backup: cordis.patch.yml.bak)`);
}

/* 4 ── instructions ──────────────────────────────────────────────────── */
console.log(`
✔ 安装完成（本地路径已装入 profile）。还需最后一步：

  重启 web profile 使 boot manifest 生效：
    dsh web            # 在运行 dsh web 的终端 Ctrl+C 后重跑

  验证：
    curl -s http://127.0.0.1:3080/ | grep '"id":"dsh-theme"'

  然后刷新浏览器 → 左下角侧边栏 ⚙ 设置 → 通用 →「主题包 · 30 款」即可换肤。

  （Agent 可参考 docs/AGENT.md 的完整排障清单）
`);
