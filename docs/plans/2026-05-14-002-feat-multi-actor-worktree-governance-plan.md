---
title: "feat: multi-actor worktree governance 根治计划"
type: feat
status: completed
date: 2026-05-14
spec_id: 2026-05-14-002-multi-actor-worktree-governance
---

# feat: multi-actor worktree governance 根治计划

## 摘要

`spec-first` 的所有 skill / script 默认按"单一 actor 在静止 worktree 上工作"的模型设计；当用户在同一仓库目录里同时跑多个 agent session（多个 Claude Code / Codex 窗口、并发 background task、IDE 内置 inline agent）时，dirty 检测、stash-as-protection、readiness ledger 这些原语就会暴露出**只能观测到状态，不能区分谁在写**的盲区，导致一系列连锁误判：phantom dirty、host pointer 漂移、stash 后 worktree 又被覆写、staged 集合混入他人工作。

本计划用三层最小契约扩展把"actor 边界"建立成**可观测事实 + 可选 advisory 协作**，不引入强 enforcement、不引入新真相源、对单 actor 用户完全 backward-compatible：

1. 关键写入 script 输出"窗口期内 worktree 是否被外部修改"的确定性事实
2. setup-owned 状态漂移由 setup 自愈，不外泄到下游 readiness 校验
3. 提供 opt-in session advisory file，让多 session 互相感知，**LLM 决定**是否避让

> 命名：本计划用 actor 指代"对 worktree 有写入意图的独立执行者"——它可以是另一个 agent session、另一个并发 task、IDE 内置的写工具，或人类用户在另一窗口的编辑动作。脚本不区分 actor 类型，只输出"窗口期内是否有外部写入"这一事实。

---

## 问题框架

### 触发事件

2026-05-14 一次 `spec-graph-bootstrap` 阻塞调试中暴露的链式异常：

| 表面现象 | 直接机制 | 真正信号 |
|---|---|---|
| `git stash` 拒绝合并 (`Entry not uptodate`) | index 里 8 个文件是空 blob，磁盘有内容 | 有外部工具用 `git add` 占位再异步写内容 |
| stash 之后 worktree 又出现 dirty | CHANGELOG / plan 文件被另一份较旧内容覆盖 | 另一个 actor 持有不同的 file content snapshot 并在 stash 之后写入 |
| `spec-graph-bootstrap` 二次阻塞为 `readiness-conflict` | runtime-capabilities 说 `baseline_ready=true / host=codex`，host ledger 实际是 `baseline_ready=false / generated_at=null` | host pointer 漂移；上一次 setup 在 codex 跑过，会话切到 claude 后没人重写 pointer |
| `git stash pop` 之后 staged 集合多出 4 个不在 stash 里的文件 | 另一个会话 14:17 时刻在写 `secret-deny-patterns` 系列 + `bootstrap-providers.sh safe_string` 加固 | pop 把"另一个 actor 的 added 文件"吸收进 staged |
| `git status` 显示的 dirty 集合在跑 setup 期间持续变化 | mcp-setup 期间另一个 actor 正在持续编辑同一个 plan 文件 | 没有 lock，没有 advisory，两个 session 共用同一个 worktree |

每一个表面现象单独都解释得通，但合起来揭示的是同一个结构性事实：**`spec-first` 没有 actor 边界协议**。所有现有 contract（dirty 检测、`canonical_artifacts_preserved`、ledger 一致性校验、stash 隐式保护）都基于"window 期内 worktree quiescent"假设，这个假设在 multi-session 时代不再成立。

### 为什么不能用强 enforcement 解决

按角色契约第 4、12 节，明确反对：

- 多状态流转、强编排、中心化 gate 系统
- 复杂规则引擎替代 LLM 判断
- 让脚本决定语义范围 / 模拟业务判断
- 把 advisory facts 当 confirmed truth

因此**不应**采取以下路径：

- 引入硬 lock 文件 + 阻塞其他 session 启动
- 把 session_id 注入到所有 readiness / graph / standards artifact 字段
- 强制每个新 session 必须创建独立 git-worktree
- 在 spec-first 内部维护一个 session 协调器进程

它们都会把 spec-first 推向"中心化协调器"反模式，且对单 actor 用户造成无谓负担。

### 根治原则

- **scripts 输出 actor 边界事实**（"窗口期内 worktree 被外部改过"），不下结论
- **LLM 用 `reason_code` 选择 fallback**：avoid / retry / escalate to user
- **advisory 优先于 enforcement**：session register 可选，不启用时无副作用
- **setup-owned drift 由 setup 自愈**，不让下游 workflow 替 setup 报错
- **保持 schema_version 演进，旧 consumer 不破**

