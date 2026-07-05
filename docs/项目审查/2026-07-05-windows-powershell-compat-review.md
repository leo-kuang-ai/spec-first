# spec-first Windows PowerShell 兼容性专项审查报告

审查日期：2026-07-05

审查依据：`docs/10-prompt/兼容性审查.md`

审查模式：`spec-doc-review` 单智能体 report-only fallback。当前请求未显式授权 `subagents` / `personas` / parallel reviewer dispatch，因此未启动 persona subagents；Coverage 记录 `single-agent report-only fallback` 与 `dispatch_authorization_missing`。

关联产物：

- 问题清单：`docs/项目审查/2026-07-05-windows-powershell-compat-issues.md`
- 修复计划：`docs/项目审查/2026-07-05-windows-powershell-fix-plan.md`

## 1. 结论摘要

1. 当前仓库在 Windows 上的 npm 安装、CLI shim、pack/install、programmatic init 与 `doctor --json` 有较强正向证据：`package.json` 声明 npm bin，`npm-install-matrix.yml` 覆盖 `windows-latest` 的 `pwsh` 与 `cmd`，`scripts/npm-install-matrix-smoke.js` 使用 `shell:false`、Windows `.cmd` shim，并覆盖空格/中文/括号路径。
2. 本次未发现 P0。也就是说，没有当前源码证据表明 Windows 下基础安装链路整体不可用。
3. 仍有 2 个 P1：`agent-browser` helper registry 的 Windows 展示命令仍是 `CI=true ... && ...`，PowerShell 5.1 复制即失败；两个 compound frontmatter validator 仍使用 Python 默认 locale encoding，中文 Markdown 在 Windows 非 UTF-8 locale 下可能失败。
4. 最大兼容性风险集中在 workflow/helper 层，而不是 npm 包安装层：`spec-polish-beta`、`spec-optimize`、`spec-code-review`、`spec-sessions` 仍直接引用 bash-only helper 或 POSIX 命令。
5. `spec-mcp-setup` 是当前跨平台成熟度最高的区域：同名 `.sh` / `.ps1` 脚本基本成对存在，并有 `tests/unit/mcp-setup-powershell-contracts.test.js` 覆盖 PowerShell setup contract。
6. 根 README 已补 Windows PowerShell/cmd 安装示例，但 `docs/05-用户手册` 仍残留 `hash -r`、`npm cache clean --force && ...`、`CI=true ...` 等 PowerShell 5.1 不兼容命令，onboarding 口径不一致。
7. 仓库当前缺 `.gitattributes`。本次 `CRLF|BOM` 扫描无命中，但 LF/UTF-8 策略仍靠人工约定，不能防止 Windows 贡献者后续提交 CRLF shell 或编码漂移。
8. Windows CI 覆盖偏安装/setup：`npm-install-matrix` 已覆盖 Windows，主质量门和 skill gate 仍只跑 Ubuntu；`run-test-suite.cjs` 在原生 Windows 会跳过 POSIX shell tests，因此 bash-heavy workflow helper 没有 Windows 行为回归保护。
9. 建议默认支持层级：普通用户默认推荐 Windows Terminal + PowerShell 7+；安装、`doctor`、`init`、setup baseline 兼容 PowerShell 5.1；bash-heavy workflow 在迁移前明确标注需要 Git Bash/WSL 或手动 fallback。
10. 优先修复顺序：先修 P1 copyable command 与 Python UTF-8；再给 bash-only workflow 增加 Windows degraded notice 并迁移核心 helper 到 Node；随后补 `.gitattributes`、Windows helper CI、用户手册 PowerShell 对照和长期 command classifier。

**仓库模块地图**

