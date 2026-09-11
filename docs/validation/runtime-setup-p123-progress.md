# Runtime Setup P1-P3 实施证据

源方案：`docs/plans/2026-09-11-spec-runtime-setup-p123-optimization-plan.md`。

## 执行边界

- 基线：`fb7905d2`，分支 `leo-2026-09-07-update-skills`。
- 当前在原 checkout 串行实施；不修改预先存在的 peer runner、handoff、LFG、brand、plugin-sync、CE localization 等其他任务改动。
- 修改 canonical source；未手动修改 runtime mirror，未运行真实 Provider install/refresh。
- 本记录是增量证据，不是最终 verification-run-summary，不构成完成声明。

## 单元状态

| 单元 | 状态 | 当前证据 / 下一步 |
|---|---|---|
| U1 | 已修改，待整体审查与 runtime 收口 | bare 文案统一为只读；contracts 6/6；entrypoint、mode-target、guidance 测试通过；未执行 fresh-source 语义评测 |
| U2 | 聚焦验证通过 | metadata 已统一；后续 U3 将 registry 升为 v11，保留 v10 兼容读取 |
| U3 | 首轮实现与聚焦验证完成 | demand policy、显式 helper/tool 选择、workflow 需求及 provenance；待整体收口 |
| U4 | 首轮实现与聚焦验证完成 | installation/artifact 分离；已有图不改写及更多失败分支仍待补充 |
| U5 | 部分实施 | help 移至 args owner；其余 thin glue 边界待核查 |
| U6 | 部分实施 | build/clean/status 及 parent diagnostic 延迟加载；新进程 bare/check 用例已验证不加载高级图实现；其他生命周期边界仍需整体审计 |
| U7/U8 | 部分实施 | required MCP pin 已写入；producer/doctor 已接通 registry、HEAD、target、host/platform 与 host config 快照；实际依赖 digest、Provider identity/receipt currentness 联调未完成 |
| U9/U10 | 未完成 | 故障/宿主验证、审查、生成与最终收口 |
| U11 | 部分实施与验证 | 补齐权限 key 注释示例，模板/consumer 清单与配置保留行为通过；语义场景待验证 |
| U12 | 部分实施与验证 | 修复缺失/非法时间戳误报 pass；其余核心 consumer 闭环未完成 |

## 已执行验证

- `npm run test:jest -- --runInBand --runTestsByPath tests/unit/runtime-setup-registry-metadata.test.js tests/unit/mcp-setup-node-contracts.test.js tests/unit/mcp-setup-config-consumers.test.js tests/unit/mcp-setup-registry.test.js tests/unit/mcp-setup-project-config.test.js`：5 suites、50 tests 通过。
- `npm run lint:skill-entrypoints`：通过，扫描 490 个文件。
- U1 更新旧断言时先观察到明确失败；修订后 contracts 单独复跑 6/6 通过。entrypoint/mode-target/guidance 在前一轮均通过；该轮因旧 prose 断言总体失败，不能称该轮全绿。

## 当前发现

- Pi 有 CLI 投射但无原生 MCP，registry 与 host-authority 有意排除 Pi；U9 必须验证不支持的明确结果，不能把投射支持等同于 MCP setup 支持。
- `mcp-setup-config-consumers.test.js` 已通过 localization producer 关联每个 key 的源码 anchor；避免新建重复 consumer 注册表。源码 anchor 通过不代表真实模型执行过读取。

## U11/U12 第二批进展

- U11：模板补齐 `sweep_commit_approved`、`sweep_branch_mutation_approved`、`sweep_landing_approved` 注释示例；默认均 false，明确 setup 不生成授权。模板与注册表的 key 覆盖先复现缺失，再修复。
- 新增真实 filesystem/git 行为用例：刷新 example 不覆盖用户 local override、不忽略 docs/plans、不创建 CE namespace。config-consumers/project-config 共 25 tests 通过。
- U12：发现 `computeDecisionInputHealth` 对缺失/非法 generated_at 原先返回 pass；2 个反例复现后修复为 warn，保留 freshness basis 与显式 verify-only 建议。真正 required action 仍优先 error，不被 freshness warn 遮蔽。
- consumer-health/config-consumers 共 14 tests 通过。仅覆盖此读取出口，不代表其余 consumer、freshness fingerprint 或 U12 整体完成。
- typecheck 上一批通过（259 files），后续行为改动仍需最终复跑。

## U3 第三批进展

