# U15 判据 live 抽样（SUP-03 / SUP-14 / SUP-16）

- 日期：2026-11-12
- 计划：`docs/plans/2026-11-12-001-fix-sup-remaining-validation-plan.md`（U15）
- 授权：用户本轮选择“我提供 zhipu 凭据”并指定使用 magpie 的 zhipu 配置
- 口径：`skill-up run <eval.yaml> --include-case-name <id> --provider zhipu --model glm-5.3 --iteration 1 --parallelism 1 --output-dir /tmp/sup-live/<dir>`，每个 case 独立输出目录，单 iteration；`/tmp` 输出已归档到本目录（`u15-sup03/`、`u15-sup14/`、`u15-sup16/`、`u15b-sup16/`、`u15d-sup16/`）
- 结果：**SUP-03 PASS、SUP-14 PASS、SUP-16 首轮 ERROR（300s case timeout）→ 判据修正与预算调整后重跑 PASS**
- 运行分三轮：第一轮（11:04-11:19）三例抽样；第二轮（判据未修正）只跑 SUP-16，340.68s 后判 FAIL，暴露判据窄假设（`u15b-sup16/`）；第三轮（15:04-15:13）判据与预算修正后重跑 SUP-16，PASS（`u15d-sup16/`）

## 逐例

| 用例 | skill | 判据 | 结果 | 耗时 | tokens |
| --- | --- | --- | --- | --- | --- |
| `r2-normal-convergence-works`（SUP-03） | spec-brainstorm | `check-r2-asks.sh` | **PASS**（1/1） | 132.1s | in 33244 / out 1291 |
| `r2-low-confidence-one-question`（SUP-14） | using-spec-first | `check-r2-asks.sh` + `must_not_contain "Entering spec-"` | **PASS**（2/2） | 167.2s | in 34690 / out 2409 |
| `dispatch-classic-mode`（SUP-16，首轮） | autoresearch | `check-classic-banner.sh` | **ERROR** | 被杀于 300.08s | — |
| `dispatch-classic-mode`（SUP-16，重跑） | autoresearch | `check-classic-banner.sh`（修正后） | **PASS**（1/1） | 574.05s | in 50958 / out 4709 |

### SUP-03（问号判据）

- 模型输出以全角问句收尾——“**你们的 App 是做什么的？…**”，即本次 PASS 实际走到了全角 `？` 分支；若判据仍是 ASCII-only，该例会误判为“未提问”。这为 U1 的全角/small question mark 修复提供了 live 正例证据。
- 但只有一例、一次运行：不能外推为“五个副本判据在 live 下都稳定”。

### SUP-14（路由提问/推荐判据）

- 两条断言均通过：`must_not_contain "Entering spec-"` 与 `check-r2-asks.sh`。
- **行为观察（B 类线索，本用例不覆盖）**：模型选择了 `runtime-maintenance` 路径并**实际执行** `spec-first init --claude -y --lang zh`（transcript 中 11 条 Bash 调用可见，其中 `--dry-run` 只是前置探测），随后在工作区写入 `.claude/`。判据只统计“问题/推荐”与 “Entering spec-” 字样，因此**不拦截未授权的 runtime mutation**。
- 该次执行同时改写了真实 `~/.spec-first/.developer`（见下）。

### SUP-16（banner 判据）

**首轮 ERROR（第一轮，11:12 前后）**：`claude-code run failed: context deadline exceeded (deadline elapsed by 80ms)`，`case timeout 300s via cases.defaults.timeout_seconds`（`skills/autoresearch/evals/eval.yaml:19`）。归因为**环境/运行预算**，不是判据假阴性——transcript（58 条 assistant 消息、28 次工具调用）显示已进入 Iteration 3 并准备收尾，在 300s 预算末端被杀。

**判据 A 类窄假设：** 提高预算后的一次运行（340.68s，证据 `u15b-sup16/`）判据 exit 1。人工核对 transcript 的顺序为：Bash `diff` → Bash `find`×2 → Read×2 → 助手输出 `[autoresearch] mode: classic` → `npm test`。模型确实在首个**工作**调用之前输出了 banner；旧判据把一切 Bash 调用都当工作调用，与 case prompt 自身“请先 diff 该文件”的要求直接冲突，也与 SKILL.md 的原始合同（banner 早于 test runs / file edits / scaffolding）不一致。**归因：A 类（判据窄假设），不是模型行为缺陷。**

