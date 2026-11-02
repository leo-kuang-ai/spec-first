# S08 私有会话 history 条件路径补充审查

日期：2026-11-02。范围：只读包内源码、测试断言与本报告写入。**未访问任何真实私有会话目录或内容，未运行发现/抽取脚本，未调用模型，也未产生外发。** 本次读取的是脚本如何工作，不是读取脚本指向的数据。

结论：history 的触发、提取、合成及进入知识候选的直接依赖已经解析，不能再以“条件路径不评价”排除。设计具备分别授权、私有scratch与promotion边界；但这些不是脚本级不可绕过的权限控制。新增一项明确的读取范围说明漂移和一项尚待合成数据验证的最小化风险，均不证明发生了泄露。

## 真实调用及消费者

`SKILL.md:43,52 → modes.md:31–41 → session-history.md:7–76 → discover-sessions.sh / extract-metadata.py → extract-skeleton.py（可选extract-errors.py） → session-historian.md → assembly.md:9–30 → promotion.md:5–14`。

- 仅interactive Full且已有explicit restricted-read授权才探测；无授权不看session roots/tool schemas，记录reason后继续assembly。headless及Lightweight禁用history。dispatch另需授权，不能从受限读取授权推导。此层是LLM执行约定；shell/Python本身不接收或验证授权receipt。
- discovery仅输出文件路径，没有网络/模型调用。Claude/Cursor按repo-name子串目录匹配；Codex枚举两个session根内时间窗所有jsonl，再由metadata按cwd过滤；Pi显式cwd编码路径更精确，override目录由环境变量选择。
- metadata先提取头部平台信息，再过滤已有cwd。绝对cwd为规范化精确匹配；无cwd记录不受该filter排除。Claude元数据当前只提取branch/session/ts，故同名或包含repo-name的目录需要caller核对，而不是有脚本级exact-repo保证。当前session排除、最多5项、branch/keyword relevance门由LLM执行，不由脚本硬限。
- skeleton/errors读取所选输入全文，去掉reasoning结构块、折叠工具记录，但保留对话文本最多800字符、命令最多120字符、错误首行最多200字符。截断不是脱敏；路径/命令/对话前缀仍可能含敏感信息。
- synthesizer只读caller给的scratch路径，禁止自行发现、读取原会话或写tracked文件；只输出技术摘要并提醒隐私内容不可进入技术总结。合成失败按缺口继续，不冒充history成功。
- assembly保留`(session history)`来源标记；history只丰富失败尝试/预防/背景，不能独立证明代码行为或修复结果。promotion要求当前源码和真实验证，历史“已修复”声明不能成为知识事实。

## 授权、范围与外发出口

| 出口 | 已有保护 | 实际强度及剩余风险 |
|---|---|---|
| 私有目录枚举/读取 | entry+modes+history分离restricted-read；无授权skip | workflow约定。脚本直接调用仍能读取传入路径，不能宣称host强制了授权。 |
| 跨repo读取 | 时间窗、repo-name发现、metadata cwd过滤、topic relevance、最多5条 | Codex发现阶段跨repo列出路径/读元数据；Claude/Cursor无cwd的候选不自动精确绑定。应让受限读取授权明确覆盖这些实际范围。 |
| scratch写入 | research创建0700目录，umask077，owner/non-symlink recheck；historian要求同目录临时文件+rename | extract-skeleton/errors的`--output`实际用普通open(w)，不自行做containment、symlink拒绝或原子发布。安全依赖caller选择并保护私有目录，不能把worker原子写约定外推到extractor。 |
| 内容交给模型 | 原始内容先写scratch，worker仅收到路径且需另有dispatch授权；未内置HTTP/SDK上传 | worker读取scratch仍会进入当前宿主模型上下文；“只传路径”不是零数据外发。现有history条款没有单独显式的发送前redaction/接收方事实，需继续遵守当前全局资料外发权限。不能从dispatch或restricted-read推导任意新provider外发。 |
| 持久化知识 | orchestrator独占product写；来源标签、当前源码grounding、promotion | 脚本产物与模型摘要均是advisory；不把“历史成功”升级confirmed。此链路未产生新的自动push/对外发布授权。 |

## 发现

**H-S08-01，P2候选（读取范围说明不准确，影响需场景验证）：** `references/session-history.md:50`写“元数据探测只读取每个文件前200行”，但`extract-metadata.py:95–110,355–358`还读取尾部16KiB；带`--keyword`时`:202–222,415–426`会在cwd过滤后读取候选全文。调用文档本身允许keyword重跑，因此这不是无关CLI路径。建议明确“初始头部元数据最多200行，另读尾部16KiB；关键词扫描是全文读取且仅在授权范围内进行”，不将文案修正替代范围授权。

**H-S08-02，P2待合成场景验证：** repo-name子串发现 + 缺cwd不排除，可能将相似仓库会话纳入候选（discovery:44–77，metadata:370–375,415）。已有语义relevance和5项上限可缩小摘要，但发生在目录枚举/metadata读取之后，不能撤销已经发生的受限读取。建议用纯合成的同名/前后缀目录与缺cwd记录确认范围，然后决定收窄路径或明确授权披露。未查看真实会话，未断言越权发生，不提升P0/P1。

