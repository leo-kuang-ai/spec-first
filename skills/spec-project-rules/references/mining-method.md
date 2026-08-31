# Mining Method

本参考在取证前读取，用来组织证据、防止只写表层描述、并把架构边界知识置于编码约定之前。只把当前目标仓库中稳定、重复、可回源的模式写入知识库。

## 基础策略

- **规则准入三问**（写入前逐条过，任一问为否即不写入）：AI 不知道这个吗（私有事实，不存在于训练分布）？AI 的默认会错吗（偏离——模型默认行为与本项目冲突）？这条只属于这里吗（公司特性/明文红线）？通识、语言/框架默认、模型已不生成的 anti-pattern 一律挡在门外；依据：Anthropic 2026-07 删除 80%+ 系统提示词且编码评测无损——通识入规则零收益。
- **AGENTS.md 内嵌筛选**（知识库全部条目中仅 top 5-10 条进入入口文件，≤30 行）：在内嵌基础上额外要求——违反 = 立即出错（不是风格偏差而是功能破坏）+ 跨模块或后果全局 + 一句话加规则内点名对象能自证。例外类别（最多 2 条）：高风险区（必须点名具体路径）、注册链（必须点名注册点）。不入选：归属细节、复用指针、编码风格。见 [Knowledge Format](knowledge-format.md) 入口 Pointer 节。
- 默认证据阈值：同一规则/边界至少出现在 2 个文件（同一文件内多处证据只算 1 个文件）；禁止/缺失类规则使用缺失性证据——记录可复现的检索式与命中数（如全仓 `rg` 0 命中），不适用 2 文件门槛；中大型仓库只把 80%+ 一致的模式写成规则。
- 大仓库（>500 个源码文件或上下文预算不足）：100% 阅读核心/shared 模块与各端入口，按目录比例抽样剩余源码（布局不受支持时，抽样清单由 `extract-deps.cjs` exit-2 输出的 `sampling` 字段提供，不自创）；preview 中披露抽样范围。
- 多端/monorepo/workspace：先识别端级与包级边界；跨端规则只写稳定通用模式，单端规则必须写明适用端范围，并提醒改具体端先跟随本端现有结构。
- 检索式写入条目时用紧凑转义形式（`rg "a\|b"`，`\|` 无前后空格），与一行条目的 ` | ` 字段分隔符不冲突（见 [Knowledge Format](knowledge-format.md) 条目格式节）。
- 微型仓（<5 个源码文件）：可以输出知识库，但必须标注样本小；允许单文件证据的条目，降级为带 sample-size 说明的 inferred 条目。
- 单端仓/无 shared 层：降级为最简内容（归属 + 约定两小节），在 limitations 说明"单端降级"；不虚构跨端小节。
- 混合语言/技术栈：按端或语言分节；跨端规则只写目录布局、依赖方向、提交约定这类共同模式。
- 生成代码占比高：跳过 generated/scaffolded 文件；若 >80% 是生成代码，先警告并只写人工源码证据。
- 冲突模式：50/50 分裂不写规则；可在 `limitations` 中说明"未生成规则"。
- 历史例外：存在高频主模式和少量旧代码反例时，写成"新增代码优先沿用主模式"或"不要扩大历史例外"；不要写成全仓库事实或绝对禁令。
- 超大仓库分批执行（>500 源码文件默认启用）：第 1 批 bootstrap 骨架 = 确定性构建层（settings/build 文件与依赖图，配合 `scripts/extract-deps.cjs`）+ 共享层职责 + 明文规范吸收；第 2 批起按模块群/端逐批深挖，每批候选条目 preview 后**立即增量合入** `docs/architecture.md`（不留中间产物文件，已合入批次即断点恢复点）。一次性全量深挖在单会话上下文装不下时是错误执行方式。批次切割、并行派发与合入纪律见 SKILL.md 大仓分批执行节。
- 仓外依赖（git submodule、二进制制品/AAR、以 maven/npm 坐标消费且无本地源码的库）：证据只能来自调用点 import 与构建声明；此类条目 grade 上限为 inferred，正文标注"无本地源码，仅调用点取证"，不得据此生成实现层规则。
- 失效反证深度：判定既有规则失效（标 stale）前，至少完成目标路径/导出的存在性检查 + 全仓引用检索（记录检索式与命中数）；仅当检索零命中或命中均已失效时才可标 stale。
- 反向声称防护（回写路径）：用户声称与既有规则相反时，(a) 已标注历史例外的路径不得作为新约定证据；(b) 明文来源（README/ADR）仍存在且未被修改 → 默认拒绝，输出"明文来源仍有效 + 例外路径反证"；(c) 口头指令本身不是 confirmed 证据来源，只能在 limitations 记录为待 owner 确认。
- 绝对化措辞：除非证据在目标适用范围内压倒性一致，不要使用"统一""只""永远""不得""禁止"等全称表达；需要强约束时必须同时给出 scope 或例外边界。

