# 共享引用整改记录

相对阶段三冻结基线 `5a55514d9`，本次整改涉及 23 个文件。供总账读取的两张表共 9 项：共享目录 7 项、知识刷新包内投影 2 项，均为修改。其余 14 项仅列在后文，不重复入表。冻结源的逐件审阅见同目录 [shared.md](shared.md)。

## _shared

| 包相对路径 | 变更 | 具体中文判断 |
|---|---|---|
| `README.md` | 改 | 六份引用逐项列出实际接收包和读取时机，对应 14 个目标；移除错误的“16 份”和易过期的行数。区分共享副本、产物读者和独立同名文件，明确只读同步检查不负责发现新消费者。 |
| `references/concepts-vocabulary.md` | 改 | 示例用就餐领域作分组标题，不再以应避免的同义词 `Booking` 命名分组；示例中的标准概念仍为 `Reservation`，不改变词汇准入或删除规则。 |
| `references/html-rendering.md` | 改 | 源码链接不再假定 `main`：只有仓库、已发布提交和对应文件都有依据时才生成链接，未提交或版本不明则保留相对路径。首屏按实施计划、需求稿和创意稿分别呈现；实施单元可折叠次要细节，排序创意卡保持展开以便比较。 |
| `references/markdown-rendering.md` | 改 | 实施计划在既有目标摘要里先说明谁受到影响、什么改变或不变、为什么这样做及如何验收；需求稿先交代用户结果、决定依据和未解阻塞；创意稿按自身模板开场。不新增章节或元数据。 |
| `references/settled-decisions.md` | 改 | 明确未展示取舍的随口同意不能标为 `user-approved`。协议标识不变，替代方案和理由使用读者语言；记录过去的决定不授予本次执行权限。 |
| `references/tracker-defer.md` | 改 | 两种模式遇到建单结果不明，都须在原授权目的地按 `finding_id` 只读对账。唯一确认匹配则返回已有工单；未查清则记 `failed` 并注明不确定性，不重试、不换目的地。去标签重试须确认是标签拒绝且未建单；`no_sink` 仅用于无可用授权目的地且未尝试写入。 |
| `references/yaml-schema.md` | 改 | 区分共享速查指南与消费包内的规范 `references/schema.yaml`。经验稿在现有正文首段说明可观察现象、适用做法及重要限制；`--promotion` 只在解析安全检查上增加两项晋升字段检查，不证明枚举全面正确、证据可信或建议仍有效。 |

## spec-compound-refresh

| 包相对路径 | 变更 | 具体中文判断 |
|---|---|---|
| `references/concepts-vocabulary.md` | 改 | 由共享词汇指南同步生成。刷新包独立安装后也能读到修正后的分组示例，不再把弃用的同义词当领域标题；没有新增刷新包专属规则。 |
| `references/yaml-schema.md` | 改 | 由共享 YAML 指南同步生成。刷新或改写经验时以本包的 `references/schema.yaml` 为准，按本包模板组织读者首段，不把晋升字段检查通过当作知识内容已验证。 |

## 其他包投影

以下 12 项均为同步命令生成的修改，与上表两份知识刷新投影合计 14 份。路径均相对仓库根。

- `skills/spec-plan/references/html-rendering.md`、`skills/spec-plan/references/markdown-rendering.md`、`skills/spec-plan/references/settled-decisions.md`：实施计划的两种首屏及已有技术决策的来源标注。
- `skills/spec-brainstorm/references/html-rendering.md`、`skills/spec-brainstorm/references/markdown-rendering.md`、`skills/spec-brainstorm/references/settled-decisions.md`：需求稿展示用户结果与未决问题，已定的产品选择须有可追溯取舍。
- `skills/spec-ideate/references/html-rendering.md`、`skills/spec-ideate/references/markdown-rendering.md`：两种格式均使用创意稿的候选导语，不套计划摘要。
- `skills/spec-compound/references/concepts-vocabulary.md`、`skills/spec-compound/references/yaml-schema.md`：经验捕获包取得相同的词汇示例、规范定位和验证边界。
- `skills/spec-work/references/tracker-defer.md`、`skills/spec-lfg/references/tracker-defer.md`：交互和无人值守调用方使用同一套建单对账规则，返回结构不变。

## 创意模板

- `skills/spec-ideate/references/ideation-sections.md`（改）：标题下、背景前先写首选候选、依据和最大代价；没有候选通过时说明原因。排序不是批准，原有章节、元数据与候选明细保留。

## 聚焦测试

- `tests/unit/shared-reference-contracts.test.js`（增）：校验 README 路径集合与同步目标相等、两种模式共用对账规则、源码链接不猜默认分支、两种格式按产物区分首屏，以及创意导语排在背景之前。

## 验证

- 整改时运行 `npm run sync:shared-references`。本次收尾另运行只读的 `npm run check:shared-references`，14/14 个注册目标均与共享源一致；这不等于真实宿主已刷新。
- 整改时新增的聚焦测试 6/6 通过。扩大到 11 套 Jest 的当次记录为 114/116 通过：一个失败是两个知识包的 `validate-frontmatter.py` 字节不一致，另一个是全仓语言检查命中本次未改的 `spec-compound-refresh`、`spec-write-skill` 文案。此处记录当次结果，不将其作为当前全仓结论。
- 未运行真实跟踪器建单、独立模型复验或非工程读者实测；合同检查不证明外部系统已经去重，也不证明目标读者已理解首屏。