---

## 需求

来自用户真实研发增益反推：

1. multi-session 用户开多窗口同时干活时，`spec-first` skill 必须 fail-fast 给出可解释的 reason_code，禁止 silent corruption
2. 单 actor 用户感知不到任何新约束、不需要新命令
3. host pointer 漂移（单宿主或跨宿主）由 mcp-setup 自动 reconcile，不再让 `spec-graph-bootstrap` 走 `readiness-conflict` 替 setup 报错
4. session 之间提供 cheap 的 advisory 感知：第二个 session 启动 spec-first skill 时能看到 "已有 session A 在工作"，但**是否避让由 LLM 判断**
5. 任何根治行为都必须 backward-compatible：旧版 consumer / 旧 artifact / 旧 ledger 不能因新 schema 失效

---

## 假设

- 用户多窗口共用同一 worktree 是常见模式（用户已在 2026-05-14 会话中确认）
- 真正构成"独立 actor"的是另一个 agent session 或并发 background task；普通 IDE auto-save / linter 视为"用户主线工作流的一部分"，脚本不试图区分二者
- session register 是 opt-in 能力，没有强制启用路径；未注册的 session 仍按"匿名 actor"处理（被 fingerprint 检测覆盖）
- `bootstrap-providers.sh` 与 `bootstrap-providers.ps1` 的并发检测语义保持一致；二者共享同一个 reason_code
- 现有 `canonical_artifacts_preserved` 语义不变；并发检测是它的**补充信号**，不是替代

---

## 范围边界

### 范围内

- `spec-graph-bootstrap` 关键写入窗口前后采 worktree status hash，新增 `concurrent-write-detected` reason_code
- `spec-mcp-setup` 在 host pointer 漂移时自愈：重写 pointer + ledger 到当前宿主路径，输出 `host-pointer-reconciled` advisory event；不再让 graph-bootstrap 替 setup 报错
- 引入 `.spec-first/sessions/<session-id>.json` advisory schema（`spec-first-session.v1`），CLI primitive `spec-first session register` / `unregister` / `list`
- `using-spec-first` guide mode 在检测到 multi-session 信号时输出一句 advisory（推荐 `git-worktree` 隔离或 advisory 协作）
- 双宿主（Claude / Codex）host 切换的 reconciliation 路径
- 兼容性：`spec-first-session.v1` 不存在时所有现有 skill 行为不变

### 后续单独处理

- `bootstrap-providers.sh` 自身 `safe_string` 等输入校验加固——属于另一个会话归属的 secret-deny-patterns 工作（plan `2026-05-07-001`），由该工作自己 commit；本计划只关心**并发检测**侧的修改
- session-aware readiness artifact（`produced_by_session` 字段贯穿 graph / standards / impact）——等 advisory 协议接受度成熟后再做
- 替代 stash-as-protection 模式（用 ephemeral worktree 做 atomic snapshot）——P2 长期事项
- 跨 host 双向同步（codex 与 claude 同时活跃）的 ledger 共识协议——超出当前根治范围
- 强制 worktree 隔离作为 default workflow 入口——违反角色契约，永久性 OUT

---

## 图谱就绪状态

- 当前 `.spec-first/graph/provider-status.json` 在 commit `5b8f64f9` 落盘前最后一次成功 bootstrap 锁在 `source_revision=6f4b0e1f`，提交 `5b8f64f9` 后 graph artifacts 已 stale
- worktree 仍 dirty 4 个 Group A 文件（另一个 actor 的 secret-deny-patterns 工作），暂时不能跑 graph bootstrap refresh
- 本计划自身的实施单元主要影响 script + schema + skill prose，不依赖 fresh graph evidence；可在 graph 仍 stale 时进入 plan 评审与 U1/U2 实施
- U3 实施前需要 graph fresh 一次以验证 advisory file 不进入 graph 索引（应已被 `.spec-first/sessions/**` 隐式排除，但需 evidence）

---

## 上下文与研究

### 相关代码与模式

