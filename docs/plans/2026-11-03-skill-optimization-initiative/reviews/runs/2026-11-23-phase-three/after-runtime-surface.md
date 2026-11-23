# Runtime Setup 非 lib 整改对账

基线 `5a55514d9`。原审阅 `runtime-surface.md` 覆盖包内非 lib 的 34 个文件、9,160 行；下表只登记整改后发生差异的 16 个包文件，均为修改。九项发现中八项已在本范围修复，一项需与 lib 作者联改。测试、报告本身和其他作者的改动不计入包差异。

## spec-runtime-setup

| 包相对路径 | 操作 | 具体判断 |
| --- | --- | --- |
| `SKILL.md` | 改 | 区分单项目 bare 写入与父目录 bare 只读；明确仓内钩子、仓外标记和实际查询是三种不同证据。首次 Python extract 失败直接报告，不指导操作者自行改跑 update。 |
| `evals/README.md` | 改 | 给维护者说明 check 的调用与结果必须配对，区分 CLI 与会话退出码、固定哨兵与全局写入审计；轨迹示例的助手回复改为英文，说明有限 Bash 形态不是通用授权。 |
| `evals/cases/bare-invocation-fail-closed-on-unverified-surface.yaml` | 改 | 以英文明确夹具 HOME、Claude 宿主参数、真实脚本路径和只允许的可选参数；标题只承诺检查受监视路径，不再承诺全局零副作用。 |
| `evals/cases/check-readonly.yaml` | 改 | 英文请求要求从夹具根直接运行已加载入口的 `--check --json`；路径发现走读取工具，不接受改跑 `--verify-only`、管道或重定向。 |
| `evals/examples.json` | 改 | 仓外钩子示例按标记、旧目录覆写与读取完整性选择 `verified-external` 或 `manual-only`；两者均不证明 Git 已执行。 |
| `evals/fixtures/repos/mini-ledger/README.md` | 改 | 按实际 POST 实现写明读取 amount 和 note，ID 与时间戳由服务端生成，删除“手填五个字段”的错误说明。 |
| `evals/fixtures/scripts/check-bare-mutation.sh` | 改 | 识别直接的隔离 HOME 下 bare 命令，按调用 ID 查对应结果；核对结构化拒绝或 CLI 本地化拒绝行，以及有记录的工具退出码 2。其他模式不能顶替。 |
| `evals/fixtures/scripts/check-not-setup-scope.sh` | 改 | 仅同步业务夹具 README 的哈希；原语义审查仍须独立判断，不改变机械判定的授权边界。 |
| `evals/fixtures/scripts/check-readonly-verify.sh` | 改 | 在原有文件哨兵外，要求直接 Bash 调用、配对的成功结果、诊断 schema、当前 Git 夹具真实根及两个结果数组；同步 README 哈希。 |
| `references/config-template.yaml` | 改 | 把渲染设置的残句改成可执行的选择说明；三个示例继续保持注释，不激活偏好或运行下游工作流。 |
| `references/project-config.md` | 改 | 将验证、反馈授权与渲染偏好分开；本地配置回读使用 `--check`，只有另获事实写入授权才用 `--verify-only`。 |
| `references/supported-mcp-tools.md` | 改 | 补齐 OpenCode、ZCode、Pi 的配置文件、键与作用域；CodeGraph 验证回读历史证据，不重新打开数据库或给旧查询标新时间。 |
| `scripts/providers/common.cjs` | 改 | 版本检查匹配完整的常见 CLI 版本输出，接受可识别的工具前缀和 `v`，不把预发布后缀当正式 pin。 |
| `scripts/providers/graphify.cjs` | 改 | 把旧工具清理放到替代链路验收之后；分离失败的可选钩子、实际查询和安装身份。共享宿主写入限于可辨认的内容；Qoder 给出 CLI 和直接读源码回退，外部钩子检查不完整则保留手动刷新。 |
| `scripts/setup.cjs` | 改 | 门禁和分派共用同一个父目录 bare/check 条件。该路径不要求写授权；单仓 bare 和父目录显式批量安装仍受门禁约束。 |
| `scripts/vendor/README.md` | 改 | 补上同版 npm 归档的 SHA-512、分发件和许可证的成员路径以及实际 `safeLoad` 使用边界；没有改压缩件、版本或许可正文。 |

## 九项处置与复查触发

