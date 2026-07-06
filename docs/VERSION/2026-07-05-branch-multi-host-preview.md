# 分支版本说明：多宿主 preview 扩展（leo-2026-07-03-kiro）

> 本文件是 `leo-2026-07-03-kiro` 分支相对 `main` 的累积版本说明，覆盖 37 个提交、约 500 个改动文件。版本基线为 `spec-first@1.12.1`（`package.json` 已从 `1.12.0` 升至 `1.12.1`），分支内改动尚未 bump 新的 npm 版本号；正式发版时以届时 `package.json` 与 `docs/VERSION/` 的单版本说明为准。

## 摘要

本分支在保持 CLI 与既有宿主（Claude Code、Codex）对外行为兼容的前提下，把 `spec-first` 从**双宿主**扩展为**五宿主 preview 交付面**：新增 Kiro、Qoder 两个 opt-in preview host，以及更保守的 Cursor `generated_runtime_preview`（仅证明 runtime 生成，宿主 skill loader/user journey 未验证）。同期完成跨宿主 `spec-*` 用户入口归一化、新增 `spec-rule-miner` 规则挖掘 skill、Windows PowerShell 兼容性 Phase 1 与低风险 Phase 2、Runtime Setup provider 生态迁移与 PATH 修复，并把 `using-spec-first` bootstrap 收敛为最小入口锚点。

Kiro、Qoder、Cursor 三宿主均为**显式 opt-in preview**，不进入 `init -y` 默认宿主集；Cursor 的 preview 边界最窄，属诚实降级而非完整宿主支持。

## 亮点

### 宿主支持从双宿主扩展到五宿主（preview）

`spec-first` 从 `Claude Code + Codex` 扩展到 `Claude Code + Codex + Kiro + Qoder + Cursor`。新增三个宿主 adapter（`src/cli/adapters/kiro.js`、`qoder.js`、`cursor.js`）并接入 adapter registry、`init`/`doctor`/`clean`/help、plugin governance、runtime catalog、gitignore/context/source-runtime 边界与 `spec-mcp-setup` 的 shell + PowerShell MCP 配置。三宿主的 preview 成熟度不同，如实分层：

- **Kiro（opt-in preview）：** 生成 `.kiro/skills/` Agent Skills、`.kiro/agents/` 只读 agent profiles、`.kiro/spec-first/state.json`；不生成 `.kiro/commands/spec`、`.kiro/hooks` 或 `.kiro/steering`；`.kiro/specs/**` 保持 Kiro 原生 advisory 输入。MCP 默认写项目级 workspace JSON，用户级需 `--user-scope` / `KIRO_USER_SCOPE=1` 显式 opt-in。Kiro IDE 实机 smoke 与 `read` 工具代码检索能力仍为 open item。
- **Qoder（opt-in preview）：** 生成 `.qoder/commands/spec-*.md` project commands（旧 `.qoder/commands/spec/` namespace 已退役，`init` 会清理）、`.qoder/skills/`、`.qoder/agents/` 与 `.qoder/spec-first/state.json`；不生成 `.qoder/rules/**`、hooks 或 plugin。agents 默认 `Read/Grep/Glob`，不默认 `Write/Edit/Bash/Agent`。MCP 默认写 `.qoder/settings.local.json`，用户级需 `--user-scope` / `QODER_USER_SCOPE=1`。本机无 `qodercli`/`qoder`，保持 degraded preview 表达。
- **Cursor（opt-in `generated_runtime_preview`，边界最窄）：** `init --cursor` 生成 `.cursor/skills/**`、`.cursor/spec-first/**`，MCP 默认写项目级 `.cursor/mcp.json`（用户级 `~/.cursor/mcp.json` 需 `--user-scope` / `CURSOR_USER_SCOPE=1`）。当前 release evidence 记录 `cursor_loader_validation_unavailable`——仅证明 runtime 生成，**未**证明 Cursor 本地 skill 发现/调用与 user journey。不视为完整宿主支持，不进入 `init -y` 默认。Cursor 原生 `.cursor/rules/**`、Kiro 原生 `.kiro/specs/**`、Qoder 原生 `.qoder/rules/**` 保持宿主自有，仅在显式点名时作为 advisory 输入。

