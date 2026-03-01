# Spec-First v5 对 v4 审查问题闭环核查报告

> 对照文档：`docs/03审查报告/review-spec-first-v4.md`  
> 被核查文档：`docs/01需求文档/spec-first-v5.md`  
> 核查日期：2026-02-08

## 结论摘要

- v4 报告提出的 3 个关键缺陷中：
  - 已解决：0
  - 部分解决：2
  - 未解决：1
- v4 报告中的风险项在 v5 中基本都被识别并给出缓解策略，但多数仍处于“规范定义/路线图”层，非“工具已落地”层。

## 逐项核查（对应 v4 报告第 3 节）

### 1) 缺陷一：机器可读性不足（v4 建议：YAML Front Matter/结构化块）
**状态：部分解决**

**v5 已改进点**
- 明确了结构化元数据字段 `traces` / `verifies` 的强制规则（`spec-first-v5.md:1315`，`spec-first-v5.md:1323`，`spec-first-v5.md:1324`）。
- 给出了跨 Agent 的标准化 `context-pack.yaml` 结构与强制约束（`spec-first-v5.md:1996`，`spec-first-v5.md:2020`）。
- ID 正则与格式规则更细化（`spec-first-v5.md:1240`-`spec-first-v5.md:1246`，`spec-first-v5.md:1256`）。

**仍未完全解决点**
- `spec.md` / `tasks.md` / `tests` 仍是 Markdown-first 规范，未升级为“强制 schema 文件（如 artifacts.yaml）”。
- 自动化方式仍以“脚本扫描 + Regex lint”为主（`spec-first-v5.md:1908`-`spec-first-v5.md:1912`），未定义统一 machine schema 校验层。

**判定理由**
- 从“纯文本自由格式”提升到了“半结构化约束”，但未达到 v4 建议的“核心产出物强结构化、可严格机器解析”的终态。

---

### 2) 缺陷二：缺乏 Prompt Engineering 配套（v4 建议：`prompts/` + 标准 System Prompt）
**状态：未解决**

**核查结果**
- v5 有代理路由矩阵与 Context Pack 标准（`spec-first-v5.md:1973`，`spec-first-v5.md:1996`），但未定义按阶段的 Prompt 模板体系。
- 文档内未出现 `prompts/` 目录或标准 System Prompt 规范（全文检索无命中）。

**判定理由**
- “任务分派标准”已增强，但“AI 输出格式稳定性”的核心抓手（提示词模板标准化）仍缺失。

---

### 3) 缺陷三：工具链仅描述化，缺少可执行统一入口（v4 建议：`sdd-cli`）
**状态：部分解决**

**v5 已改进点**
- 明确 Git/CI/Hook 校验点与触发时机（`spec-first-v5.md:1898`-`spec-first-v5.md:1903`）。
- 增加“追踪体系工具化支撑”表，定义了多类自动校验动作（`spec-first-v5.md:1906`-`spec-first-v5.md:1914`）。
- 路线图第二步明确“编写校验脚本 + CI 集成”（`spec-first-v5.md:2109`-`spec-first-v5.md:2111`）。

**仍未完全解决点**
- 未给出统一 CLI 命令约定（如 `sdd check` / `npm run sdd:verify`），仍是“脚本能力说明”，不是“单入口工具产品化”。

**判定理由**
- 自动化从“概念”走向“流程设计”，但未完成“工具产品化收口”。

## v4 风险项在 v5 的覆盖情况（对应 v4 报告第 4 节）

### 1) 追踪矩阵维护成本高
**状态：已覆盖（风险已识别+给出缓解）**
- v5 明确列出风险并给出“最小闭环、渐进扩展”策略（`spec-first-v5.md:2143`）。

### 2) AI 幻觉导致 ID/规范污染
**状态：已覆盖（风险已识别+给出缓解）**
- v5 新增该风险项及缓解策略（人类 Sign-off、AI 标记、抽检）（`spec-first-v5.md:2165`-`spec-first-v5.md:2173`）。

### 3) 过度设计 / 流程过重
**状态：已覆盖（风险已识别+给出缓解）**
- v5 给出“3 步落地路线图”与 Size S 裁剪策略（`spec-first-v5.md:2084`，`spec-first-v5.md:2155`，`spec-first-v5.md:2163`）。

## 综合判断

v5 相比 v4 报告时点，明显前进在“流程工程化”与“风险显性化”，尤其是：
- 增加 AI 协作编排规范、Context Pack、落地路线图、风险矩阵、度量运营体系。

但若以 v4 报告的原始 P0/P1 目标衡量：
- **P0（机器可读性强结构化）**：仅部分达成。
- **P0（统一 CLI 工具化）**：仅部分达成。
- **P1（Prompt 标准化）**：未达成。

因此，本次结论为：**“大幅改进，但尚未完全闭环 v4 所有关键改进项”**。

## 建议下一步（只列闭环必需）

1. 增补 `prompts/` 标准：至少覆盖 Specify/Design/Plan/Implement/Verify 五阶段。
2. 定义单入口命令规范：例如 `sdd check`、`sdd gate --phase plan`，并在文档中给出最小可执行示例。
3. 给 `spec.md` / `tasks.md` 增加可机检 schema（YAML block 或 sidecar YAML），将 Regex 校验升级为 schema + 语义校验。
