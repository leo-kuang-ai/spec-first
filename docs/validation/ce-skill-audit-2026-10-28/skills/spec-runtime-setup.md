# spec-runtime-setup 全量源码对照审查

状态：source_review_complete；单模型 inline report-only。双方包内所有文本逐段全文审读；直接依赖与消费者见文件表。脚本运行不等于宿主安装验收。

本地是有 authority、供应链和项目证据约束的 runtime convergence owner；CE 是轻量可选工具 health/config helper。本地安装、配置、facts、单仓图与多仓生命周期有真实消费者，不能回退为 CE 的纯 health wrapper。尚未达到完美融合：应先修本地确定性边界，再窄化吸收 CE 的按需能力和原 owner 修复纪律。

## 研发能力与融合裁定

| 研发场景 | CE 源码事实 | spec-first 源码事实 | 裁定与最小建议 |
| --- | --- | --- | --- |
| 开发环境缺少辅助能力 | `ce-setup/SKILL.md:15,85` 明确可选、禁止 bulk install | 本地入口:37、registry v11、`baseline-policy.cjs` 区分 always/workflow/advisory；显式 demand | 按需 helper 已融合；保留 required baseline，但统一 supported-tools 文档，不能把缺 ffmpeg 当普通研发阻塞 |
| 配置修复 | CE `references/repo-fixes.md:58` 在产生错误的 layer 修，不能另加 override 遮盖 | `project-config.cjs:18` exact consumer map，safeLoad、duplicate/unowned 检查；host-config scope/precedence/conflict | 吸收原 owner 修复原则；不导入 CE 跨模型路由键；不要让 local preference 获得团队授权权威 |
| Artifact 放置 | CE 入口:26 的 docs_root 唯一读取与 contained fail-closed | 本地 registry artifact_contracts 与 source-first，固定 docs / .spec-first consumers | 可配置 root 暂缓，需真实消费需求和全链迁移；不只新增 config key |
| 安装与写宿主配置 | CE health 展示安装建议 | `installation-executor.cjs`、`npm-warmup.cjs`、`host-config.cjs` argv、身份、锁、快照、回滚、postverify | 保留本地增强；CE 不能替换这些机制；direct wheel hash 不等于全量传递依赖锁定 |
| 图导航证据 | CE 无同等项目图生命周期 | `providers/codegraph.cjs` 和 `graphify.cjs` 绑定安装身份、source、产物、scope/query；setup-facts consumer 回读 | 保留 provider_untrusted 与 freshness，不能把 installed/configured/indexed 升级为理解充分 |
| 多仓开发 | CE health 没有对应 owner | workspace executor/build/async/hook/lease/state/status：staging promotion、并发 lease、pending、source变化降 partial | 本地独有且有 consumer；保留失效与恢复，优先修路径与Git环境边界 |
| 知识库发现 | CE repo-fixes:92–109 根据 tracked knowledge 条件提出 store/compounding 指令 | 本地固定知识链、Setup 明确不能判断知识语义 | 可吸收确定性存在提示；优先复用既有入口，不每次 setup 重写 AGENTS 或创建第二 compounding policy |
| 文风及 Pack 分发 | CE repo-fixes:111 默认提供 noslop standing offer，入口 pack scaffold | 本地没有相应必要 consumer | 不集成强制 ce-noslop、Packs 或通用跨模型 runtime；避免扩大研发主链与 setup 权限 |
| 跨平台与降级 | CE health 的 tool availability 是线索 | registry 覆盖8宿主4平台，configured dependency scanner主要Claude/Codex；external hook marker仅 advisory | 保留多宿主投射；限制必须可见，未运行真实宿主不能宣称8端安装通过 |

## 已确认问题

### RT-1 [P1] 悬空 symlink 绕过 containment，两个直接 writer 会创建根外文件

Direct evidence: `skills/spec-runtime-setup/scripts/lib/path-safety.cjs:48` 在 existsSync=false 时跳过 lstat；`workspace-routing-inject.cjs:89–100` 把悬空 AGENTS.md 当 absent，writeFileSync 跟随 symlink；`workspace-git-exclude.cjs:58–69` 同样直接写 exclude。真实调用分别来自 workspace-graph-executor:315 和 workspace-graph-build:22,41。临时 ws/outside 两兄弟目录探针确认两个 outside_created=true，返回 created / ok=true。此处不是 rename leaf 的泛化猜测，已限制在两个可达 direct writer。

建议：共享路径 owner 用 lstat 区分真正 ENOENT 与 dangling symlink；写入使用 nofollow/独占临时文件与目标重核，补 dangling leaf/ancestor 和已有 symlink 的失败保全反例。

### RT-2 [P1] Git 环境可将外仓状态记为当前仓已观测事实

Direct evidence: `workspace-graph-state.cjs:223–228` 经 workspace-exec 继承环境执行 git -C；`inspectRepoSnapshot:37–48` 直接采信 HEAD/status。构图前后快照和 status 消费此事实。临时 A/B 两仓探针，GIT_DIR/GIT_WORK_TREE 指向B时，A的 head_sha=B，observed=true，fingerprint为空变更摘要。`source-snapshot.cjs:52–59` 已有清理GIT_*的正确机制；建议统一到共享 Git runner，补环境污染回归。不扩大为所有 target resolver 均失效。graphify:1287 的 advisory HEAD 同样继承，影响上限需单独标记。

### RT-3 [P2] 展示的修复命令未保持路径参数身份

Direct evidence: `host-config-repair-command.cjs:21` join空格，探针 folder含空格被拆参数；`project-config.cjs:75–79` 与 renderer:267–269 仅双引号，不能安全表达含 shell expansion 的目录，而且 project config下一步恒 --repo，与 folder支持不一致。实际 runtime runner 是argv；这里只确认用户复制命令的错误/潜在命令替换，不声称自动exec注入已发生。

建议：argv为唯一数据，按host shell安全渲染；保留repo/folder目标种类，不用只加引号的补丁。

### RT-4 [P2] required/helper 与 external hook 文档存在冲突

`references/supported-mcp-tools.md:38` 的ffmpeg baseline措辞与入口/registry v11不一致；external hook 入口:165允许有界只读inspect，但eval examples:47与graphify:195–196 non_actions仍说不读目录。实际graphify:818–904只读bounded marker，并明确installed/verified=false、execution unverified。consumer `src/cli/helpers/setup-facts.js:470` 还将 verified-external归unknown。应统一为marker-only advisory、执行未验证；不能据旧文案认定执行验证已经完成。

## 验证与限制

- `runtime-probes.cjs` / `runtime-probes.json`：临时目录、无网络/模型/provider安装，确认RT-1/2及路径空格展示；清理完成。第一次非canonical macOS /var 路径会触发exclude拒绝，最终脚本改为realpath临时根后重跑，避免把别名拒绝误作安全结论。
- `runtime-tests.json` / `.log`：4 suites / 33 tests通过（config consumers、routing inject、git exclude、demand policy）。这些现有测试没有覆盖已复现的 dangling leaf/Git污染，绿色不撤销finding。
- 全量账保留vendor minified全文阅读：按0–14000、14000–28000、28000–end字符段；safeLoad调用限制在safe schema，不因bundle包含js/function就报告可达执行漏洞。
- 未执行真实全局安装、联网供应链检查、8宿主操作、Windows/WSL现场或fresh model eval；缺独立评审。project-config并发覆盖、子进程后代清理和其它竞态只作后续验证候选，不作确认finding。

最小顺序：共享路径/Git边界 → 修复命令与文档/consumer一致性 → 条件知识提示 → 真实研发任务按需能力评测。保持source-first，不改runtime mirror。