## 大仓候选导航

大仓库、monorepo 或依赖关系难以直接定位时，可以把 `code-graph` / `project-graph` capability-class 输出作为 `provider_untrusted` 候选导航，用来决定下一批 source refs。遵守当前仓库 `docs/contracts/project-graph-consumption.md` 的 candidate-only 口径；若该合同在运行目标不可见，按本小节最小边界执行。

- 候选只回答"先看哪里"，不能证明边界归属、依赖方向、复用契约、频率或一致性。
- 每条进入知识库的模式仍必须由当前目标仓库源码、测试、配置、构建定义或已有明文文档确认；记录代表性 source refs。
- 候选不可用、stale、unknown、unverified、失败或不安全时，直接回退到 bounded source reads、`rg`、ast-grep 和分层抽样；不要阻塞梳理。
- 不从本 skill 运行图谱刷新、索引生成、repair 或 mutation；不要读取完整 raw graph artifact，例如 `graph.json`。
- 如果候选影响了阅读顺序，在 preview/closeout 的 `limitations` 或 `evidence_summary` 里说明查询摘要、采纳/拒绝的候选和回源确认结果。

## 架构类别（一级，优先取证）

### A1. Workspace 拓扑与端识别

识别 workspace 中的端与构建单元：移动 app、H5/web、admin 控制台、后台服务、shared/公共包、工具链。启发式：目录名（`app/`、`h5/`、`admin/`、`server/`、`packages/`、`apps/`）、多个 `package.json`/`build.gradle`/`Podfile` 等构建定义、技术栈指纹（React Native/Flutter/Vue/Spring 等）、部署配置（Dockerfile、CI matrix）。为每端记录：目录、技术栈、职责边界、明确"不该放什么"的反例（带 source refs）；找不到反例证据时显式写"暂无代码反例"并在 limitations 披露，不虚构反例。词汇只管理与边界/契约直接相关的术语（如"自选股域归 watchlist-core"）；全量业务词汇表归 CONCEPTS.md/`spec-compound`，本 skill 不建词表。

### A1.5 架构分层模式（模块内部结构）

识别目标仓库使用的架构模式（MVVM / Clean Architecture / MVI / MVP / 混合）及层级职责，产出"新代码放哪一层"的判定规则。AI 不知道项目用什么模式，会把网络调用写在 View 层、跳过 UseCase、让 DTO 泄漏到 domain。

取证方法：
- **模式识别**：抽样 10+ 个 feature 目录，看有无 domain/ 层（Clean）、Presenter（MVP）、Intent/State 类（MVI）、只有 ViewModel（纯 MVVM）
- **层级纯度**：`rg "import android\." domain/` 命中 → domain 不纯，写入"domain 禁 Android 依赖"或标注混合
- **ViewModel 直调 API**：`rg "ApiHelper\|retrofit" --type kt` 在 presentation 层命中 → 强制 UseCase 规则；未命中 → 允许直调
- **DTO 泄漏**：`rg "Dto\|DTO" domain/` → 命中则写禁止
- **状态管理**：`rg "sealed class.*UiState\|sealed interface.*UiState"` 统一模式 → 写入
- **新功能文件数**：最近 5 个 feature 的文件创建统计 → 稳定模式写"新功能 N 件套"

产出条目示例：
```markdown
### 架构分层
- 本项目用 MVVM + Clean Architecture，presentation→domain→data 单向 | inferred | 抽样 20 个 feature
- Fragment 只做 UI 绑定，禁止网络调用 | inferred | 0 处 Fragment 直调 API
- domain 层纯 Kotlin，禁止 import android.* | inferred | rg 0 命中
- 新功能 5 件套：Fragment + ViewModel + UiState / UseCase / RepositoryImpl | inferred
```

### A2. 依赖方向

取证各端与 shared 层之间的引用方向：import/require、模块引用、DI 注册、远程调用边界。记录允许方向与禁区（例如 admin 不得引用 app 的业务模块、端内不得绕过 shared 层直接依赖底层库）。既有违规按 A4 处理。证据来源：import 语句、构建依赖声明、模块边界配置（如有）。

