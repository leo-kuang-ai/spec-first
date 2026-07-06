---
title: "fix: 在 24h cooldown 内短路版本检查网络调用"
type: fix
status: completed
date: 2026-06-21
spec_id: 2026-06-21-003-fix-version-check-cooldown-short-circuit
origin: docs/brainstorms/2026-04-29-001-startup-version-update-reminder-requirements.md
implements_schemas: []
---

# fix: 在 24h cooldown 内短路版本检查网络调用

## 摘要

会话启动时的版本检查当前只对展示做了节流（24h cooldown），但没有对网络成本做节流：因为 cooldown key 嵌入了 `latestVersion`，代码必须先执行网络 fetch，才能判断 cooldown 是否命中。因此窗口内的每次会话仍会启动 `startup-reminder` 子进程并访问网络，最后只是丢弃结果。本方案新增一个与版本无关的 “last attempt” 时间戳，并在 `lookupLatestVersion` 之前同步检查和记录它，让每个 startup host 的网络 lookup 最多每 24h 运行一次；同时把同类节流扩展到 CLI `doctor`/`init`/`clean`/`update` 路径，这条路径目前完全没有 cooldown。超时根因和 env override 已经在先前 PRD `2026-06-01-001` 中落地，所以本方案只处理网络 lookup 前的 throttle placement；hook 级 no-spawn preflight、timeout/drift 项只是文档说明或后续工作，不改代码。

---

## 决策摘要

- **推荐方案：** 引入一个与版本无关的 “last attempt” 时间戳，与现有 cooldown state 一起持久化；当窗口仍有效时，在网络 lookup 前短路 `buildStartupVersionReminder`。Startup 使用 `startup.{claude,codex}` scope，CLI reminder 使用独立的 `cli.package` scope；两者复用同一 attempt-gate helper，但互不抑制。每个 scope 内的任何先前结果（已展示、已是最新、网络失败）都应触发短路。
- **关键决策：** (1) 以版本无关时间戳做 gate，而不是继续使用现有 `host|currentVersion|latestVersion` key，因为该 key 正是 placement 错位的根因。(2) attempt timestamp 必须在进入 `lookupLatestVersion` 前同步持久化，确保慢网、超时或网络失败也会短路后续检查。(3) Startup 与 CLI attempt record 分离，避免后台 startup/offline attempt 屏蔽用户显式运行的 `doctor` / `update` 检查。(4) 保留现有 display-cooldown 记录以兼容旧状态；attempt gate 是额外的更早 guard。
- **验证重点：** 单测必须证明窗口内不会调用网络 lookup（lookup spy 断言 not-called）、慢网/失败路径会在 lookup 前记录 attempt、startup 与 CLI scope 不互相抑制，并且现有 `version-reminder.sh` 套件在一处必要断言改写后继续通过。
- **最大风险 / 边界：** 现有一个测试（`tests/unit/version-reminder.sh` 中的 “newer latest version bypasses existing cooldown”）断言的是新行为的反面，必须修改。这是有意的行为变更，不是回归。本方案不改 hook template，因此不承诺 cooldown 内 no-spawn；如实现后续选择触碰 template，必须从 source 重新生成双宿主 runtime mirror，不能手改。

---

## 问题框定

`spec-first` runtime 会在 Claude/Codex 会话内被消费，因此陈旧 runtime 会在用户实际工作的位置悄悄降低 workflow 定义、治理规则和路由质量。startup version reminder（origin: `docs/brainstorms/2026-04-29-001-startup-version-update-reminder-requirements.md`）的产品意图，是向那些只调用 `spec-*` workflows、几乎不在终端运行 CLI 的用户提示 “有新的 spec-first 可用”。对这类用户来说，会话启动是唯一可靠的升级触点。这个产品意图是成立的，本方案保留它。

