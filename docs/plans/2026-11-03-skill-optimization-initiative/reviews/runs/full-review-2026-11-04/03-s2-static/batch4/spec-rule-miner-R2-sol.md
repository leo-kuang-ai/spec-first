# spec-rule-miner 评审（R2）

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | `skills/spec-rule-miner/SKILL.md:24-25,42-48,63-67` | 划定近邻职责、写入边界和失败处理；本次未评估这些约束相对真实失败是否过度或过时。 |
| D02 | pass | `skills/spec-rule-miner/SKILL.md:16,47,53-57,71-76` | 要求规则回到当前仓库证据，并控制语言默认、抽样、多包范围和历史例外；真实任务输出对照未覆盖。 |
| D03 | pass | `skills/spec-rule-miner/SKILL.md:44-46,58-59,67` | 静态约定明确 preview、确认、刷新比较和 no-op；脚本强制与实际运行行为未覆盖。 |
| D04 | not-verified | `skills/spec-rule-miner/SKILL.md:33-38,57-59` | 定义了输出及收尾信息，但消费者如何实际使用这些输出，尚无已读消费者证据。 |
| D05 | pass | `skills/spec-rule-miner/SKILL.md:12-16,33-38,50-59` | 职责、产物和步骤均可定位；维护成本与任务成本不在已读静态证据中。 |
| D06 | pass | `skills/spec-rule-miner/SKILL.md:8-10,55`; `skills/spec-rule-miner/references/pattern-categories.md:17-25` | 将图谱结果限定为不可信导航候选，并规定 source 回证与降级路径；按本 Skill 能力假设审查，未要求多模型运行证据。 |
| D07 | pass | `skills/spec-rule-miner/SKILL.md:46,66-67`; `skills/spec-rule-miner/references/write-targets.md:41-48` | 定义重新取证、比较 canonical block、无变化不重写；长期效用与实际消费者效果未验证。 |
| D08 | pass | `skills/spec-rule-miner/SKILL.md:53-58`; `skills/spec-rule-miner/references/pattern-categories.md:7-25` | 规定分层抽样、披露覆盖限制和按需图谱导航；实际读取成本未评估，但不影响静态承诺判定。 |
| B01 | pass | `skills/spec-rule-miner/SKILL.md:18-25,61-66`; `skills/spec-rule-miner/evals/trigger-cases.json:15-92` | 正向触发、相似入口负例、范围外目标与近邻去向均有明确描述及静态用例；运行表现未据此推断。 |
| B02 | pass | `skills/spec-rule-miner/SKILL.md:27-38,50-59`; `skills/spec-rule-miner/references/pattern-categories.md:17-25` | 输入输出、证据来源、限制和图谱 readiness 降级都有可定位约定；消费者一致性尚未核对。 |
| B03 | pass | `skills/spec-rule-miner/SKILL.md:40-48,57-59`; `skills/spec-rule-miner/references/write-targets.md:39-50` | 限定只读代码、写入前 preview/授权、不覆盖既有规则及受限替换范围；授权边界静态清晰。 |
| B04 | pass | `skills/spec-rule-miner/SKILL.md:42-43,55,58`; `skills/spec-rule-miner/references/write-targets.md:52-57` | 规则区分独立 source 文档与 generated runtime，并给出禁止目标和从 source 修复投射的路径。 |
| B05 | pass | `skills/spec-rule-miner/SKILL.md:44-46,61-67`; `skills/spec-rule-miner/references/write-targets.md:41-48` | 对无源码、旧无 marker 输出、刷新无变化等静态失败/恢复场景有处置规则；中断恢复与 dirty overlap 未由已读文本覆盖。 |
| B06 | not-verified | `skills/spec-rule-miner/SKILL.md:57-59,69-78` | 有 preview、closeout 和质量检查要求，但消费者、实际产物及审查闭环证据尚未完成核对。 |
| X01 | pass | `skills/spec-rule-miner/SKILL.md:52-56`; `skills/spec-rule-miner/references/pattern-categories.md:7-15` | 多包识别、抽样、包级适用范围、历史例外和分裂模式处理均有明确静态约定。 |
| X02 | not-applicable | `skills/spec-rule-miner/SKILL.md:14,27-38,50-59` | 本 Skill 的静态职责是挖掘项目编码规则及写入规则文件/pointer，不负责 API、架构或版本变更。 |
| X03 | not-applicable | `skills/spec-rule-miner/SKILL.md:40-48,50-59` | 本 Skill 不实施高风险代码变更或发布交付；写规则文件的授权与边界已在 B03 审查，不等同于高风险实现/发布职责。 |
| X04 | pass | `skills/spec-rule-miner/SKILL.md:36-38,44-46,57-59`; `skills/spec-rule-miner/references/pattern-categories.md:17-25` | 规定证据摘要、限制、刷新状态和图候选回源披露，适用于本 Skill 的规则沉淀；跨会话知识消费者未核对。 |

## Findings

- **消费者一致性未能作出结论**  
  位置：`skills/spec-rule-miner/SKILL.md:33-38,57-59`  
  后果：无法确认消费者是否接受 `rules_block`、`evidence_summary`、`target_files`、`limitations` 这些产物约定，也无法对 D04、B06 的链路完整性作静态结论。  
  最小处理：补读消费者清单所列 `tests/src` 文件后复核；本次不据此推断存在实现缺陷。

## 主责深挖面发现

本次已读入口、`write-targets.md`、`pattern-categories.md`、检查表和合同基线。已读材料中，入口职责及近邻路由（B01）、输入输出及证据边界（B02）、授权和写入信任边界（B03）、source/runtime 边界（B04），以及 X01-X04 的适用性或静态约定均可定位。**这不是完整深挖结论**：消费者清单文件及全部相关 eval 未完成核对，故不对消费者一致性、行为覆盖或审查闭环作通过声明。

## 未读文件

- `/Users/kuang/.codex/AGENTS.md`：读取请求被权限拦截；未覆盖其中的用户级补充指引。
- 消费者清单：`/Users/kuang/xiaobu/spec-first/docs/plans/2026-11-03-skill-optimization-initiative/reviews/runs/full-review-2026-11-04/evidence/input-packs/spec-rule-miner.consumers.txt`：读取该清单的命令被工具策略拦截；因此未能确认、读取或逐一列出其中的 `tests/src` 文件，消费者结论不完整。
- `skills/spec-rule-miner/evals/cases/no-preview-no-write.yaml`、`review-request-routes-out.yaml`、`r2-debug-request-routes-out.yaml`：未读取；未覆盖其逐项静态期望断言。
- `skills/spec-rule-miner/evals/fixtures/scripts/check-preview-first.sh`、`skills/spec-rule-miner/evals/fixtures/repos/mini-ledger/README.md`、`package.json`、`src/server.js`：未读取；未覆盖 fixture 行为及其与 Skill 约定的一致性。
- `skills/spec-rule-miner/evals/eval.yaml` 与 `trigger-cases.json` 已读取；但 trigger cases 只证明静态用例存在，不证明运行通过。

## 结论一句话

已读源码呈现出清晰的入口、授权、证据与 source/runtime 静态边界；但由于消费者清单及部分 eval/fixture 未完成核对，本报告是**未覆盖消费者面的有限静态裁决**，不构成完整通过结论。
