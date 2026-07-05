# spec-first Windows PowerShell 兼容性问题清单

审查日期：2026-07-03

问题总数：14 个。P0 0 个，P1 2 个，P2 9 个，P3 3 个。

## P0

未发现 P0。

依据：

- `package.json:6-8` 声明 npm `bin`。
- `.github/workflows/npm-install-matrix.yml:51-84` 覆盖 `ubuntu-latest`、`macos-latest`、`windows-latest`，Windows 分别跑 `pwsh` 与 `cmd`。
- `scripts/npm-install-matrix-smoke.js:124-139` 验证 Windows `.cmd` shim。
- `scripts/npm-install-matrix-smoke.js:486-638` 覆盖 pack/install、空格/中文/括号路径、Claude/Codex init 与 `doctor --json`。

## WIN-P2-07：`spec-polish-beta` helper 是 bash-only

- 严重程度：P2
- 影响范围：`spec-polish-beta` / `spec-polish-beta`
- 涉及文件：
  - `skills/spec-polish-beta/SKILL.md:63`
  - `skills/spec-polish-beta/SKILL.md:67`
  - `skills/spec-polish-beta/SKILL.md:83`
  - `skills/spec-polish-beta/SKILL.md:85`
  - `skills/spec-polish-beta/SKILL.md:126-130`
  - `skills/spec-polish-beta/scripts/*.sh`
- 触发场景：agent 在 Windows 宿主内要求启动浏览器可见 app 并进入 polish loop。
- 失败原因：workflow contract 要求执行 `bash scripts/read-launch-json.sh`、`bash scripts/detect-project-type.sh`、`bash scripts/resolve-package-manager.sh`、`bash scripts/resolve-port.sh --type <type>`；如果 harness 未提供 bash，原生 PowerShell 路径会失败。若宿主 Bash tool 已绑定 Git Bash，该问题会被环境缓解。
- macOS/Linux 影响：无直接影响。
- 最小修复：在 SKILL 中显式声明 Windows 原生暂需 Git Bash/WSL 或手动启动；同时为四个 helper 增加 Node 版本并优先调用 Node。
- 长期修复：把 helper 统一迁移为 `scripts/*.cjs`，删除 workflow 主路径对 bash 的硬依赖。
- 验证命令：

```powershell
npm install
node skills/spec-polish-beta/scripts/detect-project-type.cjs .
node skills/spec-polish-beta/scripts/resolve-package-manager.cjs .
node skills/spec-polish-beta/scripts/resolve-port.cjs --type vite
```

- 回归风险：框架探测结果改变可能影响现有 macOS/Linux polish 行为；需要 fixture 锁定 Next/Vite/Nuxt/Astro/Remix/SvelteKit。

## WIN-P2-08：`spec-optimize` 优化闭环依赖 POSIX shell 与 `/tmp`

- 严重程度：P2
- 影响范围：`spec-optimize` / `spec-optimize`
- 涉及文件：
  - `skills/spec-optimize/SKILL.md:321`
  - `skills/spec-optimize/SKILL.md:350`
  - `skills/spec-optimize/SKILL.md:393`
  - `skills/spec-optimize/SKILL.md:402`
  - `skills/spec-optimize/SKILL.md:521`
  - `skills/spec-optimize/SKILL.md:543`
  - `skills/spec-optimize/SKILL.md:555`
  - `skills/spec-optimize/scripts/measure.sh`
  - `skills/spec-optimize/scripts/parallel-probe.sh`
  - `skills/spec-optimize/scripts/experiment-worktree.sh`
- 触发场景：agent 在 Windows 宿主内建立 baseline、并行 probe、创建 experiment worktree、通过 Codex backend 执行实验。
- 失败原因：`mkdir -p`、`bash scripts/*.sh`、`WORKTREE_PATH=$(...)`、`cat /tmp/... | codex exec ...` 均为 POSIX 写法。无 bash 的原生 PowerShell harness 会失败；Git Bash/WSL 可作为 fallback，但这不构成原生 PowerShell 兼容证据。
- macOS/Linux 影响：无直接影响。
- 最小修复：新增 Windows degraded notice；把 Codex backend 的 temp file 示例改为 OS-temp 表达，并给 PowerShell 替代命令。
- 长期修复：新增 `skills/spec-optimize/scripts/optimize-runner.cjs`，统一处理 measurement、parallel probe、worktree 和 stdin dispatch。
- 验证命令：