缺陷不在于是否需要 reminder，而在于 throttle 的实现位置。`buildStartupVersionReminder` 用 `host|currentVersion|latestVersion` 计算 cooldown key（`src/cli/version-reminder.js`，`buildStartupReminderKey`），所以它必须先知道 `latestVersion` 才能判断 cooldown；而知道 `latestVersion` 需要网络 fetch。结果是：按 `src/cli/version-reminder.js:117` fetch → `:131` cooldown check 的执行顺序确认，在 24h 窗口内，每次 session-start 仍会 spawn `startup-reminder` 并执行网络 lookup，然后把答案丢掉。session-start hook 注释（`templates/claude/hooks/session-start` 与 `templates/codex/hooks/session-start`，两者 `timeout: 1200`）也明确承认这一点：“on a dead/slow network it re-spawns every session”。本方案不把 hook 的 child-process spawn 移出路径，而是让已启动的 helper 在网络边界前快速退出；因此它保护的是网络 lookup 成本和慢网延迟，不声称完全消除 spawn 开销。

第二个较小实例：CLI reminder（`maybeShowVersionReminder`，在 `src/cli/index.js:37-41` 接入 `doctor`/`init`/`clean`/`update`）完全没有 cooldown，每次这些命令都会无条件访问网络。

这些判断已在计划阶段基于当前源码确认；本会话的 brainstorm 对话是本方案范围决策的来源。

---

## 需求

- R1. 在 active cooldown window 内，session-start 版本检查不得执行网络 lookup；短路必须发生在调用 `lookupLatestVersion` 之前。（推进 origin R6 “low-noise 24h”，但这里保护的是网络成本和慢网延迟，不承诺 hook 级 no-spawn）
- R2. 任意先前 attempt 结果都必须触发同 scope 短路，包括 update-shown、on-latest、network-failed；attempt timestamp 必须在进入 `lookupLatestVersion` 前同步持久化，以避免外层 1200ms hook timeout 在慢网下杀掉进程后无法记录失败 attempt。
- R3. CLI reminder 路径（`doctor`/`init`/`clean`/`update`）必须遵守独立的 package-level `cli.package` 24h attempt window，避免每次调用都访问网络；startup scope 与 CLI scope 互不抑制，所以一次后台 startup/offline attempt 不会屏蔽用户显式运行的 `doctor` / `update` 检查。
- R4. 必须保留所有 origin invariants：非阻塞（不抛错、不改变 exit code、失败静默，origin R2/R5）、只读（不 auto-install/refresh/restart，origin R3/R8）、host-correct entrypoint wording（`spec-update` vs `spec-update`，origin R7），以及 reminder body 中现有的只读边界句。
- R5. 必须有意记录 24h staleness trade-off：全新 release 最多可能延迟一个窗口才提示；一次临时离线也会让检查暂停一个窗口。（origin Key Decision “失败静默” + 本会话 “any outcome” 决策）
- R6. 现有 reset 行为（`clearStartupVersionReminderCooldown` / `startup-reminder --reset`）必须继续清除对应 host 的 startup throttle；成功的 `spec-first update` 必须清除 package-level `cli.package` throttle，使升级 remedy 后后续 CLI 检查不被旧 attempt 静默。

**Origin actors:** A1（workflow 用户）、A2（host startup surface）、A3（spec-update workflow）
**Origin flows:** F1（startup 发现新版本）、F2（检查失败 / 离线）
**Origin acceptance examples:** AE1/AE2（startup 展示 current+latest+entrypoint）、AE3（offline → 无错误，会话启动）、AE4（无自动 mutation）

---

## 范围边界

- 只改变 throttle *placement*。timeout 值、env override、semver 比较、reminder 文案结构、触发位置和只读边界都不变。
- 不新增 opt-out env var，也不新增 CI / non-TTY auto-skip。（已考虑并明确延后，见下文）
- 不改变哪些命令触发 reminder；`-v` / `--help` 继续和今天一样保持静默。
- 不改变 latest-version source split（Claude 使用 GitHub raw，Codex/general 使用 npm registry）。
- Drift detection 仍归 `doctor` / `init`；session-start hook 继续只验证 bootstrap-marker 的*存在性*。

### 延后到后续工作

- **Opt-out env var + CI/non-TTY auto-skip**（update-notifier / `gh` 惯例）：这是一个真实的卫生问题（CLI path 在 CI 中每次命令都会访问网络），但超出本次约定的最小范围。可作为单独 follow-up。
- **完全 async decouple**（网络完全离开 startup path，session-start 只读取 out-of-band 刷新的 cache）：承载成本更高（background refresh、cache-staleness semantics、双宿主协调）；P1 已捕获约 80% 收益。brainstorm 中已拒绝。
- **统一两条检查比较的对象**（CLI 比较已安装 `pkg.version`；startup 比较 runtime `manifestVersion`）：这是留给后续的 coherence 问题；本方案只共享 *throttle*，不统一比较语义。

