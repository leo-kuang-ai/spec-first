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


## U7 CodeGraph 安装归档与证据传递

- 扩展现有 npm archive 验证 owner，共用实际 SHA-512、manifest identity、contained scratch 与清理逻辑；warmup 保留 npx 路径，CodeGraph 使用 npm install -g file:<已校验归档>。registry 固定 1.6.0 顶层归档 integrity/source，直接 apply 和统一 Provider dependency 阶段都保留安装后版本复核。
- 首批三个测试失败，其中直接 apply 真实观察到错误 digest 仍进入 npm install；修正后聚焦 27 tests 通过。图专用旧测试改为明确已有依赖，仅测试 sync/reindex/query 原场景；安装本身由新增归档测试承接。
- 真实离线测试使用隔离 HOME/cache/prefix、本地无依赖包、真实 npm pack 与 npm install，证明全局安装消费已校验归档并替换旧包；不安装真实 CodeGraph 平台二进制，不触及用户 runtime。先前 warmup 的真实 npx collision 用例保留。
- 首轮独立源码审查没有发现问题，但后续 runSetup 联调发现其未覆盖的第三条旁路：applyReadinessPolicy 将显式 tool 标为 required，baseline installer 按 effective host registry 先运行 npm install，adapter 因版本已就绪跳过校验。原调用证据为首条命令按包名安装，Provider identity 缺失。修复后 baseline/preview 通过同一 providerOwnsInstallation 判断归还安装 ownership，保留 host-config 步骤，Provider action 明示 archive_verification。
- 独立 reviewer 唯一 follow-up 确认上述旁路、失败传播与预览一致性修复；两轮均为只读源码审查，未独立执行测试，前轮结论不冒充覆盖第三条旁路。
- tool-facts.v2 的 Provider dependency_identity 是兼容增量，新增 installer=npm-pack+npm-install；CLI 保留七字段有效身份，拒绝扩大的 verification_scope。warmup cache 仍只接受原 npm-pack+npx；旧 facts/已安装且本次未安装的 Provider 不补造安装证据。
- 本轮 inline 完成 spec-simplify-code 的 reuse/quality/efficiency 三视角：共用 archive owner，baseline 与 preview 共用 ownership 判断；没有为减少行数移除校验或引入新安装缓存。未派发三个独立简化 reviewer。
- 首次共享回归 42 suites / 727 tests 中 726 通过，唯一失败是本轮统一入口缺 identity 的真实旁路；修复后的最终回归结果另记。过程中另有 fixture 版本输出不符与错误预期 reason_code，均按实际 command contract 修正，未削弱生产版本校验。
- 验证范围仍是顶层 npm 归档；不外推为 optional 平台包、传递依赖或安装后文件完整性。U7 的 Provider 探测身份发布、U8 当前 identity/receipt 比较及 U9–U12 最终收口仍需核对，整体计划保持未完成。

### 本批最终定点验证

- 第二次共享大回归 42 suites / 728 tests 中 726 通过；新预览测试误读 actions 字段（实际为 planned_operations），另一失败证实失败汇总会把 Provider digest 错误覆盖为 missing_dependency。修正测试字段，并让 tool probe 合并实际 Provider dependency 安装结果，保留原始原因和安装证据。
- 最终九 suites / 244 tests 全通过，覆盖完整 entrypoint、Provider、registry、facts、CLI consumer health、warmup/cache/integrity 与真实离线安装。该结果是修复后的针对性回归；不将此前大回归的两个失败改写为全绿。
- typecheck 262 files、skill entrypoint lint 490 files 与 staged diff whitespace 检查通过。独立暂存范围只纳入本轮增量，排除 Pi/ZCode/Graphify 与其他任务的已有修改；验证来自共享工作树，不等同本提交的独立全量快照验证。未执行真实用户宿主 install/init、native Windows、push 或 PR。


## U8 Provider 当前身份生产与消费

