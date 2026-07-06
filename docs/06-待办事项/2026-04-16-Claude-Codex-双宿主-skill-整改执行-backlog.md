# Claude/Codex 双宿主 Skill 整改执行 Backlog

- 日期：`2026-04-16`
- 来源文档：`docs/06-待办事项/2026-04-16-Claude-Codex-双宿主-skill-整改清单.md`
- 目标：把整改清单转换成可直接开工、可排期、可验收的执行 backlog
- 口径：只按当前仓库代码事实拆分，不引入未落地的新能力假设

## 1. 总量结论

按当前整改清单与本轮执行修订，**共 `22` 个核心整改任务**，分布如下：

1. `P0`：`11` 个
2. `P1`：`6` 个
3. `P2`：`5` 个

按执行顺序，分成 **`6` 个阶段**：

1. 产品契约收口
2. 硬断点修复
3. 用户可见入口清理
4. 独立叙事前置与双宿主治理补齐
5. 镜像与规范同步
6. 机械治理闸门

如果按“真正可派工的执行包”看，评审修订后建议压成 **`12` 个执行包**，而不是 `22` 个碎片化单点任务。

## 1.1 执行前必须先锁定的 P0 决策

在真正开始代码整改前，必须先把下面三个决策写成明确 contract，否则后续任务会继续互相打架。

这三项由 `T00` 统一承接，后续 `T01 / T11 / T12 / T14` 必须直接引用 `T00` 产物，而不是各自重定义：

1. **Codex compatibility layer 决策**
   - `.codex/commands/spec/*` 是彻底移除，还是保留为兼容层但明确排除在“用户可见入口”之外
   - 这会直接决定 `T01` 的实现方式与 smoke 断言写法
2. **治理枚举与 schema 决策**
   - 先锁定 `entry_surface`、`host_scope`、必要补充字段与 allowed values
   - `T12` 不能在 schema 未定时直接开工
3. **filtered asset set contract 决策**
   - 明确输入、输出、构建时机、状态落盘边界
   - 否则 `init / sync / doctor / clean / state` 仍会继续各自实现

这三项不是额外“发散讨论”，而是已经 formalize 为 `T00` 的真实前置条件。

## 2. 推荐执行包

### 包 A：产品契约与兼容层决策收口

- 覆盖任务：`T00`、`T01`、`T16`
- 状态：`已完成（2026-04-16，分支 feat/sync-compound-core-workflow-updates）`
- 目标：
  - 把三项前置决策正式落文
  - 锁定 Codex compatibility layer 策略
  - 停止 Codex 对外产品面继续传播 `spec-*`
  - 把外层产品 copy 与 CLI 可见口径统一收口到 `spec-*`
- 主要文件：
  - `src/cli/adapters/codex.js`
  - `src/cli/commands/init.js`
  - `src/cli/commands/doctor.js`
  - `src/cli/index.js`
  - `tests/smoke/cli.sh`
  - `.claude-plugin/plugin.json`
  - `README.md`
  - `skills/spec-mcp-setup/SKILL.md`
  - `skills/spec-graph-bootstrap/SKILL.md`
  - `skills/setup/SKILL.md`
  - `docs/contracts/dual-host-governance/README.md`
  - `src/cli/contracts/dual-host-governance/*.json`（machine-readable runtime truth source）
- 依赖：无
- 验收：
  - `T00` 产物存在，且可被 `T01 / T11 / T12 / T14` 直接引用
  - 已明确记录 `.codex/commands/spec/*` 的最终策略：移除，或保留为兼容层但不再视为用户可见入口
  - Codex 不再被代码与对外文案双重描述为 `spec-*`
  - `.claude-plugin/plugin.json`、README、CLI 输出与最终契约一致
  - 若涉及源码变更，已同步追加 `CHANGELOG.md`
  - 至少完成对应 unit / smoke 验证；具体 smoke 断言以 compatibility layer 决策为准，不预设必须删除 `.codex/commands/spec/*`
  - 若兼容层策略影响 Codex command 产物，`tests/smoke/cli.sh` 中 `init --codex` / `doctor --codex` / `clean --codex` 场景断言已同步更新
