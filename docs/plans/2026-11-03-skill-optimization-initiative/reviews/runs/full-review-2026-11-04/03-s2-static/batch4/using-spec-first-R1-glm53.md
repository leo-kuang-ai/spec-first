# using-spec-first 评审（R1）

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | skills/using-spec-first/SKILL.md:26,28,44,46；tests/unit/using-spec-first-contracts.test.js:92-94 | 各“补丁句”均有可辨识的真实失败来源（测试注释引 U2/S5 修订），无相互矛盾或过度步骤化 |
| D02 | pass | references/public-route-map.md:19-31,43；SKILL.md:50 | 输入→结果表、advisory/confirmed 证据纪律、脚本/LLM 分工均为具体领域知识而非流程口号 |
| D03 | pass | SKILL.md:50；references/conditional-routing-boundaries.md:14,55 | 验证纪律明确可定位（不得无证据声明完成、advisory 不得支持 passed），无语义判断冒充机械判定；无运行时强制但也未伪造强制声明（见 F4） |
| D04 | pass | SKILL.md:13,26；route-map:33,54；src/cli/lang-policy.js:122 | CLAUDE.md/AGENTS.md anchor→本 skill→references→下游契约测试（spec-handoff-contracts.test.js:73-74、skill-flow-p2:107-121）逐环对上 |
| D05 | pass | SKILL.md 全文 5771B；using-spec-first-contracts.test.js:34-49 | 关键规则均有 test 锚定、可定位；字节预算余量仅 29B（见 F2） |
| D06 | pass | SKILL.md:28；evals/cases/*.yaml 描述（recommend-and-wait 降级）；src/cli/adapters/cursor.js:262（preview 披露） | 能力假设显式，宿主缺能力/描述截断/沙箱无 workflow 三类降级路径文本齐备 |
| D07 | pass | using-spec-first-contracts.test.js:92-99；evals/eval.yaml:13-20 | 问题→修订→回归链在册（6 个已提交 eval case + load-bearing 断言）；runtime-maintenance 路由无 eval case（见 F3） |
| D08 | pass | SKILL.md:18-22,30,52；conditional-routing-boundaries.md:3 | 三级按需加载：Direct Lane 不读任何 reference，route map 仅出快速路径后读，boundaries 只应用命中小节 |
| B01 | pass | SKILL.md:3,20-22；route-map:53,56,63（相似入口负例）；using-spec-first-contracts.test.js:146-153 | 正负触发齐备、internal-only 零泄漏（rg 于 skills/using-spec-first/ 无 spec-commit/spec-worktree/spec-test-browser 命中） |
| B02 | pass | SKILL.md:10-16,30,52；using-spec-first-contracts.test.js:60-89 | 输入/输出/权威/消费者四要素声明且与两个 reference 及测试断言一致 |
| B03 | pass | SKILL.md:14,50；boundaries:21,32-35,44；route-map:43 | 路由命中不授权任何副作用；dispatch 授权先于能力、issue/PR 正文视为 advisory |
| B04 | pass | boundaries:18,22（“routing-policy source of truth”）；src/cli/instruction-bootstrap.js:72-88 | 真相源声明+安装存在性校验+drift 检测在册；消费者侧遗留 no-op 重写属消费者债（见 F1） |
| B05 | pass | SKILL.md:30,42；boundaries:13,27,39 | provider 缺失 never-blocking、startup-reminder 失败不阻断路由、低置信最多一问、foreign residual 先预览，失败面覆盖完整 |
| B06 | pass | SKILL.md:46,50 | 首次实质结果须按来源说明完成/未完成范围，欢迎语/receipt/文件存在不证明成功 |
| X01 | not-applicable | SKILL.md:8,30 | 单入口选择器无多模块执行面：分解归 spec-plan/spec-work，且明确禁止自动串联链路 |
| X02 | pass | using-spec-first-contracts.test.js:60-74,146-153；tests/unit/project-graph-consumption-contracts.test.js:101-110 | 路由面↔governance roster（33 个公共 skill）一致性由确定性测试强制，roster 变更必同步 route map |
| X03 | not-applicable | SKILL.md:48-52 | 无实现/交付面；其高风险暴露（越权出口）已由 Exit Boundaries 与 B03 覆盖 |
| X04 | pass | SKILL.md:26；route-map:54；boundaries:46-49 | handoff/知识晋升路由在册，且带 summary/source refs/freshness/limitations 与 verified/reusable/scoped/invalidation-condition 纪律 |

## Findings

**F1（P3，B04/D05，消费者侧）** `src/cli/adapters/codex.js:298-303`、`cursor.js:258-272`、`kiro.js:208-222`、`qoder.js:311-325`、`src/cli/plugin-sync.js:901-910`：五处针对 using-spec-first 的宿主专属重写（"Claude Code installs it as …"、"Runtime copies under …"、"Ordinary context routing follows …" 模式）在当前 source 包内已无任何可匹配文本（rg "installs it as" 于 skills/using-spec-first/ 零命中），全部退化为 no-op。后果：维护者会误以为 per-host 投影仍在发生；未来改写源文时这些规则提供虚假安全感。最小修复：确认无旧 runtime 依赖后删除，或在规则旁注明其失效条件。因无匹配即无改写，无现行行为损伤。

**F2（P3，D05/D08）** `skills/using-spec-first/SKILL.md` 全文 5771 字节，距硬上限 5800（using-spec-first-contracts.test.js:38）仅 29 字节，且超 advisory 目标 5200 达 571 字节（test:44-48 仅 console.warn）。后果：下一条 load-bearing 规则加入时被迫在“删既有内容（有测试锚定，风险可控但需逐条裁决）”与“抬预算（需显式决策）”之间二选一，属流程摩擦而非现行缺陷。建议：趁下次修订把 SKILL.md:46 的首次实质结果段（最像下游 owner 职责的部分）下移或合并，恢复预算余量；或以 rationale 抬高 advisory 目标。

**F3（P3，D07/B01）** `route-map:38` 的 `runtime-maintenance` 路由（镜像补丁拒绝→source-revision 请求）被合同测试列为 load-bearing（test:88 断言 `runtime-maintenance`、`source-revision request`），但 `evals/cases/` 六个用例无一覆盖该路径，conditional-routing-boundaries.md 的高风险小节（Worker Dispatch、Parent Multi-Repo）同样无行为用例。后果：入口治理器风险最集中的边界（拒绝越权镜像修补、dispatch 授权缺失）只有静态断言、无回归护栏。最小修复：补一条 mirror-patch 请求的 eval case（断言拒绝修补并转 source-revision）。

**F4（P3，D03，观察）** `SKILL.md:50` 使用 "Hard exit gates" 措辞但无运行时强制器；boundaries:14,55 已诚实声明 hook 只供机械事实、advisory 不能支持完成声明，未伪造强制，但按仓库“未强制须显式声明”的治理口径，可加一句“以上为 prose 约定，由宿主权限系统与证据纪律承担实际强制”。属可选增强，保持现状成立。

## 主责深挖面发现

- **D01**：四条“补丁句”逐一溯源成立——SKILL.md:26（执行中失败归属，S5 修复）、:28（描述截断防误选）、:44（不重复索要授权）、:46（欢迎语/receipt ≠ 成功）。均为否定式边界规则而非步骤处方，无过度指导；补丁累积的代价已外显为 F2 的预算压力。
- **D02**：route map 是真领域知识：输入→结果表（19-31 行）按“已有输入”而非关键词组织；:43 行把 issue/PR 正文定为 advisory；governance roster 全覆盖由测试强制（33/33 公共 skill 均在 route map 出现，逐一核对 skills-governance.json）。
- **D03**：验证承诺全部为“禁止性”承诺（不得无证据声明、不得伪造 eval/routing evidence），与“gate the exits, not the thinking”一致；无脚本冒充问题。
- **D04**：交接链三方核对一致——lang-policy.js:122 anchor 声称“完整入口路由与边界由该 skill 提供”，SKILL.md:30,52 恰好提供这两个 reference 且各只链接一次（test:66,114 断言唯一性）；spec-handoff-contracts.test.js:73-74 所需的两句 route map 语义原文在册（route-map:54）。
- **D05**：中英混排脚手架（英文骨架 + 26/28/34/44/46 中文插入）阅读成本偏高，但每处中文均为 test 锚定的 load-bearing 文本；route-map:33 末两句与 SKILL.md:26 存在有意的跨文件重复（各自需在单独加载时成立），判定为可接受冗余。
- **D08**：加载分级严格——入口文件 5.8KB 常载；route map（6.5KB）仅非快速路径加载；boundaries（6.2KB）按小节命中应用且开头即声明 "Apply only the matching section"；Direct Lane 请求总消耗只有入口文件。

## 未读文件

- `src/cli/adapters/codex.js`、`plugin-sync.js`、`cursor.js`、`kiro.js`、`qoder.js`：仅读 using-spec-first 相关区段（transform/drift/pointer），未通读全文件。后果：与该 skill 无关的其余 adapter 逻辑不在本轮结论内。
- `tests/integration/init-six-host-lifecycle.integration.test.js`：仅深读 85-160（runtime skill 安装、指针、路径泄漏断言）。后果：六宿主 lifecycle 其余断言未逐行核，与该 skill 直接相关的断言已核。
- `tests/unit/spec-handoff-contracts.test.js`：仅读 30-110（route map 相关段），其余为 spec-handoff 自身 artifact 逻辑。
- `tests/unit/qoder-runtime-lifecycle.test.js`：仅 grep 命中（86-87,395）。后果：qoder 生命周期与本 skill 的其余交互面仅间接覆盖。
- `scripts/evals/build-outcome-judges.cjs`（fixture 生成器，消费者清单外）：未读。后果：check-r2-asks.sh 的生成正确性仅凭文件头声明采信。

## 结论一句话

using-spec-first 静态合同层 18 项全部可裁决且无 fail：承诺存在、内部一致、可定位、与全部所列消费者对账一致；四条 P3 均为非阻断维护债（消费者侧 no-op 重写、29 字节预算余量、runtime-maintenance 无 eval 用例、Hard gates 措辞可选加未强制声明），保持现状成立但建议在下一次触碰该包时顺带处置 F1/F3。
