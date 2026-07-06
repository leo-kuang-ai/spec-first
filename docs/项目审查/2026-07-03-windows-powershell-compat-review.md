# spec-first Windows PowerShell 兼容性专项审查报告

审查日期：2026-07-03

审查模式：`$spec-doc-review` 单智能体 report-only fallback。当前请求未显式授权 `subagents` / `personas` / parallel reviewer dispatch，因此未启动 persona subagents；Coverage 记录 `single-agent report-only fallback` 与 `dispatch_authorization_missing`。

关联产物：

- 问题清单：`docs/项目审查/2026-07-03-windows-powershell-compat-issues.md`
- 修复计划：`docs/项目审查/2026-07-03-windows-powershell-fix-plan.md`

## 1. 结论摘要

1. 当前仓库的 npm 安装、CLI 入口、`doctor`、Claude/Codex programmatic init 在 Windows 上已有较强正向证据：`package.json` 声明 `bin.spec-first`，npm install matrix 覆盖 `windows-latest` 的 `pwsh` 与 `cmd`，安装 smoke 显式验证 `.cmd` shim、空格路径、中文路径和括号路径。
2. 本次未发现 P0。也就是说，没有证据表明 Windows 下核心安装链路整体不可用。
3. 最大风险不在 npm 包安装，而在 workflow/helper 层：`spec-polish-beta`、`spec-optimize`、`spec-code-review`、`spec-sessions` 等仍包含 bash-only helper 或 POSIX 命令示例。它们不是“用户复制命令”问题，而是 agent 在 workflow 内执行 helper 时依赖当前 harness 是否提供 bash；无 bash 时需要 Git Bash / WSL / 手动 fallback。
4. `spec-mcp-setup` 是当前跨平台成熟度最高的区域：`scripts/` 下有 `.ps1` 与 `.sh` 对等实现，并有 `tests/unit/mcp-setup-powershell-contracts.test.js` 覆盖 PowerShell setup contract。
5. `helper-tools.json` 中 `agent-browser` 的 Windows 展示命令仍使用 `CI=true ... && ...`，这在 Windows PowerShell 5.1 下直接不兼容；实际 `.ps1` installer 已使用 `$env:CI='true'` 和 PowerShell 控制流，所以这是注册表/展示/next-action 漂移风险。
6. Python 风险集中在默认编码：两个 frontmatter validator 使用 `open(doc_path)`，在 Windows 非 UTF-8 locale 下读取中文 Markdown 可能失败或乱码。
7. 文件换行当前未发现已跟踪文件含 CRLF 或 BOM，但仓库缺 `.gitattributes`，没有机械约束 shell LF、PowerShell UTF-8、Markdown/JSON/YAML 文本策略。
8. Windows CI 覆盖偏安装/setup；`scripts/run-test-suite.cjs` 在原生 Windows 会跳过 POSIX shell tests，`ai-dev-quality-gate.yml` 与 `skill-entrypoint-gate.yml` 只跑 Ubuntu，因此 workflow helper 层没有 Windows 行为回归保护。
9. 建议默认支持层级：普通用户默认支持 Windows Terminal + PowerShell 7+；兼容 PowerShell 5.1 的安装、doctor、init 和 setup 基线；bash-heavy workflow 在迁移前明确标注“需要 Git Bash/WSL 或待 Windows helper”。
10. 最优先修复顺序：先修 P1 的 copyable Windows 命令和 Python encoding；再给 bash-only workflow helper 补清晰 degraded notice，并逐步迁移到 Node/PowerShell 可执行路径；随后补 `.gitattributes`、Windows smoke 扩展、用户手册 PowerShell 对照。

## 2. 风险总览表