- 执行回写：
  - `T00`：已新增 `docs/contracts/dual-host-governance/README.md`，明确 Codex 不再生成 `.codex/commands/spec/*`，并落文治理枚举与 filtered asset set contract
  - `T01`：已在 `src/cli/adapters/codex.js`、`src/cli/index.js`、`tests/smoke/cli.sh` 收口 Codex 产品面与清理链路
  - `T16`：已在 `.claude-plugin/plugin.json`、`README.md`、`skills/spec-mcp-setup/SKILL.md`、`skills/spec-graph-bootstrap/SKILL.md`、`skills/setup/SKILL.md` 同步外层 copy
  - 验证：`npx jest tests/unit/dual-host-governance-contracts.test.js --runInBand` 通过；`npm run test:smoke` 通过

### 包 B：`spec-mcp-setup` 收口与残余缺口复核

- 覆盖任务：`T02`、`T14`
- 状态：`已完成（2026-04-16，分支 feat/sync-compound-core-workflow-updates）`
- 目标：
  - 修路径漂移
  - 先重新核实 `spec-mcp-setup` 在 Codex 侧是否仍存在真实脚本缺口
  - 若只剩文档口径问题，则直接收口文案；若仍有真实脚本 gap，则保留包 B 所有权，并在包 G 治理产物落定后回到包 B 补实现
- 主要文件：
  - `skills/spec-mcp-setup/SKILL.md`
  - `skills/spec-mcp-setup/scripts/verify-tools.sh`
  - `skills/spec-mcp-setup/scripts/verify-tools.ps1`
- 依赖：包 A
- 验收：
  - 文档路径全部真实存在
  - `T14` 已被重新定性为“文档收口”或“真实代码缺口”，不再混写
  - 文档承诺不超过脚本实际能力
  - 若涉及脚本变更，已同步追加 `CHANGELOG.md` 并运行 `bash tests/unit/mcp-setup.sh`
- 执行回写：
  - `T02`：已修正 `skills/spec-mcp-setup/SKILL.md` 中全部 `skills/mcp-setup/...` 旧路径，补齐 macOS/Linux 的 `install-coordinator.sh` 实际脚本路径
  - `T14`：经复核，`verify-tools.sh` / `verify-tools.ps1` 均已有 Codex 分支与现成 unit 覆盖；当前不存在额外脚本 gap，定性为“文档收口”
  - 口径补齐：可选工具说明已与脚本现实对齐；该历史 backlog 中关于飞书 MCP 的旧口径已废弃，当前活跃支持范围以现行 `spec-mcp-setup` 文档为准
  - 验证：`bash tests/unit/mcp-setup.sh` 通过（`pass: 136 / fail: 0`）

### 包 C：硬断点修复

- 覆盖任务：`T03`、`T04`
- 状态：`已完成（2026-04-16，分支 feat/sync-compound-core-workflow-updates）`
- 目标：
  - 修 `lfg` 的错误入口与 plan path 断链
  - 修 `git-worktree` 失效变量
- 主要文件：
  - `skills/lfg/SKILL.md`
  - `skills/git-worktree/SKILL.md`
- 依赖：包 A
- 验收：
  - 按文档执行不再卡死
  - 示例命令不依赖未定义宿主变量
- 执行回写：
  - `T03`：`skills/lfg/SKILL.md` 已把 step 3 改为显式传递 `<plan-path-from-step-2>`，并将 `todo-resolve` / `test-browser` / `feature-video` 收口为 standalone skill 调用
  - `T04`：`skills/git-worktree/SKILL.md` 已移除 `${CLAUDE_PLUGIN_ROOT}`，统一改为基于 skill 内 `scripts/worktree-manager.sh` 的宿主中立表述
  - 验证：`npx jest tests/unit/lfg-contracts.test.js tests/unit/git-worktree-contracts.test.js --runInBand` 通过（`4/4`）

### 包 D：Todo 流程入口清理

- 覆盖任务：`T05`、`T06`
- 状态：`已完成（2026-04-16，分支 feat/sync-compound-core-workflow-updates）`
- 目标：
  - 清掉 `todo-*` 中错误的 slash command 表述
  - 去掉 Claude 专属 `/model` / `Haiku` 假设
- 主要文件：
  - `skills/todo-triage/SKILL.md`
  - `skills/todo-create/SKILL.md`
  - `skills/todo-resolve/SKILL.md`
- 依赖：包 A
- 验收：
  - `todo-*` 不再把 standalone skill 写成已声明命令