- Graphify 复用既有 `resolvePythonGraphifyCommand` / `probePythonDistributionIdentity`，在 installation 与 artifact verify 两个 scope 发布 `provider_identity`：package、version、实际 command/interpreter、installer 和有界 installed inventory 的 `inventory_sha256`。不输出完整包清单；空/非法清单摘要为 null。
- apply 在图操作完成后重新 probe 实际 launcher/interpreter，再发布身份；不把 plan 中的历史 pin 或旧解析器身份当作当前事实。新增版本漂移与同版本更换 interpreter 反例，分别证明降级和避免 interpreter/hash 混用。
- `provider-readiness.v2` 增加受限 identity 对象；CLI `normalizeSetupFacts` 仅保留必需字符串和合法摘要。facts 及 schema 验证保持兼容，未知或不完整身份不升级为 confirmed。
- 首轮审查发现 apply 可能发布旧 interpreter 与新 inventory 的混合身份（P2）；修复为使用 final probe 的 interpreter，并补反例。独立 follow-up 定点复核通过。
- 本批审查修复前聚焦 4 suites / 164 tests 通过，修复后定点复跑 2 suites / 65 tests 通过；typecheck 262 files、入口 lint 490 files、diff check 通过。
- 当前仍未把 provider identity 纳入 doctor freshness 比较，也未把 Graphify scope receipt 的 graph hash 与 identity 统一为一个 durable truth；CodeGraph 已有顶层 npm archive identity，平台 bundle/传递依赖仍明确不在证明范围。


## U8 Graphify 当前身份消费切片

- doctor 在 source snapshot/TTL 通过后，复用 Graphify readCurrentIdentity 与既有 resolver，比对 package/version/command/interpreter/installer/inventory_sha256；不读取 facts 中的命令作为执行目标，不安装、不构图、不 query。
- 已观察红测试：当前 command 变化时 doctor 仍返回 fresh；接线后身份不符返回 stale，探测失败、旧 facts 或缺 inventory 返回 unknown。同步撤销 Provider fresh 状态及计数，保留原始 facts；source 已失效时不再运行身份探针。
- 验证：三个相关 suites / 95 tests 通过；随后增加计数降级与缺摘要检查，两个 suites / 33 tests 通过。npm run typecheck 262 files 通过；最后一处 limitations 数组改为拷贝，node --check 与 diff --check 通过。
- 独立 fresh-source 审查指出真实 Python import 可产生 bytecode，launcher 非零/超时被误判为版本漂移。新增隔离真实 Python launcher/import 测试观察到 __pycache__ 新增；两个 launcher 失败测试也观察到 stale 误判。修正 identity runner 强制 PYTHONDONTWRITEBYTECODE=1、跳过 npm collision classification，并拆分 version 命令执行失败与版本不符。
- 所有 identity 子命令共享单调时钟 5 秒预算，超限 unknown 并给出 graphify-identity-probe-timeout；测试证明预算耗尽后不启动后续候选。预算不含同步文件读取与进程终止开销，不是严格墙钟或任意程序副作用沙箱。
- 最终三个相关 suites / 99 tests 通过；lint:skill-entrypoints 490 files 通过。独立 reviewer 的唯一 follow-up 定点复核通过，无本切片新增阻断；reviewer 只读审查，未独立执行测试。CodeGraph 当前身份、既有 graph scope receipt 的 consumer 联调以及 U9–U12 最终收口仍待完成，整体计划未完成。


## U8 Graphify receipt 消费闭环