| 编号 | 严重程度 | 类型 | 文件 | 问题摘要 | Windows 影响 | 修复优先级 |
| -- | -- | -- | -- | -- | -- | -- |
| WIN-P1-04 | P1 | Registry/command | `skills/spec-mcp-setup/helper-tools.json` | `agent-browser` Windows 展示命令使用 `CI=true ... && ...` | PowerShell 5.1 复制即失败；与 `.ps1` 实际执行路径漂移 | 第一阶段 |
| WIN-P1-05 | P1 | Python/encoding | `skills/spec-compound*/scripts/validate-frontmatter.py` | `open(doc_path)` 未指定 encoding | 中文 Markdown frontmatter 在 Windows locale 下可能读错 | 第一阶段 |
| WIN-P2-07 | P2 | Shell/helper | `skills/spec-polish-beta/SKILL.md`, `skills/spec-polish-beta/scripts/*.sh` | UI polish workflow 强制 `bash scripts/<name>.sh` | 原生 PowerShell 无 bash 时 agent 无法自动启动/探测 dev server | 第一阶段提示，第二阶段迁移 |
| WIN-P2-08 | P2 | Shell/helper | `skills/spec-optimize/SKILL.md`, `skills/spec-optimize/scripts/*.sh` | Optimize workflow 使用 `mkdir -p`、bash helper、`cat /tmp/...` | 原生 PowerShell 无 bash 时优化闭环卡在测量/并行/派生 worktree | 第一阶段提示，第二阶段迁移 |
| WIN-P2-09 | P2 | Shell/helper | `skills/spec-code-review/scripts/resolve-base.sh`, `skills/spec-code-review/SKILL.md` | Review base resolver 依赖 bash/awk/sed | 原生 PowerShell 无 bash 时需 Git Bash/WSL 或手动提供 base | 第一阶段提示，第二阶段迁移 |
| WIN-P2-01 | P2 | Shell/helper | `skills/spec-sessions/scripts/discover-sessions.sh`, `skills/spec-sessions/SKILL.md` | session 发现依赖 bash/find/xargs，示例写 `/tmp` | Windows 原生查询历史 session 体验差 | 第二阶段 |
| WIN-P2-02 | P2 | Python/path | `skills/feature-video/scripts/capture-demo.py`, `skills/feature-video/references/upload-and-approval.md` | 默认输出目录硬编码 `/tmp/spec-first/feature-video` | Windows 原生路径不可用或落到错误语义 | 第二阶段 |
| WIN-P2-03 | P2 | Docs | `docs/05-用户手册/01-快速开始.md`, `docs/05-用户手册/06-本地源码安装.md`, `docs/05-用户手册/04-常见问题.md` | 用户手册仍以 bash/hash/`&&` 示例为主 | README 与用户手册 Windows 指引不一致 | 第二阶段 |
| WIN-P2-04 | P2 | CI/test | `scripts/run-test-suite.cjs`, `.github/workflows/*.yml` | Windows runner 跳过 POSIX shell tests；主质量门只跑 Ubuntu | Windows workflow helper 兼容性缺少 CI 保护 | 第二阶段 |
| WIN-P2-05 | P2 | Encoding/newline | 仓库根目录 | 缺 `.gitattributes` | LF/UTF-8 策略靠人工约定，shell/ps1 换行风险无机械约束 | 第二阶段 |
| WIN-P2-06 | P2 | Path coverage | `scripts/npm-install-matrix-smoke.js`, workflow helper scripts | 空格/中文路径覆盖集中在 install/init/doctor | 高层 workflow helper 未证明支持空格/中文路径 | 第二阶段 |
| WIN-P3-01 | P3 | Release path | `scripts/release-publish.cjs` | dry-run 分支直接 `spawnSync('npm', ...)` | Windows 发布维护者路径可能找不到 `.cmd` shim；现有 try/catch 会降级跳过预览 | 第三阶段 |
| WIN-P3-02 | P3 | Governance | 新增建议文件 | 缺统一 `verify-windows.ps1` / `verify-cross-platform.js` | Windows 验证命令分散，贡献者不易复现 | 第三阶段 |
| WIN-P3-03 | P3 | Docs/lint | docs/skills 全仓 | 缺文档命令 PowerShell classifier | 新增 docs/skill 命令示例可能持续引入 bash-only 写法 | 第三阶段 |

统计：P0 0 个，P1 2 个，P2 9 个，P3 3 个，共 14 个。

## 3. P1 确定性问题与 P2 workflow helper 详情

### 问题 1：`spec-polish-beta` dev-server helper 是 bash-only