- registry v11 新增 readiness_policy；v10 通过兼容 schema 读取，未知旧 entry 保留旧 blocker 并记录 migration warning。
- 精确需求来源：CLI `--only` > always-required > `--workflow` 与 required_for 匹配；无信号不从用途推断。
- 入口对每次请求生成独立 effective registry 投影，使用已有 required/baseline_blocking 执行链，facts item 增量输出 demand。
- `--only gh` 已走真实 Node orchestration 测试，成功报告 helper scope 且不生成 Graphify 图；provider 失败判断排除非 provider ID。
- entrypoint/demand-policy/metadata 共 73 tests 通过；此前 6 个旧行为断言因取消全局 helper 阻断失败，已调整为明确需求 fixture 或新的无关能力不安装预期。
- U3 尚需补 v10 loader 兼容 fixture、完整 setup tests 与 schema/consumer 回归；其余 U4-U10 未完成。

## U3 回归与 U4 首轮实现

- 正确过滤的 setup 全量 unit 回归：35 suites / 638 tests，637 通过，唯一失败为 setup.cjs 行数上限。将 help 移到既有 args owner 后，thin-entrypoint 检查通过；不通过调高阈值隐藏膨胀。
- v10 loader 兼容 fixture 与 v11 missing/unknown policy 反例通过。未知旧 entry 不静默转 advisory。
- 曾使用 Jest 不支持的复数 testPathPatterns，导致误启动扩大范围；已终止该进程（exit 143），不能计为完整回归。其宿主重复 init 失败在 source 稳定后的同名聚焦测试复跑通过；单次失败尚不足以认定 generator 缺陷。
- U4：新增显式 `--installation-only`（复用 only 执行模式），plan/verify 分别保留只读预览/facts-only 权限。Provider installation-only 不执行图生成、query、hook 或迁移；显式 --only 图路径保持原有行为。
- `provider-readiness.v2` 增量字段 readiness_scope，schema、facts consumer、display 与图消费契约同步；installation 总结为 partial scope，不能宣称完整 graph readiness。
- Provider/mode/entrypoint 170 tests 通过；增加 scope-summary/display 后 entrypoint/facts-renderer/config-consumers 再验证。整体 U4 尚需补充现有图不被改写、失败分支与全部消费回归。
- U5 已完成入口 help 职责移出的小步收敛，其余架构单元仍待检查；U6-U10 与最终审查未完成。

## U7/U8 增量复核

- U7 已固定两个 required MCP 版本并记录 npm integrity；尚未接入安装字节校验，不构成供应链闭环完成。
- U8 producer/normalizer 已发布并保留 source_snapshot；新增显式 currentSourceSnapshot 比对，registry/host/platform 变化降为 stale，缺失字段降为 unknown。
- 四个反例先复现近期 facts 被误判 fresh，再修正比较逻辑。当前身份自动采集、host config/provider identity/artifact receipt 联调仍未完成，不能把此局部通过计为 U8 完成。

## U6/U8 当前磁盘闭环与审查修正

- `source-snapshot.cjs` 统一读取 source registry 原始字节，替代先前无法在 doctor 重建的 effective-registry hash。快照绑定 repo root、HEAD、host/platform、host config 与 precedence guard 摘要；路径来自受信 registry，不读取历史 facts 指定的任意路径。
- doctor 实际调用当前快照采集；已知变化为 stale，未知 HEAD、不安全/不可读 host config 和旧快照缺字段为 unknown。数据只记录摘要；不输出配置内容。future generated_at 不再通过零 age 冒充 fresh。
- `tool-facts.v2` 增量 schema 与 project-graph 消费合同已同步；旧未版本化快照可读，但不能证明当前身份。没有重新写入历史 facts。
- 新增真实临时 Git 仓库和隔离 host config 测试，覆盖 producer/doctor 一致、registry/HEAD/config 变化、symlink 拒绝、schema 非法摘要、旧字段缺失。测试 fixture 显式隔离 system config，避免读取真实宿主配置。
- U6 新进程反例先证明 bare/check eager-load 三个 workspace 实现，再将 import 移入 action；parent diagnostic 的间接依赖也已延迟加载。未删除 lease/rollback/state 等保护逻辑。
- 扩大回归首次 41 suites / 694 tests 中 692 通过，两个失败为上一批 pin 留下的 `@latest` 期望；已改为实际 pinned 版本并聚焦复跑 entrypoint 通过。后续全量回归另记，不能把首次失败记录成通过。
- 本批只是 U6/U8 的实现推进；实际 Provider identity、artifact receipt、非 Git source fingerprint、工作树未提交内容 fingerprint、U7 install integrity 与最终独立审查仍未完成。当前没有运行真实 Provider install、graph refresh 或用户宿主 init。

