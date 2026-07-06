# spec-first Windows PowerShell 兼容性问题清单

审查日期：2026-07-05

来源：`docs/项目审查/2026-07-05-windows-powershell-compat-review.md`

问题总数：14 个。P0 0 个，P1 2 个，P2 9 个，P3 3 个。

## P0

未发现 P0。

依据：

- `package.json:6-8` 声明 npm `bin`。
- `.github/workflows/npm-install-matrix.yml:51-84` 覆盖 `ubuntu-latest`、`macos-latest`、`windows-latest`，Windows 分别跑 `pwsh` 与 `cmd`。
- `scripts/npm-install-matrix-smoke.js:120-145` 使用 `shell:false` 并隐藏 Windows 子进程窗口。
- `scripts/npm-install-matrix-smoke.js:716-868` 覆盖 pack/install、Windows `.cmd` shim、含空格/中文/括号路径、Claude/Codex/Cursor/Kiro/Qoder programmatic init 与 `doctor --json`。

## WIN-P1-01：`helper-tools.json` Windows command 使用 PowerShell 5.1 不兼容语法

- 严重程度：P1
- 影响范围：`spec-mcp-setup` helper repair path 的用户复制命令与 registry 展示。
- 涉及文件：`skills/spec-mcp-setup/helper-tools.json:21-25`
- 触发场景：`agent-browser` 缺失且用户复制 registry 的 Windows command。
- 失败原因：`CI=true npm install ... && agent-browser install && npx ...` 是 POSIX/PowerShell 7+ 混合命令；PowerShell 5.1 不支持 env-prefix 和 pipeline chain operator。
- macOS/Linux 影响：无。
- 最小修复：把 Windows command 改成 `$env:CI='true'; npm install ...; if ($LASTEXITCODE -eq 0) { ... }`。
- 长期修复：将 helper install command 从单字符串升级为结构化 steps，renderer 按 platform/shell 输出。
- 当前复核命令：

```bash
rg -n '"windows": "CI=true|&& agent-browser|agent-browser install' skills/spec-mcp-setup/helper-tools.json skills/spec-mcp-setup/scripts/install-helpers.ps1
```

- 修复后验收命令：

```powershell
$registry = Get-Content -Raw .\skills\spec-mcp-setup\helper-tools.json | ConvertFrom-Json
$command = ($registry.helpers | Where-Object { $_.id -eq 'agent-browser' }).installation.commands.windows
if ($command -match '(^|\s)CI=true\s|&&') { throw "Windows command is not PowerShell 5.1 safe: $command" }
npx jest tests/unit/mcp-setup-powershell-contracts.test.js --runInBand
```

- 回归风险：修改 registry schema 时需同步 `lib-helper-registry.ps1/.sh`、renderer 与 contract tests。

## WIN-P1-02：frontmatter validators 未显式 UTF-8

- 严重程度：P1
- 影响范围：`spec-compound`、`spec-compound-refresh`
- 涉及文件：
  - `skills/spec-compound/scripts/validate-frontmatter.py:43`
  - `skills/spec-compound-refresh/scripts/validate-frontmatter.py:43`
- 触发场景：Windows 中文系统 locale 校验含中文 frontmatter 的 Markdown。
- 失败原因：`open(doc_path)` 使用 Python locale 默认编码；Windows 非 UTF-8 locale 下可能抛 `UnicodeDecodeError` 或误读。
- macOS/Linux 影响：通常无，因为常见 locale 是 UTF-8。
- 最小修复：两个文件同步改 `open(doc_path, encoding='utf-8', newline='')`。
- 长期修复：给所有 Python 文本读写建立 lint/contract，禁止无 encoding 的文本文件读写。
- 当前复核命令：

```bash
rg -n "open\\(doc_path\\)" skills/spec-compound/scripts/validate-frontmatter.py skills/spec-compound-refresh/scripts/validate-frontmatter.py
```

- 修复后验收命令：

```powershell
$dir = Join-Path $env:TEMP 'spec-frontmatter 中文'
New-Item -ItemType Directory -Force -Path $dir | Out-Null
$doc = Join-Path $dir '含中文-frontmatter.md'
$content = @'
---
title: "中文标题"
problem_type: workflow_issue
---

# 中文标题
'@
$utf8NoBom = New-Object System.Text.UTF8Encoding -ArgumentList $false
[System.IO.File]::WriteAllText($doc, $content, $utf8NoBom)
python skills/spec-compound/scripts/validate-frontmatter.py $doc
python skills/spec-compound-refresh/scripts/validate-frontmatter.py $doc
npx jest tests/unit/frontmatter-validator.test.js --runInBand
```

- 回归风险：两个 validator 必须 byte-identical；修改一个不改另一个会触发现有测试。

## WIN-P2-01：`spec-polish-beta` helper 是 bash-only