- 严重程度：P2
- 涉及文件：`skills/spec-polish-beta/SKILL.md:63`, `:67`, `:83`, `:85`, `:126-130`
- 问题类型：Shell / PowerShell 命令兼容性
- 触发场景：agent 在 Windows 宿主内运行 `$spec-polish-beta`，workflow 尝试读取 launch config、探测项目类型、解析包管理器和端口。
- 失败原因：文档 contract 明确要求运行 `bash scripts/read-launch-json.sh`、`bash scripts/detect-project-type.sh`、`bash scripts/resolve-package-manager.sh`、`bash scripts/resolve-port.sh --type <type>`；如果当前 harness 没有可用 bash，原生 PowerShell 路径会失败。若宿主 Bash tool 已经绑定 Git Bash，该问题会被环境缓解。
- 影响范围：浏览器可见 UI polish workflow 的自动启动能力；Git Bash/WSL 用户受影响较小。
- 推荐修复：把四个 helper 迁移为 Node 脚本，或新增 `.ps1` 对等实现并在 SKILL 中按平台分派。
- 验证方式：在 Windows PowerShell 7+ 跑一个 Vite/Next fixture，确认无需 Git Bash 即可解析 package manager、端口并启动。
- 回归风险：dev-server 启动逻辑迁移可能影响 macOS/Linux；应保留现有 `.sh` smoke 或用 Node 单实现替代。

### 问题 2：`spec-optimize` 优化闭环强依赖 POSIX shell 和 `/tmp`

- 严重程度：P2
- 涉及文件：`skills/spec-optimize/SKILL.md:321`, `:350`, `:393`, `:402`, `:521`, `:543`, `:555`
- 问题类型：Shell / temp path / command piping
- 触发场景：agent 在 Windows 宿主内运行 `$spec-optimize` 建立 baseline、probe parallel readiness、创建 worktree 或使用 Codex backend。
- 失败原因：workflow contract 使用 `mkdir -p`、`bash scripts/measure.sh`、`bash scripts/parallel-probe.sh`、`bash scripts/experiment-worktree.sh`、`cat /tmp/... | codex exec ...`。PowerShell 5.1 不支持同样的 POSIX 命令语义，`/tmp` 也不是 Windows 原生临时目录；若 harness 提供 Git Bash，则部分 helper 可继续运行，但仍不是原生 PowerShell 可验证路径。
- 影响范围：优化 workflow 的核心闭环；macOS/Linux 不受影响。
- 推荐修复：用 Node coordinator 统一实现 measure/probe/worktree/temp-file/stdin pipe；短期可增加 PowerShell adapter。
- 验证方式：Windows PowerShell 下运行最小 optimization fixture，覆盖 baseline 写盘、worktree count、一次 measurement。
- 回归风险：并行 worktree 与命令执行涉及状态写入，需先加 fixture 再替换 helper。

### 问题 3：`spec-code-review` base resolver 依赖 bash/awk/sed

- 严重程度：P2
- 涉及文件：`skills/spec-code-review/scripts/resolve-base.sh:1-103`, `skills/spec-code-review/SKILL.md:335`, `:402`, `:438`, `:458`, `:476`
- 问题类型：Shell / Git helper
- 触发场景：agent 在 Windows 宿主内执行 code review，需要自动解析 PR base 或 merge-base。
- 失败原因：resolver 是 `#!/bin/bash` 脚本，并使用 `awk`、`sed`、POSIX test、command substitution；SKILL 中多处示例直接链式执行 `echo ... && git ...`。它不是用户复制命令的确定性失败，但在无 bash 的原生 PowerShell harness 中会退化为手动 base/fallback。
- 影响范围：核心 review workflow 的自动 diff boundary；若用户手动提供 base 或在 Git Bash/WSL 下运行，可绕过。
- 推荐修复：把 base resolver 迁移为 Node `resolve-base.cjs`，复用 `child_process.spawnSync` + `git`/`gh` 参数数组，输出保持 `BASE:<sha>` / `ERROR:<message>`。
- 验证方式：Windows PowerShell、cmd、macOS/Linux 分别跑 fork-safe PR fixture、origin/HEAD fallback、common branch fallback。
- 回归风险：PR fork remote 解析已有细节，迁移时需保持 `gh pr view`、shallow repo、base remote fallback 行为。

### 问题 4：`helper-tools.json` 的 Windows 安装命令对 PowerShell 5.1 不可复制