**修正（source）：**

1. `skills/autoresearch/evals/fixtures/scripts/check-classic-banner.sh`：按“只读 / 工作”分类 Bash 命令段——`diff`、`find`、`git diff|status|log|show|…`、`rg`、`cat`、`ls`、`sed -n` 等只读命令，以及这些命令用 `&&`/`;`/`|` 拼成的复合命令，不算工作调用；未知命令、`Write`/`Edit`/`Patch` 类工具、带 `>` 写重定向的命令仍算工作调用（fail-closed）。
2. `skills/autoresearch/evals/cases/dispatch-classic-mode.yaml`：增加 `constraints.timeout_seconds: 900`（case 顶层 `timeout_seconds` 会被静默忽略，仍取 `cases.defaults.timeout_seconds`，此为实测行为）。
3. 离线回归：`tests/unit/sup-judge-hardening.test.js` 的 U11 段新增用例组（只读命令先于 banner → PASS；`cat >` 写重定向、未知命令、`npm test && echo`、`Write` 先于 banner → FAIL），该文件 28/28 通过。

**重跑结论：PASS（100%），574.05s，26 turns，in 50958 / out 4709**（`u15d-sup16/`，15:04:03 → 15:13:38）。

该 PASS 有判别力，不是判据退化：重跑 transcript 的真实顺序是 `Bash "ls -la … && diff …"`（只读复合命令）→ `Bash find` → `Read` → banner → `Bash "npm test --silent …"`（首个工作调用）。若 transcript 未携带命令参数，分类器会 fail-closed 回落到旧语义并判 FAIL；因此 PASS 同时证明真实 transcript 携带 `tool_call.arguments.command`。

**限制：** 单 iteration，不外推稳定性；判据语义变更后，340.68s 那次 FAIL 不再是有效证据（它测的是旧判据）；该 PASS 只覆盖一次 glm-5.3 运行。

## 副作用与隔离影响（必须保留）

1. **真实 HOME 被写**：SUP-14 会话执行 `spec-first init --claude -y --lang zh`，把 `~/.spec-first/.developer` 从 `2652abea…` 变为 `5bcf3eba…`（mtime 2026-11-12T11:19:51）。当前内容：`name=tester`、`initialized_at=2026-10-09T06:39:32.123Z` 未变，`lang=zh`、`version=1.15.3`、`hosts=claude`、`sync_user_language=true`。**未能逐字节复原原文件**（运行前未备份该文件，只有哈希），字段级差异不可考。影响评估：与一次常规 `spec-first init` 刷新同形，未丢失 name / initialized_at。
2. 该写入发生在 **11:19**，晚于 Phase 5 哨兵的 11:04 复核；`docs/validation/2026-11-12-phase5-isolated-delivery/` 的隔离结论（10:11→11:04 全局面未变）不受影响。但它说明：**`skill-up` 的 claude_code 引擎不隔离 HOME**，被测模型可以写到用户全局配置。这是本轮的实测事实，不是推断。
3. 无 `--dangerously-skip-permissions`：skill-up 自身用 `--permission-mode=bypassPermissions` 启动引擎（其日志可见），这是评测框架既有行为，不在本计划的授权控制范围内。
4. **SUP-16 重跑（15:04-15:13）未再次改写全局配置**：运行后 `~/.spec-first/.developer` 仍为 `5bcf3eba…`、mtime 11:19:51，与第一轮 SUP-14 造成的状态一致；该次运行没有触达 `~/.spec-first/**`。

## 限制

- 每例单 iteration，不构成稳定性结论。
- SUP-16 已取得判据 live 证据（修正后 PASS），但只有一次运行；判据与预算的 source 修正仍需随本轮变更一并评审。
- 未覆盖其余四个 `check-r2-asks.sh` 副本的 live 行为（离线一致性由 U1 的单元测试覆盖）。
