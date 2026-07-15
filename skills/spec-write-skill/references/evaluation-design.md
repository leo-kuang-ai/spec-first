# Shape-Aware Evaluation Design

**trigger_condition：** 已完成 create/revise apply 的 Design Brief，准备 pre-patch eval、baseline 或 protected behavior。**must_read：** 必须读完后才可声称已建立 semantic baseline。**fallback_if_unread：** 只能报告 structural-only evidence，不得声称 baseline、semantic adequacy 或行为改善。**eval_case：** `prepatch-entry-governor` 触发；纯 Tier A typo revise 不触发。

先选择目标项目已有 native eval owner；没有时创建 target-local maintainer cases，不把 `spec-write-skill` promotion validator 变成通用平台。fresh reviewer 只接收 raw source、真实 request 和 artifact，不能收到 intended fix。

| Shape | Baseline and protected behavior | Minimum eval family |
| --- | --- | --- |
| entry governor | with-skill vs bare-menu、route collision、near-neighbor | route/discipline，必要时重复 run 报告波动 |
| artifact producer | artifact contract、错误输出和 consumer | machine assertion + semantic artifact rubric |
| deterministic setup/validation | facts、reason code、failure boundary | unit/integration assertion，不用 prose 替代 deterministic facts |
| prose/agentic workflow | authority、输出 contract、good/bad/why | positive、near-neighbor、failure fresh-source cases |
| long-horizon loop | checkpoint、stop/resume/recovery | authority + checkpoint + recovery path |
| hybrid | 每个承重面各自 evidence | 组合必要 case，不强迫统一总分 |

新增 protected behavior 必须有 `protected_behavior → source carrier → contract assertion → semantic eval case` 映射。不能把 fixture pass、模型自检或 source bytes 当作 runtime quality。反馈/transcript/issue 先是 advisory：绑定 source/host/model，脱敏、最小复现、确认 expected behavior，并取得 eval-source mutation authorization后才可转 regression；否则只记录 observation。

closeout 分开报告 deterministic checks、eval adequacy、五轴 readiness、default-source bytes、field outcome（默认 `not-run`）、not-run reasons、generated runtime status 和 residual risks。`manual_observation` 不能支持 default promotion。