共享安全纪律：全宿主 MCP install/configure/uninstall 走单一 CLI 写路径并 fail-closed，Claude/Codex/Kiro/Qoder/Cursor generated setup surface 均注入 canonical `MCP_SETUP_HOST` host pin，避免多宿主共存时误判当前宿主；`doctor` 裸自动探测只认各宿主的 spec-first managed sentinel（如 `.cursor/spec-first/state.json`、`.qoder/spec-first/state.json`），不因仅存在宿主原生 artifact 而误判。

### 跨宿主 `spec-*` 用户入口归一化

将 skills/templates/docs/tests 中残留的历史宿主入口语法统一收敛为 `spec-*` 形式，使 Claude Code、Codex、Cursor、Kiro、Qoder 共用同一套 source 资产、同名 `spec-*` workflow 入口，无需手维护 generated runtime 副本。同步收敛命令命名空间：`src/cli/state.js` 新增 `isSpecFirstManagedCommandFile` 守卫，使命令 prune 仅作用于 `spec-*.md` 受管文件、不误删非受管命令；`.claude/settings.json` 的 spec-plan guard matcher 从 `spec:plan` 改为 `spec-plan`；修复 Cursor/Kiro/Qoder generated skill runtime context 里 host-native advisory 文案被路径 rewrite 拼接成混合表述的问题。

### 新增 `spec-rule-miner` skill

将外部 `agent-rule-miner` 迁移并按 spec-first 命名规范注册为 source standalone skill `spec-rule-miner`（`skills/spec-rule-miner/`），从目标仓库证据挖掘 ≤1000 words 的 AI 编码规则。

- 默认写入独立 canonical 文件 `docs/ai/project-rules.md`，`AGENTS.md` 与 `CLAUDE.md` 仅写 repo-relative pointer，避免把完整规则塞进入口文件。
- 规则合成约束：多包/monorepo 先识别包级边界，跨包只写稳定通用模式，包级规则显式标注适用范围；避免把抽样主模式写成全仓绝对事实。
- 写入安全：headless 默认写入须有宿主/调用参数证据；支持 legacy `rule-miner-start/end` marker 迁移到 `spec-rule-miner-start/end`，保留 frontmatter。
- 在 `skills-governance.json` 注册五宿主 standalone delivery，配套 trigger/boundary eval 与 contract test。

### Windows PowerShell 兼容性（Phase 1 + 低风险 Phase 2）

按 Windows 兼容性专项审查落地确定性修复：`helper-tools.json` 的 agent-browser Windows 命令改为 PS 5.1 安全写法并加反漂移 contract test；`validate-frontmatter.py` 显式 UTF-8 并加非 UTF-8 locale 中文 fixture；`feature-video` 默认输出改 `tempfile.gettempdir()`；新增 `.gitattributes`（显式扩展名 `eol=lf`，零 renormalize churn）；MCP install shell/PowerShell 诊断摘要新增 token/password/apiKey/env/args/Authorization/URL 凭据 redaction；用户手册补 PowerShell/cmd 对照。审查明确区分确定性用户复制/locale 类 bug（已修）与 bash-only workflow helper 的 native-PowerShell portability gap（记为 P2 待办）。

### Runtime Setup provider 生态迁移与 PATH 修复

- provider source pin 更新到官方最新版本：CodeGraph `@colbymchenry/codegraph` `1.0.1 → 1.2.0`；Graphify 从旧 PyPI 路线迁移到 npm scoped 包 `@sentropic/graphify@0.17.1`，`install-helpers.{sh,ps1}` 改用 npm global install，readiness 渲染按生态输出 `package@version`。
- 修复 Graphify npm 安装/升级后的 PATH symlink 抢占：解析到 pinned 可执行文件后，对 PATH 上版本不匹配且为 symlink/junction 的旧 `graphify` 入口执行可回退备份并重指向 pinned CLI；普通文件/不可写/歧义场景保持 report-only。
- `provider-readiness-renderer.cjs` 改用非 login shell 解析 PATH，避免 macOS login shell 启动文件把旧 PATH 注入 provider 判断。
- provider 状态块证据分层：`verify-tools.{sh,ps1}` 新增 `readiness_scope` 与 `probe_status` 派生显示列，把 install/index readiness 与 server/query probe verification 明确分开；文案要求不得把未验证的 `server_reachable/query_verified=false` 表述为 confirmed 可用。

