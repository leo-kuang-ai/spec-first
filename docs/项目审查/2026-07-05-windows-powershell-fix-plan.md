# spec-first Windows PowerShell 兼容性分阶段修复计划

审查日期：2026-07-05

来源：

- `docs/项目审查/2026-07-05-windows-powershell-compat-review.md`
- `docs/项目审查/2026-07-05-windows-powershell-compat-issues.md`

## Goals

- 让 Windows 用户在不安装 WSL 的前提下完成安装、`doctor`、`init`、setup baseline 和关键 workflow 的可验证最小路径。
- 消除高价值 workflow 中不必要的 bash-only helper。
- 将 Windows 兼容性从一次性审查转为可重复的 CI/checklist。
- 保持 macOS/Linux 现有行为不回归。

## Non-Goals

- 不要求所有历史 docs/plans 中的 bash 示例都改为 PowerShell。
- 不把 Git Bash/WSL 作为普通 Windows 用户的唯一支持路径。
- 不手改 `.claude/`、`.codex/`、`.agents/skills/` generated runtime mirrors。
- 不让脚本做语义判断；脚本只提供 deterministic compatibility facts。

## Phase 1：快速止血

目标：Windows 用户能完成基本安装和核心流程；关键 workflow 遇到 bash-only helper 时不 silent fail。

| 任务 | 优先级 | 涉及文件 | 最小改动 | 验证方式 |
| -- | -- | -- | -- | -- |
| 修复 `agent-browser` Windows command | P1 | `skills/spec-mcp-setup/helper-tools.json`, `tests/unit/mcp-setup-powershell-contracts.test.js` | 将 `windows` command 改为 `$env:CI='true'; ... if ($LASTEXITCODE -eq 0) { ... }` 或结构化 steps | PowerShell 5.1 copy smoke；`npx jest tests/unit/mcp-setup-powershell-contracts.test.js --runInBand` |
| validator 显式 UTF-8 | P1 | `skills/spec-compound/scripts/validate-frontmatter.py`, `skills/spec-compound-refresh/scripts/validate-frontmatter.py`, `tests/unit/frontmatter-validator.test.js` | 两份 byte-identical 文件同步 `encoding='utf-8'` | 中文 frontmatter fixture；`npx jest tests/unit/frontmatter-validator.test.js --runInBand` |
| bash-only workflow 显式降级 | P2 | `skills/spec-polish-beta/SKILL.md`, `skills/spec-optimize/SKILL.md`, `skills/spec-code-review/SKILL.md`, `skills/spec-sessions/SKILL.md` | 主流程加入 Windows 原生 degraded-mode 说明、harness bash 前提和手动 fallback | `git diff --check`；新增 contract anchor |

Phase 1 完成标准：

- PowerShell 5.1 复制 `agent-browser` Windows repair command 不因语法失败。
- 中文 frontmatter validator 在 Windows locale 下可读。
- Windows code review 能不依赖 bash 解析 base，或明确要求用户提供 base。

## Phase 2：跨平台抽象

目标：消除 workflow helper 主路径的 shell 依赖。

