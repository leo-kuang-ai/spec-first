# spec-sweep 评审（R2）

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | `skills/spec-sweep/SKILL.md:19-23,42-59` | 唯一状态写入者、整轮不可信输入和独立授权边界均有明确用途，文本内部一致。 |
| D02 | pass | `skills/spec-sweep/SKILL.md:89-97,107-113` | 源类型、配置语义、cursor 与状态操作约束均具体，状态引擎与编排者职责有区分。 |
| D03 | pass | `skills/spec-sweep/SKILL.md:107-127`; `skills/spec-sweep/references/run.md:19-30` | 状态词、失败停止条件、read-back 和收尾要求明确；入口同时声明尝试命令不证明成功。 |
| D04 | pass | `skills/spec-sweep/SKILL.md:123-125`; `skills/spec-sweep/references/plan-template.md:33-63` | 输出稳定的 spec-lfg 计划路径，并定义输入项如何进入计划及关闭项如何移除。 |
| D05 | pass | `skills/spec-sweep/SKILL.md:19-23,42-73` | 入口职责和关键授权集中可定位；本轮静态证据未显示相互矛盾的重复规则。 |
| D06 | pass | `skills/spec-sweep/references/model-tiers.md:5-12`; `skills/spec-sweep/SKILL.md:44-59` | 模型覆盖能力未知时继承或 inline 降级，并将 worker 授权与敏感数据授权分开。 |
| D07 | pass | `skills/spec-sweep/SKILL.md:113-127`; `skills/spec-sweep/references/state-schema.md:76-103` | 闭合状态要求可定位的合并证据，敏感内容在写入时脱敏；本轮不据此声称实际效果已验证。 |
| D08 | pass | `skills/spec-sweep/SKILL.md:27-40,99-105` | 按阶段读取对应 reference，headless 与交互路径分开；入口给出了明确按需加载指引。 |
| B01 | pass | `skills/spec-sweep/SKILL.md:1-5,77-105` | 入口定位为反馈源清扫，首次配置与常规运行分流清楚；作为禁用模型自动调用的入口，不要求其承担通用路由职责。 |
| B02 | fail | `skills/spec-sweep/SKILL.md:90-97`; `skills/spec-sweep/references/interview.md:186-211` | 入口列出的 email 类型是 `email`，interview 却允许输入 `email-experimental`，且示例与配置合同要求存为 `email`；最小修复是把输入选项统一为 `email` 或明确规范化规则。 |
| B03 | pass | `skills/spec-sweep/SKILL.md:23,42-73`; `skills/spec-sweep/references/interview.md:59-79` | 内容、委派、转录外发、commit、分支变更和 landing 授权彼此分立；headless、配置与权限均未被当作授权来源。 |
| B04 | pass | `skills/spec-sweep/SKILL.md:19,79-82,101-105`; `skills/spec-sweep/references/state-schema.md:3-7` | 状态引擎是唯一状态写入者，入口指向 Skill 源目录脚本；没有声称生成 runtime 是真相源。 |
| B05 | pass | `skills/spec-sweep/SKILL.md:107-122`; `skills/spec-sweep/references/run.md:19-30,64-72,97` | 并发、状态损坏、lease 丢失、媒体失败及共享发布不确定均有停机、降级或恢复处理。 |
| B06 | pass | `skills/spec-sweep/SKILL.md:21,113-127` | 要求报告真实结果、失败操作、计划路径和发布状态，并明确报告或计划不证明外部副作用成功。 |
| X01 | not-applicable | `skills/spec-sweep/SKILL.md:17-21,75-127` | Skill 执行的是周期性反馈清扫与计划汇总，不是多模块软件实现或长任务分解；分阶段清扫流程本身不触发 X01。 |
| X02 | not-applicable | `skills/spec-sweep/SKILL.md:17-21,89-97` | 本入口不承担 API、架构或版本演进工作；配置字段是其既有输入合同，不代表本轮存在接口变更场景。 |
| X03 | not-applicable | `skills/spec-sweep/SKILL.md:42-73,107-127` | 当前审查对象是静态 Skill 合同，不包含高风险实现或交付；外部写入授权要求已在 B03 覆盖。 |
| X04 | pass | `skills/spec-sweep/SKILL.md:44-59,115-127`; `skills/spec-sweep/references/plan-template.md:27-31,51-63` | 委派边界、敏感内容限制、恢复证据和计划中的人类备注所有权均有明确规则。 |

## Findings

1. **邮件类型标识不一致** — `skills/spec-sweep/references/interview.md:26-30`、`skills/spec-sweep/references/interview.md:39-39`、`skills/spec-sweep/references/interview.md:208-211`、`skills/spec-sweep/SKILL.md:90-90`  
   interview 指示用户选 `email-experimental`，但存储枚举及入口均规定 `email`。照 interview 操作可能生成消费者无法识别的类型配置。最小修复：将交互选项改为 `email`，并保留“experimental”作为展示说明；或在写配置前明确规范化 `email-experimental` → `email`。