- 严重程度：P1
- 涉及文件：`skills/spec-mcp-setup/helper-tools.json:21-25`, `skills/spec-mcp-setup/scripts/install-helpers.ps1:212-249`, `:289-292`
- 问题类型：Registry / copyable command / PowerShell 5.1
- 触发场景：`agent-browser` 缺失时，用户根据 registry 展示或 next action 复制 Windows 安装命令。
- 失败原因：registry 的 Windows command 仍是 `CI=true npm install ... && agent-browser install && npx ...`。PowerShell 5.1 不支持 POSIX env-prefix，也不支持 PowerShell 7 的 pipeline chain operator `&&` / `||`。实际 `.ps1` 代码已经使用 `$env:CI = 'true'` 和 `if ($LASTEXITCODE -eq 0)`，说明 source registry 与执行实现漂移。
- 影响范围：setup repair 的用户体验和文档可信度；实际 `$spec-mcp-setup` PowerShell installer 路径不一定失败。
- 推荐修复：把 `helper-tools.json` 的 `windows` command 改为 `.ps1` 风格，或改为结构化 command steps，renderer 按平台生成。
- 验证方式：PowerShell 5.1/7+ 分别复制 registry 渲染命令；Jest contract 锁定不出现 `CI=true` 与 `&&`。
- 回归风险：如果直接改 string，macOS/Linux 命令不应被影响；更长期的结构化 steps 需要 schema 版本说明。

### 问题 5：frontmatter validators 未指定 UTF-8 encoding

- 严重程度：P1
- 涉及文件：`skills/spec-compound/scripts/validate-frontmatter.py:43`, `skills/spec-compound-refresh/scripts/validate-frontmatter.py:43`
- 问题类型：Python / 文件编码
- 触发场景：Windows 用户在中文系统 locale 下运行 `$spec-compound` 或 `$spec-compound-refresh` 校验中文 `docs/solutions` Markdown。
- 失败原因：Python `open(doc_path)` 默认使用 locale encoding；Windows 非 UTF-8 locale 下读取中文 Markdown 可能抛 `UnicodeDecodeError` 或读出错误文本。
- 影响范围：知识沉淀 workflow；macOS/Linux UTF-8 locale 下通常不暴露。
- 推荐修复：两个文件同步改为 `open(doc_path, encoding="utf-8", newline="")` 或 `Path.read_text(encoding="utf-8")`，并补 Windows/中文 fixture。
- 验证方式：构造含中文 frontmatter 的临时 Markdown，在 Windows 或模拟非 UTF-8 locale 环境运行 validator。
- 回归风险：两个脚本要求 byte-identical，必须同步修改并保留 `tests/unit/frontmatter-validator.test.js`。

## 4. 文档命令兼容性审查

| 当前命令 | 问题 | PowerShell 替代写法 | Git Bash / WSL 写法 | 建议 |
| -- | -- | -- | -- | -- |
| `hash -r` | PowerShell 无该命令 | 关闭重开 terminal；或 `Remove-Item Alias:spec-first -ErrorAction SilentlyContinue` 仅处理 alias 场景 | `hash -r` | 用户手册增加 Windows 说明 |
| `npm cache clean --force && npm install -g ...` | PowerShell 5.1 不支持 `&&` | `npm cache clean --force; if ($LASTEXITCODE -eq 0) { npm install -g spec-first }` | 原命令可用 | FAQ/source install 增加分 shell 示例 |
| `CI=true npm install ... && ...` | POSIX env-prefix + `&&` | `$env:CI='true'; npm install ...; if ($LASTEXITCODE -eq 0) { agent-browser install }` | 原命令可用 | 修 `helper-tools.json` Windows command |
| `bash scripts/<name>.sh` | PowerShell 原生无 bash | `pwsh scripts/<name>.ps1` 或 `node scripts/<name>.cjs` | 原命令可用 | 新增 cross-platform helper |
| `mkdir -p <dir>` | PowerShell 语义不同 | `New-Item -ItemType Directory -Force -Path <dir>` | 原命令可用 | SKILL 示例按平台分栏 |
| `cat /tmp/file | codex exec ...` | `/tmp` 与 `cat` 非原生 | `Get-Content -Raw $tempFile | codex exec --skip-git-repo-check -` | 原命令可用 | 使用 OS temp API 生成文件 |
| `find ... | xargs ...` | PowerShell 管道传对象，不是字节流 | `Get-ChildItem ... | ForEach-Object { ... }` | 原命令可用 | `spec-sessions` 改 Node/Python |