- 红测试观察到 graph.json 改变后 doctor 仍 fresh。复用既有 scope provenance reader，在已验证结果中传递既有 graph_sha256；schema 增加兼容可选字段，normalizer 不再丢弃 scope_provenance。没有新建 durable receipt。
- doctor artifact scope 核对历史摘要、当前 receipt 和当前图。覆盖仅图变化、图和 receipt 同时更新、旧/缺 receipt、旧 facts 缺摘要及缺 scope；后两者不猜测当前范围。installation scope 跳过图检查。当前 identity/source 已 unknown/stale 时不再扩大读取，保持保守降级。
- 首轮独立审查发现大小预检后仍用路径无限读取的并发漏洞。按现有 source snapshot 模式改为 fd 读取，O_NOFOLLOW/O_NONBLOCK、单链接普通文件检查、实际 size+1 上限与读后 fd/path/containment 复核；receipt 64 KiB、图 64 MiB。注入测试覆盖 open 前增长与替换 symlink，均 invalid。
- 三个相关 suites / 101 tests 通过；包含真实临时图/receipt 的 producer-facts-schema-normalizer-doctor 链路，Provider 命令仍使用既有 stub，receipt reader 不执行命令。独立 reviewer 唯一 follow-up 定点复核通过，未独立运行测试。
- 不证明图语义、跨文件原子性或严格墙钟上限；当前 scope receipt 仍未绑定图生成时的 source content snapshot，CodeGraph 当前身份及 U9–U12 整体收口仍待处理。整个 P123 计划未完成。

- 本切片最终验证：npm run test:mcp-setup 33 suites / 695 tests 通过；最后收紧历史 artifact root 后，两套 identity/consumer suites / 39 tests 通过；typecheck 262 files、入口 lint 490 files、diff check 通过。完整回归运行于共享工作区，不外推为本提交的隔离全仓测试。


## U8 构图源码内容绑定

- 红测试证明源码改变后只重新发布 tool facts，旧图仍可 fresh。Graphify generation/refresh 前后复用既有 source snapshot 有界采集，仅一致且完整的内容身份写入现有 receipt 的 source_snapshot 三字段；normalizer/schema/doctor 共同消费，不新建 durable 文件。
- doctor 比较历史绑定、当前 receipt 与当前源码；缺绑定为 unknown，已知内容不同为 stale。构图期间源码变化时清除绑定、记录专用 source_reason_code，Provider degraded；前后快照不可得时 unknown，保留真实图/query lifecycle。
- 首轮独立审查发现无 HEAD 时虽写 snapshot=null，apply 仍 fresh。真实临时 Git fixture 复现并修复，增加稳定源码 fresh、构图期间变化 degraded、无 HEAD unknown 三个场景。11 个旧 Provider fixture 和三个 entrypoint fixture 未建立 HEAD，更新其 freshness 预期；不改变其安装、query 或 hook 断言，也不修改 CodeGraph 的预期。
- 三个聚焦 suites / 104 tests 通过；typecheck 262 files、入口 lint 490 files 通过。独立 reviewer 唯一 follow-up 定点复核通过，未独立执行测试。
- 共享工作区完整 setup 回归首次为 683/698：三项为本轮旧 entrypoint freshness 预期（已更新），另十二项来自并发 registry.cjs 改动删除 getDiagnosticRegistry 导出。该并发改动不属于本切片，未覆盖或纳入提交；使用基线 33f09024 加本切片的独立 checkout 继续验证。
- 前后采样不证明过程中没有短暂变化；内容身份按整个执行 repo/folder 的既定 source 范围计算，未知/不安全/超预算采集不伪装成绑定。旧 receipt 需显式生成/refresh，不通过 verify 补造。CodeGraph 当前身份与 P123 最终整体验收仍未完成。

- 最终隔离验证：基线 33f09024 + 本切片，两个 consumer/identity suites / 39 tests 通过；完整 mcp-setup 32 suites 通过、1 suite 失败。唯一失败为已在 HEAD 中存在的 plugin-modules 锚点别名断言：HEAD 的 plugin-sync.js 仍有两份字面量表，而 HEAD 测试要求别名（直接 git show 核实）；该文件的并发工作区修复未纳入本切片，不能声明本提交整仓全绿。
- 共享 registry 的 getDiagnosticRegistry 导出随后由并发工作恢复；再次运行 entrypoint/registry 两 suites / 88 tests 全通过。隔离 checkout 与待提交的七个 production/schema/test 路径逐字节一致，验证副本已在检查完成后清理；不把其他 dirty source 的成功当作本提交证据。