---

## 完成标准

- `npm run test:unit` 通过，其中包括已修改的 `tests/unit/version-reminder.sh` 断言，反映新的 “within window → no network call” 行为。
- `docs/08-版本更新/README.md` 与 `CHANGELOG.md` 按 U4 更新，并经 changelog 格式/文档注记核验。
- 除测试通过外，不新增 `status` gating；这是行为修复，不是 contract/runtime-schema 变更。

---

## 直接证据准备度

- target_repo: spec-first（当前 repo）
- evidence_sources: direct source reads、`rg`、现有 unit/test inspection
- source_refs: `src/cli/version-reminder.js`, `src/cli/index.js`, `templates/claude/hooks/session-start`, `templates/codex/hooks/session-start`, `tests/unit/version-reminder.sh`, `docs/brainstorms/2026-04-29-001-...md`, `docs/brainstorms/2026-06-01-001-...md`
- current_revision: f458c81d
- worktree_status: dirty（无关的 mcp-setup + README 变更已在其他地方 staged；本方案不触碰它们）
- confidence: root cause 与 surface 为 high；exact persistence shape 为 medium（留给实现）
- limitations: P1 “窗口内仍会 fetch” 来自阅读执行顺序，不来自一次真实 offline session-start run，见 Risks。

---

## 直接证据

- repo_scope: `src/cli/version-reminder.js`（throttle logic）、`src/cli/index.js`（CLI wiring）、`templates/{claude,codex}/hooks/session-start`（spawn cap）、`tests/unit/version-reminder.sh`（cooldown tests）
- source_reads_completed: 本会话已完整或按相关范围读取上述内容
- source_reads_required: planning 阶段无未完成读取；implementation 会重新打开 `version-reminder.js` 的 state read/write helpers
- commands_or_tools_used: `rg`、`sed`、`git status`、direct Read
- impact_on_plan: 已确认 (a) cooldown key 嵌入 `latestVersion`，迫使 fetch-before-check；(b) CLI path 没有 cooldown；(c) 两个 hooks 共享相同 `timeout: 1200`；(d) timeout 默认值已是 2000ms 且有 env override（P2 只是 doc note）；(e) 一个现有测试断言了 P1 要移除的行为
- key_findings: 修复是在已有充分测试模块中改变网络 lookup placement，架构风险低，但需要明确 startup/CLI scope 分离、lookup 前同步记录 attempt，以及一个既有测试断言改写
- limitations: 未执行 live offline session-start measurement（延后到实现验证）

---

## 上下文与调研

### 相关代码与模式

- `src/cli/version-reminder.js` — `buildStartupVersionReminder`（fetch-then-cooldown 顺序）、`buildStartupReminderKey`（根因所在的 `host|currentVersion|latestVersion` key）、`isStartupReminderCooldownActive` / `recordStartupReminderCooldown` / `readStartupReminderState` / `writeStartupReminderState`（现有 startup JSON state 位于 `~/.{host}/spec-first/startup-version-reminder.json`）、`clearStartupVersionReminderCooldown`（startup reset）。
- `src/cli/index.js:37-41` — 无 cooldown 的 CLI reminder wiring；`runStartupReminder`（spawn entrypoint）。
- 要镜像的 state-persistence pattern：`writeStartupReminderState` 中现有的 atomic tmp-write+rename。
- `src/cli/developer.js` — `~/.spec-first/.developer` 提供 package-level home state 位置先例；CLI `cli.package` scope 可使用 `~/.spec-first/version-reminder.json`（测试中继续支持 `homeRoot` override）。
- `src/cli/helpers/global-config-dir.js` — host-aware global paths 的参考模式；现有 `getStartupReminderStatePath` 已建立可复用的 startup `~/.{host}/spec-first/` 位置。

### 组织内沉淀

- 计划阶段未找到专门关于 version-check throttling 的 `docs/solutions/` 条目；两份 prior brainstorm 是当前组织记录，本方案把它们作为 origin/context 承接。

### 外部参考