```powershell
npm install
node skills/spec-optimize/scripts/optimize-runner.cjs probe --project . --measurement "node -e \"console.log(JSON.stringify({score:1}))\""
```

- 回归风险：优化 workflow 涉及状态日志和 worktree，迁移需要 crash-recovery fixture。

## WIN-P2-09：`spec-code-review` base resolver 依赖 bash/awk/sed

- 严重程度：P2
- 影响范围：`spec-code-review` / `spec-code-review`
- 涉及文件：
  - `skills/spec-code-review/scripts/resolve-base.sh:1-103`
  - `skills/spec-code-review/SKILL.md:335`
  - `skills/spec-code-review/SKILL.md:402`
  - `skills/spec-code-review/SKILL.md:438`
  - `skills/spec-code-review/SKILL.md:458`
  - `skills/spec-code-review/SKILL.md:476`
- 触发场景：agent 在 Windows 宿主下 review PR 或本地分支，需要自动确定 merge-base。
- 失败原因：脚本 `#!/bin/bash`，内部使用 `awk`、`sed`、POSIX test、command substitution；SKILL 命令示例也使用 `&&` 链式 shell。它不是用户复制到 PowerShell 的确定性失败，但在无 bash 的原生 PowerShell harness 中会退化为手动 base/fallback。
- macOS/Linux 影响：无直接影响。
- 最小修复：允许用户显式传入 base，并在 Windows 下跳过 bash resolver；文档说明 Git Bash/WSL fallback。
- 长期修复：迁移为 `resolve-base.cjs`，保持输出协议。
- 验证命令：

```powershell
node skills/spec-code-review/scripts/resolve-base.cjs
```

- 回归风险：fork-safe remote resolution 与 shallow repo unshallow 行为必须逐项回归。

## WIN-P1-04：`helper-tools.json` Windows command 使用 PowerShell 5.1 不兼容语法

- 严重程度：P1
- 影响范围：`spec-mcp-setup` helper repair path 的用户复制命令与 registry 展示。
- 涉及文件：
  - `skills/spec-mcp-setup/helper-tools.json:21-25`
  - `skills/spec-mcp-setup/scripts/install-helpers.ps1:212-249`
  - `skills/spec-mcp-setup/scripts/install-helpers.ps1:289-292`
- 触发场景：`agent-browser` 缺失且用户复制 registry 的 Windows command。
- 失败原因：`CI=true npm install ... && agent-browser install && npx ...` 是 POSIX/PowerShell 7+ 混合命令；PowerShell 5.1 不支持 env-prefix 和 pipeline chain operator。
- macOS/Linux 影响：无。
- 最小修复：把 Windows command 改成 `$env:CI='true'; npm install ...; if ($LASTEXITCODE -eq 0) { ... }`。
- 长期修复：将 helper install command 从单字符串升级为结构化 steps，renderer 按 platform/shell 输出。
- 验证命令：

```powershell
$env:CI='true'; npm --version; if ($LASTEXITCODE -eq 0) { npx --version }
```

- 回归风险：修改 registry schema 时需同步 `lib-helper-registry.ps1/.sh` 与 contract tests。

## WIN-P1-05：frontmatter validators 未显式 UTF-8

- 严重程度：P1
- 影响范围：`spec-compound`、`spec-compound-refresh`
- 涉及文件：
  - `skills/spec-compound/scripts/validate-frontmatter.py:43`
  - `skills/spec-compound-refresh/scripts/validate-frontmatter.py:43`
- 触发场景：Windows 中文系统 locale 校验含中文 frontmatter 的 Markdown。
- 失败原因：`open(doc_path)` 使用 Python locale 默认编码；Windows 非 UTF-8 locale 下可能抛 `UnicodeDecodeError` 或误读。
- macOS/Linux 影响：通常无，因为常见 locale 是 UTF-8。
- 最小修复：两个文件同步改 `open(doc_path, encoding="utf-8", newline="")`。
- 长期修复：给所有 Python 文本读写建立 lint/contract，禁止无 encoding 的文本文件读写。
- 验证命令：

```powershell
python skills/spec-compound/scripts/validate-frontmatter.py .\tests\fixtures\frontmatter\chinese.md
python skills/spec-compound-refresh/scripts/validate-frontmatter.py .\tests\fixtures\frontmatter\chinese.md
```