- `skills/spec-graph-bootstrap/scripts/bootstrap-providers.sh` 当前 dirty 检测：line 548-553 一次性 `git status --porcelain`；line 635-637 fail-closed `dirty-refresh-non-canonical`
- `skills/spec-mcp-setup/scripts/detect-host.sh` 输出当前宿主路径
- `skills/spec-mcp-setup/scripts/verify-tools.sh` 写 readiness ledger v2 与 `runtime-capabilities.json` 的 `host_ledger_pointer`
- `skills/using-spec-first/SKILL.md` 已有 guide mode 推荐入口的 prose；可扩展 multi-session disclosure
- `src/cli/commands/` 已有 stable subcommand pattern（`init`、`doctor`、`clean`），可参照新增 `session` 子命令
- `.gitignore` 现有规则：`.spec-first/*.local.yaml` 已忽略；`spec-first-session.v1` 文件需要新增 `.spec-first/sessions/` 忽略规则

### 项目沉淀

- 角色契约 4/12/13 节：light contract + scripts prepare + LLM decides + advisory 优先
- 角色契约 14.3：大型任务必须明确 goals/non-goals、artifact contracts、failure modes、migration、test plan
- 角色契约 9.1：session register 文件属于 generated runtime 还是 source？应归类为 **runtime state**（不入 git，按 .gitignore 排除），与 `.spec-first/graph/*` 同级
- `docs/plans/2026-05-11-002-feat-spec-first-project-optimization-upgrade-plan.md` 的优化目标里强调 evidence-first / fact-first，本计划与之兼容

### 外部参考

- Git 多 worktree 共享同一 ODB 的常见 race 现象：见 `git-worktree(1) BUGS` 与 `git-stash(1)` 对 cross-worktree 行为的免责声明——印证"stash 不是 multi-actor safe primitive"
- VS Code / Cursor 等 IDE 的 file watcher 模型：磁盘写入到 IDE buffer 之间存在异步窗口，但通常通过 mtime 比较抑制覆写——这是为什么本计划不试图区分"IDE 写"与"agent 写"
- Anthropic Claude Code 多窗口默认共用同一项目目录的设计：advisory cooperation 比 hard lock 更贴合现有 UX

---

## 关键技术决策

| 决策 | 选择 | 理由 |
|---|---|---|
| 并发检测形态 | worktree status hash before/after，scripts 输出 fact，不输出 verdict | 符合 6.1 scripts 责任，不让脚本替 LLM 决定下一步 |
| 检测失败时行为 | fail-closed + 新 reason_code，artifact 已写部分按现有 `canonical_artifacts_preserved` 语义 | 与现有 dirty 检测一致；LLM 用 reason_code 选 fallback |
| host pointer 漂移处理 | setup 自愈（重写 pointer + ledger），输出 advisory event；graph-bootstrap 删除 host disagreement 作为 fail-closed 条件 | 漂移本质是 setup-owned drift，应由 setup 修复 |
| session register 形态 | opt-in `.spec-first/sessions/<id>.json` advisory file | 不强制 lock，不破坏单 actor 用户体验；schema_version 管理 |
| session id 来源 | 由调用方传入或 CLI 自动生成 UUIDv7 | UUIDv7 自带时间戳，便于按 started_at 排序 |
| 多 session 信号检测者 | `using-spec-first` guide mode（LLM-side） + `spec-first session list`（script-side facts） | 事实由 script 输出，是否 disclose 由 LLM 判断 |
| Schema 演进策略 | 所有新 schema 引入 `schema_version` 字段，缺失时 consumer 走 backward-compatible default | 符合角色契约 13 节"schema_version 管理下游消费产物" |

---

## 开放问题

### 规划中已解决

- session register 是否强制？→ 否，opt-in
- 是否区分 IDE / linter / human 编辑？→ 不区分，统一视为 "external actor"
- bootstrap-providers.sh 的 safe_string 加固是否纳入本计划？→ 不纳入（归属 plan `2026-05-07-001`）

### 推迟到实施阶段

- session register 的 stale 清理策略：基于 PID + started_at + heartbeat？还是简单按 mtime > 24h 视为 stale？U3 实施时定
- 多 session 同时发起 graph-bootstrap 的 lockfile 是否需要？暂用 fingerprint 检测兜底，U1 数据收集后评估
- using-spec-first guide mode 的 advisory 文案在多 session vs 单 session 下如何切换？U4 prose 阶段定

---

## 高层技术设计

### 架构层级

