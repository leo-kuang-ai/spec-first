# 代码功能完整性审查报告（多Agent）

> 审查日期：2026-02-09  
> 审查范围：`src/`、`tests/`、CLI 真实运行链路（`dist/cli/index.js`）  
> 审查重点：功能完整性（是否可用、是否闭环、是否与设计一致）

## 1. 结论

当前版本存在多处 **P0 级功能断点**，尚不满足“功能完整可交付”标准。  
主要问题集中在：命令层与核心模块接口漂移、阶段流转未闭环、关键命令运行时崩溃。

---

## 2. 审查方法

1. 自动化审查：执行 `pnpm check`、`pnpm lint`、`pnpm test`。  
2. 结构审查：核对 `commands` 与 `core` 接口契约一致性。  
3. 运行审查：在临时目录真实执行 CLI 端到端冒烟。  
4. 证据化：所有问题提供文件与行号定位。

---

## 3. 关键发现（按严重级别）

### P0-1 CLI 主链路不可用：`stage advance` 在 00 阶段崩溃

- 现象：`spec-first stage advance FEAT-XXX` 报错 `conditions is not iterable`。
- 根因：`GateDefinition | undefined` 被当作 `GateCondition[]` 传入评估器。
- 证据：
  - `src/commands/stage.ts:128`
  - `src/commands/stage.ts:133`
  - `src/core/gate-engine/gate-evaluator.ts:202`
  - `src/core/gate-engine/gate-evaluator.ts:429`
- 影响：无法从初始化进入后续流程，主流程不可用。

### P0-2 阶段推进在 `02_design -> 03_plan` 断链

- 现象：即使使用 `--force`，仍报“必须通过 Gate 评估（gate_passed）才能前进”。
- 根因：命令仅调用 Gate 评估，未写回状态机 `gate_passed`。
- 证据：
  - `src/commands/stage.ts:133`
  - `src/core/process-engine/stage-machine.ts:204`
  - `src/core/process-engine/stage-machine.ts:274`
  - `src/core/process-engine/stage-machine.ts:301`
- 影响：流程在设计阶段后卡死。

### P0-3 `gate check` 命令不可用

- 现象：`spec-first gate check` 运行时报 `conditions is not iterable`。
- 根因：`getGateDefinitions` 返回结构对象，但 `evaluateGate` 需要条件数组。
- 证据：
  - `src/commands/gate.ts:93`
  - `src/commands/gate.ts:97`
  - `src/core/gate-engine/gate-evaluator.ts:205`
- 影响：质量门禁入口不可用，无法做阶段放行判断。

### P0-4 AI 命令组不可用（接口漂移）

- 现象：
  - `ai context` 报路径参数错误；
  - `ai catchup` 报路径参数错误；
  - `ai stats` 报 `collector.getSummary is not a function`。
- 根因：命令层调用签名与核心实现不一致，且调用了不存在的方法。
- 证据：
  - `src/commands/ai.ts:83`
  - `src/commands/ai.ts:135`
  - `src/commands/ai.ts:159`
  - `src/core/ai-orchestrator/context-builder.ts:40`
  - `src/core/ai-orchestrator/session-manager.ts:46`
  - `src/core/ai-orchestrator/stats-collector.ts:12`
- 影响：M5 能力不可对外使用。

### P0-5 缺陷管理命令写坏数据，后续不可查/不可更

- 现象：
  - `defect register` 输出字段为 `undefined`/`[object Object]`；
  - 持久化 JSON 中 `title` 被写成对象；
  - `defect get/update` 无法按预期工作。
- 根因：命令层以对象传参，但核心接口为位置参数；字段名也不一致（`id` vs `defectId`）。
- 证据：
  - `src/commands/defect.ts:122`
  - `src/commands/defect.ts:134`
  - `src/commands/defect.ts:160`
  - `src/core/change-mgr/defect-tracker.ts:107`
  - `src/core/change-mgr/defect-tracker.ts:134`
  - `src/core/change-mgr/types.ts:122`
- 影响：M4 缺陷链路数据损坏，流程不可审计。

### P0-6 类型系统未闭环（`pnpm check` 失败）