1. **清理顺序，已修。** 只有实际查询成功、被查询的图完整且哈希稳定、请求范围的收据绑定同一图、最终 Python 包身份与查询时一致、宿主配置通过、项目钩子已验证或确实不适用，才进入旧 npm 工具归属核对；受保护的源码仓不借“免宿主配置”进入清理。查询失败、身份变化、缺少范围收据三组替身均未调用 npm。正例通过公开 `apply`，只移除临时夹具中确认归属的旧包和启动链接。更换安装器、查询命令或收据算法时，同时重跑正反两侧。
2. **共享宿主写入，已修。** 共享 Markdown 限定 Graphify 节，忽略围栏中的标题，拒绝重复标题和不能确定的边界；OpenCode 共享 JSON 不做全文替换。Claude/Codex 只更新 `PreToolUse` 中匹配的 Graphify 命令；测试保留相邻团队规则、其他工具和其他事件的值。需要改命令时 JSON 会重新序列化，不承诺原缩进；本包的规范化器也不能担保上游原生安装器的写入行为。新增宿主布局或标题语法时，先用相邻的用户内容验证归属。
3. **独立可选钩子，已修。** 项目内可选安装失败仅记录原因和 `manual-only`，不重复安装、不清理旧工具，独立的提取与查询仍可得出各自结果。项目内钩子命令执行期间目标变化仍阻断相关操作。下次改钩子修复流程时，分别复查普通工具失败与目标不再安全，不能把两者并成同一放行分支。
4. **父目录 bare 门禁，已修。** 临时非 Git 父目录加一个 Git 子仓，无宿主写授权时，bare、bare `--all-repos` 与 `--check` 都到达同一诊断；单仓 bare 和父目录 `--installation-only --all-repos` 均拒绝。若新增批量模式或改变目标解析，按这两对拓扑和模式重新验收。
5. **check 实际调用，已修。** 只读评测不再接受“自述已检查、文件没变”作为通过证据。缺调用、缺结果、错 ID、错目标均拒绝；实际 `runSetup` 在临时 Git 夹具、替身探针下产生的诊断可以被 judge 消费。bare 校准另验证其他模式和错误退出码不能冒充正确拒绝。证据来自标准化轨迹，不证明 runner 记录了所有事件；接入不同引擎、工具结果封装或 shell 命令形式时，用真实正常轨迹重新校准，不能以助手文本补缺。
6. **平台安装字段互斥，后续联改已完成。** 冻结版加载器接受两种命令同时出现。总负责人在提供方与库代码一起审查后更新 `setup-registry.schema.json`、`scripts/lib/registry.cjs`；四个平台复用一项互斥定义，真实加载器同步执行。`tests/unit/mcp-setup-registry.test.js` 的 23 项全部通过，其中四个平台分别实测四种输入：仅执行命令、仅展示命令均接受；两者都有、两者都无均拒绝。对应两项差异在 `final-current.md` 登记，不重复计入本表的 16 项。
7. **Qoder 模板，已修。** 仅安装规则的 Qoder 不再要求加载同名 Skill。规则以图存在且 CLI 可执行为前提，给出 `query/path/explain`，不可用则直接读源码。已验证模板和宿主适配夹具，未验证真实 Qoder 会话；适配器改变能力声明时复查二者。
8. **版本 pin，已修。** `codegraph v1.6.0` 接受，`codegraph 1.6.0-beta.1` 不冒充 `1.6.0`；原有启动器解析正常夹具通过。未来 pin 或 CLI 输出格式变化时，保留真实版本输出作为正例，继续覆盖后缀和非版本输出，不退回子串匹配。
9. **操作说明与输出，已修。** 支持宿主表、CodeGraph 历史回读、首次 Graphify 提取失败不回退、外部标记示例和实际实现已对齐。外部只检查 `post-commit` 和 `post-checkout` 两个普通文件，每个上限 1 MiB，不写、不执行、不调用 `hook status`。仅提交标记且未检出旧覆写、检查完整时才可报告 `verified-external`；仅 checkout 标记、旧覆写或读取不完整均为 `manual-only`，不得据此保证核心查询成功。正常标记夹具增加超限的相邻文件后实测不再验证通过。升级 Graphify 或改变外部标记格式时，重跑这四种状态；真实 Git 触发不在此次证据内。

## 测试与证据边界

- 新增 `tests/unit/runtime-setup-nonlib-surface.test.js`：旧工具保留、可选钩子、共享 Markdown/JSON、父目录写门禁、版本和 Qoder 模板；不与 lib 作者共用新测试文件。
- 修改 `tests/unit/runtime-setup-eval-judge.test.js`：校准调用与结果配对、目标、退出码，并把实际源码诊断送入 judge。轨迹外壳为测试夹具，不冒充真实模型轨迹。
- 修改 `tests/unit/mcp-setup-providers.test.js`：旧工具清理正例走公开入口；外部提交标记测试兼验超限的相邻文件。修改 `tests/unit/mcp-setup-contracts.test.js`：在外部钩子专属段断言两个文件、大小上限、两类状态、旧覆写、禁止动作及“标记不等于执行”；未用宽泛关键词代替原合同。
- 最终离线 Jest：以上非 lib 专项、评测 judge、宿主合同，以及只读运行的 `tests/unit/mcp-setup-config-consumers.test.js` 四个完整文件 **57/57 通过**；provider 文件按正常夹具筛选 **19 通过、70 未选**，合计 76 个不同测试通过。使用临时 HOME、TMPDIR，禁用系统 Git 配置，npm 离线；安装、查询、卸载等均用替身。
- 已检查有差异的 CJS 语法、Bash 语法、JSON/YAML 解析。按基线扫描 SKILL、参考、评测及 vendored README 的新增行：唯一汉字命中为 judge 匹配既有 CLI 本地化拒绝行的正则；README 的轨迹示例为英文。第三方分发件与许可证未变；离线来源和同版字节核验见原审阅，不宣称逐字解混淆。
- 没有运行真实八宿主、模型 fresh-source 评测或发布包验证，没有派工、联网安装、修改真实宿主或刷新镜像。`plugin-modules` 的静止态字节复验由总账方另跑；本报告不把它计作通过，未改共享总表。
