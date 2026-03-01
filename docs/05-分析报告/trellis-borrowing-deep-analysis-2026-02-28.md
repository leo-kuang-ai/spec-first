# Trellis 对 Spec-First 的可借鉴点深度分析（2026-02-28）

## 1. 目标与范围

- 目标：深度理解 `Trellis` 项目，识别可落地借鉴到 `spec-first` 的工程机制，并形成分阶段实施方案。
- 范围：
  - Trellis：CLI、更新机制、模板系统、多平台适配、多代理脚本、工作区/任务模型、文档化实践。
  - spec-first：CLI、skill runtime、hook 集成、update/bootstrap、feature/stage 流程与 skills。

---

## 2. 逐步理解过程（Step-by-Step）

### Step 1：Trellis 的结构与核心能力

1. Trellis 是“模板分发 + 工作流运行时”双核架构：
   - CLI 入口仅 `init/update` 两个主命令，职责非常聚焦（证据：`/Users/kuang/xiaobu/Trellis/src/cli/index.ts:61`, `/Users/kuang/xiaobu/Trellis/src/cli/index.ts:101`）。
2. 平台适配采用“注册表 + 统一派生”的单一真理源：
   - `AI_TOOLS` 声明平台元数据（证据：`/Users/kuang/xiaobu/Trellis/src/types/ai-tools.ts:80`）。
   - `PLATFORM_FUNCTIONS` 声明平台行为（configure/collectTemplates），并派生 managed dirs、configured platforms 等（证据：`/Users/kuang/xiaobu/Trellis/src/configurators/index.ts:64`, `/Users/kuang/xiaobu/Trellis/src/configurators/index.ts:193`）。
3. 更新机制具备“模板变更可判别 + 迁移可编排 + 回滚可恢复”三层能力：
   - 模板哈希跟踪（证据：`/Users/kuang/xiaobu/Trellis/src/utils/template-hash.ts:17`, `/Users/kuang/xiaobu/Trellis/src/utils/template-hash.ts:269`）。
   - 变更分类（new/unchanged/auto-update/changed）（证据：`/Users/kuang/xiaobu/Trellis/src/commands/update.ts:268`）。
   - 迁移清单（manifest）+ 分类执行（auto/confirm/conflict/skip）（证据：`/Users/kuang/xiaobu/Trellis/src/migrations/index.ts:69`, `/Users/kuang/xiaobu/Trellis/src/commands/update.ts:662`）。
   - 全量备份后再更新（证据：`/Users/kuang/xiaobu/Trellis/src/commands/update.ts:503`, `/Users/kuang/xiaobu/Trellis/src/commands/update.ts:1382`）。
4. 工作流运行时使用 Python 脚本层，强调跨平台一致性：
   - Git 输出 UTF-8 强制、Windows stdout 兼容（证据：`/Users/kuang/xiaobu/Trellis/.trellis/scripts/common/git_context.py:15`, `/Users/kuang/xiaobu/Trellis/.trellis/scripts/common/git_context.py:55`）。
   - 多 CLI 适配器封装路径/命令差异（证据：`/Users/kuang/xiaobu/Trellis/.trellis/scripts/common/cli_adapter.py:37`, `/Users/kuang/xiaobu/Trellis/.trellis/scripts/common/cli_adapter.py:215`）。
5. Context 工程有可量化文档：
   - 公开上下文开销与峰值 token（证据：`/Users/kuang/xiaobu/Trellis/docs/context-overhead.md:9`, `/Users/kuang/xiaobu/Trellis/docs/context-overhead.md:124`）。

### Step 2：spec-first 当前实现基线

1. spec-first 是“流程引擎 + skill runtime + host bootstrap”架构：
   - CLI 命令面广，覆盖流程、质量、追踪、AI、宿主集成（证据：`/Users/kuang/xiaobu/spec-first/src/cli/index.ts:27`）。
2. Feature 初始化具备并发锁与幂等回滚：
   - FEAT 注册表锁与 stale lock 回收（证据：`/Users/kuang/xiaobu/spec-first/src/core/process-engine/init.ts:93`, `/Users/kuang/xiaobu/spec-first/src/core/process-engine/init.ts:198`）。
   - 临时目录写入后原子 rename 提交（证据：`/Users/kuang/xiaobu/spec-first/src/core/process-engine/init.ts:364`, `/Users/kuang/xiaobu/spec-first/src/core/process-engine/init.ts:459`）。
3. skill runtime 有硬门禁与阶段机：
   - P0-P5 phase 机 + 3-strike（证据：`/Users/kuang/xiaobu/spec-first/src/core/skill-runtime/phase-machine.ts:27`, `/Users/kuang/xiaobu/spec-first/src/core/skill-runtime/phase-machine.ts:85`）。
   - code/design/orchestrate 的 HARD-GATE（证据：`/Users/kuang/xiaobu/spec-first/src/core/skill-runtime/hard-gate.ts:6`, `/Users/kuang/xiaobu/spec-first/src/core/skill-runtime/hard-gate.ts:176`）。
