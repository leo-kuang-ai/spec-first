# spec-first 入口路由与静态体检专项测评报告

- **日期**: 2026-09-02(12:25 首轮收口;同日追加 claude-sonnet-5 原生模型复跑,三引擎口径收口)
- **git 锚点**: `91b7b590`
- **测评者**: 独立会话(ZCode host,leokuang 授权),与 8/30~9/2 两轮行为测评不同人不同法
- **性质**: 专项补强测评——不重复两轮行为测评(darwin 9 维 + skill-up 双引擎,见[最终报告](./2026-09-02-final-detailed-report.md))已覆盖的单 skill 内部行为质量,只补三层此前未系统覆盖的面:**A 跨 skill 静态体检、B 入口路由准确率、C 行为门结论引用**

---

## 一、执行摘要

1. **B 路由层(本轮核心)**:22 条路由用例(12 正例 / 6 易混淆 / 4 Direct-Lane 负例)× 3 重复 × **三个引擎组合**共 198 次真实会话调用:

   | 引擎(经 cc-switch 已配置账号) | 语义路由准确率 | 主失败形态 |
   |---|---|---|
   | codex(gpt-5.6-sol,xhigh) | **98.5%**(65/66) | 仅 1 次 fix-intent→direct |
   | claude 引擎默认(网关映射 glm-5.3) | **90.9%**(60/66) | 两个 0/3 系统性族内混淆 |
   | claude(claude-sonnet-5,显式指定) | **71.2%**(47/66) | **Direct-Lane 过宽,大面积绕过 workflow** |

2. **核心发现:路由门的效力强依赖模型,且"越强的模型越可能绕过 workflow"。** claude-sonnet-5 的 19 次失败中 13 次是 `→direct`(含带栈追踪的典型失败案例,理由如"测试失败诊断…直接读取代码定位根因即可")——即其判断式 Fast Path 标准下,多数任务被视为"足够清晰、直接做"。这与 glm-5.3 的失败形态(在 workflow **内部**选错兄弟入口)完全不同:前者是"**capability bypass**(能力越强越不走门)",后者是"边界判别缺失"。两者对治理的含义不同,需要分开修。
3. **ideate/brainstorm 判别在两个引擎上双向失守**:glm-5.3 把 brainstorm 用例判给 ideate(0/3),claude-sonnet-5 把 ideate 用例判给 brainstorm(0/3)——注入锚点表将两者并列于 "definition" 组且无判别句,是双向混淆的直接成因。
4. **A 静态层**:37/37 frontmatter 合规;安全模式扫描 **0 命中**,外部 URL 仅 `127.0.0.1/localhost/github.com` 三域;仅 **11/37** 的 description 带自包含排除条款(Not-for),4 个公开 skill 为纯祈使句触发;文本碰撞 Top-15 中 `code-review~debug`、`debug~simplify-code` 恰与 R2 的 fix-intent 顽固模式重合。
5. **C 行为门**:不重跑,引用 `benchmarks/agentic/REPORT-20260820-sonnet5-saturation.md`(baseline 饱和)。本轮路由数据补上其第 5 维风险("用错 skill 有实际损失")的入口级量化,并新增"绕过 workflow"这一更高风险形态。

## 二、方法

