# spec-optimize 全量源码审查

结论：应保留本地更严格的实验预算、测量授权、独立 holdout、measurement-only 和路径/secret 保护；CE 值得吸收的是机会定位、反 Goodhart 语义审查、比较身份与可共享结果，而不是整包覆盖或默认扩大后台调度。现状并非完美融合，已复现样本地板、自报噪声和 worktree ownership 缺口。源码审查完成；未实施、未运行真实模型或外部连接器。

## 覆盖与比较基线

双方包内全部文本、脚本、schema、模板、示例、eval 全文读取，逐文件及同 hash 复用来源见 `../file-tables/spec-optimize.md`。直接读取本地四组单测和 CE 两组 decide/worktree 测试；公共 secret helper、入口路由与已审 caller 按同 hash 全文记录复用。CE 根为 `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-optimize/`，以下同名路径分别相对此根和本地 `skills/spec-optimize/`。本项没有发现 `spec-work` 的真实 optimize artifact intake，不能虚列 downstream consumer。

## 全量能力裁定

| 能力 | 双方源码事实 | 研发融合建议 |
|---|---|---|
| 任务定位与机会选择 | 本地 loop 要求生成 10–30 个假设；CE `references/loop.md:16-41` 用 opportunity record、成本份额与最便宜 locating measurement 决定下一步 | 吸收 CE。估计需 baseline、单位、范围、假设；unknown 可保留 backlog。仅当便宜可执行测量会改变 keep/skip 时先测，不强制凑假设或所有任务先 profile |
| 数值与语义地板 | 本地 decide 更严格校验 enum、boolean、聚合、paired 和 error exit；CE loop 明确 immutable harness 仍可被 gaming | 保留本地脚本，吸收 CE `loop.md:193`：达标但违反 constraints、少做真实工作提分仍 revert；记录 harness 漏观察项，下次 run 修。脚本做数值，LLM 判语义 |
| 授权与预算 | 本地 serial=1、4 iterations/1h、runner-up=0，explicit dispatch、exact command/cwd/env/effects；CE 支持更大预算、remote 与 ticks | 保留小默认和独立执行授权。吸收 approval record 绑定 spec digest 与预算；记录已有授权，不能伪造人工确认或机械重复询问。后台 scheduler/remote 默认暂缓 |
| 费用 | 本地 loop 在累计 judge spend 达 cap 后停；CE 覆盖更长执行生命周期 | 增加 dispatch 前的剩余预算判断，覆盖 worker/research/judge；区分 host-reported 与 estimate，不当精确账单。缺可靠计价时明确限制 |
| A/A→A/B 与 measurement-only | 本地新增冻结 baseline/candidate/corpus/harness/environment、broken-run taxonomy、无 mutation/promotion | 保留。CE 没有等价完整地板，不能因 CE 更长 run-state 而回退 |
| selection/holdout | 本地 holdout 要完整 protocol、同改善 objective，且不影响 selection 排名；CE holdout 较宽松 | 保留本地增强；把同样真实样本地板补到 selection。不同 seed 不证明集合互斥，必须记录样本身份、防泄漏 |
| 比较与归因身份 | CE `experiment-log-schema.yaml` 每个 distinct reference/candidate/workload comparison 独立保存；原 baseline→final 完整再测 | 吸收，不能 in-place 覆盖，不能用共享 HEAD 代表不同 source bytes。区分 standalone/integrated contribution；不加各轮百分比或把 ordinal judge point 写成百分比 |
| 最终可共享结果 | 本地证据主要留 `.spec-first/workflows/spec-optimize` scratch；CE `wrap-up.md:16-32` 输出 tracked report | 吸收可共享报告，保留本地 commit owner；不搬自动 commit/push。报告包含原始 baseline、最终测量、holdout、回归、限制和恢复入口 |
| judge 反馈与校准 | CE 模板有每项 feedback/worst cases、failure themes；calibration 与 holdout 字段更丰富 | 吸收主题级假设，不为每个失败 case 添规则。用已有 labels 或可选盲标校准，不先展示 judge 分；缺 labels 如实限制，不硬套固定 10/50 条或冒充人工评分 |
| cache 与模型身份 | CE cache 仅按 item bytes，声称相同 item 同分；CE 模型用 cheap/strong，本地用 haiku/sonnet | cache key 需覆盖 rubric、上下文、关联 cluster、task model 等完整 judgment input；不能承诺 LLM 确定性。tier 可借，但 requested/actual/observed serving 分开 |
| per-case 回归 | CE decide 输出 regressions，但缺一侧 cases 返回空，candidate 漏 case 也可能跳过 | 可借 advisory 诊断，补 unrecorded/missing 分类；缺记录不等于无回归，完整性 gate 应先拒绝 partial run |
| 工作树与命令执行 | 本地不默认复制 env，secret deny/realpath/index/空格路径增强；measure.sh 有 TERM→KILL、Python resolver、signal/censor 区分 | 保留。两方 worktree 都存在 reset/cleanup ownership 缺口，CE 不提供可直接搬回的修复 |
| 持久化与恢复 | CE state root/approval/wait receipt/two clocks 更丰富；本地 bounded run 较简单 | 可借 run identity、恢复和 wall deadline，不复制无当前需求证据的 host scheduler、worker commit、remote push。ledger 路径独立存在检查，不能以 branch 不存在就覆盖旧 run |
| 评测 | 本地四组 tests 有数值与准入真实调用，也有 prose pins；eval 多为词命中 | 保留脚本反例，补零实验、holdout 失败、真实恢复和预算耗尽的结果 eval；字符串通过不证明模型行为 |