### 本批验证与审查结果

- 源码稳定后的 setup/runtime/doctor 回归：42 suites、699 tests 全通过；另外 malformed facts 6 tests 通过。
- `npm run typecheck`：260 files 通过；`npm run lint:skill-entrypoints`：490 files 通过；`git diff --check` 通过。
- 已做 inline report-only 自审，未派发独立 reviewer。审查期间 mutation guard 返回 `mutation_detected: false`；guard 覆盖 tracked diff，不包含未跟踪文件，新模块另由实现阶段直接源码检查和行为测试覆盖。
- 自审 F1：发布时重新读 registry 会让旧 probe 绑定新快照。由 spec-work 通过 `sourceRegistry` 对照修复；执行期间 registry 改变增加 `registry-changed-during-setup` limitation，doctor 不把该快照视为 fresh。反例先失败，修复后 consumer/entrypoint/registry/facts 四 suites、138 tests 通过。
- F1 修复后的 138 tests 是针对性复跑；不宣称此前 699 tests 覆盖了后加的反例。整体计划与最终 review/verification closeout 仍保持未完成。

## U4 默认行为矩阵复核

- 先前只有 `--installation-only` 开关，并未实现方案要求的默认 plan/verify scope；本批将无显式图需求的 plan/verify/refresh-facts 统一为 installation。
- 新增 `--verify-only --only <graph-id>` 的显式图验证路径，仍只有 write-setup-facts 权限；保留 refresh 与 verify 的互斥。repair 建议保留 installation-only，防止配置修复扩大为构图。
- Graphify refresh 缺图曾隐式转 first generation，仅有报告也会执行 update；两种反例复现后修为 graphify-refresh-artifact-missing。blocked provider plan 不再通过 verify 掩盖原因。
- 默认 plan/安装/默认 verify 走真实 Node orchestration fixture，检查无 init/index/sync/extract/update/query/status 图命令、旧 graph.json 与 canonical scope receipt 字节保持不变；fixture 的 host config 和目录均隔离。
- 首批 provider/entrypoint/mode/facts 四 suites、216 tests 通过；进一步 repair-scope 用例和全量回归另记。本批无真实 Provider 安装，无 fresh-source 模型行为评测；prompt 消费仍需要最终 U10/U12 验证。

### U4 提交前审查与验证

- 独立 fresh-source reviewer 报告三个问题：未选 Provider 仍可能 query、默认 verify 被误称为完整验证、通用 Workflow 步骤越过 mode 边界。现已修复；同一 reviewer 只读定点复核三项通过。这是静态语义审查，不是实际 Provider 行为评测。
- 未选 Provider 的普通 verify、安装失败补充检查和 apply 后复核均使用 installation scope；bare/check 不再推断 query 和 hook 状态。两个旧断言已按安装 scope 更新，保留 configured 与只读检查。
- 修复前 37 suites / 671 tests 通过；修复后共享工作区首次回归 668/671，通过之外包含两个 scope 旧断言和一项并发 ZCode 改动失败。修正断言后相关四 suites / 217 tests 通过（含并发任务新增的一例）。
- 暂存范围排除了并发 ZCode 变更。隔离快照的四 suites / 216 tests 通过；config-consumers 因临时仓库缺 HEAD 首次失败，补齐临时 Git 基线后 12 tests 通过。初次隔离曾混入并发未完成的常量引用，已修正暂存内容，未将该失败计为通过。
- typecheck（260 files）、skill entrypoint lint（490 files）及 staged diff whitespace 检查通过。未执行真实 Provider install/query/refresh、宿主 init、push 或 PR；完整 P123 计划仍未完成。

## U7 warmup 缓存身份增量（首轮记录）

- 目标仓库仍为 spec-first，基线 783eddd4；本批只修改 installation-executor、supported-mcp-tools、entrypoint 的缓存断言、新 warmup identity 测试、CHANGELOG 与本进度记录。既有 ZCode/registry、peer runner 等并发改动不属于本批。实现 inline，未派发实现或独立代码审查 worker。
- 8 个反例先失败，覆盖依赖 integrity/source/version 变化、旧 receipt、未来/非法时间和镜像来源丢失。缓存改为 v2，绑定声明身份，旧格式只在下一次显式安装时重新 warmup；读取直接返回已验证的 receipt，避免缓存判定与来源读取分两次产生不一致。
- 增加 latest TTL/force 回归，以及真实 Node orchestration 的 cache -> install provenance -> facts 断言。78 项首次聚焦通过；扩展后 129 项中 128 通过，唯一失败仍是并发 ZCode 平台映射的旧 config-consumer 断言，不计为全绿。node --check 和入口 lint（490 files）通过。
- bounded inline report-only 自审无新增代码 finding，但标准全工作树 mutation guard 返回 true；五个限定被审文件（包括未跟踪测试）逐文件摘要均未变。按 review owner 约定本次审查状态 failed，不能声称通过或独立覆盖；完整复核留待稳定/隔离 source snapshot。
- review artifact: /private/var/folders/0v/f_smd31500113ppkqs66c9yr0000gn/T/runtime-warmup-review-k6dovcg2/review.json。该 artifact 仅记录本次限定增量和审查限制。
- 尚未校验下载字节、npm 实际 resolved version 或当前 MCP 会话，缓存身份摘要不是供应链完整性证明。U7、U8 Provider/receipt 联调、U9/U10/U11/U12 全链路审计及最终收口仍未完成。


