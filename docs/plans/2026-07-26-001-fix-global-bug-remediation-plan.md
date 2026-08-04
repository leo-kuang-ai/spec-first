---
title: "fix: 逐项整改全局 Bug 审查报告"
date: 2026-07-26
status: completed
artifact_contract: spec-unified-plan/v1
artifact_readiness: implementation-ready
execution: code
product_contract_source: spec-plan-bootstrap
origin: docs/项目审查/2026-07-26-全局bug审查报告.md
---

# fix: 逐项整改全局 Bug 审查报告

## Goal Capsule

- **目标：** 以当前工作树而非审查报告的历史快照为准，逐项关闭仍成立的缺陷，并把已存在的修复补足为可验证闭环。
- **推荐方式：** 按 source owner 分批整改；先保护数据与确定性 gate，再处理 Windows 和脚本兼容性，最后处理低风险 P3。
- **决策重点：** 不把目录名、文件名或历史报告当作 ownership/完成证据；generated runtime 不进入修复面。
- **验证重点：** 每个行为修复有最窄回归测试；Windows 结论采用 `path.win32` / spawn 注入测试，真实 Windows smoke 单独标注。
- **最大风险：** 工作树已经含有用户的 staged/unstaged 修复；实施只能扩展和验证这些改动，不能覆盖、回退或重复声称其完成。

---

## Product Contract

### Summary

将 `docs/项目审查/2026-07-26-全局bug审查报告.md` 中的 P1、P2 与具备明确源位置的 P3 作为整改输入，但每项在动手前必须重新以当前 source 确认。

### Problem Frame

报告对应的旧快照已与当前 dirty worktree 分叉：P1 #2-#7、#9 及若干第二轮 P2 已有未提交修复；P1 #8、doctor slug、端口解析和 `run-test-suite` Windows spawn 等仍可从当前源码确认。

### Requirements

- R1. 每个报告项都必须有 `current`、`patched-pending-verification`、`invalidated` 或 `deferred` 的明确处置，不得把旧行号直接当作当前事实。
- R2. 数据删除、ownership、路径 containment 与 deterministic gate 的修复必须 fail closed，并保留用户资产。
- R3. 跨平台 ref、spawn、编码与 Git 路径处理必须保持外部 contract 使用 POSIX repo-relative 表示、内部 I/O 使用本机路径的边界。
- R4. 每个 feature-bearing 修复单元补充或扩展同目录 unit/contract test；验证声明仅覆盖实际运行的测试与平台。
- R5. 现有 dirty 改动保持其原始所有权；整改不创建 runtime mirror patch、不提交、不推送。

### Scope Boundaries

- **In scope：** 原报告的 P1/P2、列出源位置的 P3，以及当前未提交修复的缺口审查。
- **Deferred for later：** 无法从摘要定位或缺少可复现条件的 P3，先记录 disposition 与补证条件，不做猜测式修复。
- **Out of scope：** vendor、宿主内部行为、真实 Windows 设备验证、generated host runtime 手工修改。

---

## Planning Contract

### Key Technical Decisions

- KTD-1. **以 source owner 承接修复（extend）。** 不新建全局错误处理或路径抽象；在既有 CLI helper、provider、script 中修正各自契约，并只在已有共享 owner 已存在时复用。
- KTD-2. **报告项先定性再修改。** 实施开始时记录当前 diff 归属；若已修补则执行其指定测试并只修 residual，若反证成立则更新 disposition 而不是强行改代码。
- KTD-3. **删除 ownership 需要正向、不可伪造证据。** `plugins/spec` 等混合所有权目录不能因出现通用 `spec-*` 文件名而整体删除；优先使用 managed state、受控 marker 或逐个受控资产删除。
- KTD-4. **Windows compatibility 以 contract 测试锁定。** 统一由 `path.posix` 或边界归一化生成对外 ref；`npm.cmd` / CLI shim 走已存在的 Node/npm resolver，不依赖 `shell:false` 的 `.cmd` 可执行语义。

### Evidence & Limitations