README 根文档已给出 PowerShell 和 cmd 示例：`README.md:56-70`、`README.zh-CN.md:56-70`。不一致主要在用户手册与 skill 内部命令。

## 5. 脚本兼容性审查

| 脚本 | 当前风险 | 是否可在 PowerShell 运行 | 建议处理 |
| -- | -- | -- | -- |
| `scripts/npm-install-matrix-smoke.js` | 低风险；已用 `shell:false`、解析 npm CLI JS、Windows `.cmd` shim | 是 | 保留为 Windows smoke 基线 |
| `scripts/run-test-suite.cjs` | Windows 下跳过 POSIX shell tests | 部分 | 增加 Windows workflow helper smoke，而不是只跳过 |
| `src/cli/commands/update.js` | 已用 `npm.cmd` / `spec-first.cmd` | 是 | 作为 Node 跨平台模式参考 |
| `skills/spec-mcp-setup/scripts/*.ps1` | 覆盖较好 | 是 | 继续保持 `.sh`/`.ps1` contract parity |
| `skills/spec-polish-beta/scripts/*.sh` | bash-only | 否 | 迁移 Node 或新增 `.ps1` |
| `skills/spec-optimize/scripts/*.sh` | bash-only，含 worktree/measurement 状态 | 否 | 优先迁移 Node coordinator |
| `skills/spec-code-review/scripts/resolve-base.sh` | bash/awk/sed | 否 | 迁移 `resolve-base.cjs` |
| `skills/spec-sessions/scripts/discover-sessions.sh` | bash/find/xargs | 否 | 迁移 Python/Node 并用 `os.homedir()` |
| `skills/feature-video/scripts/capture-demo.py` | `/tmp` default | 部分 | 改 `tempfile.gettempdir()` 或显式 `--output-dir` |
| `scripts/release-publish.cjs` | dry-run 直接 `spawnSync('npm')` | 低风险；失败会被 try/catch 降级为跳过预览 | 解析真实 npm 二进制：Windows 用 `npm.cmd`，POSIX 用 `npm`；不要经 `npm_execpath` 回到 pnpm |

## 6. 路径与文件系统兼容性审查

- 路径分隔符：CLI 主要 Node 代码已大量使用 `path.join` / `path.resolve`，安装 smoke 也用 `path.join(os.tmpdir(), ...)`；风险集中在 skill prose 和 `.sh` helper。
- 空格路径：`scripts/npm-install-matrix-smoke.js:530-531` 使用 `prefix with spaces`、`cache with spaces`，`scripts/npm-install-matrix-smoke.js:594`、`:610`、`:634` 覆盖含空格、中文、括号的项目路径。
- 中文路径：安装/init/doctor smoke 已覆盖中文路径；workflow helper 层未系统覆盖中文路径。
- 临时目录：正向模式是 `os.tmpdir()`；风险点是 `skills/spec-optimize/SKILL.md:543`、`skills/feature-video/scripts/capture-demo.py:762`、`skills/spec-sessions/SKILL.md:208-210` 的 `/tmp` 示例或默认值。
- 大小写敏感：未发现明确依赖大小写敏感文件系统的核心路径；仍建议在 Windows CI 增加 case-insensitive fixture。
- symlink：未发现本次审查范围内的 Windows symlink 硬依赖；如后续 helper 使用 symlink，应避免默认要求管理员/Developer Mode。
- CRLF/LF：`git ls-files -z | xargs -0 file | rg 'CRLF|BOM'` 无命中；但 `.gitattributes` 不存在，缺少持续约束。

## 7. npm / Python / Shell 兼容性审查

### Node/npm

正向：

- `package.json:6-8` 声明 `bin.spec-first = bin/spec-first.js`。
- `package.json:15-35` npm scripts 基本使用 `node ...` 或 `jest ...`，未发现 `NODE_ENV=...`、`rm -rf`、`cp -r` 这类高风险 npm script。
- `scripts/npm-install-matrix-smoke.js:56-105` 解析 npm CLI JS 入口，避免依赖 shell shim。
- `scripts/npm-install-matrix-smoke.js:124-139` Windows 走 `cmd.exe /d /c call "<shim>" ...` 验证 `.cmd` shim。
- `src/cli/commands/update.js:103-119` Windows 下使用 `npm.cmd` 与 `spec-first.cmd`。

风险：