## U8 CodeGraph 当前安装身份闭环

- 复用既有 npm launcher resolver 发布 package/version/installer/command/inventory_sha256；摘要绑定解析出的主包与平台包名称、版本、目录、真实入口及固定 prefix，不含业务 argv。未另造 resolver 或 durable receipt，provider/facts/schema/normalizer 使用现有兼容身份字段。
- doctor 复用 Provider 的 readCurrentIdentity，从当前环境定位命令，不执行历史 facts command。版本/身份不符 stale；旧 facts 缺字段、native 未识别、探针失败 unknown；source/TTL 或前一 Provider 已失效时停止后续比较，保留尚未逐一探测的限制。
- 首轮独立 fresh-source 审查发现 producer 在前序 version/status/query 成功后，最终身份探针失败仍 fresh。三个反例已先观察到失败，再修复 unknown/degraded 分界；verify/apply/configuration reconciliation 均覆盖，保留实际 lifecycle，配置成功不能洗掉缺失身份。另一个红测覆盖探针期间平台 manifest 改变，改为前后 resolver 核对，不发布旧身份。
- 新 Windows fixture 覆盖解析、producer/facts/schema/normalizer，实际命令由 DI runner 替代。独立复审确认原 P1 闭合，另指出 Unix 默认 runner 测试缺 Windows skip；已按平台限定执行，保留 Windows 解析合同。Unix 测试真实调用默认 process runner 与隔离 shell fixture，npm shim 的 exit 99 不执行；前后比较目录、mode、文件字节和 symlink 目标，未观察到写入。此验证不是真实 Windows 二进制或生产 CodeGraph 任务。
- 修复旧测试对本机 npm 安装的意外依赖：CodeGraph provider fixture 显式空 env；三个缺安装身份的 fresh 预期改 unknown，同时保留全部 lifecycle/sync/query 断言。有效 npm fixture 的 producer 正例仍要求 fresh。entrypoint 同类纯命令 stub 更新为 unknown，仍要求实际 host 配置和 lifecycle 成功。
- 验证：三套 identity/consumer suites 55 tests 通过；Windows skip 与字节比较增强后，launcher suite 15 tests 通过；typecheck 262 files 与入口 lint 490 files 通过。共享工作区完整 mcp-setup 首轮 697/698，通过 32 suites，唯一失败是上面的 entrypoint 旧 fresh 预期，已修正，定点复跑结果另记。
- inline simplify 按 reuse/quality/efficiency 三个 lens 检查：复用 launcher 与 CLI 身份比较 owner；前后解析、失败降级和配置阻断为 protected；apply 内部用 verifyReadiness 避免重复附加身份。没有额外派发 simplify workers，不声称三个独立审查。
- 元数据与版本前后观测不是原子快照，不能证明同版本二进制/传递依赖字节完整性；5 秒仅限制身份子进程，不包括同步文件解析。CodeGraph database/source currentness、U1–U12 逐项最终验收和 structured closeout 仍未完成，本轮不关闭整体计划。
- 定点复跑结果：entrypoint/provider 两套共 137 tests 通过；本轮完整 suite 的历史失败保留，不重写为全绿。完整回归运行于共享 dirty 工作区，不外推为独立提交的全仓证明。
- 本轮暂未提交：并发 owner 已暂存八个宿主治理文件并占用 CHANGELOG 的另一条记录。保留其 index 和 working tree，本轮十个 owned 路径仅留工作区；待交叠收敛后按精确路径提交，不执行裸 commit、不 push。

## U5 发布失败与前置 scope 校验