- 执行回写：
  - `T05`：`skills/todo-triage/SKILL.md` 已移除 `/model` / `Haiku` 假设，并将 `/todo-resolve` 改为 `todo-resolve` skill 调用
  - `T06`：`skills/todo-create/SKILL.md`、`skills/todo-resolve/SKILL.md` 已统一改为 standalone skill 表述，不再把 `todo-*` 写成 slash command
  - 验证：`npx jest tests/unit/todo-triage-contracts.test.js tests/unit/todo-create-contracts.test.js tests/unit/todo-resolve-contracts.test.js --runInBand` 通过（`4/4`）

### 包 E：测试与演示类 skill 入口清理

- 覆盖任务：`T07`
- 状态：`已完成（2026-04-16，分支 feat/sync-compound-core-workflow-updates）`
- 目标：
  - 清掉 `test-*` / `feature-video` 中错误的 Quick Usage / Usage
- 主要文件：
  - `skills/test-browser/SKILL.md`
  - `skills/test-xcode/SKILL.md`
  - `skills/feature-video/SKILL.md`
- 依赖：包 A
- 验收：
  - 不再出现 `/test-browser`、`/test-xcode`、`/feature-video` 这类假入口
- 执行回写：
  - `T07`：`skills/test-browser/SKILL.md`、`skills/test-xcode/SKILL.md`、`skills/feature-video/SKILL.md` 的示例区已统一改为 host-neutral 的 skill 参数示例；`feature-video` 的 upload-only 示例也已去掉假 slash command
  - 验证：`npx jest tests/unit/test-browser-contracts.test.js tests/unit/test-xcode-contracts.test.js tests/unit/feature-video-contracts.test.js --runInBand` 通过（`6/6`）

### 包 F：主 workflow 与后续入口清理

- 覆盖任务：`T08`、`T09`、`T10`
- 状态：`已完成（2026-04-16，分支 feat/sync-compound-core-workflow-updates）`
- 目标：
  - 清掉 `/proof`、`/agent-native-architecture`、`/research`
  - 收口 `/simplify` 这类未声明交付的可选入口提示
  - 清掉 `# /compound`、`# /sessions` 等旧别名
- 主要文件：
  - `skills/spec-debug/SKILL.md`
  - `skills/agent-native-audit/SKILL.md`
  - `skills/spec-work/SKILL.md`
  - `skills/spec-work-beta/SKILL.md`
  - `skills/spec-compound/SKILL.md`
  - `skills/spec-sessions/SKILL.md`
- 依赖：包 A
- 验收：
  - 主 workflow 文案中不再残留未声明入口
- 执行回写：
  - `T08`：`skills/spec-debug/SKILL.md` 已把 `/proof` 改为 `proof` skill；`skills/agent-native-audit/SKILL.md` 已把 `/agent-native-architecture` 改为 skill 调用
  - `T09`：`skills/spec-work/SKILL.md`、`skills/spec-work-beta/SKILL.md` 已把 `/simplify` 收口为 “simplify skill or equivalent capability” 的能力表述
  - `T10`：`skills/spec-compound/SKILL.md`、`skills/spec-sessions/SKILL.md` 已改为描述性标题，并对齐 Claude/Codex 双宿主入口；`/research` 已从 `spec-compound` 的 Related Commands 中移除
  - 验证：`npx jest tests/unit/spec-debug-contracts.test.js tests/unit/agent-native-audit-contracts.test.js tests/unit/spec-work-contracts.test.js tests/unit/spec-work-beta-contracts.test.js tests/unit/spec-compound-contracts.test.js tests/unit/spec-sessions-contracts.test.js --runInBand` 通过（`17/17`）

### 包 G：双宿主治理设计与 inventory 收口

- 覆盖任务：`T11`、`T13`
- 状态：`已完成（2026-04-16，分支 feat/sync-compound-core-workflow-updates）`
- 目标：
  - 按 `T00` contract 完成 `47` 个 skill 的治理分类
  - 完成宿主专有 inventory 收口
  - 产出可供实现阶段直接消费的 machine-readable 真源文件
- 主要文件：
  - `src/cli/contracts/dual-host-governance/` 下 machine-readable 宿主治理真源文件（待新增，命名由 `T00` 定稿）
  - `skills/claude-permissions-optimizer/SKILL.md`
  - `skills/orchestrating-swarms/SKILL.md`
