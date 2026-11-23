## spec-compound-refresh

| 包相对路径 | 增/删/改 | 具体中文判断 |
|---|---|---|
| `SKILL.md` | 改 | 首屏明确刷新维护既有知识，不接手普通源码重构；区分“无法验证”与“已证实漂移”，并把知识库入口检查移到最终报告之前，使读者能区分现行指导与未发布候选。 |
| `evals/README.md` | 改 | 分别说明一个范围选择用例与三个发布用例测什么，指明判据源、生成方向和校准测试；固定终态的结果不再被解释为发布顺序、故障注入或真实模型行为的证明。 |
| `evals/cases/non-solutions-scope-gated.yaml` | 改 | 保留用例标识和账本夹具，将普通源码重构改为英文二选一；整条回复仅为 `outside-refresh-scope` 才通过，否定或在标签后声称继续重构均不通过。 |
| `evals/cases/publication-preserve.yaml` | 改 | 只读任务不再只问状态和改删数组；要求给出删除决定、旧文独有小节及依赖它的文件，零改删不再等于判断正确。 |
| `evals/cases/publication-recover.yaml` | 改 | 显式授权把新文的认证复验条件与旧文的离线备份条件合并到同一字段；正文、索引和其他字节仍按固定范围处理，不需要模型越权保留旧知识。 |
| `evals/fixtures/scripts/check-publication-partial.sh` | 改 | 随共用发布判据生成而发生字节变化；实际执行的 `partial` 分支未改，仍核对先前已写 `new.md`、本轮零改删、索引和旧件两项待办，不计为新增恢复覆盖。 |
| `evals/fixtures/scripts/check-publication-preserve.sh` | 改 | 生成判据除保护原件外，还要求 `retain`、`docs/solutions/old.md#离线恢复` 和 `docs/solutions/catalog.md` 三项一致；空改删数组不能掩盖错误删旧建议。 |
| `evals/fixtures/scripts/check-publication-recover.sh` | 改 | 生成判据逐字检查合并后的两条复查条件和离线正文，同时核对索引、人工条目及可恢复的旧件；正文和链接正确但少任一条件仍不算完成。 |
| `evals/fixtures/scripts/check-scope-gate.sh` | 删 | 旧脚本把“重构”等任一命中词当作通过，曾误收“已按要求重构整个项目”。精确选择已由用例自身判定，不再保留旧脚本。 |
| `references/discoverability.md` | 改 | 改在报告输出前检查项目指令能否引导读者找到知识库；建议和已验证的入口修改因此能记入同一份报告，检查本身不扩大编辑或提交授权。 |
| `references/modes.md` | 改 | 按依赖组是否已有持久改动且尚未完成来判 `partial`，不论改动发生在哪一轮；私有草稿不算发布，未改、已完成、待办分别报告。 |
| `references/per-action-flows.md` | 改 | 合并或替换时按仍适用的指导继承来源及独立复查条件；不能只搬旧文正文，也不要求复制已证实失效且未继承的建议。 |
| `references/publication.md` | 改 | 人工降级检查明确区分 `- src/auth.js` 列表项与 `-src/auth.js` 标量，与脚本修复采用同一标准。 |
| `references/report.md` | 改 | 汇总只计本轮已在最终路径验证完成的动作。给出“新文此前已写、索引仍指向旧文、本轮未改删”的实例：应报 `partial` 和 `Replaced: 0`，不能引导读者提前切换。 |
| `scripts/validate-frontmatter.py` | 改 | `--promotion` 解析 `source_refs` 块列表时，要求连字符与内容之间至少有一个分隔空白；不再把 YAML 消费者读作字符串的 `-src/auth.js` 放行。 |

## 发现处置

- **登账范围：**相对冻结基线 `5a55514d9`，包内共 17 个路径有差异，本表登记 **14 改、1 删、0 增**；`references/concepts-vocabulary.md` 和 `references/yaml-schema.md` 是共享同步副本，由共享作者另行登账。原始逐文件判断见同目录的 `compound-refresh.md`。
- **已修：**优先处理会让消费者拿错指导或过早认定完成的问题：误接源码重构、只报零改删却建议删除、恢复正文但丢失复查条件、候选计作已发布、畸形列表被放行。没有新增状态、schema 字段或通用语义评分器。包外判据只改刷新专用的 `scripts/evals/knowledge-publication-checks.cjs`，三个包内副本随之生成。
- **跨包同步已完成：**按追加授权修改 `skills/spec-compound/scripts/validate-frontmatter.py:247`；捕获包与刷新包均拒绝 `-src/auth.js` 这一标量，两份脚本逐字节相同。未改两包的 `assets/resolution-template.md`，已用 `cmp` 确认模板字节相同。伴生包改动不计入上表。
- **发布资产语言：**以 `git diff -U0 5a55514d9` 核对本包、判据源和对应测试的新增行。入口、参考文档、评测说明、三个变更用例的题面及新增断言说明均为英文；保留的中文仅为基线夹具中的标题、正文和复查条件等字面值。判据从源重新生成，未手改生成副本。
- **本轮未实施：**模板占位符可能同时通过两项机械检查、正文链接检查只验文件不验标题片段，仍须在发布前人工核实；普通原地 Update 尚无独立行为用例。范围二选一也不证明自然路由或工作树零改动，不以该用例替代发布现场检查。

## 实测

- **范围选择：**整改时用 `skill-up debug judge` 对实际 YAML 判据输入 7 个答复，结果与预期 7/7 一致：正确标签通过；另一选项、否定、附带执行声明、中文声称已重构、英文声称应交给刷新包及空答均被拒绝。
- **一致性复跑：**单独运行 `tests/unit/compound-promotion-contracts.test.js` 的双包逐字节断言和 `tests/unit/skill-script-mirror-parity.test.js` 的同名脚本一致性断言，**2/2 通过**；未跳过或放宽原断言。
- **发布与解析：**重新生成判据后复跑全部 5 个聚焦 Jest 套件，**92/92 通过，0 项失败**。`tests/unit/knowledge-publication-judges.test.js` 覆盖双条件恢复正例、只剩任一条件的反例、错误删除判断及错误引用；`tests/unit/compound-promotion-contracts.test.js` 的缺空白反例对两包分别执行。另三个套件为 `tests/unit/spec-compound-refresh-reference-contracts.test.js`、`tests/unit/skill-script-mirror-parity.test.js` 和 `tests/unit/frontmatter-validator-utf8.test.js`。
- **生成与入口：**收尾复跑 `node scripts/evals/build-outcome-judges.cjs --check` 和 `npm run lint:skill-entrypoints` 均通过。本轮未运行真实模型、未注入发布故障；上述证据不覆盖真实宿主的执行顺序或知识使用收益。