### `using-spec-first` bootstrap 收敛为最小入口锚点

将 `CLAUDE.md`/`AGENTS.md` 的 bootstrap 从完整入口菜单与 generated mirror 长路径列表，收敛为 L0 最小入口锚点 + `context-governance` owner 指针；`using-spec-first` description 补强 lightweight/current-context/narrow-lookup/single-document 排除，降低进入错误 workflow 的概率。非 Claude 宿主的共享 `AGENTS.md` bootstrap 收敛为 Codex/Cursor/Kiro/Qoder 共用 `spec-*` 口径，避免多宿主 init 末位写入者覆盖 Codex startup/dispatch 边界。

## 新增

- 三个 preview 宿主 adapter：`src/cli/adapters/kiro.js`、`qoder.js`、`cursor.js`，及配套 `doctor --kiro/--qoder/--cursor` 探测、gitignore/context 边界、supported-host governance schema/data。
- standalone skill `spec-rule-miner`（SKILL + `pattern-categories.md` / `write-targets.md` references + trigger/boundary eval）。
- Windows 兼容支撑：`.gitattributes`、PowerShell 兼容 contract test、非 UTF-8 locale 中文 fixture。
- 大量治理与调研文档：Kiro/Qoder/Cursor host support PRD 与实施计划、Windows PowerShell 兼容审查三件套（2026-07-03 与 2026-07-05）、系统性项目审查与三份 closure plan、spec-first skills 优化方案（16 思维模型 + 50 轮深度审查）、Skill Harness 能力审查方法论、runtime-setup host authority solution 知识沉淀。
- 新增/扩展 unit 测试：`doctor-cursor-detection`、`doctor-kiro-detection`、`doctor-qoder-detection`、`spec-rule-miner-contracts`、`context-bundle-contracts`、`frontmatter-validator`、`gitignore-policy` 等。

## 修复

- 修复 Runtime Setup 在多宿主 runtime 文案中误把当前 host 语义判断为其他宿主的风险（Host Authority And Write Safety：当前入口 host 优先于 PATH/runtime 目录/历史 setup facts）。
- 修复 Graphify npm 安装/升级后旧 `graphify` symlink 抢占 PATH 导致 provider 判断错误的问题。
- 修复 Cursor/Kiro/Qoder generated skill runtime context 中 host-native advisory 文案被路径 rewrite 拼接成混合表述的问题。
- 修复入口归一化过度替换产生的错误路径（如 `.claude/commands/spec-*.mdskill-audit.md`、`.qoder/settings.local.jsonmcp.json`）。
- 恢复 `AGENTS.md` 被误删的 `spec-first:bootstrap` managed block 标记，使 start/end 重新配对。
- 修复 Windows 平台 helper 命令的 PS 5.1 不兼容与 frontmatter 验证默认编码问题。

## 兼容性与升级

- 向后兼容：Claude Code、Codex 既有行为不变，可从 `1.12.0` 平滑升级，无需迁移。
- Kiro/Qoder/Cursor 需显式 `--kiro` / `--qoder` / `--cursor` opt-in，均不进入 `init -y` 默认宿主集。
- Cursor 为 `generated_runtime_preview`，loader/user journey 未验证；请勿据此当作完整宿主支持。
- source 变更后修复 runtime drift 一律走 `spec-first init`，不手改 `.claude/`、`.codex/`、`.agents/skills/`、`.cursor/`、`.kiro/`、`.qoder/` generated mirror。

## 验证说明

本文件为 docs-only 汇总，内容依据 `git log main..HEAD`、`git diff --stat main...HEAD`、根 `CHANGELOG.md` 分支段与 `package.json`/`README.md`/adapter source 直接核对。各源码提交的具体验证命令（`npm test`、`npm run test:mcp-setup`、focused Jest 套件、`spec-first init --claude --codex --cursor --kiro --qoder --dry-run`、PowerShell parser check 等）记录在对应 `CHANGELOG.md` 条目与 `docs/plans/**`、`docs/validation/**` 中。宿主 loader 实机验证状态（Kiro IDE smoke、Qoder CLI、Cursor loader）保持 degraded/open，未在本分支声明为 confirmed。