- 依赖：`T00` 产物可用；不必等待 `T01 / T16` 全部完成
- 验收：
  - `47` 个 skill 的分类矩阵完整闭环，且按 `entry_surface` / `host_scope` 分列
  - `13` 个 command-backed workflow skill 的分类已显式反映 `T00` compatibility layer 决策，且不再混淆 `entry_surface` 与 `host_scope`
  - `spec-work-beta` 已被显式归类，避免继续处于模糊地带
  - `claude-permissions-optimizer` 等宿主专有项已完成定性
- 执行回写：
  - `T11`：已新增 `src/cli/contracts/dual-host-governance/skills-governance.json` 与 `skills-governance.schema.json`，把当前 `47` 个 source skills 全量收口为 machine-readable 真源
  - `T13`：已在真源中明确 `orchestrating-swarms = host_exclusive(owner_host=claude)`、`claude-permissions-optimizer = target_host_maintenance(owner_host=claude)`，并把 `spec-work-beta` 显式归为 `standalone_skill + dual_host`
  - 验证：`npx jest tests/unit/skills-governance-contracts.test.js --runInBand` 通过（`3/3`）

### 包 I：runtime 过滤真源落地

- 覆盖任务：`T12`
- 状态：`已完成（2026-04-16，分支 feat/sync-compound-core-workflow-updates）`
- 目标：
  - 按 `T00 + T11 + T13` 产物实现 filtered asset set
  - 让 `init / sync / doctor / clean / state` 共用 filtered asset set
- 主要文件：
  - `src/cli/plugin.js`
  - `src/cli/commands/init.js`
  - `src/cli/state.js`
  - `src/cli/commands/doctor.js`
  - `src/cli/commands/clean.js`
  - `src/cli/contracts/dual-host-governance/` 下 machine-readable 宿主治理真源文件（由包 G 产出）
- 依赖：包 G 完成、包 A 完成；包 B 仅在 `T14` 被复核为真实脚本 gap 时作为附加前置
- 验收：
  - 过滤逻辑不再只依赖 manifest command set
  - 宿主专有能力可被单一真源表达
  - 已同步追加 `CHANGELOG.md`
  - 完成治理相关 unit 测试，并补 smoke 覆盖 `init --codex` / `doctor --codex` / `clean --codex`
- 执行回写：
  - `T12`：`src/cli/plugin.js` 已新增 `buildFilteredAssetSet()` 与治理真源校验，并改为由 `skills-governance.json + plugin manifest` 共同驱动 `sync / inspect`
  - `init` 已改为按 filtered asset set 构建 previewState；`doctor` 已通过 `inspectInstalledAssets()` 读取过滤后的期望集合；Codex runtime 不再同步 `orchestrating-swarms`
  - smoke 已改为直接从治理真源计算 Codex 期望数量，并补 `claude-permissions-optimizer` 存在、`orchestrating-swarms` 缺席断言
  - 验证：`npx jest tests/unit/skills-governance-contracts.test.js tests/unit/managed-state-contracts.test.js tests/unit/dual-host-governance-contracts.test.js --runInBand` 通过；`npm run test:smoke` 通过；`npm run test:integration` 通过

### 包 H：Stage-0 叙事统一

- 覆盖任务：`T15`
- 状态：`已完成（2026-04-16，分支 feat/sync-compound-core-workflow-updates）`
- 目标：
  - 把 `spec-graph-bootstrap` 改成与 `spec-plan/spec-work/spec-code-review` 一致的 Stage-0 叙事
- 主要文件：
  - `skills/spec-graph-bootstrap/SKILL.md`
- 依赖：包 A
- 验收：
  - 不再自相矛盾
  - 不夸大为“已自动注入主工作流”
- 执行回写：
  - `T15`：经代码复核，`skills/spec-graph-bootstrap/SKILL.md` 已明确声明其是 `Stage-0 supporting workflow`，且“不是第六阶段”“自动注入是未来能力”
  - 为防回流，已新增 `tests/unit/spec-graph-bootstrap-contracts.test.js`
  - 验证：`npx jest tests/unit/spec-graph-bootstrap-contracts.test.js --runInBand` 通过（`1/1`）

### 包 J：文档尾注、reference、镜像刷新