- 行业惯例（update-notifier、`gh`、brew、rustup）来自既有设计知识，未重新抓取：check ≠ display（在网络调用前 throttle，而不是调用后 throttle）；约 24h 窗口；opt-out + CI/non-TTY skip。本方案采纳 throttle-before-network 原则（R1），并延后 opt-out/CI hygiene。

---

## 关键技术决策

- **使用版本无关时间戳做 gate，而不是 display key。** 在网络 lookup 前读取 “last attempt at” 记录。理由：现有 key 不拿到网络结果就无法计算，这正是整个缺陷。
- **attempt 在 lookup 前同步记录。** 理由：hook 外层 timeout 是 1200ms，而 inner lookup 默认 timeout 是 2000ms；如果只在 lookup 返回或 throw 后记录，慢网/死网时子进程可能先被杀掉，无法满足 “network-failed also throttles”。
- **Startup 与 CLI scope 分离。** Startup 使用 `startup.claude` / `startup.codex`，CLI 使用 package-level `cli.package`。理由：普通 `doctor`/`init`/`clean`/`update` 没有 host selector；把它硬归到某个 host 会污染 reset 语义，而与 startup 共享 record 又会让后台 startup/offline attempt 屏蔽用户显式 CLI 检查。
- **任何结果都短路，包括失败。** 理由：只有这个变体能修复代码注释承认的 offline/slow-network 重复 lookup；成本（≤24h 滞后）对一个 cosmetic nudge 是可接受的，而且 remedy（运行 `spec-first update`）本来也发生在会话外。成功的 `spec-first update` 应清除 package-level CLI attempt gate，使升级后后续检查不被旧状态静默 24h。
- **保留现有 display-cooldown 记录。** 新 attempt gate 是*额外的更早* guard，不替代旧记录，最大限度减少对已验证 state schema 的扰动，并保留 reset path。
- **与 CLI path 共享 gate helper，不共享 attempt record。** 理由：用同一机制关闭第二条无 cooldown 路径，同时保持 passive startup 与 user-initiated CLI discovery 的产品边界。
- **P2/P3 是文档事项，不是代码事项。** 1200ms spawn cap 是有意的 latency guard，且高于已测约 630ms fetch；inner default 已是 2000ms。Drift 仍归 `doctor`/`init`。两者只记录为说明，不变更。

---

## 开放问题

### 计划阶段已解决

- 是否提高 1200ms hook timeout？不提高。它是有意的 startup-latency cap，健康网络能在该窗口内完成；只做文档说明。
- attempt timestamp 存在哪里？Startup 复用现有 `~/.{host}/spec-first/startup-version-reminder.json` state file 和 read/write helpers；CLI 使用 package-level `~/.spec-first/version-reminder.json`。两者都新增与版本无关的 attempt 字段，而不是复用 display key。
- failure 也短路，还是只对确定性结果短路？任意结果都短路（本会话用户决策）。
- startup 与 CLI 是否共享 attempt record？不共享；两者只共享 helper 语义，避免后台 startup 影响用户显式 CLI 检查。

### 延后到实现

- 现有 startup state object 与新增 CLI state object 中 attempt timestamp 的确切字段名和 JSON shape。
- 那个被修改测试断言的确切措辞。

---

## 实施单元

### U1. 为 startup reminder 新增版本无关 attempt gate

**目标：** 当该 host 的先前 startup attempt 落在 24h window 内时，让 `buildStartupVersionReminder` 完全跳过网络 lookup。

**需求：** R1, R2, R4, R5, R6

**依赖：** 无

**文件：**
- Modify: `src/cli/version-reminder.js`
- Test: `tests/unit/version-reminder.sh`

**做法：**
- 在调用 `lookupLatestVersion` 之前，从现有 startup-reminder state 读取 per-host startup attempt timestamp。如果它在 `nowMs` 的 `cooldownMs` 窗口内，立即返回 `null`（no fetch；仍允许 hook 已经启动的 helper 进程快速退出）。
- 对每次即将触达网络边界的 startup attempt，都在进入 `lookupLatestVersion` 前同步记录 attempt timestamp，确保 success、on-latest、failure、慢网和外层 timeout 情况都满足 “any outcome” 规则。现有 display-cooldown 记录保持原位，仍只在真正展示后写入。
- 保留 `clearStartupVersionReminderCooldown`，让 `startup-reminder --reset` 清除该 host 的 startup attempt gate 与 display cooldown。
- 不修改 reminder body、entrypoint wording 或 non-blocking/silent-failure 行为。