| 任务 | 优先级 | 涉及文件 | 最小改动 | 验证方式 |
| -- | -- | -- | -- | -- |
| `spec-code-review` base resolver 迁移 Node | P2 | `skills/spec-code-review/scripts/resolve-base.cjs`, `SKILL.md` | 新增 Node resolver；保留 `.sh` 作为 Git Bash fallback 或废弃路径 | Windows/macOS/Linux git fixture；`npx jest tests/unit/spec-code-review-contracts.test.js --runInBand` |
| `spec-polish-beta` helper 迁移 Node | P2 | `skills/spec-polish-beta/scripts/*.cjs`, `SKILL.md` | 将 launch.json、project type、package manager、port resolver 改成 Node | Next/Vite/Nuxt/Astro/Remix/SvelteKit fixture |
| `spec-optimize` runner 迁移 Node | P2 | `skills/spec-optimize/scripts/optimize-runner.cjs`, `SKILL.md` | 统一 measure/probe/worktree/temp/stdin pipe | Windows PowerShell baseline + one experiment smoke |
| `spec-sessions` discoverer 迁移 Node/Python | P2 | `skills/spec-sessions/scripts/discover-sessions.cjs`, `SKILL.md` | 使用 `os.homedir()`、`path.join()`、mtime filter | Windows/macOS/Linux synthetic session fixture |
| 修 `feature-video` temp path | P2 | `skills/feature-video/scripts/capture-demo.py`, docs | 默认 `tempfile.gettempdir()` | `python ... save-local --file README.md` |
| 增 `.gitattributes` | P2 | `.gitattributes` | 强制 `*.sh eol=lf`，规范 Markdown/JSON/YAML/PS1 文本策略 | `git ls-files -z | xargs -0 file | rg 'CRLF|BOM'` |
| 增 Windows workflow helper CI | P2 | `.github/workflows/windows-compat.yml` | `windows-latest` 跑 `pwsh` smoke；必要时覆盖 `shell: powershell` | GitHub Actions matrix |
| 用户手册补 PowerShell 最小对照 | P2 | `docs/05-用户手册/01-快速开始.md`, `04-常见问题.md`, `06-本地源码安装.md` | 对安装、doctor、update、cache clean、hash reset 增加 PowerShell/cmd 示例 | docs command scan |

Phase 2 完成标准：

- 关键 workflow helper 不要求 Git Bash/WSL 才能走 happy path。
- CI 至少覆盖 install/init/doctor/setup/code-review resolver/frontmatter validator/polish helper detection。
- 空格路径与中文路径不只覆盖 install smoke，也覆盖 2 个以上 workflow helper。
- 用户从当前用户手册复制最小安装/检查命令不会因 `hash -r` 或 `&&` 失败。

## Phase 3：长期治理

目标：新增 skill / agent / script / docs 命令时，Windows 兼容性有持续护栏。

| 任务 | 优先级 | 涉及文件 | 最小改动 | 验证方式 |
| -- | -- | -- | -- | -- |
| 新增 `scripts/verify-windows.ps1` | P3 | `scripts/verify-windows.ps1` | 聚合 Windows 本地最小验证命令 | `pwsh scripts/verify-windows.ps1` |
| 新增 `scripts/verify-cross-platform.js` | P3 | `scripts/verify-cross-platform.js` | 输出 command/path/encoding facts | `node scripts/verify-cross-platform.js --json` |
| 文档命令 classifier | P3 | `scripts/verify-cross-platform.js`, tests | 扫描 copyable command 的 shell family 与风险 token | CI advisory 或 blocking 分层 |
| Windows troubleshooting docs | P3 | `docs/windows-compatibility.md`, `docs/troubleshooting/windows.md` | 支持矩阵、PATH、npm shim、PowerShell 5.1、UTF-8 | docs link check |
| 发布路径解析真实 npm CLI | P3 | `scripts/release-publish.cjs` | dry-run 解析真实 `npm` / `npm.cmd`，避免经 `npm_execpath` 回到 pnpm，并保留预览失败降级 | Windows dry-run smoke |

Phase 3 完成标准：

- 贡献者有一个明确 Windows 本地验证入口。
- 新增 bash-only copyable command 至少触发 advisory。
- 支持矩阵明确区分 PowerShell 5.1、PowerShell 7+、cmd、Git Bash、WSL。

## 推荐落地顺序

1. 修 `helper-tools.json` Windows command，因为这是最小且用户可复制失败最明显的 P1。
2. 修两个 Python validator encoding，因为改动小、风险低、直接保护中文文档。
3. 给 polish/optimize/code-review/sessions 加 Windows degraded notice，避免继续暗示原生 PowerShell 可直接跑。
4. 新增 `.gitattributes` 和用户手册 PowerShell 对照。
5. 迁移 code-review Node base resolver，因为 review 是核心链路，且当前 bash helper 可被独立替换。
6. 迁移 polish helper 到 Node，作为 helper 迁移样板。
7. 迁移 optimize runner，因其状态和并行复杂度更高，应在 polish 样板稳定后做。
8. 增 Windows CI 和 `verify-windows.ps1`，把已修路径纳入持续验证。