- 覆盖任务：`T17`、`T18`、`T19`
- 状态：`已完成（2026-04-16，分支 feat/sync-compound-core-workflow-updates）`
- 目标：
  - 修 `report-bug`
  - 批量刷新 reference
  - 刷新 `docs/10-prompt/` 镜像
- 主要文件：
  - `skills/report-bug/SKILL.md`
  - `skills/**/references/*`
  - `docs/10-prompt/skills/**`
- 依赖：包 D、E、F、H 完成
- 验收：
  - 源文档与镜像、引用文档不再分叉
- 执行回写：
  - `T17`：`skills/report-bug/SKILL.md` 尾注已从假 slash command 收口为 host-neutral 的 ``report-bug`` skill 表述；`skills/reproduce-bug/SKILL.md` 的邻近引导也已同步改为 standalone skill 语言
  - `T18/T19`：已按 `skills/` 源文档为真源，批量刷新 `docs/10-prompt/skills/**` 下的 `SKILL.md`、`references/`、`assets/` 镜像，消除旧入口与旧路径漂移
  - 验证：`npx jest tests/unit/report-bug-contracts.test.js tests/unit/reproduce-bug-contracts.test.js --runInBand` 通过（`4/4`）

### 包 K：仓库级规范补齐

- 覆盖任务：`T20`
- 状态：`已完成（2026-04-16，分支 feat/sync-compound-core-workflow-updates）`
- 目标：
  - 固化仓库级入口规范与宿主分类规则
- 主要文件：
  - `AGENTS.md`
  - 或新增维护文档
- 依赖：包 G、包 I 产出最终治理模型
- 验收：
  - 后续新增 skill 可直接按规则校验
- 执行回写：
  - `T20`：已在 `AGENTS.md` 新增 `Dual-Host Skill Governance` 段，固化 `entry_surface / host_scope / host_delivery`、用户可见入口边界、`Skill(...)` / `skill:` 豁免、Codex `spec-*` 禁止规则与镜像刷新义务
  - `docs/contracts/dual-host-governance/README.md` 已补 machine-readable 真源落位与 contributor maintenance rules，形成仓库级治理文本闭环

### 包 L：静态扫描闸门

- 覆盖任务：`T21`
- 状态：`已完成（2026-04-16，分支 feat/sync-compound-core-workflow-updates）`
- 目标：
  - 增加入口口径静态扫描并纳入合并前检查
- 主要文件：
  - `scripts/`（待新增）
  - `package.json`
  - CI / pre-merge 配置
- 依赖：包 K
- 验收：
  - 能自动阻断旧入口回流
  - 明确豁免 `Skill(...)` 与 `skill:`
  - 增强项优先采用标签感知扫描，拦截 `**Codex entry point:** spec-*` 这类错误宿主入口，而不是用过宽 `spec-*` 模式误伤合法 Claude 文案
  - 第一阶段先提供 `npm run lint:skill-entrypoints`
  - 第二阶段接入 CI gate
  - `pre-commit` 作为增强项，不在规则尚未稳定前先行强推
- 执行回写：
  - `T21`：已新增 `scripts/lint-skill-entrypoints.js` 与 `scripts/lint-skill-entrypoints.config.json`，采用“显式 blocked patterns + 从 `skills-governance.json` 推导 standalone skill 名单”的标签感知扫描
  - 规则已明确豁免 `Skill(...)` 与 `skill:`，并拦截 `# /...`、`**Codex entry point:** spec-*`、`/research`、`/simplify`、standalone skill 假 slash command
  - 已新增 `package.json` 脚本 `npm run lint:skill-entrypoints`
  - 已新增 `.github/workflows/skill-entrypoint-gate.yml`，将 lint 接入 pull request gate
  - 验证：`npx jest tests/unit/lint-skill-entrypoints.test.js --runInBand` 通过（`3/3`）；`npm run lint:skill-entrypoints` 通过

## 2.1 执行硬规则

### 代码与脚本任务的验证规则

1. `T01`
   - 必须补或更新 unit / smoke
   - smoke 断言围绕“Codex 用户可见契约收口”编写
   - 是否断言“不再生成 `.codex/commands/spec/*`”取决于包 A 的 compatibility layer 决策，不能预设