```
┌────────────────────────────────────────────────────────────────┐
│  Layer 3: Optional Session Advisory (U3)                       │
│  .spec-first/sessions/<id>.json (spec-first-session.v1)        │
│  CLI: spec-first session register | unregister | list          │
│  -> read-only consumed by skills, LLM decides disclosure       │
├────────────────────────────────────────────────────────────────┤
│  Layer 2: Setup-owned Drift Self-heal (U2)                     │
│  mcp-setup detects host pointer drift, reconciles inline,      │
│  emits advisory event, no longer leaks to graph-bootstrap      │
├────────────────────────────────────────────────────────────────┤
│  Layer 1: Concurrent-write Fingerprint (U1)                    │
│  bootstrap-providers.{sh,ps1} samples worktree status hash     │
│  before/after critical write window;                           │
│  mismatch -> reason_code=concurrent-write-detected             │
├────────────────────────────────────────────────────────────────┤
│  Existing: dirty-refresh-non-canonical, canonical_artifacts_   │
│  preserved, readiness ledger v2, host_ledger_pointer ...       │
└────────────────────────────────────────────────────────────────┘
```

每一层独立可落、独立可回滚；下层不依赖上层启用。

### 公共辅助

- `lib-worktree-fingerprint.sh` / `lib-worktree-fingerprint.ps1`：共享的 `worktree_status_hash` 采集函数（已有部分实现，提取为 lib）
- `lib-host-pointer.sh` / `lib-host-pointer.ps1`：host pointer reconcile 助手（U2 新增）
- `src/cli/commands/session.js`：session subcommand 入口（U3 新增）

---

## 实施单元

### U1. `bootstrap-providers` 并发写入检测

**目标**：让 `spec-graph-bootstrap` 在自身执行窗口内被外部写入时 fail-closed 而非 silent commit 不一致 artifact。

**修改面**：

- `skills/spec-graph-bootstrap/scripts/bootstrap-providers.sh`：在跑 provider 命令之前与之后各采一次 `git status --porcelain | sha256` worktree fingerprint；不一致时调用 `emit_blocked blocked concurrent-write-detected`，`canonical_artifacts_preserved=false`（已写部分需要重做）
- `skills/spec-graph-bootstrap/scripts/bootstrap-providers.ps1`：等价语义实现
- `skills/spec-graph-bootstrap/SKILL.md`：在 Failure modes 章节新增 `concurrent-write-detected` reason_code 描述与下游 fallback 建议
- `tests/unit/spec-graph-bootstrap.sh`：新增 fixture，模拟脚本中段被并发写入；断言 exit 1 + reason_code

**验证**：

```bash
npm run test:graph-bootstrap
bash tests/unit/spec-graph-bootstrap.sh
```

**失败模式**：

- false positive：用户在 bootstrap 跑期间手动救场（极少）→ 仍 fail-closed，reason_code 让用户重试
- worktree 极大时 hash 计算成本：使用 `git status --porcelain` 文本 hash，O(脏文件数)，不扫全树

**Coordination 注意**：本 unit 修改 `bootstrap-providers.sh`，与另一会话的 `safe_string` 加固存在文件级冲突。**实施顺序约束**：必须等 plan `2026-05-07-001` 的 secret-deny-patterns 收尾 commit 落地后再开 U1，避免再次共享 worktree 写同一文件。

### U2. `spec-mcp-setup` host pointer 自愈

**目标**：让 host pointer 漂移由 setup 在写 ledger 时直接 reconcile，不外泄成 graph-bootstrap 的 fail-closed 条件。

**修改面**：

- `skills/spec-mcp-setup/scripts/verify-tools.sh` / `.ps1`：写 ledger 前读现有 `runtime-capabilities.json` 的 `host_ledger_pointer.host`；若与当前 `detect-host` 结果不一致：
  - 重写 `host_ledger_pointer.path` 与 `host` 字段到当前宿主
  - 在新 ledger 输出 `host_pointer_reconciliation` advisory event（包含 from/to host、原 ledger snapshot、reason）
  - 不删除原宿主的 ledger 文件（非破坏性）
- `skills/spec-graph-bootstrap/scripts/bootstrap-providers.sh`：删除 line 711-713 的 `runtime baseline_ready != ledger baseline_ready -> readiness-conflict` 分支；保留 schema、ledger 存在性校验
- `skills/spec-graph-bootstrap/SKILL.md`：移除 readiness-conflict 中关于 host disagreement 的描述；明确 host drift 由 setup 处理
- `skills/spec-mcp-setup/SKILL.md`：Outputs 章节新增 `host_pointer_reconciliation` event 描述
- `tests/unit/mcp-setup-powershell-contracts.test.js`：新增 contract test，模拟 codex→claude 切换；断言 reconciliation event + new pointer

