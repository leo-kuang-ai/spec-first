# spec-compound 源码对照审查

状态：`source_review_complete`；本轮完整包内阅读及直接合同复核完成。这里的完成不表示已实施、独立复核、真实模型/宿主验证或研发收益兑现。

结论：CE 的已解决问题捕获、重叠去重、检索和词汇维护主能力已经融合。本地候选发布、证据回源、风险分级、受限历史读取和授权降级更适合当前 harness。优先借鉴 CE 将会话分类与正文留在主上下文的安排，先消除本地引用文案冲突和已复现的摘要/评测事实错误，再考虑新模式或新存储面。

## 范围与方法

以本地 `skills/spec-compound/` 全部文件为基准，完整对照 CE `skills/ce-compound/` 全部资产。逐文件 hash、完整行范围、双方关系见 [文件表](../file-tables/spec-compound.md)。与本轮此前已完成项字节相同的 schema、模板、脚本、agent prompt 和 fixture 复用其全文记录；没有以 diff 或目录枚举冒充全文阅读。另全文核对 candidate/promotion/reference/category/session-history 测试、`tests/helpers/compound-contract.js` 和 `docs/contracts/knowledge/knowledge-harness.md`；refresh publication 按当前相同 hash 复用已完成项。真实 debug caller 明确在捕获符合条件的学习、用户接受且同一 landing 授权覆盖新产物时才后续提交；work 仅声明 knowledge consumer，没有发现要求新增 CE caller-return API 的本地 producer。

## 能力与融合裁定

| 能力 | 双方源码事实 | 裁定及研发价值 |
| --- | --- | --- |
| 会话信息保真 | CE `references/research.md:28,76` 将分类和正文留在父上下文，仅 finder 条件委派；本地 `research.md:32,53,66` 三角色可派发，fresh worker 不天然有完整失败路径 | 建议吸收 parent-owned classify/draft，保留按需 finder 和语义 validator；避免把会话摘要误当完整失败证据。尚未复现真实模型信息损失 |
| durable publication | 本地 `promotion.md:7` 明确 verified/source/失效条件语义裁定；`:10` hash重查、CONCEPTS先发、learning最后、逐目标原子且承认partial；CE assembly直接写最终文件后校验 | 保留本地增强，不回退到先写后校验；无跨目标事务/锁保证，不声称脚本判断已解决 |
| grounding引用自洽 | 本地 `grounding-validation.md:3` 仍称刚写入永久知识且未来无需复核，`:12`建议fetch，`:41`无条件派validator；与 assembly候选/独立fetch授权、modes授权inline fallback及knowledge recall-as-advisory不一致 | 先修本地自洽：全文换成候选语境，fetch和派发沿用owner授权；历史叙述可归因，核心未核实行为/落地事实不能仅加as-of就promote |
| 分类及corpus | CE corpus-first/open taxonomy；本地schema/yaml-schema的Classification Contract v2使用canonical component/root_cause，material rewrite重分类 | 窄吸收先观察既有语料和语义alias，避免同义重复；不把CE开放字段直接搬入既有consumer合同 |
| 模式 | CE支持non-interactive及lightweight/full；本地headless强制Full，Lightweight仅低风险bounded/source-grounded/verified，context压力不能豁免 | 保留本地风险边界；无真实caller需要时不扩alias/depth矩阵。上下文不足就handoff或skip |
| 知识去重和packs | CE支持writable pack/config，本地repo docs/solutions+canonical分类 | 可借已有规范覆盖就不重复、保留repo nuance；暂缓packs/root配置产品面，不为上游新增能力扩本地owner和写权限 |
| 会话发现 | CE discover识别CLAUDE_CONFIG_DIR/CODEX_HOME，Claude metadata带cwd并用路径组成筛选；本地固定HOME默认、Claude缺cwd、Codex exact cwd | 建议窄吸收配置root与cwd provenance，显式选择本repo/祖先/后代策略；不把更宽路径匹配变成私人历史读取授权。OMP支持暂缓真实需求 |
| 提取器防御 | 本地non-object过滤、UTF-8降级、Codex stderr不当error、探测不受前10行限制；CE相应实现更弱 | 保留本地增强。修本地两条已复现的工具状态表达缺口，不能把skeleton当成功证据 |
| 词汇退休 | CE要求positive contrary evidence、alias/fold/relationships；本地shared Mutation And Evidence Contract已有相应保护 | 已有主要等价实现；不新增通用词汇引擎，不因找不到symbol就删概念 |
| refresh和caller | 本地refresh-and-discoverability:27要求单候选invoke；report:83却只recommend且不跨文档自动写；headless report:21要求end turn，CE说明结束skill但caller可继续 | 先统一refresh为owner授权内的精确recommend/调用；存在caller时复用return语义，不强制中断父任务。无consumer不增API |
| 专家prompt | 本地historian限定private output修复了CE Never write与caller写artifact矛盾；双方performance固定200ms/5KB/O(nlogn)，best-practices偏重curated技能 | 保留本地scratch修复；固定指标降为需项目证据的heuristic，当前source优先，外部查询仍需scope/egress边界 |
| 结果eval | 本地有promotion拒绝场景与shell judge，但positive fixture缺导出，prompt声称已过测试；CE同类结构不能证明本地有效 | 先修正fixture和前置事实，再评模型是否拒绝无证据promotion；judge字段/关键词存在不等于实际verified知识 |

## 实际验证与确认问题

- 5 suites / 77 tests通过，见 [测试结果](../compound-tests.json) 和 [日志](../compound-tests.log)。只证明相应静态合同、parser与validator行为，不证明模型遵循或真实宿主效果。
- 隔离JSONL：`exit_code:23` 且输出不含legacy字符串时，`extract-errors.py`报告失败，`extract-skeleton.py`却输出`-> ok`。来源为skeleton只匹配aggregated文字。研发风险是回看失败路径时丢失失败事实。
- 隔离Claude输入：3个Read只有1个result，其余未知，skeleton输出`all ok`。`flush_tools`在err为0且不是全部未知时直接all-ok，必须保留unknown数量。两方共有缺口，不是建议照搬上游。
- 本地Claude metadata输入带`cwd`，输出丢失cwd；已确认提取行为，未用真实私有历史复现跨repo误归属。配置root/匹配策略作为设计建议，不冒充已观察隐私事件。
- 在solved-ledger fixture运行`node --test test/entries.test.js`，2测试均失败，`parseEntry is not a function`：server未导出函数。见 [隔离复现](../compound-source-probes.json)。此前两次命令分别用错fixture路径和传目录导致工具错误，已改为实际文件；确认结论只依据最终显式文件运行，不拿调用错误冒充产品失败。

## 最小落地顺序

1. 本地合同一致性：candidate/recall、fetch/dispatch授权、refresh建议与父caller继续。
2. 修状态摘要unknown/structured exit、正向fixture和结果judge；针对真实失败补回归，保留已有防御。
3. parent-owned classify/draft与corpus alias小范围实验；比较知识事实保真和无重复沉淀。
4. 根据真实受限历史需求引入配置root/cwd provenance；不默认增加OMP、packs或模式矩阵。

所有建议均未实施。未调用真实连接器、未读真实私人session、未运行模型行为eval、未派独立reviewer；通用prompt中尚未实测的风险标为候选，未作为confirmed缺陷。