| 模块 | Windows 相关现状 | 证据 |
| -- | -- | -- |
| npm package / CLI bin | `bin.spec-first` 由 npm 生成 Windows `.cmd` shim；主 scripts 基本是 `node ...` / `jest ...` | `package.json:6-35` |
| Install smoke | 覆盖 Windows `pwsh` 与 `cmd`，并验证 `.cmd` shim、空格路径、中文路径与括号路径 | `.github/workflows/npm-install-matrix.yml:51-84`, `scripts/npm-install-matrix-smoke.js:120-145`, `scripts/npm-install-matrix-smoke.js:716-868` |
| Test runner | Windows 原生跳过 POSIX shell tests，只跑部分 Jest/npm smoke | `scripts/run-test-suite.cjs:61-112` |
| MCP setup | `.sh` / `.ps1` 基本成对，PowerShell contract tests 存在 | `skills/spec-mcp-setup/scripts/*`, `tests/unit/mcp-setup-powershell-contracts.test.js` |
| Workflow helpers | 多个 workflow 仍以 bash-only helper 为主 | `skills/spec-polish-beta/SKILL.md:63-130`, `skills/spec-optimize/SKILL.md:321-555`, `skills/spec-code-review/scripts/resolve-base.sh:1-103` |
| Python helpers | 大多无 `shell=True`，但 frontmatter validator 缺 UTF-8，feature-video 默认 `/tmp` | `skills/spec-compound*/scripts/validate-frontmatter.py:43`, `skills/feature-video/scripts/capture-demo.py:762` |
| CI | 仅安装矩阵覆盖 Windows；质量门/skill gate 为 Ubuntu-only | `.github/workflows/*.yml` |
| Docs | README 已补 Windows，用户手册仍有 POSIX 示例残留 | `README.md:56-70`, `docs/05-用户手册/**` |

## 2. 风险总览表

| 编号 | 严重程度 | 类型 | 文件 | 问题摘要 | Windows 影响 | 修复优先级 |
| -- | -- | -- | -- | -- | -- | -- |
| WIN-P1-01 | P1 | Registry/command | `skills/spec-mcp-setup/helper-tools.json` | Windows command 使用 `CI=true ... && ...` | PowerShell 5.1 复制即失败；registry 与 `.ps1` 实现漂移 | 第一阶段 |
| WIN-P1-02 | P1 | Python/encoding | `skills/spec-compound*/scripts/validate-frontmatter.py` | `open(doc_path)` 未指定 UTF-8 | 中文 Markdown 在 Windows locale 下可能读错或失败 | 第一阶段 |
| WIN-P2-01 | P2 | Shell/helper | `skills/spec-polish-beta/**` | dev-server helper 是 bash-only | 原生 PowerShell 无 bash 时无法自动探测/启动 | 第一阶段提示，第二阶段迁移 |
| WIN-P2-02 | P2 | Shell/temp | `skills/spec-optimize/**` | 使用 `mkdir -p`、bash helper、`cat /tmp/...` | 原生 PowerShell 优化闭环失败或需 Git Bash/WSL | 第一阶段提示，第二阶段迁移 |
| WIN-P2-03 | P2 | Shell/Git | `skills/spec-code-review/scripts/resolve-base.sh` | base resolver 依赖 bash/awk/sed | 无 bash 时 code review 自动 scope detection 退化 | 第二阶段 |
| WIN-P2-04 | P2 | Shell/session | `skills/spec-sessions/**` | session discovery 依赖 bash/find/xargs，示例写 `/tmp` | Windows 原生查询历史 session 体验差 | 第二阶段 |
| WIN-P2-05 | P2 | Python/path | `skills/feature-video/**` | 默认输出目录硬编码 `/tmp/spec-first/feature-video` | Windows 原生路径语义错误 | 第二阶段 |
| WIN-P2-06 | P2 | Docs | `docs/05-用户手册/**` | 用户手册缺 PowerShell 对照 | README 与手册复制命令不一致 | 第二阶段 |
| WIN-P2-07 | P2 | CI/test | `scripts/run-test-suite.cjs`, `.github/workflows/*.yml` | Windows runner 跳过 POSIX tests，质量门 Ubuntu-only | workflow helper 兼容性缺回归保护 | 第二阶段 |
| WIN-P2-08 | P2 | Encoding/newline | 仓库根目录 | 缺 `.gitattributes` | LF/UTF-8 无机械约束 | 第二阶段 |
| WIN-P2-09 | P2 | Path coverage | `skills/*/scripts/*` | 空格/中文路径覆盖集中在 install/init/doctor | 高层 workflow helper 未证明支持空格/中文路径 | 第二阶段 |
| WIN-P3-01 | P3 | Release path | `scripts/release-publish.cjs` | dry-run 直接 `spawnSync('npm')` | Windows 维护者路径可能找不到 `.cmd`，当前会降级跳过预览 | 第三阶段 |
| WIN-P3-02 | P3 | Governance | 新增建议文件 | 缺统一 Windows 本地验证入口 | 贡献者不易复现 Windows 兼容性验证 | 第三阶段 |
| WIN-P3-03 | P3 | Docs/lint | docs/skills 全仓 | 缺文档命令 PowerShell classifier | 新增 docs/skill 命令示例可能持续引入 bash-only 写法 | 第三阶段 |