## 建议验证命令

当前 macOS/Linux 开发机上的最小验证：

```bash
git diff --check
npx jest tests/unit/changelog-format.test.js --runInBand
npx jest tests/unit/mcp-setup-powershell-contracts.test.js --runInBand
node scripts/npm-install-matrix-smoke.js
git ls-files -z | xargs -0 file | rg 'CRLF|BOM'
```

Windows PowerShell 7+ 上的建议验证：

```powershell
npm ci
npm run typecheck
npm run test:mcp-setup
node scripts/npm-install-matrix-smoke.js
spec-first doctor --json
spec-first init --codex -y
```

Windows PowerShell 5.1 上的建议验证：

```powershell
npm install -g spec-first
spec-first doctor
$env:CI='true'; npm --version; if ($LASTEXITCODE -eq 0) { npx --version }
```

含空格/中文路径 fixture：

```powershell
$root = Join-Path $env:TEMP 'spec first 中文 (win)'
New-Item -ItemType Directory -Force -Path $root | Out-Null
Push-Location $root
spec-first doctor --json
spec-first init --codex -y
Pop-Location
```

## 回归风险与控制

| 风险 | 可能影响 | 控制方式 |
| -- | -- | -- |
| Node helper 输出与旧 bash helper 不一致 | polish/optimize 行为变化 | 先写 fixture，保留旧 helper 对照输出 |
| `.gitattributes` 引发大量换行 diff | 历史文件 churn | 单独 PR，先 dry-run 检查，不混入功能修复 |
| PowerShell 5.1 与 7+ 语法差异 | 修复只在 7+ 生效 | copyable command 默认按 5.1 保守写法 |
| helper registry 从 string command 改 steps | downstream renderer 破坏 | 若改 schema，版本化并补 renderer tests |
| Windows CI 时长增加 | PR feedback 变慢 | 初期新增 focused workflow，后续再扩 matrix |

## Source / Runtime 边界

- 可修改 source：`skills/`、`docs/`、`scripts/`、`.github/workflows/`、`.gitattributes`、tests、`CHANGELOG.md`。
- 不手改 generated runtime mirrors：`.claude/`、`.codex/`、`.agents/skills/`。
- 若修复 skill/runtime projection 后需要刷新 runtime，由后续执行 `spec-first init` 生成，不在 source patch 中直接改 mirror。

## Issue 拆分建议

| Issue | 标题 | 建议标签 | 依赖 |
| -- | -- | -- | -- |
| 1 | Fix PowerShell command rendering for helper-tools agent-browser | `windows`, `setup`, `P1` | 无 |
| 2 | Make compound frontmatter validators UTF-8 explicit | `windows`, `python`, `P1` | 无 |
| 3 | Replace spec-code-review resolve-base bash helper with Node | `windows`, `review`, `P2` | 4 |
| 4 | Add Windows degraded notices for bash-only workflows | `windows`, `docs`, `P2` | 无 |
| 5 | Add PowerShell examples to user manual install/update docs | `windows`, `docs`, `P2` | 4 |
| 6 | Port spec-polish-beta helper scripts to Node | `windows`, `workflow`, `P2` | 4 |
| 7 | Port spec-optimize runner helpers to Node | `windows`, `workflow`, `P2` | 4 |
| 8 | Port spec-sessions discovery to Node/Python | `windows`, `workflow`, `P2` | 4 |
| 9 | Add gitattributes and encoding/newline scan | `windows`, `governance`, `P2` | 无 |
| 10 | Add focused Windows compatibility workflow | `windows`, `ci`, `P2` | 1,2,3 |
| 11 | Add verify-windows.ps1 and cross-platform command lint | `windows`, `tooling`, `P3` | 10 |