### A3. 复用契约

取证 shared/公共层的暴露面：导出 API 的形态与稳定性、哪些是跨端通用、哪些实际只被单端使用（复用信号退化）、跨端重复实现信号（同名工具/常量在多端各有一份）。为每项记录：归属、预期消费端、known 非目标（"不属于 shared 的东西"反例）。

### A4. 既有违规与历史例外

发现的架构违规（越界依赖、绕过封装、跨端复制）不写成规则，写成历史例外条目：现象、涉及路径、收窄措辞。它们是边界规则的反证或例外输入，不是规范本身。落位：写入所属小节（归属/依赖方向/复用）的一行条目，`例外:` 尾字段必填。

### A5. 明文规范吸收

目标仓库已有的 README 架构节、ADR、contribution guide、目录说明文档中已明文规定的边界，直接吸收为 `confirmed` 条目并引用原文位置；与代码现状冲突时并列记录并标注冲突。

### A6. 演化证据（git 历史）

用 `git log` 区分"新增代码主模式"与历史存量：如 `git log --since=<date> --diff-filter=A --name-only --pretty=format: -- "*.kt" | wc -l` 对比新增文件的语言/目录分布，判定"新增代码优先 Kotlin""旧包区不再扩大"这类边界。证据记录检索式与时间窗；无 git 历史或浅克隆时跳过并说明。

## 编码类别（二级，收窄取证）

只收影响 AI 生成正确性的高信号规则；这一节产出写入 `docs/architecture.md` 的 `约定（rules）` 小节，宁缺毋滥。

### C1. Hidden Associations（必查，最高价值）

总是一起出现、不写就错的隐性耦合：service 与 types 文件、handler 与 validation、route 与 registry、请求必须经过的封装层、数据库访问的 transaction wrapper、跨端共享的类型定义位置。至少写一条，除非证据明确不存在。

### C2. Anti-Patterns（必查）

项目几乎从不使用、AI 默认却常生成的写法：默认导出、`any`、直接 `process.env`、直接调用外部 SDK、未包装错误、绕过 shared 层的本地复制。只写当前仓库证据支持的禁用项。

### C3. 封装强制约定

"必须走某封装而不是直接调用"类规则：统一请求客户端、统一错误处理入口、统一路由注册、统一权限检查。这类规则 AI 最容易违背，优先收录。

### C4 查重义务（存在性知识的行为化）

识别"AI 最可能重复造轮子的域"（utils/组件/HTTP 客户端/格式化/校验等），每个域产出一条义务规则：先查哪里（含可复现检索式）→ 不存在才新建 → 新建后归位共享层。落位：能力指针条目（住址+查法）写入 `复用（reuse）` 小节；查重义务条目（行为约束）写入 `约定（rules）` 小节，均为 v2 一行条目格式。禁止产出条目级组件清单——清单必腐烂，义务不会。

## 前端专属维度（条件取证）

目标仓库含前端代码（React/Vue/Angular/Svelte/小程序）时，除上述通用类别外，按以下维度取证。这些规则写入 `约定（rules）` 小节，用子标题分组（如 `### 设计 token` / `### 状态管理`）。**只收 AI 默认会做错的项目私有约定**——通用最佳实践仍走准入三问过滤。

### F1. 设计系统与 token（前端最高优先）

AI 最常犯的前端错误：硬编码颜色/间距/字号、绕过组件库自造 UI。取证：
- **token 强制**：项目是否有 design token / CSS variable / theme 配置？新代码是否统一引用？检索式：`rg "var\(--" src/` / `rg "#[0-9a-fA-F]{3,8}" src/ --type css --type ts -c`（硬编码 hex 计数）。若 token 存在但硬编码也大量存在，写"新增代码优先用 token"+ 收窄措辞。
- **组件库优先**：项目是否有内部组件库？新 UI 是用库组件还是自建？检索式：查 import 统计（`rg "from '@.*ui'" src/ -c`）。
- **样式方案统一**：CSS Modules / Tailwind / styled-components / plain CSS——项目实际用哪种？混用时写主模式+收窄。
- **响应式断点**：mobile-first 还是 desktop-first？断点在哪定义？
- **间距/圆角/字号 scale**：是否有预定义 scale（如 Tailwind 默认 scale、自定义 spacing token）？

### F2. 状态管理边界