- 现象：`pnpm check` 在 `typecheck` 阶段失败（命令层/核心层接口不一致 + `mdast` 类型缺失）。
- 证据：
  - `src/commands/ai.ts`
  - `src/commands/defect.ts`
  - `src/commands/gate.ts`
  - `src/commands/stage.ts`
  - `src/parsers/markdown-parser.ts:14`
- 影响：版本不可作为稳定可维护交付。

---

## 4. 次级问题（P1）

### P1-1 Hook 防线未闭环

- `pre-push` 调用了不存在命令 `spec-first sca`，并且失败时放行。
- 证据：
  - `src/core/tool-integration/git-hooks.ts:59`
  - `src/core/tool-integration/git-hooks.ts:61`
- 影响：本地防线形同虚设，依赖 CI 单点兜底。

### P1-2 `doctor` 修复指令不可执行

- 报告建议 `spec-first tool hooks install`，但 CLI 无 `tool` 命令。
- 证据：
  - `src/commands/doctor.ts:84`
  - `src/index.ts:24`
- 影响：自愈路径断裂，运维体验差。

### P1-3 RFC 创建参数未完整生效

- `--level`、`--description` 在创建路径未落地。
- 证据：
  - `src/commands/rfc.ts:22`
  - `src/commands/rfc.ts:25`
  - `src/commands/rfc.ts:110`
  - `src/core/change-mgr/rfc-machine.ts:129`
  - `src/core/change-mgr/rfc-machine.ts:133`
- 影响：变更单信息不完整，审批语义丢失。

### P1-4 空矩阵默认“全绿”存在误导

- 分母为 0 时，多个覆盖率返回 100%，导致空项目报告可能 9/9 PASS。
- 证据：
  - `src/core/trace-engine/coverage-calculator.ts:138`
  - `src/core/trace-engine/coverage-calculator.ts:167`
  - `src/core/trace-engine/coverage-calculator.ts:190`
  - `src/core/trace-engine/coverage-calculator.ts:213`
  - `src/core/trace-engine/coverage-calculator.ts:256`
  - `src/core/trace-engine/coverage-calculator.ts:296`
  - `src/core/trace-engine/coverage-calculator.ts:341`
- 影响：度量报告可能误导上线决策。

---

## 5. 观察项（P2）

### P2-1 AI 统计采集为占位实现

- 当前统计核心字段为固定 0，未接入真实 diff 统计。
- 证据：
  - `src/core/ai-orchestrator/stats-collector.ts:52`
  - `src/core/ai-orchestrator/stats-collector.ts:126`
- 影响：无法支撑真实 AI 效能运营。

### P2-2 命令层单测偏注册，不覆盖真实行为

- 大量用例仅验证“命令是否存在/选项是否注册”，无法发现接口漂移。
- 证据：
  - `tests/unit/commands/ai.test.ts:23`
  - `tests/unit/commands/defect.test.ts:23`
  - `tests/unit/commands/stage.test.ts:23`

---

## 6. 自动化审查结果

- `pnpm check`：**失败**（`typecheck` 失败）。  
- `pnpm lint`：通过。  
- `pnpm test`：通过（42 files，447 tests）。

说明：当前“测试通过”不等于“功能完整可用”，实际 CLI 运行已复现多条断链。

---

## 7. 修复优先级建议

1. **先修 P0（阻断项）**：`stage`/`gate`/`ai`/`defect` 命令与核心接口统一，打通主流程。  
2. **再修 P1（质量项）**：Hook 命令对齐、doctor 修复路径、RFC 参数完整落地、覆盖率语义校准。  
3. **最后做 P2（治理项）**：AI 统计真实化、命令行为级测试补齐。

---

## 8. 复验入口（建议）

完成修复后建议以以下命令作为最小复验集：

```bash
pnpm check
spec-first init --feat AUTH --mode N --size M --platform github
spec-first stage advance FEAT-AUTH-001
spec-first gate check FEAT-AUTH-001 --stage 02_design
spec-first ai context FEAT-AUTH-001 --validate
spec-first defect register FEAT-AUTH-001 --title "x" --severity S2 --reporter leo --discovered-in testing
```

预期：全部命令可运行，且不出现类型错误、参数签名错误或状态机断链。