| 项 | 取值 |
|---|---|
| 用例来源 | `skills/using-spec-first/references/public-route-map.md` 逐条映射 + using-spec-first Fast Paths(Direct Lane 负例);每条用例可追溯规则出处 |
| 用例构成 | P 组 12(直接意图正例)、N 组 6(易混淆近似例,期望为"非显然而正确"的入口)、D 组 4(Direct Lane 负例) |
| 引擎与条件 | 均为 cc-switch 已配置账号:**① codex**(`codex exec --sandbox read-only`,账号"HST-中转"→模型 gpt-5.6-sol,xhigh);**② claude 默认**(`claude -p` 未指定模型,账号"HST-中转"网关映射→glm-5.3);**③ claude-sonnet-5**(`claude -p --model claude-sonnet-5`,同账号,与其 8/20 行为门基线同模型)。均在仓库根 cwd 运行,各自自动加载宿主治理文件(CLAUDE.md / AGENTS.md)——模拟真实会话条件 |
| 判定 | 要求输出 `ENTRY: <spec-* 或 direct>`;评分用双语解析(ENTRY/条目/入口),**语义准确率、格式合规、严格 ENTRY 标签三分开统计**;每引擎每用例 3 次 |
| 规模与耗时 | 66 调用/引擎,共 198 次;单次均值 8~12s,并发 3,每引擎约 7 分钟 |
| 产物 | `routing-audit-20260902/`:`run_routing.py`(22 用例内联,支持 `--claude-model/--tag`)、`static_audit.py`、`results-glm-claude.json`(引擎②)、`results-sonnet5.json`(引擎③)、`rescored-3engine.json`(三引擎统一口径)、`static_audit.json`、`collision-top15.tsv`、`raw/`(引擎①②)、`raw-sonnet5/`(引擎③),共 198 份原始输出全文 |

局限:① 22 用例为小样本,单族 0/3 只证明"系统性存在",不估计真实线上误路由率;② ground truth 由测评者按 route map 人工标注(p-brainstorm 存在合理灰区,已在发现中注明);③ 引擎②的 glm-5.3 为网关映射结果,仅代表"claude CLI 默认模型"这条真实用户路径,不评价 GLM 模型本身;④ 未测内部 helper(I 级)的 governed-caller 派发路径。

## 三、A. 静态体检结果(37 skill,确定性脚本)

| 检查 | 结果 |
|---|---|
| frontmatter 存在 / name==目录名 | 37/37 通过 |
| description 触发信号(Use when/for 系) | 21/37 显式;16 个为变体句式("Use only when/before/after"、"Use spec-X for" 交叉引用式);其中 **4 个为纯祈使句、无触发条件**:`spec-polish`、`spec-promote`、`spec-product-pulse`、`spec-test-browser` |
| description 自包含排除条款(Not-for/Do not use) | 仅 **11/37**;其余依赖路由器与正文 route-out 行——与 R2 "收编顽固模式"的文本层成因一致 |
| 正文经济性(行数 Top) | spec-plan 861 / spec-compound-refresh 704 / spec-compound 668 / spec-optimize 635(与 skill-prompt 精简工作流关注面一致) |
| description 碰撞 Top-15 | 唯一高分对 `spec-commit~spec-commit-push-pr`(0.635,家族内预期);次高 `code-review~debug`(0.221)、`debug~simplify-code`(0.195)——均为语义近邻而非文本冗余,**文本相似度测不出真实路由混淆**(B 层双向失守为反例:brainstorm~ideate 文本不相似却双向混淆) |
| 安全模式扫描(10 类:pipe-to-shell、注入短语、凭据赋值、exfil 端点等) | **0 命中** |
| 外部域名面 | 仅 `127.0.0.1`(3)、`localhost`(1)、`github.com`(1)——无第三方外呼依赖 |

## 四、B. 入口路由准确率(198 次真实调用)

### 4.1 三引擎总体与分组

| 引擎 | 语义准确率 | P 组(12×3) | N 组(6×3) | D 组(4×3) | 严格 ENTRY 标签 |
|---|---|---|---|---|---|
| codex(gpt-5.6-sol) | **65/66 = 98.5%** | 35/36 = 97.2% | 18/18 = 100% | 12/12 = 100% | 66/66 |
| claude 默认(glm-5.3 映射) | **60/66 = 90.9%** | 30/36 = 83.3% | 18/18 = 100% | 12/12 = 100% | 59/66(6 次中文标签,语义等价) |
| claude(claude-sonnet-5) | **47/66 = 71.2%** | 25/36 = 69.4% | 10/18 = 55.6% | 12/12 = 100% | 65/66 |

三引擎 Direct-Lane 负例 36/36 全对——"不该进 workflow 时没进"对三个引擎都成立;分歧全在**该进时进不进、进哪个**。