**遵循模式：**
- 现有 `readStartupReminderState` / `writeStartupReminderState` atomic write；现有 `isStartupReminderCooldownActive` time-window comparison。

**测试场景：**
- 覆盖 AE3。边界 case：一次网络 *failure* 或慢/不 resolve lookup 进入网络边界前已写入 attempt；仍在窗口内时，第二次调用不执行 lookup（lookup spy 断言未调用），并返回 no reminder。
- Happy path：第一次调用 stale runtime 时展示 reminder 并记录 attempt；窗口内紧接着第二次调用不执行 lookup。
- 边界 case：`nowMs` 前进超过窗口后，lookup 再次运行。
- 边界 case：`reset` 清除 attempt gate 后，下一次调用会执行 lookup。
- Integration：现有 startup-reminder 展示/格式断言（current+latest+entrypoint、read-only boundary sentence、不出现 `npm install -g` / `claude plugin update` / `spec-first init`）继续不变地通过。

**验证：**
- 窗口内不尝试网络 lookup（spy 断言 not-called）；窗口外 lookup 运行；lookup 前已同步写入 attempt；慢/不 resolve lookup 不会导致下一次重复进入网络边界；reset 重新启用 lookup。

### U2. 将现有 cooldown 测试更新为新的 within-window contract

**目标：** 替换编码旧行为的断言（“fetch always happens, newer latest bypasses cooldown”），改为编码新行为：“within window → no network call, any outcome”。

**需求：** R1, R2

**依赖：** U1

**文件：**
- Modify: `tests/unit/version-reminder.sh`

**做法：**
- 当前 block 断言 `"newer latest version bypasses existing cooldown" = true`（约 `tests/unit/version-reminder.sh:432`）。在新 contract 下，更新的 latest 不能再绕过窗口，因为 short-circuit 发生在知道 `latestVersion` 之前。把该断言改为：无论 hypothetically newer latest 是什么，窗口内都抑制调用；并为 within-window case 增加 spy-not-called 断言。
- 保留所有其他 cooldown 断言（first prints、same host/version suppressed across projects、reset clears）。

**执行说明：** U2 必须与 U1 同步更新。这是有意的 contract 变更，所以测试必须断言新行为，不能只是删掉断言让套件变绿。

**测试场景：**
- Happy path：第一次调用打印；第二次窗口内调用被抑制。
- 边界 case：窗口内即使 hypothetically newer latest，也不 fetch、不打印（被移除断言的反向行为）。
- 边界 case：reset 清除；下一次调用再次打印。

**验证：**
- `npm run test:unit` 在改写后的断言下通过；没有为了让套件变绿而单纯删除断言。

### U3. 将 attempt gate 扩展到 CLI reminder path

**目标：** 让 `doctor`/`init`/`clean`/`update` 遵守独立的 package-level `cli.package` 24h attempt window，避免每次调用都访问网络，同时不屏蔽 startup scope。

**需求：** R3, R4

**依赖：** U1

**文件：**
- Modify: `src/cli/version-reminder.js`
- Modify: `src/cli/index.js`
- Test: `tests/unit/version-reminder.sh`

**做法：**
- 将 U1 引入的同一个版本无关 attempt-gate helper 应用到 `maybeShowVersionReminder`（或其 `index.js:37-41` call site），但使用独立 `cli.package` throttle scope 和 `~/.spec-first/version-reminder.json` state。CLI scope 与 `startup.claude` / `startup.codex` 不共享 attempt record，所以 startup failure 不抑制后续显式 `doctor` / `update` 检查，CLI failure 也不抑制 session-start startup 检查。
- 在进入 CLI latest-version lookup 前同步记录 `cli.package` attempt timestamp；成功的 `spec-first update` 应清除 package-level CLI attempt gate，避免升级 remedy 后继续被旧 attempt 静默。
- 保持 `-v` / `--help` 当前行为（无 reminder）和 non-blocking contract。

**遵循模式：**
- U1 引入的 attempt-gate helper；现有 `index.js` command dispatch guard。