`origin` 是历史审查输入，不是当前事实。当前工作树已包含针对 Codex ownership、Windows ref/spawn、Git C-quote、app-audit gate、worktree 与 runtime-tools 的修复；这些改动在实施前必须逐文件归因。此前已运行的 10 个 targeted Jest suites 只能证明其当前测试覆盖，不能证明真实 Windows 或宿主 loader outcome。

### Issue Disposition Baseline

| 报告项 | 当前初判 | 实施归属 |
| --- | --- | --- |
| P1 #1 Codex legacy 删除 | 原无条件删除已改；ownership 证据仍需加固 | U1 |
| P1 #2 experiment index | 已有 `10#` 归一化修复，待保留验证 | U2 |
| P1 #3/#4 Windows evidence ref | 已有 POSIX ref 修复，待回归 | U3 |
| P1 #5/#6 update Windows/root | 已有 resolver/git-root 修复，待回归 | U3 |
| P1 #7 Git C-quoted path | 已有 unquote 修复，待回归 | U4 |
| P1 #8 session-history | 当前仍有探测上限、stderr 误报与异常类型缺口 | U5 |
| P1 #9 app audit rejected issue | 已有降级 validator 修复，待回归 | U6 |
| CLI/P2 ownership、reason_code、TTY、workspace | 逐项 current-source 定性后处理 | U1/U3 |
| provider/P2 备份、EACCES、JSON | 逐项补 failure-path 测试 | U7 |
| app-audit/PRD P2 | 部分已修；剩余 intake/path contract 归 U6 | U6 |
| 其他脚本 P2/P3 | 按 session、port、encoding、timeout、legacy key 分组 | U2/U5/U8 |

---

## Implementation Units

### U1. 收紧 Codex 与 instruction 的用户资产边界

- **Goal:** 关闭 P1 #1、Codex legacy skill 清理与 instruction 空白规整的剩余越界写风险。
- **Requirements:** R1, R2, R5.
- **Dependencies:** 无。
- **Files:** `src/cli/adapters/codex.js`, `src/cli/runtime-tools-index.js`, `src/cli/coding-guidelines.js`, `src/cli/instruction-bootstrap.js`, `tests/unit/managed-removal-ownership.test.js` 及对应契约测试。
- **Approach:** 将混合目录删除收敛为可证明属于 spec-first 的具体资产；孤立 marker 仅移除可归属内容；未命中 managed block 时不得格式化用户全文。
- **Test scenarios:** 用户目录含通用 `spec-*` 名称但无 managed 证据时保留；可证明的 legacy asset 被清理；start/end marker 缺失时用户 tail 保留。
- **Verification:** init/clean plan 与 apply 两条路径均不列出未归属删除。

### U2. 修复 worktree 与 shell 路径/索引边界

- **Goal:** 完成 experiment-worktree 的零填充、含空格路径与 worktree slug containment，并处理 shell 脚本的端口/compose 解析缺陷。
- **Requirements:** R1, R2, R4.
- **Files:** `skills/spec-optimize/scripts/experiment-worktree.sh`, `skills/spec-worktree/scripts/worktree-manager.sh`, `skills/spec-polish/scripts/resolve-port.sh`, `skills/spec-optimize/scripts/parallel-probe.sh`, 对应 `tests/unit/*contracts.test.js` 或脚本 fixture。
- **Approach:** 数值输入十进制化；把用户 slug 作为单段路径验证；解析 JSON/compose 时限定 dev/start 语义，不用全文件首个匹配。
- **Test scenarios:** `010` 指向 exp-010；含空格 worktree 可识别；`..`/嵌入 traversal 被拒；无引号 compose mapping 与无关 Storybook 端口不被误取；GNU grep 兼容。
- **Verification:** 所有破坏性操作在删除前通过 containment 与目标 identity 校验。

### U3. 统一 CLI 的跨平台路径、spawn 与结构化失败出口