AI 默认全塞 useState 或全放全局——需要明确分界。取证：
- **服务端状态 vs 客户端状态分治**：项目用 React Query/SWR 管服务端数据吗？还是手动 fetch + useEffect？
- **全局 store 边界**：什么进全局、什么留组件内？检索 store 目录结构。
- **表单状态**：用 react-hook-form / formik 还是手写？检索式：`rg "useState.*onChange\|react-hook-form" src/`。

### F3. 组件模式约定

取证项目特有的组件写法约定（AI 默认可能不匹配的）：
- **文件组织**：一文件一组件还是允许多个？文件放 `components/` 还是就近放？
- **Props 类型**：TypeScript interface 还是 inline 类型？导出方式？
- **受控/非控**：项目偏受控还是非控？有统一模式吗？
- **拆分阈值**：组件超过多少行团队会拆？（git log 中大文件被拆的频率）

### F4. 路由与导航（条件）

路由约定多数可从代码推断（文件约定优于配置），只收 AI 默认会错的：
- 动态路由参数风格（`[param]` vs `:param` vs query string）
- 受保护路由的 guard 机制
- 路由定义集中还是分散

### 前端排除项

- ❌ 通用 React/Vue 最佳实践（模型已知）
- ❌ Tailwind/框架默认用法（模型已知）
- ❌ 可从组件库文档推断的用法（模型可查）
- ❌ 具体像素值/设计稿还原规则（属于设计工具，不是 AI 编码规则）

### F5. H5 移动端 Web 专属（条件）

AI 在 H5 最常犯：用桌面思维写移动页面。取证：
- **视口方案**：rem / vw / clamp / px——项目用哪种？1rem 等于多少设计稿单位？检索式：`rg "rem|vw\|clamp" postcss.config / vite.config`
- **WebView 兼容**：须兼容哪些浏览器（微信内置/UC/X5/低版本 Chrome）？browserslist 是什么？有无已知 CSS/JS 兼容禁区（如 gap 不支持、Optional Chaining 需转译）？检索式：`cat .browserslistrc`
- **JSBridge**：原生通信走统一封装还是直接 wx.xxx / window.xxx？检索式：`rg "wx\.\|window\.webkit\|JSBridge" src/`
- **性能预算**：首屏 JS/图片体积有无红线？图片是否强制 CDN + webp？列表是否用虚拟滚动？
- **认证降级**：微信内静默授权 / 非微信环境降级到手机号+验证码 / token 过期自动刷新——项目怎么处理？

### F6. Admin 控制台专属（条件）

AI 在 Admin 最常犯：不知道用什么组件库、不懂权限层级。取证：
- **组件库强制**：项目用哪个（Ant Design / Element Plus / Arco / 自研）？禁止混用其他库？检索式：`rg "from 'ant-design\|element-plus\|@arco'" package.json src/ -c`
- **表格范式**：列表页用 ProTable 还是手写 Table+Pagination？搜索与表格怎么联动？导出走什么统一工具？
- **表单范式**：校验分几层（前端 rules + 后端校验）？跨字段联动用什么（dependencies / useEffect）？动态表单用 Form.List？
- **权限体系（三层）**：路由级（动态路由按权限码过滤）/ 按钮级（Auth 组件包裹）/ 数据级（后端过滤）——各层怎么实现？检索式：`rg "Auth\|permission\|hasRole" src/`
- **数据字典**：枚举/状态映射在哪管理（constants/dictionary.ts / 后台管理不发版）？禁止组件内硬编码状态文案？
- **布局系统**：侧边栏/Header/多标签页——自定义布局还是组件库 Layout？主题切换（暗色模式）支持吗？

### F7. 小程序专属（条件）

AI 在小程序最常犯：不知道平台 API 差异、忽略分包体积。取证：
- **分包策略**：主包体积限制（微信 2MB）？按什么维度分包（业务域/页面/组件）？检索式：`cat app.json \| grep -A5 subpackages`
- **平台差异**：微信/支付宝双端用条件编译（#ifdef）还是运行时判断？统一走 uni.xxx 还是各平台原生 API？检索式：`rg "#ifdef\|#ifndef" src/ -c`
- **页面栈管理**：navigateTo 层级上限（10 层）超过用 redirectTo？Tab 页用 switchTab？
- **登录链**：wx.login → code2Session → token？token 存 storage？过期静默刷新不弹登录页？

## 跨端对齐维度（多端 monorepo 条件取证）