统计：P0 0 个，P1 2 个，P2 9 个，P3 3 个，共 14 个。

## 3. P0 / P1 关键问题详情

### 问题 1：`helper-tools.json` Windows command 使用 PowerShell 5.1 不兼容语法

- 严重程度：P1
- 涉及文件：`skills/spec-mcp-setup/helper-tools.json:21-25`
- 问题类型：Registry / copyable command / PowerShell 5.1
- 触发场景：`agent-browser` 缺失时，用户根据 registry 渲染的 Windows command 或 next action 复制命令。
- 失败原因：Windows command 仍是 `CI=true npm install ... && agent-browser install && npx ...`。PowerShell 5.1 不支持 POSIX env-prefix，也不支持 PowerShell 7+ 的 `&&` pipeline chain operator。`install-helpers.ps1` 实际实现已用 `$env:CI = 'true'` 与 `$LASTEXITCODE` 控制流，说明 registry 展示命令与执行路径漂移。
- 影响范围：`spec-mcp-setup` repair guidance、helper registry 文档可信度；实际 `.ps1` installer 不一定失败。
- macOS/Linux 影响：无。
- 推荐修复：把 `windows` command 改为 PowerShell 5.1 保守写法，或将 command string 升级为结构化 steps，由 renderer 按 platform/shell 输出。
- 最小修复方案：`$env:CI='true'; npm install -g agent-browser@latest --no-audit --no-fund --loglevel=error; if ($LASTEXITCODE -eq 0) { agent-browser install }; if ($LASTEXITCODE -eq 0) { npx -y skills@latest add ... }`
- 长期治理方案：helper registry 不保存混合 shell 单字符串；新增 tests 禁止 Windows command 出现 `CI=true`、裸 `&&`。
- 验证命令：PowerShell 5.1/7+ 下检查 registry 渲染出的 Windows command 不含 `CI=true` / `&&`，并运行 `npx jest tests/unit/mcp-setup-powershell-contracts.test.js --runInBand`。
- 回归风险：若改 schema，需要同步 `lib-helper-registry.{sh,ps1}`、renderer 和 contract tests。

### 问题 2：frontmatter validators 未显式 UTF-8

- 严重程度：P1
- 涉及文件：`skills/spec-compound/scripts/validate-frontmatter.py:43`，`skills/spec-compound-refresh/scripts/validate-frontmatter.py:43`
- 问题类型：Python / 文件编码
- 触发场景：Windows 中文系统 locale 校验含中文 frontmatter 的 `docs/solutions` Markdown。
- 失败原因：`open(doc_path)` 使用 Python locale 默认编码；Windows 非 UTF-8 locale 下可能抛 `UnicodeDecodeError` 或误读。
- 影响范围：`spec-compound`、`spec-compound-refresh` durable knowledge 入口。
- macOS/Linux 影响：常见 UTF-8 locale 下通常不暴露。
- 推荐修复：两个 byte-identical copy 同步改为 `open(doc_path, encoding='utf-8', newline='')` 或 `Path.read_text(encoding='utf-8')`。
- 最小修复方案：只改读取语句并补中文 fixture。
- 长期治理方案：Python 文本 I/O lint/contract 禁止无 encoding 的文本读写。
- 验证命令：临时生成 UTF-8 无 BOM 的中文 frontmatter Markdown，分别运行两个 validator；并运行 `npx jest tests/unit/frontmatter-validator.test.js --runInBand`。
- 回归风险：两个脚本必须保持 byte-identical；只改一份会破坏现有治理测试。

