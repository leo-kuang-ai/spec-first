取证完成，证据已充分。结论明确：**回源验证不成立，拒绝写入**。知识库保持原样，交还控制权。

---

## 回写处理结果：❌ 拒绝（回源验证不成立）

**Scope**：`--scope module:apps/admin`（回写路径 · 推翻既有规则）

### 用户声称 vs 代码证据

| 验证项 | 结果 |
|---|---|
| 口头声称 | "admin 现在可以直接 import web 的模块了" |
| L0 依赖图（extract-deps.cjs） | edges 仅 `admin→api-client`、`web→api-client`、`web→ui`，**无 admin→web 边**；alias_count=0，排除别名引用 |
| 全量扫描 `apps/admin` | 唯一命中 `apps/admin/src/legacy/OldPanel.ts:2`——即知识库已登记的**历史例外**，规则明文"不得扩大"，非新约定证据 |
| 新约定所需 ≥2 文件证据 | **0 个** |
| 明文来源（README.md:5） | 仍为 "admin **不得**依赖 apps/web 的业务代码，跨端复用一律走 packages/"，用户未先行改动 |

### 裁决依据

推翻既有规则需满足二选一，**均不成立**：
1. **新代码证据**：admin 源码中不存在任何新增的 web import（唯一引用是登记在案的 legacy 例外）；
2. **用户先改明文来源**：README.md（该规则的 confirmed source_ref）未改动，AGENTS.md 内嵌块也仍持禁止规则。

口头声称不构成 confirmed 证据，本次不写入 `docs/architecture.md`。

### 两条出路（任选其一后可重新发起回写）

1. **补代码证据**：在 admin 实际落地 ≥2 处对 web 模块的 import（legacy/OldPanel.ts 例外不计），提交后重跑本回写；
2. **先改明文来源**：先更新 `README.md` 架构边界节（及 AGENTS.md 若需同步），声明新依赖方向约定，再凭改动后的明文来源回写。

### Closeout

- scope：`module:apps/admin` 回写（推翻规则类）
- 写入面：**零写入**（docs/architecture.md 与 AGENTS.md 均未改动）
- 环境形态：headless（自动化 runner，无交互确认原语）——因验证不成立未进入写前 preview，无 `headless_default_write` 回执
- limitations：无；反证 refs：`extract-deps.cjs` edges 输出、`apps/admin/src/legacy/OldPanel.ts:2`、`README.md:5`

控制权交还 caller。
