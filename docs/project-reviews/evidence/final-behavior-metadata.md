# 历史行为评测元数据有界恢复

日期：2026-11-02。类型：既有评测产物只读核查，不是新增评测。只读取 `docs/project-reviews/evidence/batch1/2/4` 的结果/统计与 `/tmp/batch1`、`/tmp/batch2`、`/tmp/batch4` 中明确评测 output 路径。没有访问用户真实会话、认证配置或全环境，没有重新调用模型。仅写本文件。

## 恢复出的事实

本机三批临时目录仍可读。主结果 JSON 有 engine、observed version、start/end time、case duration；但 `model_name` 为空，requested/applied configuration 仅记录 role/engine/protocol，不能靠该文件独自还原模型与 effort。下表额外从每项指定 rollout 的**前 30–40 行**抽取白名单字段；不深扫 transcript，不读取 prompt/response 正文。仅五个样本，不外推为全部 189 次的统一配置。

| 抽样 | 产物与日志直接支持 | 工具与执行边界 | 不支持的外推 |
|---|---|---|---|
| batch1 S04-P1 GPT，第1轮 A | `codex`；CLI `0.166.0`；`gpt-6-astra`；turn_context `effort=medium`；provider=`custom` | workspace-write、network_access=false、approval_policy=never；前40行出现 `exec` 调用 | 日志 custom 不独立证明中转 URL；全部工具菜单 unknown；不能将 medium 外推其他轮或基线组 |
| batch1 S04-P1 GLM，第1轮 A | `claude_code`；版本 `2.1.311`；assistant message model=`glm-5.3`；事件字段 `effort=high` | permissionMode=`bypassPermissions`；前40行出现 Skill、Read、Bash 调用 | high 是外壳日志字段，不能证明供应商实际推理强度；全部工具可用性 unknown |
| batch2 S04-P1 复现，第1轮 A | `claude_code`；`2.1.311`；`glm-5.3`；`effort=high` | bypassPermissions；前40行出现 Skill、Read | 只确认抽样复现；不能覆盖所有筛查、正式批次或独立 reviewer |
| batch4 X-02，第1轮 A | `codex`；`0.166.0`；`gpt-6-astra`；`effort=medium`；provider=`custom` | workspace-write、network_access=false、approval_policy=never；前40行出现 `exec` | `.git` 写限制以既有错误/结果记录为准，不由 workspace-write 名称推断 Git 可写；不扩展为无工具限制 |
| batch4 S10-D1，第1轮 A | `claude_code`；`2.1.311`；`glm-5.3`；`effort=high` | bypassPermissions；前40行出现 Skill、Read、Bash | 不能用该样本证明所有 S10 A/B 相同 effort 或成功执行全部工具 |

`batch1/results.md` 记录 skill-up `0.12.0`、`environment.type=none`，GLM 经 `open.bigmodel.cn`、GPT 经 `qianxing.pro`；本次没有从认证配置验证这些域名，来源仍是历史评测记录。模型标签与外壳版本有上述抽样日志交叉支持；这不证明服务端真实模型身份或官方服务表现。

`batch2/results.md` 第5节记录独立复核只开放 Read/Grep/Glob；本次未读取该 reviewer 的完整运行元数据，因此标为“历史记录支持”，不能把五个 A 组样本的工具或 effort 借给复核者。batch2 文件开头的“只用GLM”针对早期筛查/复现，后面的正式批次有两模型，不能把页首声明泛化至整份不断追加的文件。batch4 页首的“P0、已停下、尚未做其他项”同样属于早期阶段，后文才是补跑和降级后的状态；本核查不恢复已撤销结论。

## S04 可得时间与不可回补工时

以下时间是 **runner 执行时间**，不是静态审查工时、人工审阅时间或整个试点成本。两引擎并行，case duration 求和可能大于墙钟窗口。

| 来源 | 历史 start/end（+08:00） | case duration 求和 |
|---|---|---|
| `/tmp/batch1/s04-gpt/iteration-1/result.json` | 2026-11-01 17:07:40.511049 → 17:18:30.937919 | 649,260 ms |
| `/tmp/batch1/s04-gpt/iteration-2/result.json` | 17:18:30.940069 → 17:29:23.601179 | 651,506 ms |
| `/tmp/batch1/s04-glm/iteration-1/result.json` | 17:09:51.106440 → 17:18:00.556152 | 1,077,787 ms |
| `/tmp/batch1/s04-glm/iteration-2/result.json` | 17:18:00.558172 → 17:24:55.796588 | 1,029,105 ms |