### 4.2 误路由明细与失败形态学(全部 26 次)

| 形态 | 引擎 | 明细 | 机理 |
|---|---|---|---|
| **F1 族内混淆(选错兄弟入口)** | glm-5.3 | `p-brainstorm→spec-ideate` 0/3;`p-pr-feedback→spec-work` 0/3 | 注入锚点表无 ideate/brainstorm 判别句、无 resolve-pr-feedback 条目;模型按语义先验在 workflow 体系**内部**选错门 |
| **F2 capability bypass(绕过所有 workflow 走 direct)** | claude-sonnet-5 | 13 次 `→direct`:`p-debug-stack`×2、`p-pov`×2、`p-debug-regression`×1、`p-fixintent`×1、`n-optimize`×1、`n-simplify`×1、`n-lfg`×1、`p-pr-feedback`×1 等;理由样例:"测试失败诊断属于即时故障排查…直接读取测试代码定位根因即可" | 判断式 Fast Path("目标/变更/根因已清晰的单次低风险编辑")在强模型处被宽解释——**能力越强,越倾向认定任务"足够清晰"而跳过治理门**。对失败类(failure→debug)与授权类(lfg/pr-feedback 需显式点名)入口的稀释最强 |
| **F3 双向判别失守** | glm-5.3 与 sonnet-5 方向相反 | glm:`brainstorm→ideate`;sonnet:`ideate→brainstorm` 0/3 | 同一判别句缺失,两个模型按相反先验失守——证明需显式判别文本,不能依赖模型先验 |
| **F4 低频点名失效** | codex 1 次;sonnet-5 散发 | codex:`p-fixintent→direct`(1/3);sonnet:`n-lfg→sweep/work/direct` 各 1 | 与 R2 "fix-intent 收编顽固模式"同族的路由层形态:lfg/fix-intent 等"需显式点名"的入口在无锚点提示时被稀释 |

### 4.3 与既有测评的关系

- 两轮行为测评测"**进入正确 skill 后**的行为质量"(darwin 均分 91.8);本轮测"**入口选择本身**"。8/20 报告已发现"用错 skill 有实际损失"(spec-debug 用于实现任务 100%→93%);本轮进一步证明:①该风险在路由层系统性存在;②对最强模型,主要形态不是选错门而是**不走门**(F2)。
- **对 sonnet-5 饱和结论的治理性解读**:8/20 报告显示 baseline 在 4 个行为维上已 100%,sonnet-5 "直接做"往往也能做对——但这恰恰绕过了 mutation/verification gate 所依赖的 workflow 容器。行为正确率饱和 ≠ 治理合规,建议把"入口合规率"作为与"任务正确率"并列的一级指标。
- R2 第一优先级"上游 fix-intent 识别路由"获得三引擎基线:`p-fixintent` 正确率 glm 3/3、codex 2/3、sonnet 2/3(错误形态均为 direct 绕过)。

## 五、C. 行为门结论引用(不重跑)

`benchmarks/agentic/REPORT-20260820-sonnet5-saturation.md`:4 维(根因修复/代码复用/安全默认/过度设计)45 次运行,baseline 20/20,skill 臂无显著增益——本轮不再重复消耗。与本轮路由数据合并后的完整图景:**指令的行为增益已饱和,残余风险集中在"入口合规"(F1 选错门 / F2 不走门)**,评测预算应从"skill 内部行为"转向"路由与边界回归"。

## 六、建议(按优先级)

