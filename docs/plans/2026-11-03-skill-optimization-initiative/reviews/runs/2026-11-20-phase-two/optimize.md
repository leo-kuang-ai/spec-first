# 实验优化：37 个文件的内容审查

**首先修数字判定，不是换报告文案。** `scripts/decide.cjs:233` 的增量和排名使用整组基线；第 255 行判断改善用的却是候选实际配对的前几项。例：两对都是 `10 → 16`，原结果是 `keep / +6 / 0.6`；基线末尾多三个未配对的 `90`，变成 `keep / -74 / -0.8222`。后两个数分别是主指标增量和排序值。脚本允许基线比候选长，前者未配对的样本不该改变这两对的改善量。数值输出冲突已复现；没有据此观察到真实实验选错赢家。

建议数值判定所有者在同一组配对上计算方向、增量与排序；另列全量基线供诊断。若协议不接受多余基线，则显式拒绝，不输出相互矛盾的结果。复验保持已配对项不变，分别加高、低的未配对基线；另测最小化、样本不足、候选多于基线和确认集。不能以此为由放宽确认样本量。

**其次修两个读者入口。** `SKILL.md:109` 写 `calibration.mode`，而规范实际为 `measurement.calibration.mode`。建议用可解析的最小 YAML 展示真实全路径，并验证只测量分支确实不改任一方；未观察到误写。收尾示例先列实验计数、后列结果，且正文要求的停止原因、独立确认及证据限制不在示例栏中。建议报告先答“哪个版本、是否保留、为什么、还有什么没证实”，然后给各必需指标，最后列尝试次数。未找到默认 `docs/optimize/` 下的本轮成品；这只是模板判断，不是独立试读。

## 全量记录

版本 `48e93fdd7`，位置相对 `skills/spec-optimize/`，括号为从第 1 行完整读至的末行。共用记账夹具及问句脚本已与前包作目录差异比对，并按本包用途复核。