### U7 实际归档校验与提交前复核

- required npm warmup 先执行 `npm pack --ignore-scripts --json`，校验归档实际 SHA-512、manifest 的包名/版本/文件名/integrity，再以 `npx -y file:<archive> --help` 执行同一归档。拒绝缺失归档、摘要不符、身份不符、symlink/hardlink/目录等输入；finally 清理隔离下载目录。
- preview 公布归档验证动作；tool-facts.v2 增量提供七字段 dependency_identity。缓存 v2 保留安装来源，并严格校验完整身份；实际重试前先删除旧成功 receipt，删除失败即阻断，避免 force 失败后普通重试误命中历史成功。
- 独立 fresh-source reviewer 首轮发现旧成功缓存失效缺口及身份字段校验不完整；均增加反例并修复，同一 reviewer 只读定点复核通过，无本次范围内剩余阻断。该结论不替代先前全工作树 mutation guard 的失败记录，也不覆盖整个 P123。
- 真实离线集成使用本地无依赖测试包、真实 npm pack 与真实 npx，隔离 HOME/cache/prefix，并放置同名 local/global bin 干扰。裸绝对 tgz 曾真实失败（exit 126），改用 file: 后通过。测试验证归档 marker，拒绝 local/global collision marker；官方 MCP 归档夹具只复制及 hash，不执行其包代码。
- 当前共享工作区回归：40 suites / 699 tests 全通过；包含上述离线集成最终版本。typecheck 261 files、skill entrypoint lint 490 files 通过；npm pack --dry-run 成功。共享工作区结果包含并发改动，不能等同仅本提交的隔离全量回归。
- 验证边界：实际运行环境为 macOS/npm 11.16.0；未执行 native Windows 验证、真实 MCP session 或用户宿主初始化。integrity_status 只证明顶层归档，不能外推为传递依赖锁定或既有用户 npx cache 可信。
- 本次提交范围为 npm warmup/cache、preview/facts/schema、对应文档与测试；保留并发 ZCode/registry 等改动。U7 其他 Provider 身份、U8 receipt/source freshness 联调及 U9-U12 最终闭环仍未完成；本次提交不代表完整 P123 交付。


## U8 source 内容 freshness 闭环

- `setup-source-snapshot.v2` 增加 source_kind/source_content_sha256；producer 与 doctor 使用同一受限采集 owner。Git tracked/untracked 当前内容变化、删除和新增文件会失效；非 Git folder 在明确范围内比较摘要。嵌套 target 不扫描 sibling，v1 可读但不能冒充已核对工作区内容。
- 采集限制 20,000 文件、单文件 32 MiB、合计 256 MiB、约 3 秒；失败、symlink/hardlink/特殊文件、submodule 或扫描变化输出 null/unknown。读取使用 no-follow fd、固定大小 buffer、前后 metadata 与目录枚举校验，不宣称全局原子性。Git fsmonitor 被禁用；Git 不可用与无 Git folder 分别处理。
- 首轮 5 个反例全部复现：tracked/untracked 修改仍 pass、local config 改变未失效、folder 无法建立内容身份、symlink 未限制 freshness。修复后 21 tests 通过，边界扩展后 25 tests 通过。
- 独立 fresh-source 审查发现 scenario fingerprint 发布自失效、canonical ignored local config 漏出范围两项问题。新增三个反例先红，再精确排除 setup scenario 输出并显式纳入 `.spec-first/config.local.yaml`；28 tests 通过。同一 reviewer 唯一定点复核通过；只读审查没有冒充独立执行测试。
- 完整 `runVerificationOrMutation` 发布链在临时 Git/folder 连续两次真实写入 facts、scenario fingerprint 和 host ledger，再经 doctor 检查；只隔离外部工具 probe，不 mock publisher。当前仓库内容采集约 892 ms，source digest 成功；宿主 config symlink 限制另行保留，未宣称真实 runtime ready。
- 扩大检查 45 suites / 746 tests 通过（审查修复前）；最终审查修复后 consumer-health/entrypoint/facts-renderer 三 suites / 136 tests 全通过。typecheck 261 files、skill entrypoint lint 490 files 与 diff whitespace 检查通过。
- bounded 简化检查采用 inline reuse/quality/efficiency 三视角；复用已有 path-safety，保留预算和重复枚举校验，不为减少行数移除保护。没有执行三个独立简化 reviewer。
- 未覆盖 ignored 外部 source、依赖目录、generated runtime currentness、Provider 当前身份与 artifact receipt；后两项仍是 U8 后续工作。未执行真实宿主 init、graph query/refresh、native Windows 或全 P123 最终收口。