- `scripts/release-publish.cjs:113-120` dry-run 分支直接 `spawnSync('npm', ...)`，原因是注释明确要避开 `npm_execpath` 指向 pnpm 时的 `pack --dry-run` 不兼容；风险是 Windows 下应解析 `npm.cmd`，但现有 try/catch 已能把失败降级为“tarball 预览跳过”。

### Python

正向：

- 多数 Python 脚本未使用 `shell=True`。
- `skills/spec-sessions/scripts/extract-skeleton.py`、`extract-errors.py` 写文件使用 `encoding="utf-8"`。

风险：

- `skills/spec-compound*/scripts/validate-frontmatter.py:43` 默认 encoding。
- `skills/feature-video/scripts/capture-demo.py:762` 硬编码 `/tmp/spec-first/feature-video`。

### Shell

风险集中在 workflow helper 与 skill 文档，尤其是 `spec-polish-beta`、`spec-optimize`、`spec-code-review`、`spec-sessions`。`spec-mcp-setup` 已有 PowerShell 对等脚本，是应复用的迁移样板。

### PowerShell 适配建议

- 优先用 Node/Python 单实现替代双份 shell，而不是为每个 `.sh` 机械补 `.ps1`。
- 必须保留 shell 时，SKILL 主体写平台分派：PowerShell 用 `.ps1` 或 Node；Git Bash/WSL 用 `.sh`。
- PowerShell 5.1 目标下避免 `&&` / `||`；用 `if ($LASTEXITCODE -eq 0) { ... }`。
- 环境变量示例使用 `$env:KEY='value'`，cmd 使用 `set KEY=value`。

## 8. 建议新增文件

| 文件 | 是否建议新增 | 优先级 | 建议内容 |
| -- | -- | -- | -- |
| `scripts/verify-windows.ps1` | 是 | P2 | 跑 `node --check`、`npm run test:mcp-setup`、`node scripts/npm-install-matrix-smoke.js`、关键 docs command smoke |
| `scripts/verify-cross-platform.js` | 是 | P2 | 汇总平台检测、路径含空格/中文 fixture、shell command classifier |
| `.gitattributes` | 是 | P2 | `* text=auto eol=lf` 基线，`*.ps1 text eol=crlf working-tree-encoding=UTF-8` 是否采用需先评估；至少强制 `*.sh eol=lf` |
| `.github/workflows/windows-compat.yml` | 是 | P2 | Windows-only workflow helper smoke，覆盖 PowerShell 5.1 与 PowerShell 7+ 可行性；GitHub hosted 默认是 `pwsh`，如需 5.1 用 `shell: powershell` |
| `docs/windows-compatibility.md` | 是 | P2 | 支持矩阵、推荐 PowerShell 7+、Git Bash/WSL 降级说明、已验证命令 |
| `docs/troubleshooting/windows.md` | 是 | P3 | npm shim、PATH、execution policy、UTF-8、中文路径、PowerShell 5.1 `&&` 问题 |

## 9. 分阶段修复计划

| 阶段 | 目标 | 任务 | 涉及文件 | 验证方式 | 优先级 |
| -- | -- | -- | -- | -- | -- |
| 第一阶段 | 快速止血 | 修 `helper-tools.json` Windows command | `skills/spec-mcp-setup/helper-tools.json`, tests | Jest contract + PowerShell 5.1 copy smoke | P1 |
| 第一阶段 | 快速止血 | Python validator 指定 UTF-8 | `skills/spec-compound*/scripts/validate-frontmatter.py` | 中文 frontmatter fixture | P1 |
| 第一阶段 | 快速止血 | 明确 bash-only workflow 的 Windows 降级提示 | `spec-polish-beta`, `spec-optimize`, `spec-code-review`, `spec-sessions` | 文档 contract test | P2 |
| 第二阶段 | 跨平台抽象 | 为 `spec-code-review` 增 Node base resolver | `skills/spec-code-review/scripts/resolve-base.cjs`, SKILL, tests | Windows/macOS/Linux git fixture | P2 |
| 第二阶段 | 跨平台抽象 | 迁移 polish/optimize/session helper 到 Node/Python | skill scripts + SKILL | Windows PowerShell workflow fixture | P2 |
| 第二阶段 | 跨平台抽象 | 增 `.gitattributes` 与 Windows CI | repo root, `.github/workflows` | `git diff --check`, CI matrix | P2 |
| 第二阶段 | 跨平台抽象 | 用户手册补 PowerShell/cmd 对照 | `docs/05-用户手册/**` | docs command classifier | P2 |
| 第三阶段 | 长期治理 | 增 `verify-windows.ps1` / `verify-cross-platform.js` | `scripts/`, docs | 本地 Windows run + CI | P3 |
| 第三阶段 | 长期治理 | 文档命令 lint 与 checklist 纳入 skill/agent review | tests, docs/contracts | 新增 bash-only 示例时测试失败 | P3 |