## 已核实的缺口与影响

1. **P1：实验目录 ownership 不充分（双方共同，隔离复现 confirmed）**。本地 `scripts/experiment-worktree.sh:75-90` 对同名同 branch 现存 worktree 直接 `reset --hard` 与 `clean -fdx`；`:469-502` cleanup-all 只按前缀匹配，路径包含检查不证明该 run ownership。隔离临时仓库分别对两方脚本调用：重复 create 删除用户 untracked 并重置 tracked；同前缀非 worktree 普通目录也被 cleanup-all 删除。建议运行 manifest/身份与 dirty 检查，不自动清扫无法证明所属的目录；危险动作需实际授权。未在用户仓库运行清理。
2. **P2：selection 样本协议可被聚合值或自报计数替代（confirmed）**。本地 `scripts/decide.cjs:501-506` 无数组时回退 candidate.sample_count；repeat 模式不强制 repeat_count。探针分别在 repeat_count=5 无原样本、ladder confirmation=5 仅聚合+sample_count=5 时得到 keep/none。测试中的 scalar judge 兼容路径也明确允许这一点。建议 stable legacy 可兼容，但 repeat/ladder 的 confirmed evidence 应有真实每次样本或可验证 receipt；不把标量当独立重复。
3. **P2：A/A 噪声真实性没有被脚本强制（confirmed，边界需准确表达）**。`measurement-admission.cjs:226-246` 只检查 observed_noise_floor 自报非负且不超过 ceiling，不从 aa_attempts.score 推导。合法身份、A/A 分数 0 与 100、自报 noise=0、ceiling=.1，得到 ab_allowed=true。这证明当前是校验上游自报事实，不证明低噪声。应预注册可计算 noise rule 并由脚本重算或校验可信 receipt，不能把语义充分性硬编码成评分器。
4. **P2：无 metric gate eval 假阳性（confirmed）**。`check-no-metric-gate.sh` 只要含“目标”等词即通过。“目标已优化，实验全部完成。”在无任何指标定义/gate/零调用证据下 exit0。需要对执行轨迹与实际命令零调用核验。
5. **prose 待统一（源码事实）**：入口尾段 any concrete suggested_fix 与 wrap-up clear/reversible、设计决策 defer 的机械应用条件不一致；measurement-only 示例相对 scripts 路径与 bundled absolute 规则不一致。测量流程在 clean-tree 前建 branch/research，需保持既有 dirty owner 与隔离边界。
6. **低优先/不冒充缺陷**：primary max_regression 校验窄于 extras，建议补负/未知值反例；target_reached 与 revert 可同时出现未必错误，consumer 只能对已集成 confirmed current-best 触发 stop。parallel-probe 只是 heuristic，不能由无 blockers 推断 provider ready。未把这些未证实影响升级为已发生事故。

## 实际验证与落地顺序

运行 `spec-optimize-contracts.test.js`、`spec-optimize-loop-contracts.test.js`、`spec-optimize-decide.test.js`、`spec-optimize-measurement-only-contracts.test.js`：**4 suites / 120 tests 全通过**，见 `../optimize-tests.json` 与 `.log`。额外 8 个脚本探针详见 `../optimize-source-probes.json`；输入为 synthetic，worktree 副作用只在可丢弃临时仓库。测试通过与上述反例同时成立；没有真实模型、费用账单、宿主调度或现场收益证据。

最小顺序：先保护实验数据 ownership、补 selection 真实样本与可计算噪声地板；再统一 eval/prose；再吸收 opportunity/Goodhart/独立比较身份/最终报告；最后用冻结研发任务评估校准、per-case、模型 tiers 与长 run 恢复。remote/ticks 暂缓条件为：出现具体跨轮任务与宿主 primitive 不足证据，再论证最小机制。