4. Context Pack 已有预算与分层压缩：
   - control 区 2KB 硬限制 + slice（证据：`/Users/kuang/xiaobu/spec-first/src/core/ai-orchestrator/context-pack.ts:61`, `/Users/kuang/xiaobu/spec-first/src/core/ai-orchestrator/context-pack.ts:134`）。
5. update 偏“宿主刷新”，不含“项目模板迁移”：
   - 当前 update 主要刷新 skills/MCP/hooks/session hook（证据：`/Users/kuang/xiaobu/spec-first/src/cli/commands/update.ts:72`, `/Users/kuang/xiaobu/spec-first/src/cli/commands/update.ts:105`）。
   - 尚无 manifest 驱动的项目文件迁移、冲突分级、备份快照机制。

### Step 3：skills 侧观察

1. `spec-first:first` 已强调证据化输出和并发编排（证据：`/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/SKILL.md:36`, `/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/SKILL.md:135`）。
2. `spec-first:research` 已要求 2-action 落盘（证据：`/Users/kuang/xiaobu/spec-first/skills/spec-first/05-research/SKILL.md:14`）。
3. `spec-first:code` 已具备 Worktree First/3-strike 文本规则（证据：`/Users/kuang/xiaobu/spec-first/skills/spec-first/07-code/SKILL.md:71`, `/Users/kuang/xiaobu/spec-first/skills/spec-first/07-code/SKILL.md:91`）。
4. 结论：spec-first 在“流程约束语义”上更强，但在“模板升级工程化机制”上可向 Trellis 借鉴。

---

## 3. 可借鉴点总表（按优先级）

| 优先级 | 借鉴点 | Trellis 证据 | spec-first 现状 | 建议 |
|---|---|---|---|---|
| P0 | 模板哈希 + 变更分级更新 | `template-hash.ts` + `update.ts` 变更分类 | update 仅刷新宿主，不识别模板被用户改动 | 为 `.spec-first` 托管文件引入 hash registry + 变更分级 |
| P0 | manifest 驱动迁移 | `src/migrations/manifests/*.json`, `getMigrationsForVersion` | 无版本迁移编排层 | 增加 `src/migrations` 与 `spec-first update --migrate` |
| P0 | 更新前快照备份 | `createFullBackup()` | 无统一快照回滚点 | 更新前对受管目录做 timestamp 快照 |
| P1 | 平台注册表统一 | `AI_TOOLS` + `PLATFORM_FUNCTIONS` | host-path/skill-command/bootstrp 各自维护 | 建立 `host-registry.ts` 统一宿主能力声明 |
| P1 | CLI 适配层 | `cli_adapter.py` | 命令路径与平台逻辑分散 | 抽象 `HostAdapter`，集中路径/命令构造 |
| P1 | worktree 可执行化 | `worktree.yaml` + `multi_agent/*.py` | hard-gate 仅提醒/阻断 | 增加 `spec-first worktree` 命令与配置 |
| P2 | 上下文成本透明化 | `docs/context-overhead.md` | 有预算逻辑，无对外审计报告命令 | 增加 `ai context --report` 与 context-overhead 文档产物 |
| P2 | 任务上下文显式清单 | `implement/check/debug.jsonl` | TaskContextPack 来自矩阵推导 | 引入可选 `context/*.jsonl` 覆盖层，增强可审计性 |

---

## 4. 重点借鉴点详解（问题-方案-落地）

### 4.1 P0：把 update 从“刷新器”升级为“迁移引擎”

**问题**
- 当前 `spec-first update` 能刷新技能与 hooks，但对“历史版本项目资产升级”缺乏可审计/可回滚机制（证据：`/Users/kuang/xiaobu/spec-first/src/cli/commands/update.ts:58`）。

**借鉴方案**
1. 新增版本戳：`.spec-first/.version`。
2. 新增模板哈希：`.spec-first/.template-hashes.json`。
3. 新增 manifest 迁移层：
   - `src/migrations/manifests/<version>.json`
   - 迁移动作先做 classify，再执行（auto/confirm/conflict/skip）。
4. 更新前自动快照：
   - `.spec-first/.backup-<timestamp>/...`
5. CLI 参数对齐：
   - `spec-first update --migrate --dry-run --force --skip-all --create-new --allow-downgrade`

**落地入口（spec-first）**
- `src/cli/commands/update.ts`
- `src/shared/fs-utils.ts`（或新增 `src/core/update-engine/*`）
- `tests/unit/update*.test.ts` + integration test

**收益**
- 用户手改内容不被误覆盖。
- 升级失败可回滚。
- 版本迁移行为可审计。