### U7 后续风险验证：CodeGraph npm shim 隐式副作用（初始发现）

- 只读读取 npm 官方 `@colbymchenry/codegraph@1.6.0` metadata 及归档，实际 267196 bytes，SHA-512 为 `nCN40MqmYxF7gH1QTKqlxJ1d2mzwhw3fzSdGV2wjnQKsymjM3JZnH/5rpGqhBkcUEom0qWq0WjDRvOZh2t8mFA==`（integrity 前缀为 sha512-）。package 将六种平台 bundle pin 到 1.6.0，但 shim 的 fallback 会从 GitHub 下载，并允许缺失 checksum。
- 在隔离临时 HOME 中实际运行该官方 shim 的 `--version`；设置 `CODEGRAPH_NO_DOWNLOAD=1`，只提供本地 benign 1.6.0 cached launcher 及旧 1.5.0 cache。结果 exit 0、stdout 1.6.0，同时旧 cache 被 `pruneOldBundles` 删除。隔离目录已清理，没有触及用户 runtime。
- 因此单加 `CODEGRAPH_NO_DOWNLOAD` 不足以证明 bare/verify 只读；需在 Provider-owned launcher 边界避开 npm shim 的 self-heal/cache cleanup。下一增量同时核对 baseline probe、Provider probe 与 workspace launcher 路径，不仅处理 --version 的一个调用点。本节记录发现时状态；后续 launcher 修复见下文，R10 完整安装证据与整体 P123 仍不可关闭。


### CodeGraph launcher 副作用修复与复核

- 新增 Provider-owned 纯文件 resolver `codegraph-launcher.cjs`，普通异步 process runner（sync worker 复用同一路径）和 workspace 默认 runner 在实际启动前统一调用。识别 npm Unix shim/global Windows wrapper/local .bin wrapper，核对 main/platform manifest 的 pinned name/version，直接运行已安装平台入口；缺 bundle 不进入 shim 或 self-heal cache。Windows 使用 node.exe 与独立 argv prefix，不扩大 hook receipt 为第二套 launcher truth。
- 官方原始 shim 夹具被固定为 1.6.0 归档；真实隔离 async PATH/absolute、sync、workspace 四反例先观察 cache 被删除，再修到结构化失败且旧 cache 保留。已安装 benign 平台包可以执行。额外真实子进程覆盖 Provider 无 DI 与 registry dependency probe，未用 fake runner 代替真实启动边界。
- 初始 Windows parser 2 项失败是 macOS /var 与 /private/var 的 fixture 期望不一致，已使用 canonical fixture root；不改生产路径校验去迎合测试。独立审查另发现标准 local .bin 布局漏检，PATH/absolute 两反例先红，修复后证明存在 bundle 返回 node.exe、缺 bundle 阻断。同一 reviewer 唯一定点复核通过。
- 修复后的三 suites / 18 tests 通过。共享 setup/runtime 大回归 40 suites / 718 tests 中 717 通过，唯一失败为并发 Pi 接入期间 host-invocation-receipt.schema.json 的 host enum 缺 pi；未将该失败改写为通过，最终 P123 收口需重验。typecheck 262 files、entrypoint lint 490 files 通过；npm pack dry-run 证实包含新 resolver、不发布测试归档。
- 该 guard 只处理已知 npm 布局；保留 native launcher 与其他命令的既有行为，不是任意程序副作用沙箱，也不保证并发文件替换下的全局原子性。Windows 仅做解析合同验证，没有运行 Windows 二进制。manifest/version 与直接入口检查不证明归档实际 digest；CodeGraph 安装 provenance、U8 Provider identity/receipt 与剩余最终收口仍待完成。