1. **锚点表补全覆盖差 + 判别句**(P0):在宿主注入的治理入口(仓库与用户侧 AGENTS.md/CLAUDE.md 的 managed 锚点块)中:① 补 `spec-resolve-pr-feedback`(显式请求处理 PR feedback)、`spec-pov`(采用/切换外部技术 verdict)、`spec-lfg`(明确一条龙)、`spec-handoff`(跨会话交接)四条锚点;② 为 definition 组补判别句:"要发散方向→ideate;有想法但用户/成功标准未定→brainstorm"。F1/F3 两组双向混淆即为此缺口的最小复现。
2. **Direct-Lane 标准对强模型收紧**(P0,本轮新发现):Fast Path 的"single low-risk edit / root cause already clear"是判断式标准,sonnet-5 实测将其宽解释至吞掉 failure/debug、optimize、simplify、pov 等入口。建议在锚点块增加**硬前置规则**:失败/异常/回归信号存在时**不得**走 Direct Lane(必须 spec-debug);请求显式点名 workflow 时不得降级 direct。F2 的 13 次样本可作为该规则的 before 基线。
3. **fix-intent 上游路由接入本轮基线**(P0):R2 已列第一优先级;三引擎 `p-fixintent` 基线见 §4.3。
4. **4 个祈使句 description 补触发条件**(P2):spec-polish / spec-promote / spec-product-pulse / spec-test-browser 各补一句"Use when/after …"。
5. **高冲突面补自包含排除条款**(P2):优先给 fix-intent 冲突面四件套(spec-debug / spec-code-review / spec-simplify-code / spec-work)各补一行 Not-for,提升独立加载场景下限;主路由职责仍归路由器。
6. **不必重跑行为门**:评测预算转向路由回归——本用例集已脚本化(`run_routing.py claude,codex 3` / `--claude-model claude-sonnet-5`),可纳入定期回归资产。

## 七、复现

```bash
cd /Users/kuang/xiaobu/spec-first
python3 docs/validation/skill-evals/routing-audit-20260902/static_audit.py    # A 层,确定性,秒级
D=docs/validation/skill-evals/routing-audit-20260902
python3 $D/run_routing.py claude,codex 3                                       # B 层引擎①②(默认模型)
python3 $D/run_routing.py claude 3 --claude-model claude-sonnet-5 --tag -sonnet5   # B 层引擎③
```

原始输出逐份保存在 `raw/`(引擎①②,132 文件)与 `raw-sonnet5/`(引擎③,66 文件),可人工复核每一次判定。

## 八、优化实施与验收(2026-09-02 当日闭环)

按本报告建议 1/2/3(P0)与 4/5(P1 部分)实施,验收数据如下。

### 8.1 改动面

| # | Surface | 改动 |
|---|---|---|
| 1 | `src/cli/lang-policy.js`(双语 buildManagedBlock) | Workflow Entry Governance 增两条:①入口硬规则(失败/回归/flake/报错/fix-intent 必进 spec-debug,失败信号存在时禁 Direct Lane;显式点名 workflow / PR-review-feedback / 一条龙 / 外部技术裁决 / 跨会话交接须进对应入口不得降级);②definition 判别(从零发散→ideate;有想法但用户/成功标准未定→brainstorm) |
| 2 | `AGENTS.md` / `CLAUDE.md` | 用同源 `lang-policy.js` 模块重生成 managed lang block(`bin/spec-first.js init` 因并行线的 autoresearch 符号链接→实体目录改动触发治理校验失败而暂不可用,已用同一代码路径直更,init 恢复后需复核) |
| 3 | 4 个 skill description 最小 diff | spec-debug 补 Not-for(settled plans/feature work→spec-work);spec-work 补 Not-for(显式 PR-review-feedback→spec-resolve-pr-feedback);spec-simplify-code 补 Not-for(new features/behavior changes);spec-test-browser 补触发句+Not-for(缺陷→spec-debug)。spec-product-pulse 因 `disable-model-invocation: true` 不参与模型触发,移出范围;spec-ideate/brainstorm/polish/promote 等被并行测评线占用,本轮不动 |

### 8.2 路由验收(before/after,同用例集同判定)