2. `T12`
   - 必须新增 filtered asset set 相关 unit 测试
   - 必须补 smoke 覆盖 `init --codex` → `doctor --codex` → `clean --codex`
   - 不把现有 `tests/integration/e2e.sh` 作为这条治理链的主验收
3. `T14`
   - 先做 residual gap re-validation
   - 只有确认仍存在真实脚本缺口时，才补新的代码实现与脚本测试
4. `T21`
   - 第一阶段先落 `npm run lint:skill-entrypoints`
   - 再接 CI gate
   - `pre-commit` 仅作为后续增强项

### CHANGELOG 治理规则

1. 任何代码、脚本、打包真源变更，必须同步追加 `CHANGELOG.md`
2. 当前 backlog 中默认强制适用的执行包：
   - 包 A
   - 包 B（仅在动到脚本时）
   - 包 G
   - 包 I
   - 包 L
3. 纯文档型包默认不强制追加 `CHANGELOG.md`，除非实际触达源码或打包真源

## 3. 原子任务列表

### T00 三项前置决策锁定

- 优先级：`P0`
- 阶段：`第一阶段前置`
- 目标：
  - 明确 `.codex/commands/spec/*` 的 compatibility layer 策略
  - 锁定 `entry_surface` / `host_scope` / allowed values
  - 锁定 filtered asset set contract 的输入、输出、构建时机、状态落盘边界
- 依赖：无
- 输出：
  - 一份落位于 `docs/contracts/dual-host-governance/README.md` 的 decision record / contract 主文档
  - machine-readable runtime truth source 固定落位于 `src/cli/contracts/dual-host-governance/`
  - 后续任务不再各自重定义兼容层、枚举值和 filtered asset set 语义
- 验收：
  - `docs/contracts/dual-host-governance/README.md` 已存在且可被 `T01 / T11 / T12 / T14` 直接引用
  - `.codex/commands/spec/*` 的 compatibility layer 策略已明确落文
  - `entry_surface` / `host_scope` / allowed values 已形成可引用 contract
  - filtered asset set 的输入、输出、构建时机、状态落盘边界已明确，且 `T01 / T11 / T12 / T14` 可直接引用

### T01 Codex 产品面收口

- 来源：整改清单 `4.1`
- 优先级：`P0`
- 阶段：`第一阶段`
- 目标：
  - 停止 Codex 暴露 `spec-*`
  - 把所有对外口径统一改成 `spec-*`
- 依赖：T00
- 输出：
  - Codex compatibility layer 策略已明确落文：移除，或保留为兼容层但不属于用户可见入口
  - 代码层不再把 `.codex/commands/spec/*` 视为正式产品面
  - CLI / README / 关键 skill 对外口径一致
  - `init.js` / `doctor.js` / `printVersion()` 的修复方向显式参照 `T00` 产物，不由执行者自行猜测
  - `tests/smoke/cli.sh` 中 Codex `init` / `doctor` / `clean` 场景已按 `T00` compatibility layer 决策同步更新断言

### T02 `spec-mcp-setup` 路径漂移修复

- 来源：整改清单 `4.2`
- 优先级：`P0`
- 阶段：`第二阶段`
- 目标：
  - 把 `skills/mcp-setup/...` 全量修正为真实路径
- 依赖：T01
- 输出：
  - `skills/spec-mcp-setup/SKILL.md` 路径可直接执行

### T03 `lfg` 闭环修复

- 来源：整改清单 `4.3`
- 优先级：`P0`
- 阶段：`第二阶段`
- 目标：
  - 去掉错误入口
  - 明确 plan path 传递
- 依赖：T01
- 输出：
  - `lfg` 文档流程可闭环执行

### T04 `git-worktree` 失效变量修复

- 来源：整改清单 `4.4`
- 优先级：`P0`
- 阶段：`第二阶段`
- 目标：
  - 去掉 `${CLAUDE_PLUGIN_ROOT}` 依赖
  - 统一改成宿主中立表述，不再写死任一宿主 runtime 路径
- 依赖：T01
- 输出：
  - `git-worktree` 统一表述为“加载 `git-worktree` skill，由 skill 内脚本处理实际路径”

### T05 `todo-triage` 宿主耦合与入口修复

- 来源：整改清单 `4.5`
- 优先级：`P0`
- 阶段：`第三阶段`
- 目标：
  - 去掉 `/model` / Haiku / `/todo-resolve` 的错误产品面
