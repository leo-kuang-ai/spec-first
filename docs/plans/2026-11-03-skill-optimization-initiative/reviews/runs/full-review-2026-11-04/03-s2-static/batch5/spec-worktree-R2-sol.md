# spec-worktree 评审（R2）

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | `skills/spec-worktree/SKILL.md:17-44,77` | 先检测隔离状态、未知时停止及禁止绕过脚本的指引，都对应明确的失败场景；本轮静态审查不据此推断运行效果。 |
| D02 | pass | `skills/spec-worktree/SKILL.md:40-53,104,140-148` | 给出 linked worktree、分支唯一性、shared Git index 和 caller ownership 等具体约束，并限定 helper 与 caller 的职责。 |
| D03 | pass | `skills/spec-worktree/SKILL.md:19-44,77,104` | 明确 detect 的结构化事实与错误处理承诺，并禁止脚本失败后回退裸 `git worktree add`；prose 不冒称自动强制。 |
| D04 | pass | `skills/spec-worktree/SKILL.md:142-148`；`tests/unit/spec-worktree-contracts.test.js:95-112` | helper 的调用前置条件、返回事实和已声明的两个消费者能够对上；没有将 helper 反向声明误作新的集成边。 |
| D05 | pass | `skills/spec-worktree/SKILL.md:46-53,79-104,138-148` | create/isolate 的模式、既有分支处理及集成边界均可定位，职责限制没有与操作说明明显冲突。 |
| D06 | pass | `skills/spec-worktree/SKILL.md:19-44,57`；`skills/spec-worktree/agents/openai.yaml:1-2` | 入口按自身能力假设描述 bash、Git、Node 依赖与非 Claude 路径；没有宣称跨模型行为已验证或具备隐式调用授权。 |
| D07 | pass | `skills/spec-worktree/SKILL.md:140-148`；`skills/spec-worktree/scripts/worktree-manager.sh:555-561` | 有明确的失败原因与 caller 限制；未声称具备自动经验学习职责，因此无需为缺少知识循环判失败。 |
| D08 | pass | `skills/spec-worktree/SKILL.md:17-44,46-53` | 先用 detect 决定是否需要隔离，再展开 create/isolate 细节；对“不再嵌套创建”的关键边界有明确指引。 |
| B01 | pass | `skills/spec-worktree/SKILL.md:1-5,129-148` | 明确 `user-invocable: false`、受治理的 caller、适用与不适用情况；没有将 helper 暴露成 public 入口。 |
| B02 | pass | `skills/spec-worktree/SKILL.md:19-44,46-104,140-148`；`skills/spec-worktree/scripts/worktree-manager.sh:18-25,107-144` | detect 输入/输出、操作模式、失败行为及 caller intake contract 均有文本落点，脚本的 JSON schema 与入口说明一致。 |
| B03 | pass | `skills/spec-worktree/SKILL.md:10-15,106-110,123,125-127,140-146` | 默认不复制 env，复制需显式 opt-in；trust 状态不自动更改；并区分 caller 授权、Git 副作用和 worker 限权。 |
| B04 | pass | `skills/spec-worktree/SKILL.md:57,140-148`；`tests/unit/spec-worktree-contracts.test.js:95-112` | source 路径与 runtime 使用方式有说明；消费者测试核对源码及 caller 约束，未要求直接修改 generated runtime。 |
| B05 | pass | `skills/spec-worktree/SKILL.md:40,53,77,99-104,140-146,150-156`；`skills/spec-worktree/scripts/worktree-manager.sh:217-234,555-561` | detect 失败、重复 checkout、路径风险及非零退出后的副作用检查都有明确处理说明。 |
| B06 | pass | `skills/spec-worktree/SKILL.md:40,53,77,104,140-148`；`tests/unit/spec-worktree-contracts.test.js:37-57,74-112` | 有限的 helper 职责、caller 责任和关键静态合同测试能相互定位；未把本轮静态结论扩张成行为验收。 |
| X01 | pass | `skills/spec-worktree/SKILL.md:46-53,95-104,129-146` | 并行开发及多 worktree 场景下说明分支唯一性、已存在路径与隔离限制，并将执行和恢复留给 caller。 |
| X02 | pass | `skills/spec-worktree/SKILL.md:25-44,140-148`；`skills/spec-worktree/scripts/worktree-manager.sh:18,107-144` | 存在确定性 detect schema 时，入口说明了字段、状态和版本标识；没有把它扩张成未经说明的通用跨 Skill 协议。 |
| X03 | pass | `skills/spec-worktree/SKILL.md:10-15,77,104,106-110,123,125-127,140-146` | 涉及 env、信任配置和 Git 写入时有显式 opt-in、失败检查及权限限制，且未宣称 helper 获得发布或提交授权。 |
| X04 | pass | `skills/spec-worktree/SKILL.md:140-148`；`tests/unit/spec-work-lfg-recovery-contracts.test.js:30-36` | 跨 caller 使用时列明 intake、返回路径、worker 的 Git index 限制及 source drift 回交 owner 的约束。 |

## Findings

无符合本轮静态证据标准的 finding。未将“没有运行行为评测”作为失败依据；本结论只覆盖可从当前源码、合同和消费者测试定位的静态承诺。

## 主责深挖面发现

B01–B04、X01–X04 已逐项裁决；未发现可由当前静态材料确认的职责、授权或边界矛盾。结论限于当前入口、脚本、评测定义及所列消费者源码，不代表模型行为或真实任务效果通过。

## 未读文件

- 无。已读取 `skills/spec-worktree/SKILL.md`、该目录下脚本、eval 配置及 cases、eval fixture 脚本与 fixture 文件、agent 配置、检查表第 4 节、合同基线，以及消费者清单列出的四个测试文件。
- `skills/spec-worktree/` 下没有 `references/` 或 `templates/` 文件；因此没有该两类文件未读项。

## 结论一句话

在本轮静态合同范围内，spec-worktree 的 18 项检查均为 pass；此结论不延伸为行为质量、运行成本或现场结果验证。