**测试场景：**
- Happy path：第一次 `doctor`-path reminder 会尝试 lookup；窗口内立即第二次 CLI attempt 不执行 lookup。
- 边界 case：窗口外，lookup 再次运行。
- Error path：后续窗口中的 lookup failure 仍会抑制重复 attempt（any-outcome rule），且 command exit code 不受影响。
- Scope path：一次 startup attempt 不抑制后续 CLI `doctor` / `update` lookup；一次 CLI attempt 不抑制后续 startup lookup。
- Reset path：`startup-reminder --reset` 只清对应 host 的 startup scope；成功 `spec-first update` 清除 `cli.package` attempt gate。
- Integration：`-v` / `--help` 仍不触发 reminder。

**验证：**
- 重复 CLI invocation 在窗口内 package-level `cli.package` scope 最多执行一次网络 lookup；startup 与 CLI scope 不互相抑制；command exit codes 不变。

### U4. 记录 throttle 行为以及有意不改的 timeout/drift 项

**目标：** 记录新的 24h-any-outcome throttle、staleness trade-off，以及为什么 1200ms hook cap 和 drift detection 保持不变（P2/P3 作为 doc notes）。

**需求：** R5

**依赖：** U1, U3

**文件：**
- Modify: `docs/08-版本更新/README.md`
- Modify: `CHANGELOG.md`

**做法：**
- 增加一条简洁记录，说明：version-check 现在在 startup host scope 和 package-level CLI scope 中各自最多每 24h 执行一次网络 lookup；trade-off 是 ≤24h staleness、一次 offline blip 会暂停同 scope 检查；startup 与 CLI 不互相抑制；并补一句 1200ms session-start spawn cap 是有意的 latency guard（不是 bug），本方案不承诺 no-spawn，bootstrap drift 仍是 `doctor`/`init` 的职责，不由 session-start 检查。
- 遵循仓库 CHANGELOG 格式和 developer-profile author 规则；由于 startup/CLI latency 与 reminder cadence 是可观察行为变化，标记 `(user-visible)`。

**测试场景：**
- Test expectation: none — documentation only。

**验证：**
- CHANGELOG entry 存在且符合仓库格式；doc note 与已发布行为一致。

---

## 全系统影响

- **Interaction graph:** reminder module 的两个消费者是 session-start hooks（通过 `startup-reminder` spawn）和 CLI command dispatch（`index.js`）。两者都受影响，也都被覆盖（U1, U3），但只有网络 lookup 被 gate；hook child-process spawn 不在本方案承诺内。
- **Error propagation:** 不变。失败保持 silent 和 non-blocking；attempt gate 只新增一个更早 return path。
- **State lifecycle risks:** startup attempt timestamp 通过 atomic tmp+rename 写入现有 host-level JSON state；CLI attempt timestamp 通过同一模式写入 package-level `~/.spec-first/version-reminder.json`；corrupt/partial read 必须降级为 “no record → run the check”（fail-open），不能 throw。
- **API surface parity:** 两条 reminder path 现在共享同一种 throttle helper 语义，但使用分离 scope；latest-version *source* split（GitHub vs npm）有意不变。
- **Surface coverage:** Claude startup → in-scope（U1）；Codex startup → in-scope（U1，共享 CLI module）；CLI commands → in-scope（U3，package-level scope）；docs → in-scope（U4）；hook child-process spawn 和 hook timeout value → out-of-scope：有意的 latency guard；drift detection → out-of-scope：归 doctor/init。
- **Integration coverage:** “within-window → no network lookup” 保证必须由带 lookup spy 的单测证明；本方案预计不修改 templates，因而不需要运行 `spec-first init`。若后续实现改动 templates/source-runtime 投射逻辑，必须通过 `spec-first init` 从 source 重新生成双宿主 runtime mirrors，不能手改。
- **Unchanged invariants:** reminder text、entrypoint wording、semver comparison、timeout value/env override、trigger sites、`-v`/`--help` silence、exit codes。

---

## 风险与依赖

