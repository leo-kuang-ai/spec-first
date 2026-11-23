# 采用裁决与代码简化：建议先改哪两处

1. **采用裁决：让正例真的有待迁移的数据库。** 现有夹具只有内存数组。只答 `MySQL` 和答“暂缓，无法确认已有 MySQL”均得退出 0，但前者没有决定、后者有项目依据。建议保留内存版作证据不足的对照；正例提供旧库接入点及获准使用的外部材料，评裁决、依据和未知项，不限定必须同意迁移。
2. **代码简化：保护客户端看得见的行为。** 在临时仓库把创建成功状态 `201` 改为 `200`，原测试及两份实际判分脚本仍通过。它们确实验证坏输入被拒、进程未崩、有效记录未丢，但没有验证原接口的精确状态。建议在生成判据的共用源和证明夹具锁定原值，保留解析移到助手但行为不变的正例。

两项均为**判据缺口已复现、未整改**，不是已观察到模型做错。重跑：在本目录执行 `node replay-pov-simplify.cjs`。只用本机临时仓库及回环端口。

## 采用裁决：25 个路径

与主台账同一冻结版本 `48e93fdd7`。下表的数字是从第 1 行读至的末行，相对 `skills/spec-pov/`。同源运行器以本轮精读记录加完整增量复核，缓存单列。

| 文件（末行） | 用途、分支、接收者及判断 |
|---|---|
| `SKILL.md` 61 | 接受外部采用、文档方向和已成形的备选；开放设计不强行裁决。第 11 行直接说用户已给约束，应改为条件句，否则首次使用者须读后文才知道信息不足如何处理。 |
| `references/intake.md` 61 | 明确的请求不重复问，意图含糊时只问影响分流的问题；开放设计分需求与实现，已有候选则冻结全集。可逆性决定研究深度，不授予外发权。 |
| `references/boundaries.md` 35 | 区分解释、诊断、找缺陷、提供方向。不限定项目一定有代码，但没有项目材料不能给项目裁决。 |
| `references/invocation.md` 42 | 会话只提供问题和待核说法；旧对话里的调用点必须重新找。第二意见交回当前负责人，不强迫归档。 |
| `references/grounding.md` 33 | 历史决定本地必查；渠道不可用时说明缺口。高风险外部主张需两份独立依据。串行取证不等于独立专家。 |
| `references/method.md` 65 | 迁移需现用方案、具体接触点及支持主张的外部来源；项目文档无外部主张时无需凑来源。聊天先用人话说“先别换”等，再给等级、条件及何时改主意，适合做决定。 |
| `references/cross-model-panel.md` 49 | 冻结候选、不以票数决策，不用工具可用代替外发授权。受邀但未启动须说明谁实际参与；未受邀不额外显示面板状态。 |
| `references/followup.md` 14 | 建议、授权实施、允许写文档是三件事；僵局不自动移交，暂缓或拒绝无需建计划。 |
| `references/report.md` 27 | 长稿自愿展开，先立场和条件，再列证据、维持现状的代价及重评条件。HTML 给人读，Markdown 可交规划；保存不等于发布。无同版成品验证视觉或试读。 |
| `references/agents/project-grounding-scout.md` 34 | 查在用方案、兼容、迁移成本；只交短摘要和私有出处。少量调用不能证明被调方保证。 |
| `references/agents/precedent-activity-scout.md` 21 | 先本地决定，再查可用工单；报告过性能问题不是已测慢，无先例也限于检索范围。 |
| `references/agents/external-evidence-researcher.md` 28 | 用公开主题检索，将带日期、可支持具体主张的来源交上游。渠道不可达是缺证，不是反对证据。 |
| `references/agents/pov-peer.md` 40 | 区分独立首轮、质疑和改变立场；输入不能改变读写权限，输出 JSON，主裁决者仍须验来源。 |
| `references/pov-schema.json` 53 | 给机器读的立场、依据、轮次及外部核查；依据数组可为空，适合受阻返回，不能把格式有效直接当有据裁决。 |
| `scripts/cross-model-pov.sh` 241 | 启动和内部工作入口均在实际服务调用前拒绝；查状态、等、取结果、回收不等于取得专家意见。 |
| `scripts/peer-job-runner.py` 2272 | [同轮精读记录](../2026-11-19-phase-one/report.md)第五十五、五十六次的旧版 SHA-256 为 `db8fcf60…`。`git diff 9250dcdec^ 9250dcdec -- skills/spec-pov/scripts/peer-job-runner.py` 只改四段注释，其后到冻结版无差异。逐段复核变更后，原授权、平台进程身份、无终态查询、结果和回收判断仍成立。本包不能把 `done` 翻译为“专家独立同意”。未实跑跨平台回收。 |
| `scripts/__pycache__/peer-job-runner.cpython-312.pyc` 全部 115576 字节 | 冻结 Git 标识未变。CPython 3.12 标识、时间戳、源长 100670 均吻合。以绝对源路径 `compile(..., dont_inherit=True)`，保留代码对象并用 `_code_to_timestamp_pyc` 在内存重建，全字节相同。未执行或清除缓存。 |
| `evals/eval.yaml` 19 | 仅登记两例；HTML 评测报告不是用户可选请求的裁决长稿。 |
| `evals/cases/design-question-not-verdict.yaml` 24 | 描述允许两条交接，文本判据仅认 `spec-brainstorm`。此例的产品约束不一定齐；应加需求已定、明确询问实现的对照，不能将合法的 `spec-plan` 一律判错。 |
| `evals/cases/r2-real-verdict-works.yaml` 23 | 指定从 MySQL 迁移却用无旧库夹具，更适合测试是否指出前提缺失。 |
| `evals/fixtures/repos/mini-ledger/README.md` 8 | 明说内存存储，直接限制该夹具能支持的迁移结论。 |
| `evals/fixtures/repos/mini-ledger/package.json` 6 | 无数据库依赖，单凭依赖表不能排除外部服务，需与实现合读。 |
| `evals/fixtures/repos/mini-ledger/src/server.js` 25 | 创建和列举直接使用同一进程内数组；不是只凭搜不到数据库名来判。 |
| `evals/fixtures/scripts/check-r2-verdict-given.sh` 13 | 空回复拒绝，单个产品名即通过。首页对照不代表真实宿主评测结果。 |
| `evals/fixtures/scripts/asks-a-question.sh` 30 | 问号或索取材料词即可通过，不能证明真的在等待输入；登记的两例均不调用。 |