- 依赖：T01
- 输出：
  - `todo-triage` 转为宿主中立表述

### T06 `todo-create` / `todo-resolve` 入口文案修复

- 来源：整改清单 `4.6`
- 优先级：`P0`
- 阶段：`第三阶段`
- 目标：
  - 去掉将 standalone skill 写成 slash command 的表述
- 依赖：T01
- 输出：
  - `todo-*` 三件套对外口径统一

### T07 `test-*` / `feature-video` Quick Usage 修复

- 来源：整改清单 `4.7`
- 优先级：`P0`
- 阶段：`第三阶段`
- 目标：
  - 清掉假命令示例
- 依赖：T01
- 输出：
  - 测试与演示类 skill 的使用示例真实可信

### T08 `spec-debug` / `agent-native-audit` 下一步入口修复

- 来源：整改清单 `4.8`
- 优先级：`P0`
- 阶段：`第三阶段`
- 目标：
  - 去掉 `/proof`、`/agent-native-architecture`
- 依赖：T01
- 输出：
  - 下一步引导改为 skill 中立表述

### T09 `spec-work` / `spec-work-beta` `/simplify` 表述收口

- 来源：整改清单 `4.9`
- 优先级：`P0`
- 阶段：`第三阶段`
- 目标：
  - 去掉把 `/simplify` 写成已交付用户入口的表述
- 依赖：T01
- 输出：
  - 主执行 workflow 不再把未声明交付的 `/simplify` 入口写成产品面
  - 文案改为“simplify 类 skill 或等效能力”的宿主中立能力描述，不暗示当前仓原生提供 `/simplify`
  - `spec-work-beta` 在 `T11` 完成前统一按 standalone skill 语言描述，不提前假定它是 workflow command

### T10 `spec-compound` / `spec-sessions` 旧别名清理

- 来源：整改清单 `4.10`
- 优先级：`P0`
- 阶段：`第三阶段`
- 目标：
  - 去掉 `# /compound`、`# /sessions`、`/research`
- 依赖：T01
- 输出：
  - 标题、Usage、Related commands 同步收口
  - H1 与 command template 对齐，改为描述性标题，不写成 `# /...`

### T11 宿主治理真源设计

- 来源：整改清单 `4.11`
- 优先级：`P1`
- 阶段：`第四阶段`
- 目标：
  - 按 `T00` contract 给 `47` 个 skill 定义可落地的治理分类
  - `13` 个 command-backed workflow skill 的分类显式绑定 `T00` compatibility layer 决策
  - 产出可被实现阶段直接消费的治理真源文件
- 依赖：T00
- 输出：
  - 宿主分类矩阵（按 `entry_surface` / `host_scope` 分列）
  - 兼容层表达不再混淆 `entry_surface` 与 `host_scope`
  - 与 `T00` contract 同命名空间、落位于 `src/cli/contracts/dual-host-governance/` 的 machine-readable 宿主治理真源文件

### T12 runtime 过滤统一真源

- 来源：整改清单 `4.12`
- 优先级：`P1`
- 阶段：`第四阶段`
- 目标：
  - 按 `T00` contract 与 `T11 / T13` 分类结果实现 filtered asset set
  - 让 `init / sync / doctor / clean / state` 共用同一套过滤结果
- 依赖：T00、T01、T11、T13
- 输出：
  - runtime 分发与清理逻辑不再打架

### T13 宿主专有盘点补全

- 来源：整改清单 `4.13`
- 优先级：`P1`
- 阶段：`第四阶段`
- 目标：
  - 把 `claude-permissions-optimizer` 等宿主专有项纳入治理
- 依赖：T11
- 输出：
  - inventory 完整闭环

### T14 `spec-mcp-setup` Codex 校验对等性处理

- 来源：整改清单 `4.14`
- 优先级：`P1`
- 阶段：`第二阶段复核，第四阶段条件实现`
- 目标：
  - 先复核 Codex 侧是否仍存在真实校验 gap
  - 若 gap 已关闭，则只收口文档与口径
  - 若 gap 仍存在，再在 `T00 + T11` 治理 contract 落定后补实现