- 已复现第二次 canonical facts 发布失败仍返回 exit 0、write_result.ready/complete=true。runtime-executor 现在以最终发布结果计算退出：第二次失败保留 scenario-fingerprint-ledger-update-failed；已有 Provider/baseline 主失败保持顶层优先级，write_result 仍揭示发布失败，host ledger 未写则保持 null。
- 强化既有测试为默认 writer 的真实 rename 故障注入：第二次发布的第一个/第二个文件分别失败，旧成对 facts 均恢复；叠加 Graphify query 失败时保留 graphify-query-verification-failed。scenario artifact 自身失败而其状态成功发布仍 advisory。该批 entrypoint/facts 两套 112 tests 通过；独立 reviewer 无阻断发现，提出的组合回归已补。
- 独立 U5/U6 审计发现 requirement workspace containment 直到 baseline 安装后才检查。强化既有非法 scope 测试后，先观察到 npm-warmup-path-or-io-failed 而非原始 scope reason，证实进入了安装链。现复用选中 Provider 自有 plan，在首次安装前用 probeDependency=false 预检；blocked 通过既有 setup error envelope 退出，不发布伪 facts。执行期仍重算 Provider plan，不复用预检计划。
- 独立定点复审确认该 finding 闭合；entrypoint/node-contracts/facts 三套 127 tests 通过。非法 scope 反例检查零 mutation 调用、target/HOME 内容不变。源码语法与 diff check 通过；没有按模块数量重拆 orchestrator。

## U8/U9 CodeGraph 原生状态探针证据

- 当前已安装 CodeGraph 1.6.0 的 status 实现调用 CodeGraph.open；DB open 包含 migration、healBulkNodeLoad、healBulkSecondaryIndexes 和 healOversizedWal。status JSON 暴露 index.state/pendingRefs/pendingChanges/worktreeMismatch；退出 0 不等于完整/current 索引。
- `docs/validation/runtime-setup-codegraph-status-probe.json`：健康单文件 folder，真实 init/status 成功，未观察到持久化文件变化；该次未关闭默认遥测，原始 stderr 已保留，不能宣称无网络活动。
- `docs/validation/runtime-setup-codegraph-recovery-probe.json`：后续显式 CODEGRAPH_TELEMETRY=0、CODEGRAPH_NO_WATCH=1，隔离 HOME/XDG/TMPDIR。删除三个原生 FTS trigger 模拟中断 bulk-load，并设置 project_metadata.index_state=partial；真实 status 退出 0 但仍报告 partial，同时恢复 trigger、改变 DB 内容并清理 WAL/SHM。一次早期 fault injection 使用错误表名 metadata，在 status 前终止并清理；按当前源码改用 project_metadata 后得到本报告，不把失败尝试计作通过。
- 这改变下一步方案：doctor/verify 的只读 currentness 不能直接跑原生 status/query，也不能只哈希主 DB。须用明确绑定源码、安装身份和 DB/WAL 状态的已验证证据，且不能从旧 facts 重新造 fresh。当前代码仍有待修复的原生 artifact verify 路径，不能关闭 U8；探针没有操作用户项目或宿主 runtime。

## U5/U6 剩余验收审计

- U5 大部分 owner/reason 传播与 L0/L5 已有实现和聚焦回归；L2 failure 保留 L1 facts、L4 failure 不污染 L3 facts 的更直接组合断言仍需在最终验收中补齐或给出等价证据。
- U6 默认 bare/check 延迟加载、显式 confirmed repo set、alias/nested/escape 拒绝和多数 lease/recovery 机制已有 source/test 覆盖。独立只读审计发现真实缺口：缺 repo 数上限、前台 build 共享总 deadline/取消传播，以及实际 SIGINT 后重入恢复证据。单命令 300 秒与 async wrapper timeout 不替代前台总预算；下一批复用现有 workspace owners 补齐，不建立通用流程引擎。
- 提交交叠未变化：另一 owner 暂存了八个宿主治理路径和独立 CHANGELOG 行。本任务未操作其 index、未混合提交或 push；U5/U8 本地改动和真实探针均保留。整体 P123 与最终 structured closeout 保持未完成。