- 回归风险：两个 validator 必须 byte-identical；修改一个不改另一个会触发现有测试。

## WIN-P2-01：`spec-sessions` session discovery 依赖 bash/find/xargs

- 严重程度：P2
- 影响范围：`spec-sessions`
- 涉及文件：
  - `skills/spec-sessions/scripts/discover-sessions.sh:1-66`
  - `skills/spec-sessions/SKILL.md:208-210`
- 触发场景：Windows 用户查找历史 Claude/Codex session。
- 失败原因：脚本依赖 `$HOME`、`find`、bash glob；示例 scratch path 使用 `/tmp/spec-sessions-XXXX`。
- 最小修复：文档标注 Windows fallback；scratch path 改为 OS-temp 表达。
- 长期修复：迁移为 Python/Node session discoverer，使用 `os.homedir()` / `path.join()`。
- 验证命令：

```powershell
node skills/spec-sessions/scripts/discover-sessions.cjs --repo spec-first --days 7
```

## WIN-P2-02：`feature-video` 默认输出目录硬编码 `/tmp`

- 严重程度：P2
- 影响范围：`skills/feature-video`
- 涉及文件：
  - `skills/feature-video/scripts/capture-demo.py:762`
  - `skills/feature-video/references/upload-and-approval.md:27`
- 触发场景：Windows 用户保存 demo artifact。
- 失败原因：默认目录 `/tmp/spec-first/feature-video` 不是 Windows 原生临时目录。
- 最小修复：默认值改 `os.path.join(tempfile.gettempdir(), "spec-first", "feature-video")`。
- 长期修复：所有 Python temp path 统一 helper。
- 验证命令：

```powershell
python skills/feature-video/scripts/capture-demo.py save-local --file .\README.md
```

## WIN-P2-03：用户手册 Windows 命令对照不足

- 严重程度：P2
- 影响范围：用户 onboarding。
- 涉及文件：
  - `README.md:56-70`
  - `README.zh-CN.md:56-70`
  - `docs/05-用户手册/01-快速开始.md:11-34`
  - `docs/05-用户手册/01-快速开始.md:44-56`
  - `docs/05-用户手册/06-本地源码安装.md`
  - `docs/05-用户手册/04-常见问题.md`
- 触发场景：用户从根 README 之外的用户手册复制安装、重装或 hash 清理命令。
- 失败原因：README 已有 PowerShell/cmd 示例，但用户手册仍主要使用 `bash` block、`hash -r`、`&&`。
- 最小修复：用户手册关键命令增加 PowerShell/cmd 分栏。
- 长期修复：新增 docs command classifier，禁止新增未标注 shell 的 copyable command。
- 验证命令：

```bash
rg -n "hash -r|&&|CI=true|mkdir -p|bash scripts/" docs/05-用户手册 README.md README.zh-CN.md
```

## WIN-P2-04：Windows CI 覆盖偏安装/setup，未覆盖完整 workflow helper

- 严重程度：P2
- 影响范围：持续集成与回归防护。
- 涉及文件：
  - `scripts/run-test-suite.cjs:61-88`
  - `.github/workflows/npm-install-matrix.yml:51-84`
  - `.github/workflows/ai-dev-quality-gate.yml:43-61`
  - `.github/workflows/skill-entrypoint-gate.yml:28-49`
- 触发场景：新增或修改 workflow helper，但 CI 未在 Windows 下执行该 helper。
- 失败原因：`run-test-suite.cjs` 原生 Windows 跳过 POSIX shell tests，仅跑 PowerShell mcp contract 或 npm install smoke；两个质量门 workflow 只用 Ubuntu。
- 最小修复：新增 Windows-only workflow smoke，覆盖 `spec-code-review` base resolver、frontmatter validator、Windows docs command smoke。
- 长期修复：跨平台 helper 统一 Node 后，把主质量门扩展为 OS matrix。
- 验证命令：

```powershell
npm run test:mcp-setup
node scripts/npm-install-matrix-smoke.js
npx jest tests/unit/changelog-format.test.js --runInBand
```

## WIN-P2-05：缺 `.gitattributes` 编码/换行治理

