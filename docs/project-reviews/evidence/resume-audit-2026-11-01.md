# 2026-11-01 续审：结论修订与覆盖记录

- 类型：源码事实为 confirmed；充分性、优先级与建议为 advisory；未运行的场景为静态推演。
- 当前 owner：Codex；用户明确授权项目负责人自主推进。范围仅审查文档与证据，不修改被审 Skill、不刷新 runtime、不提交推送，不新增外部模型评测。
- 被审源码：`049e52744`，恢复时 HEAD `1aa272a60`；`git diff 049e52744 -- skills/` 为空。后续交付前再次核对。
- 最初三个新上下文派发均收到 `429 Too Many Requests`；后续上游组与知识组恢复并完成文件，专项组最终仍失败，由主审补充。失败尝试不计入覆盖或复核。派发继承了上下文，因此即使成功也不能冒充盲评；本次修订由当前 owner 回源判断。

## 已核对的纠正

| 原记录 | 当前判断 | 源码依据与影响 |
|---|---|---|
| F-S07-01：testing 视角发现的测试弱化可能自动被移出主发现 | 原推断撤回，未证实缺陷 | `skills/spec-code-review/references/finish-review.md` Stage 5 6b 要求 P2/P3、advisory、全部贡献者为 testing/maintainability 同时成立，并明确 concrete-fix 留在 primary。测试被改弱且有具体修复并不满足这一降级前提。置信门仍需单独评估，不能移用原推断证明误滤。 |
| F-S10-02：debug 没有将 issue 内容作为外部数据 | 初审观察撤回 | `skills/spec-debug/references/investigate.md` 的 Prior work / Issue provenance 明确 ticket、PR、comments 不产生指令与授权；`pipeline-return.md` 也隔离日志。 |
| F-S10-01：至少三处才允许同根检查，one change 阻止修唯一同根问题 | 缩窄为同根影响检查的清晰度候选，P2 待场景验证 | `references/fix.md:17` 的阈值针对 defense-in-depth 与复盘；`:9` one minimal change 排除无关清理，不等于禁止同根修复。两组都漏修只证明现有方法未稳定带来改善，不能证明 Skill 导致漏修。 |
| S06 没有测试设计方法 | 不成立 | `feedback-and-tests.md` 已覆盖真实入口、刻画不等于正确、DAMP、真实实现优先、错误实现检测、旧失败和 proof protection；`implementation-quality.md` 明确 reuse/extend/compose/new 与 owner 适配。 |
| F-S06-01：W5 证明实施流程普遍成本约五倍 | 仅保留该场景成本观察 | W5 属于行为保持重构，更贴近 S21；GLM 侧未触发 Skill。不能据此外推核心实施能力或所有任务成本。 |

## 阅读进度（不等同静态完成）

恢复前后的当前 owner 已完整阅读 S06 正文及全部 14 个一级 reference；S10 正文及 fix、investigate、anti-patterns、defense-in-depth、pipeline-return、investigation-techniques；S07 正文及 modes-and-output、scope、intent-and-plan、action-class-rubric、persona-catalog、select-and-route、dispatch-reviewers、cross-model-review、diff-scope、finish-review、apply-findings。S07 的脚本、schema 与相关 testing persona 尚待核对，不能标静态完成。

已完整阅读 S16、S17、S18、S19 正文；S16 的 9 个一级 reference 与 S18 全部一级 reference。S19 脚本及 dogfood 消费者仍待核对。S01 仅入口开头，其他批次仍按原记录，不能把未使用的 `/tmp/spec-review-reading/` 分片视为已读。

上述阅读包括前一上下文的实际正文读取与本轮对截断段的补读；临时分片仅用于阅读，不是独立证据。S00/S20 保留原分析覆盖，S04 仍需补齐必读引用。

## 负责人处置

接受已测小 diff 场景饱和的边界，不继续重复 S07 同类评测。保持 S07 行为未完成，不修改最低行为覆盖要求。S06 的 GLM 对照无效且任务选型不符，跨模型核心实施能力仍待补证，不再用“形式上行为完成”掩盖该限制。

静态审查继续；未完成的必读依赖、业界来源新鲜度与逐项场景保留覆盖缺口，不以报告栏目齐全代替审查完成。

## 最终增量索引

上游组完成 `resume-upstream.md` 与84项阅读记录；知识组完成 `resume-knowledge.md` 与阅读清单；专项组由主审补齐七项定位、21个静态场景和15点适用性，仍保留S09/S11/S19关键依赖缺口。核心组S07脚本/schema/testing persona已补读，peer runner与validator模板仍部分；以前“尚待脚本核对”的文字为过程记录，以各组末尾清单为准。S00新增两份refs与三个发布模块全文阅读。S04归因分歧、F-S04-01/X-03过宽断言已在主报告收窄；X-04合并两个consumer的push合同分叉。源代码未修改，不将当前静态修订视为模型行为通过。