- 严重程度：P2
- 影响范围：`spec-polish-beta`
- 涉及文件：
  - `skills/spec-polish-beta/SKILL.md:63`
  - `skills/spec-polish-beta/SKILL.md:67`
  - `skills/spec-polish-beta/SKILL.md:83`
  - `skills/spec-polish-beta/SKILL.md:85`
  - `skills/spec-polish-beta/SKILL.md:126-130`
  - `skills/spec-polish-beta/scripts/*.sh`
- 触发场景：agent 在 Windows 宿主内要求启动浏览器可见 app 并进入 polish loop。
- 失败原因：workflow contract 要求执行 `bash scripts/read-launch-json.sh`、`bash scripts/detect-project-type.sh`、`bash scripts/resolve-package-manager.sh`、`bash scripts/resolve-port.sh --type <type>`；原生 PowerShell 无 bash 时失败。
- macOS/Linux 影响：无直接影响。
- 最小修复：SKILL 中显式声明 Windows 原生暂需 Git Bash/WSL 或手动启动；同时为 helper 增加 Node 版本并优先调用 Node。
- 长期修复：统一迁移为 `scripts/*.cjs`，删除主路径 bash 依赖。
- 当前复核命令：

```bash
rg -n "bash scripts/(read-launch-json|detect-project-type|resolve-package-manager|resolve-port)\\.sh" skills/spec-polish-beta/SKILL.md
```

- 修复后验收命令：

```powershell
node skills/spec-polish-beta/scripts/detect-project-type.cjs .
node skills/spec-polish-beta/scripts/resolve-package-manager.cjs .
node skills/spec-polish-beta/scripts/resolve-port.cjs --type vite
```

- 回归风险：框架探测结果改变可能影响现有 macOS/Linux polish 行为；需要 fixture 锁定主流框架。

## WIN-P2-02：`spec-optimize` 优化闭环依赖 POSIX shell 与 `/tmp`

- 严重程度：P2
- 影响范围：`spec-optimize`
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
- 失败原因：`mkdir -p`、`bash scripts/*.sh`、`WORKTREE_PATH=$(...)`、`cat /tmp/... | codex exec ...` 均为 POSIX 写法。
- macOS/Linux 影响：无直接影响。
- 最小修复：新增 Windows degraded notice；Codex backend temp file 示例改为 OS-temp 表达，并给 PowerShell 替代命令。
- 长期修复：新增 `skills/spec-optimize/scripts/optimize-runner.cjs`，统一处理 measurement、parallel probe、worktree 和 stdin dispatch。
- 当前复核命令：

```bash
rg -n "mkdir -p|bash scripts/(measure|parallel-probe|experiment-worktree)\\.sh|cat /tmp" skills/spec-optimize/SKILL.md
```

- 修复后验收命令：

```powershell
node skills/spec-optimize/scripts/optimize-runner.cjs probe --project . --measurement "node -e \"console.log(JSON.stringify({score:1}))\""
```

- 回归风险：优化 workflow 涉及状态日志和 worktree，迁移需要 crash-recovery fixture。

## WIN-P2-03：`spec-code-review` base resolver 依赖 bash/awk/sed

- 严重程度：P2
- 影响范围：`spec-code-review`
- 涉及文件：
  - `skills/spec-code-review/scripts/resolve-base.sh:1-103`
  - `skills/spec-code-review/SKILL.md:335`
  - `skills/spec-code-review/SKILL.md:402`
  - `skills/spec-code-review/SKILL.md:428-430`
  - `skills/spec-code-review/SKILL.md:438`
  - `skills/spec-code-review/SKILL.md:448-450`
  - `skills/spec-code-review/SKILL.md:458`
- 触发场景：agent 在 Windows 宿主下 review PR 或本地分支，需要自动确定 merge-base。
- 失败原因：脚本 `#!/bin/bash`，内部使用 `awk`、`sed`、POSIX test、command substitution；SKILL 命令示例也使用 `&&` 链式 shell。
- macOS/Linux 影响：无直接影响。
- 最小修复：允许用户显式传入 base，并在 Windows 下跳过 bash resolver；文档说明 Git Bash/WSL fallback。
- 长期修复：迁移为 `resolve-base.cjs`，保持输出协议。
- 当前复核命令：

```bash
bash -n skills/spec-code-review/scripts/resolve-base.sh
rg -n "resolve-base\\.sh|awk|sed|&&" skills/spec-code-review/SKILL.md skills/spec-code-review/scripts/resolve-base.sh
```

- 修复后验收命令：

```powershell
node skills/spec-code-review/scripts/resolve-base.cjs
```

- 回归风险：fork-safe remote resolution 与 shallow repo unshallow 行为必须逐项回归。

## WIN-P2-04：`spec-sessions` session discovery 依赖 bash/find/xargs