与 `batch1/runs/tally.jsonl` 对齐：S04 GPT 16 次合计 1,300,766 ms，GLM 16 次合计 2,106,892 ms。这里的 runner PASS 可能只是 exit_code 判据，不能当专业能力场景全部通过。S04 四个 iteration 最早开始到最晚结束约21分43秒，只表示这批 runner 的包络窗口，不包含准备、源码审查、评分、复核与等待。

`S04-spec-plan/analysis.md:104` 的“静态部分约 1 个审查会话片段”**不是实际耗时**。现有已查文件没有可将人员/agent静态审查活动与起止事件可靠对应的记录；本次不访问真实用户会话，无法恢复 S04 静态审查实际工时，记为 **unknown / 历史不可回补**。不能用 runner 时间、mtime、当前补审时长或再跑一遍来填历史工时。若未来需要成本收益比较，应从下一轮开始记录准备、执行、审阅、等待等阶段的实际时间。

## 重放与完成主张边界

- 已恢复的是少量历史配置与可核对时间，不是整批全量 replay manifest。
- 未抽样的运行 effort、完整工具菜单、provider 实际身份、部分失败调用丢失结果及静态审查工时保持 unknown；不使用当前配置补历史。
- raw transcript 仍在 `/tmp` 的事实不意味着永续保存；下方摘要是版本指纹，不是备份。重放还需要原 fixture、工具版本、实际可达服务与新费用授权，本次没有执行。
- 不因恢复了 effort 就提升 S06/S07 行为完成状态，也不抹掉 GLM Skill 未加载、fixture 无初始提交、饱和和无效盲评的限制。

## 全量普查增补（2026-11-02 resume 会话）

在前述 5 样本抽样之后，对 `/tmp/batch1`、`/tmp/batch2`、`/tmp/batch4` **现存的全部** 112 个 rollout transcript 做同口径元数据前缀普查（每文件只读前 80–400 行，仅取 session_meta/turn_context/assistant message 的白名单字段：engine、model、effort、cli_version、sandbox_policy；不读 prompt/response 正文）。机器可读结果：[metadata-census-2026-11-02.json](metadata-census-2026-11-02.json)（sha256 前缀 `d51916103e5190b3`）。

| 批次 | 现存/总数 | engine×model×effort 分布 |
|---|---|---|
| batch1 | 73/93 | claude_code×glm-5.3×`high`（外壳字段）38 次；codex×gpt-6-astra×`medium` 35 次 |
| batch2 | 21/54 | claude_code×glm-5.3×`high` 21 次（gpt 侧 trace 已清理） |
| batch4 | 18/19 | claude_code×glm-5.3×`high` 9 次；codex×gpt-6-astra×`medium` 9 次 |

普查结论与限制：

- 现存 trace 的 model/effort **零缺失、零异质**：同一引擎内未见任何偏离上述组合的运行；codex 沙箱策略现存 44 个 rollout 全部 `workspace-write`。这把"仅 5 样本不外推"收窄为"现存 112 trace 全量绑定，批内无异质证据"。
- 仍属 unknown：已被清理的 54 个运行（batch1 20、batch2 33、batch4 1）的 effort/provider 细节；GLM `high` 仍是外壳日志字段、不证明供应商实际推理强度；**完整工具菜单全部保持 unknown**（本普查未提取，也未在 trace 前缀中完整存在）；本次未重提 permissionMode（此前 5 样本的 bypassPermissions 记录维持原样）。
- 第五批（r2–r4）18 次运行元数据已在 batch5 各 observations 文件全量记录，不属本普查范围。
- 本普查是只读核查，不是新增评测；不改变任何行为结论的方向，只收窄元数据 unknown 的范围。

## 抽样文件与版本绑定

下表记录实际读取的结果、时间统计及 transcript 元数据来源。transcript 只读前缀抽元数据，随后整文件 hash 仅用于内容绑定，不表示阅读全文；未复制全文到仓库。