目标仓库含多个前端表面（App/H5/Admin/小程序共存）时启用。这是多端 monorepo 最独特的规范层：AI 不知道同一个业务概念在各端的选择差异。产出写入 `约定（rules）` 小节，用 `### 跨端对齐` 子标题分组；跨端取证需要对照多端代码——分批执行时在同一批覆盖相关端，或在 limitations 记录待补。

### X1. 共享层消费路径

AI 默认在每个端各自写一份工具函数/类型定义/错误处理。取证：
- **设计 token 单源**：所有端是否引用同一 token 包（packages/design-tokens/）？各端消费方式（CSS variable / 主题对象 / 编译时替换）？检索式：`rg "design-tokens\|theme" packages/*/package.json`
- **类型共享**：API 类型/业务模型是否跨端共享（packages/types/）？各端 import 路径？还是各端各自定义？
- **工具函数查重义务**：格式化/校验/日期/加密是否统一放 shared/utils？各端有无重复实现？检索式：`rg "formatMoney\|formatDate" apps/ packages/ -l`（同名函数多端出现 → 重复信号）

### X2. 同一业务在各端的实现选择

AI 不知道"订单列表"在 App 是分页、在 H5 是无限滚动、在 Admin 是 ProTable。取证：
- **列表范式**：同一业务域的列表在各端用什么模式（分页/无限滚动/表格）？写明各端选择。
- **登录链路**：App 用微信 SDK、H5 用 OAuth、Admin 用账号密码、小程序用 wx.login——各端的认证方式和降级策略。
- **支付集成**：各端支持的支付方式（SDK/JSAPI/小程序支付）和封装位置。
- **消息推送**：App 用厂商推送、H5 用 WebSocket——统一封装还是各端独立？

### X3. 端间一致性约束

- **格式统一**：金额/日期/手机号格式化在所有端是否一致（用同一工具函数）？时区处理？
- **API 版本**：所有端调用同一 API 版本还是各自版本？API 变更时各端同步更新的约定？
- **枚举/字典**：业务状态（订单状态/支付状态）在所有端是否引用同一字典源？还是各端硬编码？

### 跨端排除项

- ❌ 各端框架的通用最佳实践（模型已知）
- ❌ 可从各端代码推断的目录结构（模型可读）
- ❌ 后端 API 文档可查的接口定义

通用排除（纯风格偏好/语言默认/生成代码习惯）见下方"明确排除（通用）"，此处不重复。

## 移动 App 专属维度（条件取证）

目标仓库含 Android/iOS 代码时启用。产出写入 `约定` 小节，用子标题分组。

### M1. 生命周期与线程（App 最高优先）

AI 不知道项目的初始化顺序和线程纪律。取证：
- **初始化链**：Application.onCreate → 模块 Launcher → Activity 的顺序和注册机制
- **线程模型**：协程（viewModelScope/lifecycleScope）vs Handler/RxJava 的主模式；主线程禁止 IO
- **网络回调**：HsObservable vs suspend vs Callback 的项目统一形态
- **生命周期注销**：Fragment/Activity 销毁时是否强制取消协程/回调

### M2. 构建变体与渠道

取证 productFlavors / buildTypes / 签名 / 混淆规则的项目特有约定：
- 渠道包用 flavors 还是 manifest placeholder
- ProGuard/R8 keep 规则的维护位置和新增反射类须同步更新的约定
- minSdk 约束和新 API 兼容模式

### M3. UI 体系与性能预算

- **ViewBinding vs Compose vs findViewById** 的项目主模式
- **布局命名前缀**（模块缩写 vs fragment_/activity_）
- **设计 token 引用**（colors.xml / design token / 硬编码 hex 的比例）
- **性能红线**：启动时间 / APK 体积 / 内存泄漏的团队约定（若明文）

### 移动端排除项

- ❌ 通用 Android/iOS 最佳实践（模型已知）
- ❌ 可从 build.gradle / manifest 推断的基础信息（模型可读）
- ❌ 具体厂商 SDK 用法（SDK 文档可查）

### 明确排除（通用）

纯风格偏好（命名、格式、注释密度、import 顺序——formatter/linter 已强制的只记已由工具处理）、语言/framework 默认习惯、生成代码的习惯、个人偏好分歧项。这些归 `spec-rule-miner` 的领地或根本不该成为规则。

## 条件补充

按目标仓库实际形态补充取证：前端（组件状态与数据获取边界）、后端（response envelope、middleware 顺序、事务边界）、移动端（navigation/平台分支约定）、桌面端。仅在对应端真实存在时使用，不硬套。