## 4. 文档命令兼容性审查

| 当前命令 | 问题 | PowerShell 替代写法 | Git Bash / WSL 写法 | 建议 |
| -- | -- | -- | -- | -- |
| `hash -r` | PowerShell 无该命令 | 重开 terminal；或按需清理具体 alias | `hash -r` | 用户手册增加 Windows 说明 |
| `npm cache clean --force && npm install -g ...` | PowerShell 5.1 不支持 `&&` | `npm cache clean --force; if ($LASTEXITCODE -eq 0) { npm install -g spec-first }` | 原命令可用 | FAQ/本地安装分 shell 示例 |
| `CI=true npm install ... && ...` | POSIX env-prefix + `&&` | `$env:CI='true'; npm install ...; if ($LASTEXITCODE -eq 0) { ... }` | 原命令可用 | 修 `helper-tools.json` |
| `bash scripts/<name>.sh` | PowerShell 原生无 bash | `node scripts/<name>.cjs` 或 `pwsh scripts/<name>.ps1` | 原命令可用 | workflow helper 迁移 |
| `mkdir -p <dir>` | PowerShell 语义不同 | `New-Item -ItemType Directory -Force -Path <dir>` | 原命令可用 | skill 示例按平台分栏 |
| `cat /tmp/file | codex exec ...` | `/tmp` 与 `cat` 非原生 | `Get-Content -Raw $tempFile | codex exec --skip-git-repo-check -` | 原命令可用 | 使用 OS temp API |
| `find ... | xargs ...` | PowerShell 管道传对象，不是字节流 | `Get-ChildItem ... | ForEach-Object { ... }` | 原命令可用 | `spec-sessions` 改 Node/Python |

根 README 正向证据：`README.md:56-70` 与 `README.zh-CN.md:56-70` 已提供 PowerShell/cmd 安装示例。主要不一致在用户手册和 workflow skill 内部命令。

## 5. 脚本兼容性审查

| 脚本 | 当前风险 | 是否可在 PowerShell 运行 | 建议处理 |
| -- | -- | -- | -- |
| `scripts/npm-install-matrix-smoke.js` | 低风险；`shell:false`，Windows `.cmd` shim，有空格/中文路径 smoke | 是 | 保留为 Windows install 基线 |
| `scripts/run-test-suite.cjs` | Windows 下跳过 POSIX shell tests | 部分 | 增加 Windows workflow helper smoke |
| `skills/spec-mcp-setup/scripts/*.ps1` | 覆盖较好，需继续与 `.sh` parity | 是 | 继续 paired contract tests |
| `skills/spec-polish-beta/scripts/*.sh` | bash-only | 否 | 迁移 Node 或新增 `.ps1` |
| `skills/spec-optimize/scripts/*.sh` | bash-only，含 worktree/measurement 状态 | 否 | 优先迁移 Node coordinator |
| `skills/spec-code-review/scripts/resolve-base.sh` | bash/awk/sed | 否 | 迁移 `resolve-base.cjs` |
| `skills/spec-sessions/scripts/discover-sessions.sh` | bash/find/xargs | 否 | 迁移 Python/Node 并用 `os.homedir()` |
| `skills/feature-video/scripts/capture-demo.py` | 默认 `/tmp` | 部分 | 改 `tempfile.gettempdir()` |
| `scripts/release-publish.cjs` | dry-run 直接 `spawnSync('npm')` | 低风险；失败会降级跳过预览 | Windows 用 `npm.cmd` |

