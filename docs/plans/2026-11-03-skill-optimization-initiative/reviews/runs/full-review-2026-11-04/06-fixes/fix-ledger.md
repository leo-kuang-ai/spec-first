# 修复台账（优化阶段）

审查证据指向主仓 source；修复均发生在主仓工作区（非冻结 worktree）。每条记录发现来源→修复内容→验证。

## FIX-001　spec-plan description 裸路由名（B01·P2，R1 dissent）

- **发现**：S1 spec-plan R1 唯一 fail 票；L1 仲裁确认 B01 pass 但保留该 finding。`skills/spec-plan/SKILL.md:3` 的 route-out 序列里其余四项（spec-brainstorm/spec-debug/spec-work/spec-doc-review）均可调用，唯 `runtime-maintenance` 是 using-spec-first route map 定义的泳道标签（`skills/using-spec-first/references/public-route-map.md:38`），不可作为 skill 调用。
- **修复**（e847db2b）：description 改为 `the runtime-maintenance route for generated runtime mirrors (regeneration via spec-first init)`——保留治理词汇表标签 + 补可执行落点。
- **影响面核实**：测试只锁 route map 文件与 eval fixture 中的标签本身（3 文件 4 处断言），不锁 spec-plan description；无测试需改。
- **待办**：runtime mirror 同步（`spec-first init`）留待优化阶段末统一再生。

## FIX-002　Interaction Rule 5(a) 悬空/错精度引用 ×6（D05 维护瑕疵，L1 发现 + 修复时扩查）

- **发现**：S1 L1 仲裁指出 `synthesis-summary.md:274` 引用不存在的编号规则；修复时 `rg "Interaction Rule"` 扩查发现同缺陷共 6 处、跨 2 个 skill：
  - spec-plan ×3（:274/:326/:418）：spec-plan 无 interaction-rules.md，SKILL.md 只有无编号 Interaction Method 节（:48-52）→ 全部悬空
  - spec-brainstorm ×3（:128/:134/:172）：interaction-rules.md 实有规则 5「Use an open-ended question only when the question is genuinely open」，但**无字母子项** → 错误精度引用
- **修复**（e847db2b）：spec-plan 三处改指 `the Interaction Method section in SKILL.md`（附关键句：an optional menu is not a waiting condition）；spec-brainstorm 三处 `5(a)` → `5`。
- **验证**：`rg "Interaction Rule" skills/spec-plan/` 清零；spec-brainstorm 剩余引用均指向实存规则 5；`npm run lint:skill-entrypoints` 518 文件通过；无测试锁定旧字符串。
- **备注**：spec-brainstorm 属批次3 未审对象，本修复是同缺陷类的确定性外延（有 file:line 证据、无语义裁量），非预审优化。

## FIX-003　spec-prd D05·P2 复述密度（392b3e97）

- **发现**：批次1 spec-prd 收敛 D05 多数 fail（R2+R3）；主会话脚本核实 relentless ×24/6 文件、Four Legal Stop Points ×18/6 文件。
- **修复**：SKILL.md:198 撤除四元组括号复述（违反 :204 Canonical 自身「只许指针」规则）；:275 Pre-Write Gate 五句 write_mode 语义复写压缩为指针 + 仅留本门独有写入前置条件。其余复述（checkpoint-as-escape :208/:219 双 register、references 中 agent prompt 载荷、closure_summary 枚举）判「保持现状成立」——不同 register 或不同 schema 服务面。
- **验证**：spec-prd 全部 14 套合同测试 179/179 绿；lint:skill-entrypoints 518 文件通过。

## 已确认待修（尚未修）

- spec-prd P3×6（R1 #1 悬空枚举 / R1 #2 连字符混用 / R3 #3 Lite token / R3 #4 evals 不对称 / R1 #5 disposition 列位 / R1 #6 legacy origin 口径）
- spec-work R1 F1-F4 P3（trivial 路由矛盾、shipping Step6 无 PR 出口、simplify 双口径、重复段）+ R3 #1-#5 —— 待 R2-v2 收敛后统一排期