- **Goal:** 关闭 evidence ref、update/run-test-suite、doctor host probe、task-pack、workspace summary 等 CLI contract 缺口。
- **Requirements:** R1, R3, R4.
- **Dependencies:** U1。
- **Files:** `src/cli/commands/update.js`, `src/cli/commands/doctor.js`, `scripts/run-test-suite.cjs`, `src/cli/helpers/spec-work-run-artifact.js`, `src/cli/helpers/verification-run-summary.js`, `src/cli/task-pack.js`, `src/cli/commands/init-workspace.js`, `tests/unit/windows-repo-relative-refs.test.js`, `tests/unit/update-command-spawn.test.js`, 新增最窄 unit tests。
- **Approach:** 外部 ref 在 producer/read back 两侧同一归一化；所有 `.cmd` 调用复用 npm/Node resolver；无权限、缺文件、Windows 保留 cwd 名称返回既有结构化 reason 而非 stack trace。
- **Test scenarios:** win32 separator round-trip；`npm.cmd` 不作为 shell:false command；子目录 update 采用 git root；EACCES/缺 counts/缺 task pack 都产生机器可消费 reason_code。
- **Verification:** public JSON schema 与 exit code 在失败路径仍可解析。

### U4. 加固 Git 输出与状态信号解析

- **Goal:** 使中文与 C-quoted Git 路径在 diff、status、fingerprint consumers 中保持同一真实 repo-relative 路径。
- **Requirements:** R1, R3, R4.
- **Dependencies:** U3。
- **Files:** `src/cli/helpers/git-diff-signals.js`, `src/cli/helpers/scenario-fingerprint.js`, `tests/unit/git-quoted-path-decoding.test.js`，相关 fingerprint tests。
- **Approach:** 复用单一 C-quote byte decoder；覆盖 numstat/name-status/porcelain、rename 与 non-ASCII path，不在 consumer 侧再次字符串修补。
- **Test scenarios:** UTF-8 八进制 quoted path、空格/反斜杠、rename、Git status failure 都得到正确路径或明确 degraded reason。
- **Verification:** resource/task governance 与 scenario fingerprint 消费相同 canonical path。

### U5. 修复 session-history 的检测、解析与错误语义

- **Goal:** 关闭 P1 #8 及 `extract-skeleton.py` / `extract-errors.py` 对合法 JSON 形状的崩溃与 false-positive。
- **Requirements:** R1, R4.
- **Dependencies:** 无。
- **Files:** `skills/spec-compound/scripts/session-history/extract-errors.py`, `skills/spec-compound/scripts/session-history/extract-skeleton.py`, `skills/spec-compound/scripts/session-history/extract-metadata.py`, `tests/unit/session-history-scripts.test.js` 或新增 fixture test。
- **Approach:** 平台探测持续到确定或输入结束；仅非零退出或明确 tool failure 计 error；对 `null`、数组和编码异常采用逐行降级计数，不中止 batch。
- **Test scenarios:** 十条以上未知 metadata 后的 Codex event；exit 0 + stderr progress；null/array JSON；非 UTF-8 bytes；真实错误仍被保留。
- **Verification:** 输出的 `errors_found` 与 `parse_errors` 可区分“无错误”“无法识别”“解析降级”。

### U6. 完成 app consistency audit 与 PRD intake 的可降级合同

- **Goal:** 固化 rejected issue、source hash、project signal、参数转发和 PRD path 的修复，并关闭仍存在的 intake 漏洞。
- **Requirements:** R1, R2, R4.
- **Dependencies:** 无。
- **Files:** `skills/spec-app-consistency-audit/scripts/preflight.js`, `skills/spec-app-consistency-audit/scripts/run-audit.js`, `skills/spec-app-consistency-audit/scripts/validate-artifacts.js`, `skills/spec-prd/scripts/check-prd-artifact.js`, `tests/unit/app-audit-gate-degradation.test.js` 及新增 fixture。
- **Approach:** 控制根排除、逐行 signal、可用数值 flag 转发；rejected issue 用专用最小 schema；裸相对 PRD path 与受限路径语义一致。
- **Test scenarios:** run-dir 不影响 source hash；iOS/Gradle 识别；缺 evidence 的 rejected item 仍产出降级报告；512KB-5MB PRD 与显式限制；`docs/prds/foo.md` blocking。
- **Verification:** headless envelope 在失败与降级均保持结构化。

### U7. 加固 provider 与 setup failure paths

