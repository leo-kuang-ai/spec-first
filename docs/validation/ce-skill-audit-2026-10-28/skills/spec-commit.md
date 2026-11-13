# spec-commit ↔ ce-commit 源码审查与能力融合

状态：已完成本项源码审查。双方全部 10 个包内文本文件逐行读取，并核对共享 commit 边界、现有回归测试和直接调用接口；仅覆盖本项，不替代调用方整个 Skill 的全量审查。单模型 inline、report-only，无独立 reviewer 或真实宿主执行证明。

## 双方意图

CE 是可独立调用的本地提交入口，本地是 public workflow 持有明确授权后调用的内部 helper。双方都负责当前改动的逻辑分组、消息、精确 stage/commit 与结果确认，不负责 push/PR。不能把 CE 的 public 自动建分支策略直接替换本地的内部授权边界。

source 为 `skills/spec-commit/`、CE `skills/ce-commit/`，及本报告列明的共享边界与 consumer；未以 runtime mirror 作为审查依据，未修改产品源码或执行本项目 Git 写入。

## 能力对照

路径分别相对于本地和 CE 仓库；逐文件绝对路径与 hash 见本项文件表。

| 研发场景 | CE 实现与意图 | 本地实现及既有增强 | 融合裁定与最小建议 | 验证与代价 |
| --- | --- | --- | --- | --- |
| 只提交本次工作，排除已有 WIP | CE 入口 46、58 显式消费 `exclude:<paths>`，精确路径 commit 避免已有 index 内容混入 | 本地入口 13、22、106–120 已限制 run-owned paths、检查既有 index，明确路径 commit 会取工作树整文件内容；mixed-file 必须 caller 已验证隔离或停止。共享 `spec-commit-push-pr/references/commit-and-push.md:8–19` 已有 exclude | **已有等价且局部更强实现；建议补齐接口表述。** 在内部 helper 明确接收 caller 的 owned/excluded paths，显式排除优先；不新建 scope schema，不从 changed-file 列表推导 ownership | 现有 `spec-commit-scope-regression.test.js` 实际执行当前 source recipe，验证其他 staged 文件保留；不覆盖混合 hunks。可加 exclude 与 owned 冲突的最窄 fixture，不能把一个用例的绿灯外推全部 Git 安全 |
| 跨平台生成多行、含特殊字符的提交信息 | CE 14、46–58 要求独立 argv 调用、用宿主 file-write tool 写 repo 外消息，`git commit -F` 读取，避开 PowerShell/Bash 引号差异 | 本地 Context 26–40 已要求独立 argv，git 消费也用 `-F`；但入口 108–118 的唯一完整 recipe 仍以 Bash 的 `mktemp`、`cat <<'EOF'` 创建消息。共享 commit reference 21–27 已是 native file-write + text argv | **建议集成，优先级中。** 将 helper 的消息创建例子与已有共享 reference 对齐，保留 Git 命令语义；不新增 shell 转义框架 | Bash fixture 通过只证明 Bash。验证正文含反引号、美元符、单双引号和多段落时的实际 Git message；真实 PowerShell/Windows 证据缺失，保持未验证。本轮未运行外部宿主 |
| 让提交与已知实现单元可追溯 | CE 入口 40 仅在一个 U-ID 已在手、提交确实属于它时加 `(U3)`，不搜索 plan，不给 mixed-unit 编假 ID | 本地 helper 103–104 没有这一具体约定；共享 commit reference 37–38 已有同等规则。work 已记录 logical commit candidate | **建议复用既有规则。** 由 caller 传入已知单元，helper 消费一个可选上下文；不加载新 plan、不加跟踪数据库、不把 ID 存在视为实现完成 | 验证单单元保留、跨单元省略、无 ID 不搜索。源码对齐成本低，真实研发收益仍待任务记录观察 |
| 提交信息保留真实作者来源 | CE 40 从移植源精确复制 author/已有 trailers，不猜邮箱 | 本地入口 101 已保留 author/trailers，并区分直接移植、仅参考思路和独立改写；共享 reference 同源，`spec-commit-push-pr-context-contracts.test.js` 检查 anchors | **已有等价或更明确实现。** 保留本地，不追加冗余 provenance 流程，也不因为本轮读过 CE 就伪造共同作者 | source assertions 仅证明规则存在；本轮不提交、不做真实 author/trailer 行为测试 |
| 默认/游离分支上的安全与连续执行 | CE 34 自动从当前 HEAD 建分支，避免 work 停留于 detached/default；不追加确认 | 本地入口 13–22、60–63、86–97 分离 commit 与 branch authority，unknown/missing 时阻断该 mutation；当前用户已有明确授权须持续消费，不能每个阶段重问 | **保留本地授权设计。** 确认确需的新分支动作时才补缺口；public caller 可携带当前任务已明确授权的具体分支事实，不能从 commit token 自动造授权，也不回退为每次审批 | `ce-localization-round-1-remediation-contracts.test.js:19–26` 只检查文本边界；没有真实宿主授权链评测。CE 自动分支不作为必须还原的规范 |
| 逻辑分组与稳定完成信号 | CE 10、32、38、60 以本次组已提交及对应工作区状态为完成，untracked 参与 cleanliness；消息强调 outcome | 本地入口 9 说 single，75–82、124 实际允许多个逻辑提交，58 包含 untracked，106–120 有精确提交范围；grouping judge 只看输出词 | **核心已有等价实现；建议轻量统一表达并改善评测。** 开头改为 scoped logical commit(s) 可减少误读，不以文件数或强制 2–3 次提交替代语义分组 | 当前 `fresh-tree-logical-grouping` 用例在 main 仅传 commit authority，未明确 branch authority，可能停在分支门槛却被 judge 当分组通过；这是评测设计候选，非真实模型失败证据 |