| 文件 | SHA-256 |
|---|---|
| `docs/project-reviews/evidence/batch1/results.md` | `b38817e6922d019a1ac802bdca9f5af62950bfd18695470685cb19eb0c18d56b` |
| `docs/project-reviews/evidence/batch2/results.md` | `36e519c91f046fe5df6e9b0c5cea86b902e89a1261ed521ec6b895dc274169dd` |
| `docs/project-reviews/evidence/batch4/results.md` | `eb28460c459cdba902feced829b95b6f947577f4cd0fe1fdbf86eeea64584b00` |
| `docs/project-reviews/evidence/batch1/runs/tally.jsonl` | `6824f2bf7d64935cf96ecb432776bad464401c65080c38156b0b3a85082952ef` |
| `docs/project-reviews/evidence/batch2/runs/tally.jsonl` | `bafcbf9e8925dcca718e6052875ee17d38c118597ac223fb81433aa4f9b2a333` |
| `docs/project-reviews/evidence/S04-spec-plan/analysis.md` | `8a695f7ef2a769b14ff2f7af1e4ece1f764b7f9adac98196a0fae212affdad27` |
| `/tmp/batch1/s04-gpt/iteration-1/result.json` | `9e3dd02e417098528500b2974923bd7b38ef71078064791f8f0d9ac3a536f972` |
| `/tmp/batch1/s04-gpt/iteration-1/s04-p1-reuse/with_skill/outputs/agent/run/rollout-2026-11-01T17-07-40-01a1965d-5244-77b0-97ad-eabf367788cd.jsonl` | `b3405089919e3b1ef0be78ec1dba38eb6ce0f65b32d14f180a3662155378876f` |
| `/tmp/batch1/s04-glm/iteration-1/result.json` | `cd8dbfbf3ffa43adfd9ede9e34b7a113c6203b64d37ae6dd3852062902c45a60` |
| `/tmp/batch1/s04-glm/iteration-1/s04-p1-reuse/with_skill/outputs/agent/run/a062e720-87fa-4bea-b5b9-92165c42f966.jsonl` | `5c023abfdc52f366aadef3973c06f92f0f4628b632605c62ccbdaa25e424b63c` |
| `/tmp/batch2/repro/iteration-1/result.json` | `ea75fd8b4c772d26a024e74db661e7b02d5fc13308b009392e22d7791817b48a` |
| `/tmp/batch2/repro/iteration-1/s04-p1-reuse/with_skill/outputs/agent/run/3477f8be-66a6-46e1-a6e3-cf98f17ab0d5.jsonl` | `461670f5401ddd9c969104fe1ce919bdd59dea4037828666cdd577d6ca0b1c0a` |
| `/tmp/batch4/x02-out/iteration-1/result.json` | `f5d2bfcb0444a943c2a0cebcf3bd423e4655e544c19186dab6b124c796ea97ac` |
| `/tmp/batch4/x02-out/iteration-1/x02/with_skill/outputs/agent/run/rollout-2026-11-01T19-00-01-01a196c4-2d6a-7511-8f14-2c2754926277.jsonl` | `9a2be71fb370128fae783f7bd15aee0bcacf2c089f5b321a3cd72ceaa08fe3b4` |
| `/tmp/batch4/f-s10/iteration-1/result.json` | `63b36ac6ba766c2ed4ef6f902cb6ed1ccfa578a6a392892d2d4ec0a7f6cb38fd` |
| `/tmp/batch4/f-s10/iteration-1/s10-d1-same-root/with_skill/outputs/agent/run/4bd7d302-bf6f-4095-968a-f7ddd2c46e7b.jsonl` | `e7a6eb06aa6dd02740a6e366b581f09230f857e924a7fcfee80ec532ba92acfc` |
| `/tmp/batch1/s04-gpt/iteration-2/result.json` | `d72d002ebbbda75d7b171eda3303ef2963e424a1e53fd4070e79971507ceb096` |
| `/tmp/batch1/s04-glm/iteration-2/result.json` | `222d9b9ca34daa1849a23d96b75265ae28d13b591f36ae21313f044010c6503c` |