## U6 有界执行切片与提交检查

- workspace executor 在 lease/mutation 前检查 confirmed repo 数，默认上限 32；使用单调时钟维护默认 15 分钟共享预算，下游命令 timeout 取剩余预算与原单命令预算的较小值。取消/超时原因跨 runner 传播，后续 Provider、routing 和 hook 不再启动，失败状态与 lease 清理仍执行。
- 三个先失败的回归覆盖超仓数零 mutation、首命令耗尽总预算后停止、CodeGraph init 后取消并恢复旧数据库且不启动下一仓。最终 workspace executor/build/provider-runners 三套 73 tests 通过。该取消测试使用 AbortController 与注入 runner，不等于真实 SIGINT、子进程树清理或同步 IO 的严格墙钟上限；这些仍属 U6/U9 未完成项。
- 本次提交保留 U5 发布失败与 scope preflight、U8 安装身份、U6 预算切片及两个真实 CodeGraph 探针。P123 整体、CodeGraph 原生 artifact verify 的只读缺口与最终整体验收仍未完成。提交不改变计划完成状态，也不推送远程。
- 本次语法检查 262 files 与 git diff --check 通过；测试运行于共享工作区，不能外推为隔离提交的全仓验证。并发宿主治理的八个暂存路径及 CHANGELOG 独立记录排除在本提交外。
- 提交前追加定点验证：CodeGraph launcher、consumer-health、Provider、entrypoint 四套 185 tests 全部通过；连同 workspace 三套，共七套 258 tests 通过。未重跑全仓测试。


## U6/U9 子进程中断与最终发布出口

- 真实隔离 Node Provider fixture 在 init 修改临时 DB 后自发 SIGINT，默认 spawnSync runner 返回真实 signal。修改前观察到 workspace-build-failed，未传播取消；现将 SIGINT/SIGTERM 与 timed_out 转换为共享停止原因，后续步骤停止。测试验证旧 DB 恢复、下一仓不运行、lease 释放，并用 fixture runner 重试完成。重试首次因 fixture 未排除既有 DB 而被 source-change guard 合法降级，修正 fixture 的已有 .git/info/exclude 后通过，未削弱生产检查。
- 默认 runner 另有真实子进程 timeout 测试；注入时钟不前进的反例检查底层 timed_out 仍触发全局停止。SIGINT 测试在 Windows 显式跳过，不能外推为 Windows 信号或主 setup 进程 SIGINT 证据。
- 独立首审发现最终 state 写入期间预算耗尽仍 complete。两个回归分别在实际临时 state 写入时触发 timeout/cancel，先观察到 complete，再修为 lease 内写后复核并发布 partial。纠正写入 EIO 则保留自有 lease、返回 partial/state.ok=false；真实 status reader 将残留 complete 降级。独立唯一修复复审确认原 P2 及此失败分支闭合，reviewer 未执行测试。
- 复用既有 executor、state writer、lifecycle owner 与 status reader；没有新增 durable schema 或通用执行引擎。回滚、lease 留存与失败证据属于 protected 行为。主 setup 进程直接 SIGINT、子进程树清理和原位 refresh 的恢复范围仍待验证，CodeGraph 只读 currentness 与最终 P123 收口仍未完成。
- 本切片最终验证：workspace executor/build/provider-runners 三套 79 tests 全部通过；typecheck 262 files 与 git diff --check 通过。测试在共享工作区执行，未声称隔离提交全仓通过；本轮不改 generated runtime、不 push。


## U8 CodeGraph 原生 JSON 完整性