---

### 4.2 P0：模板变更分级（auto-update vs user-modified）

**问题**
- 目前更新过程无法判断文件差异是“模板升级”还是“用户定制”，容易造成保守策略过重或误覆盖。

**借鉴方案**
- 复制 Trellis 的三态判定模型：
  - 当前内容 == 新模板：`unchanged`
  - 当前 hash == 历史 hash 且内容 != 新模板：`auto-update`
  - 当前 hash != 历史 hash：`user-modified`（需要冲突决策）

**关键证据**
- Trellis `analyzeChanges` 判定逻辑（证据：`/Users/kuang/xiaobu/Trellis/src/commands/update.ts:296`, `/Users/kuang/xiaobu/Trellis/src/commands/update.ts:306`）。

**落地入口（spec-first）**
- 以 `src/shared/skill-commands.ts`、`src/core/tool-integration/*.ts` 产生的托管输出为首批受管对象。

---

### 4.3 P1：统一宿主平台注册表（减少多处分叉）

**问题**
- spec-first 的宿主能力散落在 `host-paths`、`skill-commands`、`host-bootstrap`、`session-hook`，改一个平台要多点修改。

**借鉴方案**
- 建立单一 `HostRegistry`：
  - 平台基础元数据（配置路径、命令目录、skills目录、是否支持hooks、命令文件格式）
  - 平台行为接口（registerCommands/installHooks/registerSessionStart）
  - 从注册表派生 “受管路径集合”、“支持能力矩阵”

**关键证据**
- Trellis 的 `AI_TOOLS` + `PLATFORM_FUNCTIONS` + 派生 helper（证据：`/Users/kuang/xiaobu/Trellis/src/types/ai-tools.ts:80`, `/Users/kuang/xiaobu/Trellis/src/configurators/index.ts:186`）。

**落地入口（spec-first）**
- 新增 `src/shared/host-registry.ts`
- 重构调用方：
  - `src/shared/skill-commands.ts`
  - `src/shared/host-bootstrap.ts`
  - `src/core/tool-integration/session-hook.ts`
  - `src/core/tool-integration/ai-runtime-hook.ts`

---

### 4.4 P1：worktree 从“规则”升级为“工具”

**问题**
- spec-first 已有 Worktree First 守卫（高风险时阻断），但尚无一键创建/清理/状态命令，使用门槛高（证据：`/Users/kuang/xiaobu/spec-first/src/core/skill-runtime/hard-gate.ts:267`）。

**借鉴方案**
- 新增 `.spec-first/worktree.yaml`（默认模板）。
- 新增 `spec-first worktree` 命令组：
  - `create <featureId|taskId>`
  - `status`
  - `cleanup`
- 与 `orchestrate/code` 的 hard-gate 联动：
  - 检测高风险后给出直接可执行命令。

**关键证据**
- Trellis `worktree.yaml` + multi-agent 脚本链路（证据：`/Users/kuang/xiaobu/Trellis/.trellis/worktree.yaml:11`, `/Users/kuang/xiaobu/Trellis/.trellis/scripts/multi_agent/plan.py:121`）。

---

### 4.5 P2：上下文成本报告化（不是只有预算逻辑）

**问题**
- spec-first 有 context budget 机制，但缺少“项目级可读报告”来校准不同技能/阶段开销。

**借鉴方案**
- 在 `spec-first ai context` 增加 `--report`：
  - 输出阶段总 token、control 比例、明细贡献源、裁剪级别。
- 产物沉淀到 `specs/{featureId}/reports/context-overhead.md`。

**关键证据**
- Trellis 的 context overhead 文档实践（证据：`/Users/kuang/xiaobu/Trellis/docs/context-overhead.md:7`）。
- spec-first 已具备原始预算数据（证据：`/Users/kuang/xiaobu/spec-first/src/core/ai-orchestrator/context-pack.ts:146`）。

---

## 5. 对 skill 体系的具体影响

### 5.1 `spec-first:first`

- 增加“升级兼容性评估”子产物：
  - 输出项目受管文件清单、潜在冲突文件、迁移风险等级。
- 新增可选产物：
  - `docs/first/update-readiness.md`
  - `docs/first/context-overhead.md`（调用 context report）

### 5.2 `spec-first:research`

- 强化 `findings.md` 模板字段，固定输出：
  - 当前结论 / 证据路径 / 下一步 / 风险级别
- 与迁移引擎对接：支持 “迁移方案比较”固定模板。

### 5.3 `spec-first:code` 与 `spec-first:orchestrate`

- 当 hard-gate 命中高风险：
  - 优先建议并可直接调用 `spec-first worktree create ...`
- 将 `WORKTREE-CONFIRMED` 从“手工注释协议”升级为“命令写入+状态可查”。

### 5.4 `spec-first:doctor` / `spec-first:update`