2. **未读消费者与实现文件使结论范围受限** — 消费者清单 `.../evidence/input-packs/spec-sweep.consumers.txt:2-15`  
   清单列出 14 个测试消费者，但本轮未读取这些文件，无法核实入口与消费者间的静态合同、状态引擎和发布/媒体脚本实现是否兑现文案承诺。此项不另列为 Skill 缺陷；最小补证是逐一读取消费者清单中的文件并对照入口承诺。

## 主责深挖面发现

- **B01 入口职责：** 范围清晰：处理已配置反馈源、首次设置、状态/计划维护和向 spec-lfg 的交接（`skills/spec-sweep/SKILL.md:17-21,77-105,123-125`）。`disable-model-invocation: true`（`skills/spec-sweep/SKILL.md:4`）与明确调用的入口形态相符；没有证据表明其自我暴露为通用入口。
- **B02 输入输出：** 主输入为 `.spec-first/config.local.yaml` 中的反馈源与 sweep 配置（`skills/spec-sweep/SKILL.md:82-97`），输出包括状态记录、滚动计划和实际结果摘要（`skills/spec-sweep/SKILL.md:115-127`）。发现 interview 邮件类型不一致，详见上方 Finding。
- **B03 授权与信任：** 当前用户/上游授权、source standing approval、敏感媒体转录授权、worker dispatch 授权、Git commit/branch/landing 授权各自独立；未把 schedule、headless、配置存在或 ambient credentials 当授权（`skills/spec-sweep/SKILL.md:23,42-73`）。这是清晰且内部一致的静态边界。
- **B04 source/runtime：** 明确将 Skill 同目录 `scripts/sweep-state.py` 设为状态唯一写入者（`skills/spec-sweep/SKILL.md:19`），执行指引要求以 Skill 目录设置 `SKILL_DIR`（`skills/spec-sweep/references/run.md:10-15`）。本轮没有读取所有实现和测试，故只确认文案合同可定位，不对实现一致性作扩大结论。
- **X01-X03：** 不适用于本次 Skill 职责，理由见逐项裁决表。
- **X04：** 具备有界委派和敏感信息限制，也为恢复保留 run/lease/candidate 证据（`skills/spec-sweep/SKILL.md:44-59,117-122`）；计划模板将人类备注区明确为人类所有，并禁止协调器读取/写入该区（`skills/spec-sweep/references/plan-template.md:27-31,59-60`）。

## 未读文件

- `/Users/kuang/.codex/AGENTS.md` — 读取请求被权限拦截；未覆盖该用户级宿主指引。**未覆盖后果：**无法确认额外的 Codex/宿主执行规范。
- `skills/spec-sweep/references/agents/media-analyzer.md` — 未读取。**未覆盖后果：**媒体分析 persona 与入口/packet 的语义一致性未核验。
- `skills/spec-sweep/references/sources/github-issues.md`、`skills/spec-sweep/references/sources/email.md` — 未读取。**未覆盖后果：**GitHub 与 email connector 的字段映射、能力探测及授权处理未核验。
- `skills/spec-sweep/scripts/sweep-state.py`、`publish-final-state.py`、`analyze-sweep-media.py`、`analyze_riffrec_zip.py`、`run-python.sh` — 未读取。**未覆盖后果：**入口所述确定性约束、文件安全、发布验证、敏感数据处理及 Python 运行时保障未由实现确认。
- `skills/spec-sweep/evals/eval.yaml`、`skills/spec-sweep/evals/cases/headless-first-run-stops.yaml` 及相关 fixture 文件 — 未读取。**未覆盖后果：**静态 eval 声明与其夹具是否覆盖当前入口行为未核验。
- `skills/spec-sweep/templates/` — 目录不存在（枚举结果为无此路径）。**未覆盖后果：**没有独立 templates 子目录可供审查。
- `tests/unit/ce-localization-round-1-remediation-contracts.test.js`、`ce-upstream-skill-sync-contracts.test.js`、`dispatch-authorization-matrix-contracts.test.js`、`low-findings-cleanup-contracts.test.js`、`private-scratch-migration-contracts.test.js`、`python-runtime-resolution-contracts.test.js`、`remaining-script-defenses.test.js`、`skill-flow-p2-closure-contracts.test.js`、`spec-riffrec-feedback-analysis-contracts.test.js`、`spec-sweep-final-publication.test.js`、`spec-sweep-media-admission.test.js`、`specialized-skill-calibration-contracts.test.js`、`sweep-state-legacy-import.test.js`、`sweep-state-safety.test.js` — 均来自消费者清单，未读取。**未覆盖后果：**相关消费者合同、回归断言和实现防护未纳入本轮判断。
- `docs/plans/2026-11-03-skill-optimization-initiative/process/REVIEW-EXECUTION-WORKFLOW.md` 第 4 节已读取；`docs/plans/2026-11-03-skill-optimization-initiative/core/08-skill-contract-protocol.md` 已读取。角色契约已读取。

## 结论一句话

静态入口合同整体边界明确，主要确认的问题是 interview 将邮件源写成与配置枚举不一致的 `email-experimental`；由于未读实现及消费者，结论限于已读源码的静态承诺，不代表端到端消费者一致性已核实。