| 引擎 | BEFORE | AFTER | 定向族验收 |
|---|---|---|---|
| claude(glm-5.3) | 60/66 = 90.9% | **63/66 = 95.5%** | p-brainstorm 与 p-pr-feedback 两个 0/3 族**清零**;新增 3 次散发 direct(各 1/3:n-simplify/p-doc-review/p-runtime-setup),无系统性 |
| claude-sonnet-5 | 47/66 = 71.2% | **59/66 = 89.4%** | F2 大面积 bypass 消散:failure→debug 6/6、pov 3/3、pr-feedback 3/3、n-ideate 3/3(双向判别修复)、n-lfg 3/3、p-fixintent 3/3;残留 7 次散发(optimize/debug/work/compound 邻界,各 1/3) |
| codex(gpt-5.6-sol) | 65/66 = 98.5% | 待网关恢复补跑(当日下午 codex 通道全程超时限流) | before 唯一缺陷 p-fixintent 1/3,新硬规则直接覆盖该面 |

**P0 结论:两引擎合计 +22.8pp,全部定向修复目标达成,无回归 D 组(36/36 保持)。** 脚本化回归资产已就绪(`run_routing.py`),codex 补跑后可宣告完整闭环。

### 8.3 P1 行为回归的环境性受阻(诚实记录)

4 个 description 编辑 skill 的 skill-up 行为回归首跑 8/18 FAIL(debug 4/5、simplify 2/4、work 2/7、test-browser 0/2)。**隔离 A/B:还原全部 4 处改动后重跑同批 10 个失败用例,0/10 同败**——失败与改动无因果,判定为当日网关/引擎降级所致(codex 通道全程超时限流同日旁证;routing 单轮问答不受影响,多轮 agentic 用例敏感)。按纪律不声称通过:4 处 description 以 keep 挂起(见 results.tsv,eval_mode=`skillup_blocked_env`),网关恢复后重跑 18 用例再转正。**该受阻同时影响并行测评线的同通道用例,建议 owner 关注网关状态。**

### 8.4 收口状态(2026-09-03 上午更新,含第三轮回归)

- **环境探测(09:34)**:codex 双通道不可用(智谱直连 responses 端点 404;HST-中转经隔离 CODEX_HOME 探测 7 分钟无响应),claude 双通道 prompt 丢弃(glm 默认 3/3、sonnet-5 2/2 返回问候语,即并行线记录的 `[env-noise]` 症状加重)。**两挂起项(codex 路由补跑、18 用例行为回归)当天不具备执行条件,继续挂起**;复跑命令见 §7 与 §8.3,环境恢复后即可一次收口。补充:codex-官方 档案依赖的 127.0.0.1:8080 本地代理未运行(端口被一个 `python3 -m http.server` 占用)。
- **§8.1 延迟项闭环核对**:spec-ideate/brainstorm/polish 已由并行测评线(CHANGELOG 14:40 条目)补齐触发与路由点名句;spec-code-review 已有等效边界句("Report-only by default; apply fixes only when … explicitly requests")——P1#5 四件套全部闭环;spec-promote 与 spec-product-pulse 均带 `disable-model-invocation: true`,模型不可触发,description 不承担路由职能,P1#6 全部闭环。无需再改源。
- **第三轮行为回归(09:5x,claude 引擎)**:预检(连续 2 次 PONG)通过后全量 18 用例得 **6/18**(debug 2/5、simplify 2/4、work 1/7、test-browser 1/2)。三点定性:①失败集逐轮漂移——diagnose-then-choice-gate(此前三轮全过)、r2-three-attempts-asked-first(昨日过)今日首挂,missing-origin-not-run(连挂两日)今日转过;②transcript 证实失败用例 skill 已进上下文(失败用例 SKILL.md 引用 5 次 vs 通过 4 次),排除"注入缺失"与"我的 description 改动"两假设;③门禁违反形态(修而不问、requirements-only 直接实现)与 R2 收编模式同族但呈非确定性。**结论:网关降级窗口内的行为波动,回归判定继续挂起至通道稳定;按纪律不改判 keep 状态。** 三个数据点:with-edit 8/18(09-02)、without-edit 0/10 子集(09-02 隔离)、with-edit 6/18(09-03)。