- **Goal:** 修复 ledger rollback、null tool facts、Graphify EACCES/JSON、payload-smoke 渲染等错误处理断层。
- **Requirements:** R1, R2, R4.
- **Dependencies:** U3。
- **Files:** `skills/spec-runtime-setup/scripts/lib/facts.cjs`, `skills/spec-runtime-setup/scripts/providers/graphify.cjs`, `skills/spec-write-skill/scripts/inspect-context.cjs`, `src/cli/helpers/setup-facts.js`, 对应 setup/provider tests。
- **Approach:** backup capture 成功后才允许 cleanup；目录/JSON/nullable entries 均返回 reason-coded degraded result；stdout 与 stderr 分别处理。
- **Test scenarios:** existing ledger 写失败仍保留；不可读目录；npm warning on stderr；null facts；非 JSON payload smoke。
- **Verification:** `doctor` / runtime setup 的诊断失败不删除先前 artifact，也不以未捕获异常退出。

### U8. 处置可定位的剩余脚本 P2

- **Goal:** 逐项确认并修复 legacy sweep key、文本编码、Riffrec payload/timeout 与文档 claim 校验的当前缺陷。
- **Requirements:** R1, R4, R5.
- **Dependencies:** U2, U5, U7。
- **Files:** `skills/spec-sweep/scripts/sweep-state.py`, `skills/spec-sweep/scripts/analyze_riffrec_zip.py`, `skills/spec-riffrec-feedback-analysis/scripts/analyze_riffrec_zip.py`, `skills/spec-compound/scripts/validate-doc-claims.py`, `tests/unit/sweep-state-legacy-import.test.js`，以及各 script 的新增 fixture test。
- **Approach:** legacy id 迁移到现有复合 key；输入 payload 先做 object/array shape 分流；未知 duration 与 timeout 产生明确 degraded/result reason；所有中文文档读取显式 UTF-8。
- **Test scenarios:** 已关闭 feedback 不重新浮出；顶层数组 payload；未知时长与 ffmpeg timeout；Windows locale 下的中文文档。
- **Verification:** 每条 failure path 返回可区分的状态，不能以 `ok` 或空结果伪装成功。

### U9. 记录 P3 disposition，不做推测式整改

- **Goal:** 对报告摘要中无法从当前 source 直接定位的 P3，记录当前证据、反证或补证条件，防止它们被误当作完成项或盲改项。
- **Requirements:** R1, R5.
- **Dependencies:** U1-U8。
- **Files:** `docs/项目审查/2026-07-26-全局bug审查报告.md` 的引用项、fix-owned tests 与 source refs；审查报告正文仅在用户明确授权其历史结论更新时修改。
- **Approach:** 用实施 run 的 repo-relative source refs 和测试结果生成 handoff disposition，不改写原审查快照。
- **Test expectation:** none -- 该单元只汇总已执行的确定性证据，不创建新运行时行为。
- **Verification:** 每个未修 P3 都带 owner、unblock condition 或明确反证。

---

## Verification Contract

| 范围 | 证明 | 限制 |
| --- | --- | --- |
| U1-U4 | 现有与新增 Jest unit/contract tests，`git diff --check` | 不证明真实 Windows shell/host loader |
| U2/U5/U8 | Bash/Python fixture tests及语法检查 | 不对真实用户工作树执行破坏性 cleanup |
| U6-U7 | headless fixture 与结构化 envelope tests | 不对外部 provider/宿主做 mutation |
| 全体 | 最窄测试通过后再扩展受影响 suite；review 仅审查 fix-owned delta | dirty baseline 必须在 review coverage 中显式披露 |

---

## Definition of Done

- 每个 P1/P2 和可定位 P3 在 disposition 中有当前证据、修复或延期理由。
- 已修补项拥有能失败的回归测试；当前仍成立项在 source owner 中得到最小修复。
- 没有新增 generated runtime patch、无未经证实的 Windows/host completion claim。
- 变更通过相应的 unit/contract suites、`git diff --check`，并由后续代码审查覆盖 fix-owned delta。
- CHANGELOG 与用户可见文档只在实际 source 行为改变时按仓库格式更新。