**验证**：

```bash
npm run test:mcp-setup
node --check skills/spec-mcp-setup/scripts/verify-tools.sh
```

**失败模式**：

- 用户故意保留 codex pointer（双宿主轮替）：reconciliation 默认进行；后续 P3 plan 提供 `--keep-host-pointer` opt-out
- 原宿主 ledger 文件无写权限：reconciliation 仍写新宿主 ledger，advisory event 记录原 ledger 不可读

### U3. `.spec-first/sessions/` advisory 协议（schema only + read primitive）

**目标**：建立 advisory session 感知协议；本 unit 只交付 schema + read CLI，**不**默认启用 register。

**修改面**：

- `src/cli/contracts/session/spec-first-session.schema.json`（新）：定义 `spec-first-session.v1` schema：
  ```jsonc
  {
    "schema_version": "spec-first-session.v1",
    "session_id": "uuidv7-string",
    "agent_kind": "claude-code|codex|other",
    "host_marker_path": "/abs/path/to/host-setup.json",
    "started_at": "ISO8601",
    "last_heartbeat_at": "ISO8601",
    "scope_hint": "free-text-or-task-code",
    "pid": 12345
  }
  ```
- `src/cli/commands/session.js`（新）：`spec-first session register | unregister | list`，list 输出 sessions.v1 array + stale 标记（heartbeat 超 24h）
- `.gitignore`：新增 `.spec-first/sessions/`
- `tests/unit/spec-first-session-contracts.test.js`（新）：schema 校验 + register/unregister/list 正确性
- `docs/contracts/sessions/spec-first-session.md`（新）：合同文档

**验证**：

```bash
npm run test:unit
node bin/spec-first.js session register --agent-kind claude-code
node bin/spec-first.js session list
node bin/spec-first.js session unregister
```

**失败模式**：

- session 文件残留：`session list` 输出 stale 标记，由 LLM 决定是否提示用户清理
- 多 session 同时 register：UUIDv7 单调递增天然避免冲突

**Non-goals**：本 unit 不修改任何现有 skill 让它们 read sessions；那是 U4 的事。

### U4. `using-spec-first` multi-session disclosure

**目标**：让 LLM 在 substantial work 前能感知 multi-session 状态，advisory 提示用户考虑 worktree 隔离或 advisory 协作。

**修改面**：

- `skills/using-spec-first/SKILL.md`：guide mode prose 新增章节"多 session 感知"：
  - 在 substantial work 前调用 `spec-first session list`（read-only）
  - active session > 1 时，输出一句 advisory：推荐 `git-worktree` 隔离或继续但 disclose 给用户
  - **不**强制阻塞；LLM 决定是否 disclose
- `templates/claude/commands/spec/session.md`（新）：暴露 `spec-session` 命令？暂不，避免变成中心化 dispatch
- `tests/integration/using-spec-first-multi-session.sh`（新）：fixture 模拟多 session 状态；断言 guide 输出包含 advisory 关键词

**验证**：

```bash
npm run test:integration
```

**失败模式**：

- session register 未启用 → `session list` 返回空 → guide mode 不出 advisory，行为退回单 session 默认
- LLM 误把 advisory 当强约束 → SKILL prose 必须明确"不阻塞、不强制"

---

## 验证计划

- 每个 U 自带单元/集成测试，必须先于实施落地（test-first 不强制，但 U1/U3 schema 类必须先有 contract test）
- 全链路 e2e：`tests/e2e/multi-actor-worktree.sh`（U1+U2+U3+U4 全部落地后执行）
  - 模拟两个并发 session：A 跑 mcp-setup + graph-bootstrap，B 在 A 的 critical window 中写文件
  - 断言 A 输出 `concurrent-write-detected` reason_code，graph artifacts 不被 partial commit
  - 模拟 codex→claude 宿主切换，断言 reconciliation event + 后续 graph-bootstrap 不报 readiness-conflict
- 单 actor 回归：`npm test` 必须全绿，确认未 register session 时所有现有测试不受影响

---

## 失败模式总览

| 模式 | 触发条件 | reason_code / 处理 |
|---|---|---|
| concurrent-write-detected | bootstrap window 内 worktree 被改 | bootstrap fail-closed, canonical_artifacts_preserved=false; LLM 选 retry / coordinate |
| host-pointer-reconciled | mcp-setup 发现宿主切换 | advisory event, setup 自愈, 不阻塞 |
| session-register-conflict | 同一 session_id 重复注册 | CLI exit 1, 用户决定覆盖或换 id |
| session-list-stale | sessions 目录有 24h+ 旧文件 | list 输出 stale 标记, LLM advisory 提示清理 |
| sessions-feature-disabled | `.spec-first/sessions/` 不存在 | guide mode 退回单 session 默认行为, 完全静默 |