- 严重程度：P2
- 影响范围：`spec-sessions`
- 涉及文件：
  - `skills/spec-sessions/scripts/discover-sessions.sh:1-66`
  - `skills/spec-sessions/SKILL.md:208-210`
- 触发场景：Windows 用户查找历史 Claude/Codex session。
- 失败原因：脚本依赖 `$HOME`、`find`、bash glob；示例 scratch path 使用 `/tmp/spec-sessions-XXXX`。
- 最小修复：文档标注 Windows fallback；scratch path 改为 OS-temp 表达。
- 长期修复：迁移为 Python/Node session discoverer，使用 `os.homedir()` / `path.join()`。
- 当前复核命令：

```bash
bash -n skills/spec-sessions/scripts/discover-sessions.sh
rg -n "\\$HOME|find |xargs|/tmp/spec-sessions" skills/spec-sessions/SKILL.md skills/spec-sessions/scripts/discover-sessions.sh
```

- 修复后验收命令：

```powershell
node skills/spec-sessions/scripts/discover-sessions.cjs --repo spec-first --days 7
```

## WIN-P2-05：`feature-video` 默认输出目录硬编码 `/tmp`

- 严重程度：P2
- 影响范围：`skills/feature-video`
- 涉及文件：
  - `skills/feature-video/scripts/capture-demo.py:762`
  - `skills/feature-video/references/upload-and-approval.md:27`
- 触发场景：Windows 用户保存 demo artifact。
- 失败原因：默认目录 `/tmp/spec-first/feature-video` 不是 Windows 原生临时目录。
- 最小修复：默认值改 `os.path.join(tempfile.gettempdir(), 'spec-first', 'feature-video')`。
- 长期修复：所有 Python temp path 统一 helper。
- 验证命令：

```powershell
python skills/feature-video/scripts/capture-demo.py save-local --file .\README.md
```

## WIN-P2-06：用户手册 Windows 命令对照不足

- 严重程度：P2
- 影响范围：用户 onboarding。
- 涉及文件：
  - `README.md:56-70`
  - `README.zh-CN.md:56-70`
  - `docs/05-用户手册/01-快速开始.md:27`
  - `docs/05-用户手册/04-常见问题.md:269`
  - `docs/05-用户手册/04-常见问题.md:380`
  - `docs/05-用户手册/06-本地源码安装.md:69`
  - `docs/05-用户手册/06-本地源码安装.md:339`
  - `docs/05-用户手册/06-本地源码安装.md:348`
- 触发场景：用户从根 README 之外的用户手册复制安装、重装或 hash 清理命令。
- 失败原因：README 已有 PowerShell/cmd 示例，但用户手册仍有 `hash -r`、`&&`、POSIX env-prefix。
- 最小修复：用户手册关键命令增加 PowerShell/cmd 分栏。
- 长期修复：新增 docs command classifier，禁止新增未标注 shell 的 copyable command。
- 验证命令：

```bash
rg -n "hash -r|&&|CI=true|mkdir -p|bash scripts/" docs/05-用户手册 README.md README.zh-CN.md
```

## WIN-P2-07：Windows CI 覆盖偏安装/setup，未覆盖完整 workflow helper

- 严重程度：P2
- 影响范围：持续集成与回归防护。
- 涉及文件：
  - `scripts/run-test-suite.cjs:61-112`
  - `.github/workflows/npm-install-matrix.yml:51-84`
  - `.github/workflows/ai-dev-quality-gate.yml:43-61`
  - `.github/workflows/skill-entrypoint-gate.yml:28-49`
- 触发场景：新增或修改 workflow helper，但 CI 未在 Windows 下执行该 helper。
- 失败原因：`run-test-suite.cjs` 原生 Windows 跳过 POSIX shell tests，仅跑 PowerShell mcp contract 或 npm install smoke；两个质量门 workflow 只用 Ubuntu。
- 最小修复：新增 Windows-only workflow smoke，覆盖 base resolver、frontmatter validator、Windows docs command smoke。
- 长期修复：跨平台 helper 统一 Node 后，把主质量门扩展为 OS matrix。
- 当前复核命令：

```bash
rg -n "skip POSIX shell test on native Windows|runs-on: ubuntu-latest|windows-latest" scripts/run-test-suite.cjs .github/workflows/ai-dev-quality-gate.yml .github/workflows/skill-entrypoint-gate.yml .github/workflows/npm-install-matrix.yml
```

- 修复后验收命令：

```powershell
npm ci
npm run test:mcp-setup
node scripts/npm-install-matrix-smoke.js
npx jest tests/unit/frontmatter-validator.test.js tests/unit/spec-code-review-contracts.test.js tests/unit/spec-polish-beta-contracts.test.js --runInBand
# GitHub Actions 还应在 windows-latest + pwsh 下运行 .github/workflows/windows-compat.yml，
# 覆盖 code-review resolver、frontmatter validator、polish helper detection 和 docs command smoke。
```