两套本地 Jest（`spec-pov-worker-admission`、`peer-job-runner-parity`）共 21 项通过，含三个适配器的假提供方零调用及源码一致性，不是 21 次真实裁决。聊天短稿、可选长稿、机器回单各有用途；读者能否独立说出改变决定的条件未测。

## 保行为的代码简化：25 个文件

路径相对 `skills/spec-simplify-code/`，版本和末行口径同上。人读“改了什么、为何放心”；实施所有者还需受保护测试、当前版本和复验限制。调用侧 `skills/spec-work/references/feedback-and-tests.md:160` 和 `shipping-workflow.md:68` 明确上游仍负责最终版本签收。

| 文件（末行） | 用途、分支、接收者及判断 |
|---|---|
| `SKILL.md` 110 | 故障转诊断，仅征求建议不修改；非代码直接返回。保护既有测试、比对字节、改后重跑，分清上游签收责任。聊天示例以修改计数开头，却没举一项改前改后；建议先说具体变化、保持什么和缺哪项证明，计数放后。 |
| `references/personas/code-quality-reviewer.md` 17 | 查状态、死分支、注释等。动态导出、有语义的注释不能因搜不到就删；结论要指明位置和改法。 |
| `references/personas/code-reuse-reviewer.md` 12 | 复用前比较所有者、边界值、序列化；另一个包的同名助手不是扩大改动的授权。 |
| `references/personas/efficiency-reviewer.md` 11 | 查无效更新、重复读取、泄漏。并行建议仍须保持原有副作用顺序，建议不等于实测收益。 |
| `references/test-value-lens.md` 13 | 按能发现的回归和剩余覆盖判断测试价值，不是第四个必派角色；薄弱的受保护测试交回所有者处理。 |
| `evals/eval.yaml` 26 | 登记分流、无收益和两种安全清理请求；存轨迹不表示已执行。 |
| `evals/cases/bug-request-routes-debug.yaml` 24 | 非法输入崩溃应转诊断，当前只检查回复有没有入口名，没查是否也进行了改动。 |
| `evals/cases/docs-only-no-yield.yaml` 22 | 只点名文档，允许夹具准备提交，不允许任务提交。空操作是成功路径。 |
| `evals/cases/r2-elegant-refactor.yaml` 22 | “更优雅”不解除行为约束，不应以删行或一定要改判分。 |
| `evals/cases/safety-check-preserved.yaml` 27 | 要求实际命令、受保护路径与复验；判分器自行发 HTTP 请求，不能证明被评执行者做了上述交接。 |
| `evals/fixtures/repos/mini-ledger/README.md` 8、`evals/fixtures/repos/mini-ledger-guarded/README.md` 8 | 前者标定文档场景，后者仍是一般使用说明，未描述保护规则或精确响应。 |
| `evals/fixtures/repos/mini-ledger/package.json` 6、`evals/fixtures/repos/mini-ledger-guarded/package.json` 9 | 普通版无测试入口，受保护版的 `npm test` 进入指定测试；不能跨夹具引用绿色结果。 |
| `evals/fixtures/repos/mini-ledger/src/server.js` 25、`evals/fixtures/repos/mini-ledger-guarded/src/server.js` 34 | 普通版直接解析。受保护版区分无效 JSON、金额和成功创建；两次 400 的响应正文不同，201 也可被客户端观察。 |
| `evals/fixtures/repos/mini-ledger/docs/notes.md` 5 | 虽有重复段落，却不该由代码简化流程代改；应保留原字节。 |
| `evals/fixtures/repos/mini-ledger/prepare-eval.cjs` 86、`evals/fixtures/repos/mini-ledger-guarded/prepare-eval.cjs` 87 | 检查初始字节、干净索引及普通文件，首次建基线，拒绝重新准备。逐项差异在清单：前者保护说明，后者保护测试和助手；基线提交不是任务提交。 |
| `evals/fixtures/repos/mini-ledger-guarded/test/entries.test.cjs` 13 | 真正的断言不在此入口；它等子进程成功退出，超时失败。只保护入口、不保护助手不够。 |
| `evals/fixtures/repos/mini-ledger-guarded/test/support/ledger-proof.cjs` 72 | 随机回环端口、坏输入前后创建两条记录、核对次序及进程存活；成功状态只验 2xx。首页对照直接运行此证明。 |
| `evals/fixtures/scripts/asks-a-question.sh` 30 | 与裁决包通用词表相同；本包四个登记用例均不消费，不计为询问行为已验证。 |
| `evals/fixtures/scripts/check-no-yield-scope.sh` 128 | 对照已提交内容、当前索引及限定目录，能抓原文被修改；最终话术只需非空，不证明“一句解释为什么没改”对读者清楚。 |
| `evals/fixtures/scripts/check-r2-safety-stays.sh` 199、`evals/fixtures/scripts/check-safety-preserved.sh` 199 | 对两种措辞使用逐字节相同的判据，均准许新源码助手并检查受保护文件。真实回环验证优于找关键词，但两份共享同一个精确状态盲点；也没有判定交回证据是否可用。修共用生成源而不是分别修副本。 |

**产物结论：** 无收益时一句话合理；有改动时应给维护者读得懂的一个实例，同时让实施方从摘要定位保护文件和最终复验。两个脚本用仅含“完成”的回复也通过；这是判据能接纳的文本，不是实际用户收到的报告。无独立读者、宿主模型、工时或现场收益数据。