- 依赖：T00；T11 仅在确认存在真实脚本 gap 时追加生效；若只是文档口径问题，则随 T02 在包 B 完成
- 输出：
  - `T14` 已被定性为“文档收口”或“代码实现”
  - 复核与实现口径显式参照 `T00` contract
  - 验证口径与脚本现实一致

### T15 `spec-graph-bootstrap` 叙事统一

- 来源：整改清单 `4.15`
- 优先级：`P1`
- 阶段：`第四阶段前置`
- 目标：
  - 统一 Stage-0 叙事，不夸大自动注入
- 依赖：T01
- 输出：
  - `spec-graph-bootstrap` 与主 workflow 叙事一致

### T16 打包与公开文档 copy 收口

- 来源：整改清单 `4.16`
- 优先级：`P1`
- 阶段：`第一阶段`
- 目标：
  - 修 `.claude-plugin/plugin.json` 与 `README.md`
- 依赖：T00，与 `T01` 同包执行
- 输出：
  - 对外 copy 与产品契约一致
  - 已并入包 A，不再单独排包

### T17 `report-bug` 尾注修复

- 来源：整改清单 `4.17`
- 优先级：`P2`
- 阶段：`第五阶段`
- 目标：
  - 去掉不真实入口表述
- 依赖：T01
- 输出：
  - 宿主中立尾注

### T18 reference 文档同步修

- 来源：整改清单 `4.18`
- 优先级：`P2`
- 阶段：`第五阶段`
- 目标：
  - 刷新 skill reference 中残留的旧入口
- 依赖：T05-T10、T15
- 输出：
  - 引用文档与源 skill 一致

### T19 `docs/10-prompt/` 镜像刷新

- 来源：整改清单 `4.19`
- 优先级：`P2`
- 阶段：`第五阶段`
- 目标：
  - 刷新镜像文档
- 依赖：T18
- 输出：
  - 外部镜像不再误导

### T20 仓库级入口规范文档

- 来源：整改清单 `4.20`
- 优先级：`P2`
- 阶段：`第五阶段`
- 目标：
  - 固化入口与宿主分类规则
- 依赖：T11、T12、T13
- 输出：
  - 后续新增 skill 的维护规约

### T21 入口静态扫描闸门

- 来源：整改清单 `4.21`
- 优先级：`P2`
- 阶段：`第六阶段`
- 目标：
  - 给入口治理增加自动阻断
- 依赖：T20
- 输出：
  - `npm run lint:skill-entrypoints`
  - 扫描脚本
  - `Codex entry point.*\\spec-*` 这类标签感知规则（增强项）
  - CI / 合并前检查规则

## 4. 并行建议

可以并行的包：

1. 包 B、C、D、E、F 可在包 A 之后并行
2. 包 H 可与包 D、E、F 并行
3. 包 G 可在 `T00` 完成后独立推进设计与盘点，不必等待包 A 全部完成
4. 包 J 只能在 D、E、F、H 之后做
5. 包 L 只应在包 K 之后启动，但可先独立准备扫描规则草案

不建议并行的包：

1. 包 I 不能和包 A 并行修改同一套 runtime 文件
2. 包 I 不能早于包 G 的治理模型落定
3. 包 K 必须等待包 G、包 I 的治理模型与实现一起落定
4. 包 L 必须等待包 K 的规则文本落定

## 5. 最小开工顺序

如果只给一个最稳的开工顺序，建议按下面执行：

1. `T00`
2. `T01`、`T16`
3. `T02`、`T03`、`T04`
4. `T05`、`T06`、`T07`、`T08`、`T09`、`T10`
5. `T15`
6. `T11`、`T13`
7. `T12`
8. `T14`
说明：只有当包 B 复核确认 `T14` 仍是代码缺口时，才进入这一步；否则它已在第 3 步完成
9. `T17`、`T18`、`T19`
10. `T20`
11. `T21`

## 6. 最终结论

这轮整改如果按原子任务算，是 `22` 个任务。

如果按真正适合排期和派工的方式算，建议压成 `12` 个执行包。

如果按最小可落地顺序推进，第一批真正应该开工的是：

1. `T00` 三项前置决策锁定
2. `T01` + `T16` 产品面与外层 copy 收口
3. `T02` / `T03` / `T04` 硬断点修复

原因很简单：

在这三批之前，后续所有 skill 文案修复和 runtime 治理实现都会继续受到错误产品契约与未定 schema 污染，先修只会返工。