## 直接 consumer 核对

- 本地 `spec-polish/SKILL.md:65`、`spec-dogfood/SKILL.md:63,76–83` 及 `references/phases.md:128` 只有单独授权时调用；已全文读完这三个 consumer 文件。dogfood 报告里的 `uncommitted` 明确不冒充 commit 完成。
- 本地 work 的完整 shipping reference、debug 的完整入口已在 simplify 深审中读完并有相同 hash 记录；它们保留未获 commit/landing 授权的 verified uncommitted 出口。当前 run-owned 与 mixed-file 边界比 CE 的文件级分组更明确。
- CE polish 完整入口 22、dogfood 完整 phases 151、165 会自动调用本地 commit；CE debug 完整入口 105–118 会把 fix-owned scope 给 commit。本轮不把这些 caller 的授权策略同步到 spec-first。
- 本地共享 `commit-and-push.md`、完整 branch-creation reference 与当前 helper 的 mixed-file 说明一致；branch-creation 的 remote-base 选择属于将要发布的分支工作，不强行搬进 commit-only helper。
- consumer 本身引用的 browser/server/live setup 等能力由各自 Skill 负责，未把本项提交接口审查外推为其完整执行链已审完。没有沿调用图无界扩张产品范围。

## 运行证据与缺陷附录

已有 `targeted-tests.json` 记录的实际命令包含 `spec-commit-scope-regression.test.js` 和 `spec-commit-push-pr-context-contracts.test.js`，exit 0；两份测试源已完整读取。本轮没有重复跑该批次。前者在临时 repo 执行当前 canonical recipe，后者包含真实 index/checkout fixture；它们不证明宿主、权限链或 Windows 行为。

本轮新增 [commit-judge-probes.json](../commit-judge-probes.json)，仅在自动删除的临时 fixture repo 运行当前 judge：

1. `README.md` 已被 staging，但没有新增提交，最终文本为 `commit_authorization_missing`，`check-auth-gate.sh` 仍 exit 0。它检查 commit count 和 message，没有检查“不 stage”的承诺。
2. 最终文本“没有提交，也没有分组。”使 `check-logical-grouping.sh` exit 0；它的关键词不能证明实际分组或 commit outcome。

建议把 eval 断言绑定 pre/post index、HEAD、实际 commit path/message 与排除路径；保留正常对照，避免只匹配中文/英文关键词。上述返回码是 confirmed script observation；对模型/产品影响的判断未经过 independent validator，`validation_status: unresolved`。本轮不自动修复，Actionable Findings 无 apply 项。

## 最小融合顺序与限制

先复用已有共享的 native 消息写入、U-ID 与 exclude 约定，再补与真实副作用相匹配的评测。保留本地 internal/helper、授权、mixed-hunk、owner 与 attribution 设计。无需新增 Skill、脚本框架或 runtime asset。

本项已完成全部包内源码和上述直接接口的对照结论；全局跨 Skill 依赖一致性仍由整轮审查负责。未运行 fresh-source 独立评估、真实宿主提交或 Windows。源码审查完成不等于融合已实施、merge-ready 或“完美融合”。