| 风险 | 缓解 |
|------|------|
| 现有测试断言了要移除的行为（“newer latest bypasses cooldown”） | 作为 U2 中必要且有意的 contract 变更处理，改写为新 contract，不能为了通过而放宽 |
| “窗口内仍会 fetch” 来自执行顺序推断，不是 live run | 实现验证包含 lookup-spy 单测，证明窗口内 no-call；可选执行 manual offline session-start check |
| lookup 后才记录 attempt 会被 1200ms 外层 timeout 截断 | U1/U3 明确要求 lookup 前同步写入 attempt timestamp，并用慢/不 resolve lookup 测试证明下一次不会重复进入网络边界 |
| corrupt state 上的 fail-open 可能重新引入 per-session fetch | 明确指定 fail-open 语义；可接受，因为最坏情况只是回到今天的行为，不能 throw |
| 手改 mirrors 造成 dual-host runtime drift | 本方案预计不改 templates/runtime mirrors；若实现改了 source runtime templates，再通过 `spec-first init` 重新生成，绝不直接编辑 `.claude/`/`.codex/` |
| startup 与 CLI scope 混用导致主动检查被后台 attempt 屏蔽 | 需求固定为 startup scopes 与 `cli.package` scope 分离，测试覆盖跨 scope 不互相抑制 |

---

## 文档 / 运维说明

- User-visible: startup 和 repeated-CLI latency 会下降（startup host scope 与 package-level CLI scope 各自每 24h 最多一次网络 lookup），全新 release 可能最多延迟 24h 才提示；startup 与 CLI 不互相抑制。在 `docs/08-版本更新/README.md` 与 `CHANGELOG.md` 中记录（U4）。
- 无 rollout/migration 顾虑：state file 增加字段/新增 package-level CLI state；旧状态或缺失状态按 fail-open 处理。

---

## 来源与参考

- **Origin document（feature origin）：** `docs/brainstorms/2026-04-29-001-startup-version-update-reminder-requirements.md`
- **已落地 timeout fix 的 prior art：** `docs/brainstorms/2026-06-01-001-spec-first-install-version-visibility-requirements.md`, `docs/plans/2026-06-01-001-feat-install-version-visibility-plan.md`
- 相关代码：`src/cli/version-reminder.js`, `src/cli/index.js`, `templates/claude/hooks/session-start`, `templates/codex/hooks/session-start`, `tests/unit/version-reminder.sh`
- Plan origin（范围决策）：本会话的 `spec-brainstorm` 对话

---

## 完成证据

- 实施范围：已落地到 `src/cli/version-reminder.js`, `src/cli/index.js`, `src/cli/commands/update.js`, `tests/unit/version-reminder.sh`, `tests/unit/version-reminder-contracts.test.js`, `tests/unit/cli-entry-contracts.test.js`, `tests/unit/update-contracts.test.js`, `docs/08-版本更新/README.md` 和 `CHANGELOG.md`。
- 关键行为：`startup.claude` / `startup.codex` 与 `cli.package` scope 在 lookup 前 claim attempt；状态可写时使用短时本地 lock 避免同 scope 并发 lookup；`doctor` / `init` / `clean` / `update` 的子命令 `--help` / `-h` 不触发提醒、不写 CLI gate；成功 `spec-first update` 清理 CLI package gate。
- 验证：`bash tests/unit/version-reminder.sh` 通过 96/96；`npx jest tests/unit/update-contracts.test.js tests/unit/cli-entry-contracts.test.js tests/unit/version-reminder-contracts.test.js --runInBand` 通过 30/30；`node --check src/cli/version-reminder.js && node --check src/cli/index.js && node --check src/cli/commands/update.js` 通过；`npm run typecheck` 通过 121 files；`npx jest tests/unit/changelog-format.test.js tests/unit/plan-status-taxonomy.test.js --runInBand` 通过 11/11；`npm run test:unit` 通过 154 suites / 1308 tests；`npm run test:smoke` 通过；`npm run test:integration` 通过 2 suites / 4 tests；`git diff --check` 通过。
- 审查：`spec-code-review` 发现的子命令 help gate、完成证据中文化、并发 attempt gate 与覆盖缺口已逐项处理；最终代码审查结果以本轮收尾报告为准。
- Generated runtime：未编辑 generated runtime mirrors；本计划未修改 hook templates 或 runtime generation。
- Closeout artifact：上一轮记录为 `.spec-first/workflows/spec-work/spec-first/20260621-003-version-reminder-1782056866640/run.json`；本轮追加修复不依赖手改 runtime artifact。