## 6. 路径与文件系统兼容性审查

- 路径分隔符：CLI 主要 Node 代码大量使用 `path.join` / `path.resolve`；风险集中在 skill prose 和 bash helper。
- 空格路径：安装 smoke 已覆盖 `prefix with spaces`、`cache with spaces`、含空格/中文/括号项目路径；workflow helper 层没有同等 fixture。
- 中文路径：install/init/doctor smoke 有覆盖；Python validator encoding 与 workflow helper 路径处理仍有缺口。
- 临时目录：正向模式是 Node `os.tmpdir()`；风险点是 `skills/spec-optimize/SKILL.md:543`、`skills/feature-video/scripts/capture-demo.py:762`、`skills/spec-sessions/SKILL.md:208-210`。
- 大小写敏感：本次未发现核心路径依赖大小写敏感文件系统；建议在 Windows CI 加 case-insensitive fixture。
- symlink：本次未发现 Windows 原生 symlink 作为核心前提；后续 helper 不应默认要求管理员/Developer Mode。
- CRLF/LF：`git ls-files -z | xargs -0 file | rg 'CRLF|BOM'` 无输出；但 `.gitattributes` 缺失，缺少持续约束。

## 7. npm / Python / Shell 兼容性审查

### Node/npm

正向：

- `package.json:6-8` 声明 `bin.spec-first = bin/spec-first.js`。
- `package.json:15-35` npm scripts 基本使用 `node ...` 或 `jest ...`，未发现 `NODE_ENV=...`、`rm -rf`、`cp -r` 类高风险 npm script。
- `scripts/npm-install-matrix-smoke.js:120-145` 使用 `spawnSync(..., shell:false)`；`.cmd` shim 与空格/中文/括号路径证据见 `scripts/npm-install-matrix-smoke.js:716-868`。
- `.github/workflows/npm-install-matrix.yml:72-84` 分别覆盖 Windows `pwsh` 与 `cmd`。

风险：

- `scripts/release-publish.cjs` dry-run 直接 `spawnSync('npm', ...)`，Windows 维护者路径应解析 `npm.cmd`；当前 try/catch 会降级跳过预览，因此为 P3。

### Python

正向：

- 未发现 `shell=True` 或 `os.system` 主风险。
- 多个 session extraction 脚本已显式 UTF-8。

风险：

- `skills/spec-compound*/scripts/validate-frontmatter.py:43` 默认 encoding。
- `skills/feature-video/scripts/capture-demo.py:762` 硬编码 `/tmp/spec-first/feature-video`。

### Shell / PowerShell

风险集中在 workflow helper 与 skill 文档。`spec-mcp-setup` 可作为迁移样板；其他高价值 workflow 应优先迁移为 Node 单实现，避免长期维护 `.sh` / `.ps1` 双份 drift。

## 8. 建议新增文件

| 文件 | 是否建议新增 | 优先级 | 建议内容 |
| -- | -- | -- | -- |
| `scripts/verify-windows.ps1` | 是 | P2 | 跑 `npm ci`、`npm run typecheck`、`npm run test:mcp-setup`、`node scripts/npm-install-matrix-smoke.js`、关键 PowerShell copy smoke |
| `scripts/verify-cross-platform.js` | 是 | P2 | 输出路径、encoding、copyable command、helper platform facts |
| `.gitattributes` | 是 | P2 | 至少强制 `*.sh eol=lf`，规范 Markdown/JSON/YAML/PS1 文本策略 |
| `.github/workflows/windows-compat.yml` | 是 | P2 | Windows-only focused helper smoke；`shell: pwsh`，必要时加 `shell: powershell` 代表 5.1 |
| `docs/windows-compatibility.md` | 是 | P2 | 支持矩阵、推荐 PowerShell 7+、Git Bash/WSL 降级说明、已验证命令 |
| `docs/troubleshooting/windows.md` | 是 | P3 | npm shim、PATH、execution policy、UTF-8、中文路径、PowerShell 5.1 `&&` |