- 直接检查已安装 1.6.0 CLI status 源码及两份真实 status probe，确认原人类文本排除法会漏掉 partial/indexing/failed、待解析引用和 worktree mismatch。九个 apply 反例先观察到错误放行后才改生产；现使用 `status --json` 并在 Provider owner 内验证字段和目标路径。未另造 schema 或复制 Provider SQL。
- 缺字段、非法 JSON/文本和错误路径不执行 query；pending 文件/引用走原生 sync，partial/indexing/failed 与推荐重建走 index -f；每次修复后重新读取，不能因 mutation 退出 0 即升级 indexed。
- 独立首审发现官方合法 state:null（旧 marker）被误作非法而不重建。参数化反例先观察到失败，随后显式接受 null 但保持 needsReindex，缺失 undefined 仍 invalid。唯一修复复审确认闭合，reviewer 未运行测试。
- `runtime-setup-codegraph-json-status-probe.json` 保存当前真实 apply 证据：隔离 folder/HOME/XDG/TMPDIR，显式禁用遥测和 watcher，使用现有 process runner/launcher，init → status --json → version/query/identity 成功。没有安装或接线，configured/server_reachable=false、readiness unknown 如实保留。该证据不是只读验证、MCP server 或 Windows 证明。
- 测试 fixture 从 index ready 文本改成官方 JSON；两个 entrypoint 初次失败源于 fixture 返回父目录而不是 options.cwd，修正后 74/74 通过。Provider suite 最终 80/80 通过；launcher 在三套首轮通过。原生 artifact verify 的写副作用、DB/WAL/source 证据回读、主进程中断恢复和 P123 最终收口仍未完成。
- 真实 probe 已按最终 source hash 重跑并补旧 marker 故障注入：在一次性 SQLite 删除 index_state 后，实际 status 依次观测 complete → null → null → complete；显式 apply 原生重建和 query 成功，13 次实际命令均保留在同一证据 JSON。
- 最终验证：完整 npm run test:mcp-setup 33 suites / 724 tests 通过；最终 null 修复的 Provider 定点 80/80 通过，typecheck 262 files、入口 lint 490 files 与 diff check 通过。完整回归运行于共享工作区，期间收敛了 null 分支；不外推为隔离提交的整仓测试或 readonly gate 已通过。
- spec-simplify-code 仅对本次 parser 执行 inline reuse/quality/efficiency 三个 lens（未另行授权三个 simplify workers，dispatch_authorization_missing）。复用现有 succeeded/path/Provider owner，移除的旧文本 helpers 无剩余引用；无额外可保持行为的修改，三个维度应用修复均为 0。字段校验、路径边界和重建后复验为 protected，不为行数继续抽象。


## U8 CodeGraph artifact evidence 只读闭环

- 新增 `codegraph-artifact-evidence.v1`，复用 stable regular-file reader 和 source snapshot；文件集固定为 `codegraph.db`、`codegraph.db-wal`、`codegraph.db-journal`，逐文件 bounded SHA-256，前后 inventory/目录 identity 不一致则不发布。空、缺失、symlink、超预算和并发变化 fail closed。
- apply 在 status/query 后采集 source、安装 identity 和数据库文件证据；任一采样或 identity 不可确认时不附 artifact evidence，readiness 降为 unknown/degraded。facts normalizer 与 provider schema 保存该字段。
- verify/doctor 通过既有 facts root 只读获取唯一 CodeGraph artifact evidence，校验 TTL、repo root、当前 identity、source snapshot 和 DB/WAL/journal bytes；不执行原生 status/query，避免其 open 触发 migration/heal。配置 reconciliation 只有完整 evidence 才能把 unknown 升回 fresh。
- 9 个 evidence 反例覆盖无证据禁止 query、source/DB/WAL/journal 漂移、TTL、旧/非法证据、采样竞态和 symlink；真实隔离 apply 及旧 marker 恢复探针保留在前述 JSON evidence。Provider/launcher/evidence 三套定点 104 tests 通过。
- 独立首审与修复复审：首审提出合法 `state:null` 重建，已在上一切片修复；本切片未新增 reviewer 阻断。未扩展为语义图正确性、MCP server 或 Windows 真实验证。主 setup SIGINT/Windows 信号、refresh 原位恢复与 P123 最终收口仍未完成。