- 严重程度：P2
- 影响范围：全仓文本文件、shell、PowerShell、Markdown。
- 涉及文件：仓库根目录。
- 触发场景：Windows 贡献者 checkout、编辑、提交 shell 或 Markdown 文件。
- 失败原因：当前未发现 CRLF/BOM，但缺 `.gitattributes`，无法持续约束 LF/UTF-8。
- 最小修复：新增 `.gitattributes`，至少强制 `*.sh text eol=lf`、`*.cmd text eol=crlf`、`*.ps1 text working-tree-encoding=UTF-8` 策略需先验证。
- 长期修复：CI 加 CRLF/BOM scan。
- 验证命令：

```bash
git ls-files -z | xargs -0 file | rg 'CRLF|BOM'
git diff --check
```

## WIN-P2-06：空格/中文路径覆盖集中在安装链路，workflow helper 未覆盖

- 严重程度：P2
- 影响范围：Windows 用户常见路径，如 `C:\Users\Name With Space\项目`。
- 涉及文件：
  - `scripts/npm-install-matrix-smoke.js:530-531`
  - `scripts/npm-install-matrix-smoke.js:594`
  - `scripts/npm-install-matrix-smoke.js:610`
  - `scripts/npm-install-matrix-smoke.js:634`
  - `skills/*/scripts/*`
- 触发场景：workflow helper 在含空格/中文路径的项目中运行。
- 失败原因：安装 smoke 已覆盖此类路径，但 bash helper 和文档示例未建立同等 fixture。
- 最小修复：新增一个 Windows path fixture，至少跑 code-review resolver 与 frontmatter validator。
- 长期修复：所有 helper contract tests 纳入 space/unicode path matrix。
- 验证命令：

```powershell
$p = Join-Path $env:TEMP 'spec first 中文 (win)'
New-Item -ItemType Directory -Force -Path $p | Out-Null
Push-Location $p
spec-first doctor --json
Pop-Location
```

## WIN-P3-01：`release-publish.cjs` dry-run 直接 spawn `npm`

- 严重程度：P3
- 影响范围：维护者发布路径。
- 涉及文件：`scripts/release-publish.cjs:113-119`
- 触发场景：Windows 维护者运行 release dry-run。
- 失败原因：Node 文档对 `.bat` / `.cmd` spawn 有特殊约束；dry-run 分支直接 `spawnSync('npm', ...)`。但该文件注释说明这么做是为了避免 `npm_execpath` 指向 pnpm 时重新触发 `pnpm pack --dry-run` 不兼容，且该分支已用 try/catch 把失败降级为“tarball 预览跳过”。
- 最小修复：解析真实 npm 二进制而不经 `npm_execpath`：Windows 下调用 `npm.cmd`，POSIX 下调用 `npm`，并保留现有 try/catch 降级。
- 长期修复：把“真实 npm CLI”和“当前包管理器 npm_execpath”分成两个 helper，发布 dry-run 只使用真实 npm CLI。
- 验证命令：

```powershell
node scripts/release-publish.cjs patch --dry-run
```

## WIN-P3-02：缺统一 Windows 本地验证入口

- 严重程度：P3
- 影响范围：贡献者体验。
- 涉及文件：建议新增 `scripts/verify-windows.ps1`、`scripts/verify-cross-platform.js`。
- 触发场景：Windows 贡献者不知道应该运行哪些验证。
- 失败原因：现有验证分散在 npm scripts、Jest、smoke 和 setup contract。
- 最小修复：新增 `scripts/verify-windows.ps1` 聚合现有命令。
- 长期修复：`verify-cross-platform.js` 生成 machine-readable compatibility facts。
- 验证命令：

```powershell
pwsh scripts/verify-windows.ps1
```

## WIN-P3-03：缺文档命令 PowerShell classifier

- 严重程度：P3
- 影响范围：长期文档质量。
- 涉及文件：`docs/`、`skills/`、README。
- 触发场景：新增 skill 或用户手册命令时，作者只写 bash 示例。
- 失败原因：没有 lint 将 copyable command 的 shell 兼容性纳入 review。
- 最小修复：新增 advisory lint，扫描 `bash` block 中的 `hash -r`、`CI=true`、`mkdir -p`、`cat /tmp`、`bash scripts/`、`&&`。
- 长期修复：按 code block language 和 path surface 区分 required/fyi，避免误报历史 plan。
- 验证命令：

```bash
node scripts/verify-cross-platform.js --docs-command-lint
```