内容最小化另为明确限制：extractor不做敏感字段redaction；仅凭截断与private路径不能保证发给模型前已去敏。项目权限规则仍有效，不能把这条限制解释成现有授权自动覆盖敏感外发。

## 三场景与证据上限

1. 正常：明确授权本repo七天历史及当前模型接收，候选命中当前branch；抽取最多5项进入私有scratch，合成并以当前source验证后纳入candidate。设计路径可追踪，未实跑。
2. 缺信息/冲突：仅授权compound、没有history受限读取授权；必须skip，不因本地可读或Full模式探测。测试`spec-compound-reference-contracts`只验证指令存在，不证明模型遵循。
3. 失败恢复反例：文件坏JSON或缺metadata时不能声称无相关内容；脚本保留parse_errors/files_without_metadata，synthesis失败继续但记录缺口。已读`session-history-scripts.test.js`实际断言，覆盖未知exit不变ok、错误记录提取、200行头部边界和读取失败区分；本轮未执行测试，不能说通过。

## 条件排除与闭合结论

- 不执行discovery或真实extract：当前授权只涵盖源码审查，明确不访问真实私有会话。不是未读依赖。
- session-historian已全文读，不能再因“worker条件文件”排除；可选errors脚本也全文读，因为它处理原始错误输出，是敏感出口相关依赖。
- schema/yaml/resolution-template、后续grounding/enhancement归S08主审已覆盖的知识候选链，不在此重复展开；history不会绕过那些步骤。此次history直接相关引用没有关键未解析项。
- 真实会话效果、模型遵循、权限强制、数据外发与隐私漏检没有行为证据；静态阅读完成不代表这些效果通过。无需为了闭合阅读而访问用户私有数据。

## 实际阅读清单

哈希是完整文件SHA-256；行范围为实际读取，不以计算哈希冒充阅读。

| 路径 | 实际阅读 | SHA-256 |
|---|---|---|
| `skills/spec-compound/SKILL.md` | 1–61，全文 | `02da78aefef12b96966fc4dd7e9fedd48d29ab5bbc9f03d57f1f6f6127852cca` |
| `skills/spec-compound/references/session-history.md` | 1–76，全文 | `80604f4007672e3424d1a6cbc2bd45c5324d41ddd62cc14dde5eaf5383a7dd06` |
| `skills/spec-compound/references/agents/session-historian.md` | 1–87，全文 | `c90377c86e04ea79aa6e89c5f3be02f6b6cfefeeb3c5c51f895ae7258f035ef8` |
| `skills/spec-compound/references/modes.md` | 1–43，全文 | `dec899f88bd94094f71bd98ed3f5958e1631ff60435cc34b9e391ecf9576c80d` |
| `skills/spec-compound/references/research.md` | 1–132，全文 | `fabab6ca5623bf4b6b7bdaec4c7f88658fc346bc0bc468620aee0f97d62faf2e` |
| `skills/spec-compound/references/promotion.md` | 1–14，全文 | `b32a156e82bf6dc686134de23a5a1d7f6ee13883b354b2422dcdbb80e8e949b6` |
| `skills/spec-compound/scripts/session-history/discover-sessions.sh` | 1–130，全文 | `2b00a0147dd33ab0c5d8beac5b2e92800e6de6ec955586861565edfb1b67abe4` |
| `skills/spec-compound/scripts/session-history/extract-metadata.py` | 1–466，全文 | `63adae1483e2d7cd9e5f89d5d57cc28489f572ac746a0548cdc0e38854c02b49` |
| `skills/spec-compound/scripts/session-history/extract-skeleton.py` | 1–597，全文 | `2a718e2a547ac60649b4f7edcb52fa3bbad627dc818e233cf02cdd2be9c16f32` |
| `skills/spec-compound/scripts/session-history/extract-errors.py` | 1–296，全文 | `4f4548383a25678a867554696af90de8c59f8cafecd1dfdb6aedec4dadf7b184` |
| `skills/spec-compound/scripts/run-python.sh` | 1–27，全文 | `ae5ff4417bb96ac45a8f2aee143dc0bea59fa69bf101968b543e22dd766ef7c9` |
| `skills/spec-compound/references/assembly.md` | 1–34，history实际消费者与candidate边界 | `e354d7c17e2e4bacf8e4eb24c57a77fe6301d0610e3ffe35aa0941e6124bc5e9` |
| `tests/unit/session-history-scripts.test.js` | 1–122，全文 | `f9c251d4c5b6fbf89e2c49bb090238b33c5e237d4280a4bbc90602c38125199b` |
| `tests/unit/skill-flow-p2-closure-contracts.test.js` | 39–52，history消费者断言 | `8762be702369d14462c35a93045452c8b63026aee0fc0737194f4e16e3024194` |
| `tests/unit/spec-compound-reference-contracts.test.js` | 49–57，授权后Git上下文断言 | `7832158ff975ef447c05c2fc6c091ea72e0a26723ac57d720e3beed557b3d24d` |