- 新增检查项：
  - `.spec-first/.version` 与 CLI 版本关系
  - 待执行迁移项数、冲突项数
  - 最近一次 backup 状态

---

## 6. 分阶段实施计划（质量优先）

## Phase A（P0，先做）

1. 新增更新引擎骨架（不改行为）：
   - `src/core/update-engine/{hash.ts,migrations.ts,backup.ts,diff.ts}`
2. 引入 `.spec-first/.version` 与 `.template-hashes.json` 初始化写入。
3. 为当前 update 添加 dry-run 可观察输出（包含“将分类到哪一类”）。

**验收标准**
- 旧命令行为不回归。
- 单元测试覆盖 hash/load/save 与 diff 分类。

## Phase B（P0，核心）

1. 引入 manifest 迁移（rename/delete/rename-dir）。
2. 加入 `--migrate`、`--force`、`--skip-all`、`--create-new`。
3. 更新前快照备份 + 回滚演练测试。

**验收标准**
- 能从至少 2 个历史版本模拟升级。
- 用户修改文件不会被无提示覆盖。
- 升级失败可恢复。

## Phase C（P1）

1. 抽象 HostRegistry，替换分散的宿主判断分支。
2. 将 skill-commands、host-bootstrap、session-hook 接到统一注册表。
3. 增加平台能力快照测试（类似 Trellis registry-invariants）。

**验收标准**
- 新增一个宿主只改“注册表 + 适配实现”，不改 N 处 if/else。

## Phase D（P1/P2）

1. 实装 `spec-first worktree` 命令组 + `.spec-first/worktree.yaml`。
2. `ai context --report` 输出 context-overhead 报告。
3. skill 文档同步升级（first/research/code/orchestrate/doctor）。

**验收标准**
- 高风险任务可一键进入隔离工作区。
- context 开销可量化审计并纳入流程文档。

---

## 7. 不建议直接照搬的点

1. 不建议把 spec-first 核心流程迁移到 Python 脚本层：
   - 现有 TypeScript 核心已形成完整测试与模块边界，应保持语言一致性。
2. 不建议照搬 Trellis 的任务模型：
   - Trellis 是 task/workspace 为中心；spec-first 是 stage/traceability 为中心，模型不同。
3. 不建议将所有宿主都做重度 hook 注入：
   - 对不支持 hooks 的宿主，保持软降级和显式命令入口更稳妥。

---

## 8. 最终结论

- **最值得立即借鉴（P0）**：`更新安全性工程化`（hash + migration manifest + backup + conflict policy）。
- **中期收益最大（P1）**：`宿主注册表统一` + `worktree 可执行化`。
- **长期体验增强（P2）**：`上下文成本报告化` + `skills 的迁移/风险模板化`。

Spec-first 已在流程治理和硬门禁上领先；借鉴 Trellis 的重点不应是“复制流程”，而应是补齐“升级/迁移/运维”这条工程质量链路。

---

## 附录 A：关键证据索引

- Trellis CLI/更新：
  - `/Users/kuang/xiaobu/Trellis/src/cli/index.ts`
  - `/Users/kuang/xiaobu/Trellis/src/commands/update.ts`
  - `/Users/kuang/xiaobu/Trellis/src/utils/template-hash.ts`
  - `/Users/kuang/xiaobu/Trellis/src/migrations/index.ts`
  - `/Users/kuang/xiaobu/Trellis/src/migrations/manifests/*.json`
- Trellis 多平台/运行时：
  - `/Users/kuang/xiaobu/Trellis/src/types/ai-tools.ts`
  - `/Users/kuang/xiaobu/Trellis/src/configurators/index.ts`
  - `/Users/kuang/xiaobu/Trellis/.trellis/scripts/common/cli_adapter.py`
  - `/Users/kuang/xiaobu/Trellis/.trellis/scripts/common/git_context.py`
  - `/Users/kuang/xiaobu/Trellis/.trellis/worktree.yaml`
  - `/Users/kuang/xiaobu/Trellis/docs/context-overhead.md`
- spec-first 对照点：
  - `/Users/kuang/xiaobu/spec-first/src/cli/commands/update.ts`
  - `/Users/kuang/xiaobu/spec-first/src/shared/skill-commands.ts`
  - `/Users/kuang/xiaobu/spec-first/src/shared/host-bootstrap.ts`
  - `/Users/kuang/xiaobu/spec-first/src/core/skill-runtime/hard-gate.ts`
  - `/Users/kuang/xiaobu/spec-first/src/core/ai-orchestrator/context-pack.ts`
  - `/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/SKILL.md`
  - `/Users/kuang/xiaobu/spec-first/skills/spec-first/05-research/SKILL.md`
  - `/Users/kuang/xiaobu/spec-first/skills/spec-first/07-code/SKILL.md`