## WIN-P2-08：缺 `.gitattributes` 编码/换行治理

- 严重程度：P2
- 影响范围：全仓文本文件、shell、PowerShell、Markdown。
- 涉及文件：仓库根目录。
- 触发场景：Windows 贡献者 checkout、编辑、提交 shell 或 Markdown 文件。
- 失败原因：当前未发现 CRLF/BOM，但缺 `.gitattributes`，无法持续约束 LF/UTF-8。
- 最小修复：新增 `.gitattributes`，至少强制 `*.sh text eol=lf`。
- 长期修复：CI 加 CRLF/BOM scan。
- 验证命令：

```bash
git ls-files -z | xargs -0 file | rg 'CRLF|BOM'
git diff --check
```

## WIN-P2-09：空格/中文路径覆盖集中在安装链路，workflow helper 未覆盖

- 严重程度：P2
- 影响范围：Windows 用户常见路径，如 `C:\Users\Name With Space\项目`。
- 涉及文件：
  - `scripts/npm-install-matrix-smoke.js`
  - `skills/*/scripts/*`
- 触发场景：workflow helper 在含空格/中文路径的项目中运行。
- 失败原因：安装 smoke 已覆盖此类路径，但 bash helper 和文档示例未建立同等 fixture。
- 最小修复：新增一个 Windows path fixture，至少跑 code-review resolver 与 frontmatter validator。
- 长期修复：所有 helper contract tests 纳入 space/unicode path matrix。
- 当前复核命令：

```bash
rg -n "prefix with spaces|中文|doctor --json|resolve-base|frontmatter|polish" scripts/npm-install-matrix-smoke.js tests/unit skills/*/scripts
```

- 修复后验收命令：

```powershell
$repo = Resolve-Path .
$root = Join-Path $env:TEMP 'spec first 中文 (win)'
New-Item -ItemType Directory -Force -Path $root | Out-Null
$doc = Join-Path $root '含中文-frontmatter.md'
$content = @'
---
title: "中文标题"
problem_type: workflow_issue
---

# 中文标题
'@
$utf8NoBom = New-Object System.Text.UTF8Encoding -ArgumentList $false
[System.IO.File]::WriteAllText($doc, $content, $utf8NoBom)
Push-Location $root
git init
[System.IO.File]::WriteAllText((Join-Path $root 'package.json'), '{"scripts":{"dev":"vite"},"dependencies":{"vite":"latest"}}', $utf8NoBom)
'# fixture' | Set-Content README.md
git config user.email "spec-first@example.invalid"
git config user.name "spec-first windows fixture"
git add README.md package.json
git commit -m init
node "$repo\skills\spec-polish-beta\scripts\detect-project-type.cjs" .
python "$repo\skills\spec-compound\scripts\validate-frontmatter.py" $doc
node "$repo\skills\spec-code-review\scripts\resolve-base.cjs"
Pop-Location
```

## WIN-P3-01：`release-publish.cjs` dry-run 直接 spawn `npm`

- 严重程度：P3
- 影响范围：维护者发布路径。
- 涉及文件：`scripts/release-publish.cjs`
- 触发场景：Windows 维护者执行 `npm run release:publish -- <version> --dry-run`。
- 失败原因：直接 `spawnSync('npm', ...)` 可能在 Windows 下需要 `npm.cmd`；现有 catch 会把失败降级为跳过 tarball 预览。
- 最小修复：按平台解析 `npm.cmd` / `npm`。
- 长期修复：复用 `runNpm` helper 的真实 npm CLI 解析策略。

## WIN-P3-02：缺统一 Windows 本地验证入口

- 严重程度：P3
- 影响范围：贡献者验证体验。
- 涉及文件：建议新增 `scripts/verify-windows.ps1`、`scripts/verify-cross-platform.js`。
- 触发场景：贡献者想本地复现 Windows 兼容性检查。
- 失败原因：验证命令分散在 README、CI、tests 和本审查报告中。
- 最小修复：新增 `verify-windows.ps1` 聚合当前最小命令。
- 长期修复：把 command/path/encoding facts 输出为 JSON，供 CI 和 review 消费。

## WIN-P3-03：缺文档命令 PowerShell classifier

- 严重程度：P3
- 影响范围：docs/skills 长期治理。
- 涉及文件：建议新增 `scripts/verify-cross-platform.js` 与 tests。
- 触发场景：新增 skill/docs 命令示例时不小心写入 bash-only copyable command。
- 失败原因：当前只有人工审查和零散 rg，没有结构化 classifier。
- 最小修复：对 fenced code block 和 inline command 扫描风险 token，输出 advisory。
- 长期修复：按 source/runtime、docs、skill prose 分层，P0/P1 命令进入 blocking，历史 docs 保持 advisory。