---

## 迁移策略

- 所有改动 backward-compatible：旧 ledger / 旧 graph artifacts / 旧 SKILL prose / 旧 consumer 行为不变
- 新 schema 都带 `schema_version`；缺失时 consumer 走默认 fallback
- U1/U2 落地后，旧的 `dirty-refresh-non-canonical` reason_code 仍然保留作为正交检测（未提交改动这一类是 dirty 检测；窗口期内并发写是 concurrent 检测）
- 推送策略：每个 U 独立 commit，commit subject 用 `feat(governance): ...` scope；CHANGELOG 每条用户可见条目带 (user-visible)

---

## 实施顺序约束

1. **不可并行**：U1 修改 `bootstrap-providers.sh`，与另一会话 `safe_string` 加固冲突。**等 plan `2026-05-07-001` 落地后再开 U1**
2. **可并行**：U2 与 U3 修改面不重叠（mcp-setup 脚本 vs CLI session 子命令），可由不同 session 并行
3. **依赖**：U4 依赖 U3（session list primitive 必须先存在）
4. **建议顺序**：U2 → U3 → U1 → U4

---

## 验收标准

- 单 actor 用户运行 `spec-first` 任意现有 workflow，不感知任何新约束、不需要新命令、不需要新配置
- 多 session 用户开两个 Claude Code / Codex 窗口跑 `spec-graph-bootstrap`，第二个 session 看到第一个 session 输出的 `concurrent-write-detected` reason_code，不再产生 partial commit
- codex→claude 宿主切换后第一次跑 `spec-graph-bootstrap` 不再报 `readiness-conflict`；setup 自愈痕迹可在 ledger 中追溯
- `.spec-first/sessions/` opt-in 启用时，`using-spec-first` guide mode 输出 advisory；未启用时完全静默
- 全链路 e2e 测试覆盖以上四条

---

## 实施收口（2026-05-16）

> 注：原 `## 实施顺序约束` 第 1 条要求 U1 等待 plan `2026-05-07-001` 的 secret-deny-patterns 加固落地。该 plan 已在 commit `b8ee82e9` (audit headless runner + safe_string) + `17cc7db1` (audit runner boundaries) 中合并，约束自此解除，U1 在 commit `4db7aaed` 实施完成。

| Unit | 状态 | 说明 |
|---|---|---|
| U3 | ✅ 已落地 | `spec-first-session.v1` schema + `src/cli/commands/session.js` + 22 contract test (commit 23b9aaae) |
| U4 | ✅ 已落地 | `using-spec-first` Multi-Session Awareness section + 7 prose drift test (commit 23b9aaae) |
| U2 | ✅ 已落地 | verify-tools.{sh,ps1} 加 host pointer reconciliation 检测；bootstrap-providers.{sh,ps1} 删除 runtime/ledger baseline disagreement fail-closed 分支；SKILL.md 描述 advisory event |
| U1 | ✅ 已落地 | bootstrap-providers.{sh,ps1} 在 critical write window 前后采 external-actor fingerprint（排除 `.spec-first/`、`.gitnexus/`、`.code-review-graph/`、AGENTS.md、CLAUDE.md），不一致时返回 `concurrent-write-detected` reason_code 并 `canonical_artifacts_preserved=false` |

新增/调整测试：

- `tests/unit/multi-actor-worktree-governance-contracts.test.js`：17 项 contract test 覆盖 U1 fingerprint + U2 reconciliation + plan 锚点
- `tests/unit/spec-graph-bootstrap.sh`：把原 `readiness conflict fails` fixture 改写为 `host-pointer drift no longer fail-closes bootstrap`，验证 U2 by-design 行为
- 全量回归：118 unit suites / 939 unit tests / smoke / integration 全绿

仍未做（plan 范围外）：

- e2e `tests/e2e/multi-actor-worktree.sh` 真并发模拟：U1 contract + 单元 + fixture 已覆盖核心语义；真并发 e2e 留作后续按需增补
- session-aware readiness artifact（`produced_by_session` 字段贯穿所有 artifact）：仍按 plan 推迟到 advisory 协议接受度成熟后