| 文件 | 消费者、分支与结论 |
|---|---|
| `SKILL.md`（180） | 目标可重复测量才进普通实验；只测量、预算不足、不能独立判分均有不同出口。能串行做实验不能推导出能自己给定性实验打独立分。只测量入口字段需校正，见上。 |
| `README.md`（39） | 新用户先选客观或定性样例，已有确定修法不必进入实验。指向规范而不是要求每次把整份规范展示给人。 |
| `references/usage-guide.md`（142） | 内存、聚类、提示词示例有真实的决策区别；成组输出不能只看覆盖率。应保留首次小预算串行建议，不把裁判分数等同人类认可。 |
| `references/spec.md`（100） | 决定用客观量还是定性判断、冻结可改范围、护栏、预算和确认集；例子有可观察锚点。冻结应在看到结果前，而非挑赢家后改阈值。 |
| `references/measurement.md`（206） | 分支和本地日志分别检查，脏范围不覆盖；实际命令、目录、环境和效果单独授权。重复须有原始样本；不得以重复计数字段充数。并行探针只是线索。 |
| `references/loop.md`（302） | 假设、依赖、预算、派工、落盘、比较、合并各有责任；未通过独立确认、无整合权限或只有单独运行结果，都不能记已保留。第 205 行末的“调整目标、阈值或重采样到绿”与同文件要求新协议另开运行冲突，应明确原运行止于未确认，不得试到绿。 |
| `references/persistence.md`（75） | 单实验多次测量更新同一记录，集成、单独实验及最终配对分开；先查盘再重试。日志只在本机，分支不会携带它，检查点不等于授权。 |
| `references/wrap-up.md`（82） | 要求最终原始基线与集成版本按同一协议新比；不能把多轮百分比相加。继续实验不能清理恢复资料，最终报告不能披露私有测量输入。摘要示例仍应把结论放前。 |
| `references/measurement-only-calibration.md`（111） | 同版本先测噪声，通过后才允许跨版本对照；坏运行不记零分，结果最多交所有者评估。文件散列不能证明是两次独立运行。 |
| `references/optimize-spec-schema.yaml`（608） | 配置使用者冻结主要和必需目标、允许退化、重复、裁判费用、校准模式和工作区范围。确认集可不用，但未设不应宣称普遍有效。是给编排者用的描述性规范，非运行时通用验证器。 |
| `references/experiment-log-schema.yaml`（364） | 恢复方能区分单候选、已集成、最终和确认集；未记录不是空回归清单。保留原成绩与排除理由，不以日志存在证明测量真实。 |
| `references/example-hard-spec.yaml`（64） | 构建时长主指标由构建和测试成功约束；没有数值目标，虽启用目标停止，实际只能按预算、平台期等停。宜在例中说明。 |
| `references/example-judge-spec.yaml`（78） | 搜索结果用分级锚点和五美元上限，结果数、空查询为前置护栏。没有确认集，不得以搜索样例证明真实用户满意。 |
| `references/example-expensive-benchmark-spec.yaml`（88） | 本机时间、持续集成关键路径及总资源量均要看；主指标不动时其他必需目标也可带来保留资格。八小时例不是首次运行默认授权。 |
| `references/experiment-prompt-template.md`（91） | 实验实现者只接一个假设、可改范围和筛选信息，不测量、不提交；不能将保留集失败样本放进近期实验摘要。`git diff --stat` 是导航，不能证明新文件已纳入。 |
| `references/judge-prompt-template.md`（114） | 批量 JSON 给编排器，普通和单例有不同字段；检查条目标识集合再聚合，疑义留标志。机器易读并不证明评分已校准。 |
| `references/agents/learnings-researcher.md`（247） | 研究者按候选前置信息筛过再读全文，最多交五项与本次决策相关的经验；旧测量只作线索，不足以替新基线。输出是给人或模型读的建议，不依赖固定栏目名。 |
| `references/agents/repo-research-analyst.md`（259） | 以请求范围选择技术、架构、模式等，目录和索引用于导航，关键点回源。调用时忘给 `Scope:` 会运行全部研究；小实验应明确范围以免做无关调查。 |
| `references/ce-license.txt`（21） | 第三方许可及随分发保留的声明，非实验步骤或用户报告，勿当提示词冗余删除。 |
| `scripts/decide.cjs`（665） | 数值消费者可区分错误、护栏失败、不显著、需复测及有资格保留；保留集需同一目标也改善，单次资格不等于已整合。配对与增量来源不一已实测。 |
| `scripts/measurement-admission.cjs`（291） | 验证身份、预设协议、尝试次数、结果文件、退出及分数，从实得 A/A 观测重算极差；只检查记录完整性与算术，不证明谁实际运行。 |
| `scripts/measure.sh`（151） | 在指定目录执行命令，按平台选择超时实现；删失须区分运行器标记与命令自身退出，标准输出仅为原始值，权限及语义不由它鉴定。 |
| `scripts/parallel-probe.sh`（142） | 查端口、数据库、锁和独占设备作提示，不会执行测量命令。指定扫描位置均不存在时回退至 `.`，和“只查指定目录”的预期不一致；建议显式报告路径不可用，勿扩大检索。 |
| `scripts/experiment-worktree.sh`（616） | 创建、重用、普通清理和显式丢弃分别核对归属、分支、基线、脏内容；默认不复制环境文件，部分操作失败须留可恢复状态。`count` 仅数本地容器下带 `.git` 的目录，不是 Git 注册的全部工作树数。未操作用户工作树。 |
| `evals/README.md`（6） | 面向维护者，明确示例不是运行时路由。 |
| `evals/examples.json`（37） | 四项说明已有目标、先验再压缩、故障分流和需求不明；没有测量结果，不算行为证明。 |
| `evals/eval.yaml`（26） | 四个登记场景都在入口处；不能从这些场景外推整合、恢复及报告好读。 |
| `evals/cases/debug-request-routes-out.yaml`（24） | 不可稳定复现故障应交诊断，文字提到入口不证明没有另启实验。 |
| `evals/cases/empty-input-asks.yaml`（12） | 无目标应问优化什么；与问任何问题不同。 |
| `evals/cases/no-metric-goal-gated.yaml`（19） | 未提供指标要先定义，不是给好听的改善数字。判据看最终话术，未查实际启动次数。 |
| `evals/cases/r2-fastest-no-measure.yaml`（19） | “最快”未交代负载或指标；其判分比上一用例更宽，连讨论什么指标都不要求。 |
| `evals/fixtures/repos/mini-ledger/README.md`（8） | 界定记账场景，没给真实性能症状或业务阈值。 |
| `evals/fixtures/repos/mini-ledger/package.json`（6） | 无现成性能脚本；不应虚构标准基准命令已运行。 |
| `evals/fixtures/repos/mini-ledger/src/server.js`（25） | 内存收支两端点能形成候选负载，但读源码不能推断吞吐基线。 |
| `evals/fixtures/scripts/asks-a-question.sh`（30） | 通用问号或索要材料词即可通过，只能表明回复表面像提问。 |
| `evals/fixtures/scripts/check-no-metric-gate.sh`（32） | 能拒绝直接宣称完成的常见词；否定语境中也会匹配，如“没有指标，不能说已完成”。不证明真正开始或停止。 |
| `evals/fixtures/scripts/check-r2-asks.sh`（13） | 只查问号或索取词，不查目标/度量。应与上例统一验证“在这个负载上怎样量、没有测量不报改善”，避免另造近义词表。 |

## 本地复验

在仓库根执行以下纯数值对照。两套既有 Jest（`spec-optimize-decide` 和 `spec-optimize-measurement-only-contracts`）共 113 项通过；这条新反例补的是**多余基线怎样影响已经配对的结果**，不是重复检查缺少基线样本。

```js
const { decide } = require('./skills/spec-optimize/scripts/decide.cjs');
const spec = { metric: { primary: { name: 'units', type: 'hard', direction: 'maximize' }, degenerate_gates: [{ name: 'works', check: '== 1' }] }, measurement: { stability: { mode: 'repeat', repeat_count: 2, comparison: { method: 'paired', relative_threshold: 0.05 } } } };
for (const samples of [[10, 10], [10, 10, 90, 90, 90]]) {
  const result = decide({ spec, baseline: { metrics: { units: { samples } }, gates: { works: 1 } }, candidate: { metrics: { units: { samples: [16, 16] } }, gates: { works: 1 } } });
  console.log(result.decision, result.primary_delta, result.rank_score);
}
```

未运行真实实验、委派裁判、收费测量或集成候选。未对独立读者、团队成本或真实改进量作结论。
