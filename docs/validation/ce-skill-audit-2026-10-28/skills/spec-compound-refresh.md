# spec-compound-refresh：全量源码对照

状态：`source_review_complete`。双方 41 个包内文本文件、4353 行全部审读；没有把目录枚举、hash 或字符串测试当作全文阅读。源码阅读完成不代表融合实施、真实模型效果或独立审查完成。

## 意图和能力裁定

这不是通用文档润色工具，而是维护研发知识的有效性、可检索性和保留价值。双方均维护单篇真实性及整组重叠、矛盾与继任关系；本地进一步将调查、候选、语义批准和 durable publication 分开。

下表 CE 路径相对于 `compound-engineering-plugin/skills/ce-compound-refresh/`，本地路径相对于 `spec-first/skills/spec-compound-refresh/`；逐文件、hash、全文范围见对应文件表。

| 研发能力 | 双方源码事实 | 融合裁定和最小建议 |
| --- | --- | --- |
| 知识保留价值 | CE `references/worth-audit.md` 给出删除知识后的重犯/重新调查反事实；本地同名文件已有逐 claim、原文引述、幸存 artifact 和实质引用保护 | 核心已融合。后续 eval 验证独有测量、跨文件不变量、失败替代方案确实被保留，不新增 worth 状态机 |
| 外部条件失效 | CE investigate/schema/template 新增可选 `retire_when`；本地 investigate/schema/yaml 已使用必需的 `invalidation_condition`，明确 issue closed、released、adopted 三层不等价 | 保留本地单字段；不要并列迁入 retire_when。用外部条件满足但 workaround 尚存的 fixture 验证保留说明、建议有授权后移除 |
| 描述与规范冲突 | 双方 classify/investigate 均要求 independently supported guidance 不随违规实现一起改写；本地更明确 source 权威和 report-only 产品回归 | 已有等价/更强，不重复增加工具。需要以“当前代码错误，规范仍有效”的反例验证 |
| Update/Replace 和删除 | 双方均有五分类、年龄不作依据、三条件删除、四条件迁移、检索价值和实质引用；本地加私有候选、同路径替换不得 unlink、原始 untracked 恢复副本 | 保留本地安全增强；CE 直接写继任文档、自动 commit/PR 不导回 |
| 不可验证的判断 | CE 多处 memory-only 非交互可 stale-mark；本地要求独立 drift 证据，否则 preserve/report gap | 保留本地。缺证不等 false，避免清理流程误降级外部环境知识 |
| 术语保留与历史读者 | CE `references/concepts-vocabulary.md` 的 fold→retire→delete 给出历史 ticket/learning/commit 消费者路线；本地允许正证据 retirement，但不建立例行 retired catalog | 可窄化吸收“旧词还会被谁读到、哪个幸存定义承载它”的判断。先 fold+alias；只有确有历史消费者且授权到位才给一句历史解释，不默认新增 Retired 区 |
| 术语范围 | CE unscoped refresh 推及整个 CONCEPTS；本地 vocabulary-refresh 明确 broad learning refresh 不自动授权全词表审计，且 glossary 走统一发布边界 | 保留本地 scoped neighborhood。包内不存在领域名词不证明概念消失 |
| 分类和检索 | CE schema/yaml 对 component/root_cause 开放词汇、corpus-first；本地 v2 使用 responsibility closed enums，module/tags 留精确信息、未动 legacy 保持可读 | 不整体恢复开放词汇。吸收“既有分类目录是检索消费者”的动机：验证 material rewrite 后 legacy 检索仍找得到；是否有真实遗漏需 consumer 证据，不能仅靠 CE 差异判回归 |
| 存储根 | CE SKILL 的 docs_root 有 realpath containment；本地固定 docs/solutions、显式 target repo | 暂缓可配置根。须先有多目录用户需求，再把解析放 owning runtime 并核对所有 capture/retrieve/refresh consumer，不能只在本 skill 引入第二真相源 |
| 引用检查 | 双方 validate-doc-claims 都是机械候选，非真实性判官；本地增加 private candidate 的 repo-root/target-path、UTF-8、中文提交提示；CE 有更广 commit 动词和跨盘 ValueError fallback | 建议按真实漏报窄化合并 cue 覆盖，保留 NOTE 非消失、绝不依脚本认定伪造。跨盘 realpath/relpath 的兼容性可复用 CE 思路，当前未在 Windows 复现，不列确认缺陷 |
| 发布完整性 | 本地 publication:89-119 逐目标 fresh hash、atomic rename、依赖顺序、最终链接核对及 partial publication；明确非多文件 transaction，未声称强 runtime gate | 保留本地；优先结果 eval 覆盖继任写失败、并发改动、同路径 replace、外链/heading/catalog，再考虑自动化。不得把 prose 当强制能力 |
| 结果评测 | 本地唯一 case 只测不相关 scope；judge 只要出现重构/spec-/范围任一词即 pass，完全没有检查知识结果或零越界写 | 应补工作区 before/after 与逐 claim recoverability 结果评测；先保留 3 个关键知识样本，比堆关键词测试更有价值 |

## 脚本与消费者核对

完整审读本地 `validate-doc-claims.py` 421 行、`validate-frontmatter.py` 373 行、解释器 wrapper，及 CE 对应 497/137 行脚本。frontmatter default 只拦部分 parser-safety；promotion 额外检查两个字段形态，不验证全部 YAML、enum、source 可信性或失效语义。publication 已明确把这些义务交给作者/owner，不能把 validator 的 0 外推为知识合格。

claims validator 不 fetch，使用本地 refs；相对链接只检查文件存在、忽略 fragment。本地 publication:72-77、107 明确另做计划最终树及 heading 核对，故不能把脚本未查 anchor 单独算“已违反发布合同”。需要后续结果 eval 判断执行是否遵守。

直接全文审读 `tests/unit/spec-compound-refresh-reference-contracts.test.js` 和 `tests/unit/frontmatter-validator-utf8.test.js`。前者 9 项主要是引用、字符串和顺序合同，不证明发布事务、语义完整或真实模型表现；后者只覆盖非 UTF-8 locale 读取中文。本次实际执行两套共 11 项通过，结果在 `refresh-contract-tests.json/log`。未运行模型/宿主，不能由静态合同通过外推。

## 落地顺序和成本

1. 保留当前安全合同，补 3 个结果样本：不可恢复独有知识保留、已发布外部修复但未移除 workaround、继任失败不删除原文。
2. 窄化吸收历史词消费者与 commit-cue 反例；术语处理不新增全局扫库步骤。
3. 只有真实检索/跨盘/目录需求证据出现时，再改分类或路径能力；所有知识 consumer 同步核对。

这些是审查建议，没有实施。尚未执行真实知识刷新、删除、发布、Git 操作或外部请求；inline 审查没有独立覆盖。