详细任务拆分见 `docs/项目审查/2026-07-03-windows-powershell-fix-plan.md`。

## 10. Windows 兼容性审查 Checklist

- 路径是否通过 `path.join` / `path.resolve` / `os.tmpdir()` / `tempfile.gettempdir()` / `Join-Path` 处理。
- 是否避免硬编码 `/tmp`、`/bin/bash`、`/usr/bin/env bash` 作为 Windows 默认路径。
- 命令示例是否区分 PowerShell、cmd、Git Bash/WSL、macOS/Linux。
- PowerShell 5.1 示例是否避免 `&&`、`||`、`VAR=value command`。
- 环境变量是否提供 `$env:KEY='value'`、`set KEY=value`、POSIX 三种写法或结构化 runner。
- 文件读写是否显式 UTF-8。
- shell 脚本是否保持 LF；PowerShell 脚本编码是否明确。
- 是否支持路径带空格、中文、括号。
- 是否避免依赖 executable bit；Windows 文档是否使用 `node xxx.js`、`python xxx.py`、`pwsh xxx.ps1`。
- npm `bin` 是否有 shebang，Windows 是否验证 `.cmd` shim。
- 新增 workflow helper 是否有 Windows smoke 或明确 degraded-mode status。
- CI 是否覆盖 `windows-latest`，必要时分别覆盖 `shell: pwsh` 与 `shell: cmd`。
- 文档中的 copyable command 是否有测试或至少有 command classifier 检查。

## 11. Coverage / 方法 / 限制

### 已确认的仓库证据

- 直接读取 `package.json`、`.github/workflows/*.yml`、`scripts/npm-install-matrix-smoke.js`、`scripts/run-test-suite.cjs`、`src/cli/commands/update.js`、`templates/codex/hooks/session-start.cmd`、`skills/spec-mcp-setup/**`、`skills/spec-polish-beta/**`、`skills/spec-optimize/**`、`skills/spec-code-review/**`、`skills/spec-sessions/**`、`skills/spec-compound*/scripts/validate-frontmatter.py`、`skills/feature-video/scripts/capture-demo.py`、README 与用户手册。
- 执行 `git ls-files -z | xargs -0 file | rg 'CRLF|BOM'`，无 CRLF/BOM 命中。
- 执行 `test -f .gitattributes`，返回缺失。
- 使用 `rg` 扫描 bash、`/tmp`、`mkdir -p`、`&&`、Python `open(...)` / `subprocess` 相关风险。

### 外部参考

- Context7：Node.js `path` / `os.tmpdir()` / `child_process` 文档，用于校准跨平台路径和 `.cmd`/`.bat` spawn 风险。
- Context7：npm `package.json bin` 与 npm scripts shell 行为，用于校准 npm shim 与 Windows `cmd.exe` script shell。
- Context7：GitHub Actions workflow syntax，用于确认 Windows hosted runner 默认 shell 与 `shell: pwsh` / `shell: cmd`。
- Microsoft Learn：PowerShell pipeline chain operators，用于确认 `&&` / `||` 是 PowerShell 7+ 语义，不应作为 PowerShell 5.1 兼容命令。

### 限制

- 本次没有在真实 Windows 11 机器或 GitHub Actions runner 上执行命令；Windows 可用性判断来自 source direct reads、已有 CI 配置、已有 smoke 脚本和外部文档。
- Graphify/Codegraph 结果只作为 `provider_untrusted` 导航线索；报告结论以 source direct reads 为准。
- 当前工作区已有与本次无关的未提交改动，本次报告不回退、不重写这些改动。
- 本次只写审查产物和 changelog，不直接修复 CLI/skill/runtime 逻辑，不手改 generated runtime mirrors。