## 9. 分阶段修复计划

| 阶段 | 目标 | 任务 | 涉及文件 | 验证方式 | 优先级 |
| -- | -- | -- | -- | -- | -- |
| 第一阶段 | 快速止血 | 修 `helper-tools.json` Windows command | `skills/spec-mcp-setup/helper-tools.json`, tests | PowerShell 5.1 copy smoke + Jest contract | P1 |
| 第一阶段 | 快速止血 | Python validator 指定 UTF-8 | `skills/spec-compound*/scripts/validate-frontmatter.py` | 中文 fixture + `frontmatter-validator` test | P1 |
| 第一阶段 | 快速止血 | bash-only workflow 显式 degraded notice | `spec-polish-beta`, `spec-optimize`, `spec-code-review`, `spec-sessions` | 文档 contract anchors | P2 |
| 第二阶段 | 跨平台抽象 | `spec-code-review` base resolver 迁移 Node | `skills/spec-code-review/scripts/resolve-base.cjs` | Windows/macOS/Linux git fixture | P2 |
| 第二阶段 | 跨平台抽象 | polish/optimize/session helper 迁移 Node/Python | skill scripts + SKILL | Windows PowerShell workflow smoke | P2 |
| 第二阶段 | 跨平台抽象 | 增 `.gitattributes` 与 Windows helper CI | repo root, `.github/workflows` | `git diff --check`, CI matrix | P2 |
| 第二阶段 | 跨平台抽象 | 用户手册补 PowerShell/cmd 对照 | `docs/05-用户手册/**` | docs command scan | P2 |
| 第三阶段 | 长期治理 | 增 `verify-windows.ps1` / `verify-cross-platform.js` | `scripts/`, docs | 本地 Windows run + CI | P3 |
| 第三阶段 | 长期治理 | 文档命令 classifier 纳入 review | scripts/tests/docs | 新增 bash-only copyable command 触发 advisory | P3 |

详细任务拆分见 `docs/项目审查/2026-07-05-windows-powershell-fix-plan.md`。

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
- CI 是否覆盖 `windows-latest`，必要时分别覆盖 `shell: pwsh` 与 `shell: cmd` / `shell: powershell`。
- 文档中的 copyable command 是否有测试或至少有 command classifier 检查。

## 11. Coverage / 方法 / 限制

### 已执行的 source/direct evidence

- 读取：`docs/10-prompt/兼容性审查.md`、`docs/10-prompt/结构化项目角色契约.md`、`package.json`、`.github/workflows/*.yml`、`scripts/run-test-suite.cjs`、`scripts/npm-install-matrix-smoke.js`、`skills/spec-mcp-setup/helper-tools.json`、`skills/spec-polish-beta/SKILL.md`、`skills/spec-optimize/SKILL.md`、`skills/spec-code-review/SKILL.md` 与 `resolve-base.sh`、`skills/spec-sessions/**`、`skills/spec-compound*/scripts/validate-frontmatter.py`、`skills/feature-video/**`、README 与用户手册。
- 扫描：`/tmp`、bash shebang、`rm -rf`、`mkdir -p`、`chmod`、`export`、`source`、`which`、`NODE_ENV=`、`HOME`、`USERPROFILE`、`APPDATA`、`process.cwd`、`__dirname`、`path.join`、`path.resolve`、`subprocess`、`shell=True`、`os.system` 等关键词。
- 检查：`.gitattributes` 缺失；`git ls-files -z | xargs -0 file | rg 'CRLF|BOM'` 无输出。

### 限制

- 本次未在真实 Windows 11 / PowerShell 5.1 / PowerShell 7 runner 上执行命令；Windows 可用性判断来自当前源码、CI 配置和已有 smoke/contract。
- Codegraph 仅作为 `provider_untrusted` 导航；报告结论以 source direct reads、扫描和当前文件证据为准。
- 本次只新增审查产物与 changelog，不修复 P1/P2 代码，不手改 generated runtime mirrors。
