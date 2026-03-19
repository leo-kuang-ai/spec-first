# Spec-First 综合升级路线图

> 上位文档：`Spec-First综合升级蓝图与实施方案.md`
> 类型：路线图 / 分阶段落地规划 / 里程碑管理文档
> 分析日期：2026-03-15

---

## 一、路线图摘要

这份路线图解决的不是“要不要升级”，而是“按照什么顺序升级，才能在不破坏现有治理骨架的前提下，逐步把 Spec-First 升级为工程执行平台”。

整体路线遵循三个原则：

1. `核心闭环先行`
先补自动执行、快速路径、TDD 门禁，避免平台层先行但主流程仍旧偏弱。

2. `能力中台后置但不拖延`
执行层稳定后，立即建设宿主适配、工具能力、记忆能力中台。

3. `生态扩展最后进入主计划`
专项模板、多宿主扩展、专家角色库放到第三阶段，避免一开始把精力打散。

整体分为 3 个阶段、9 个里程碑、4 条并行工作流。

---

## 二、升级节奏总览

| 阶段 | 时间跨度 | 核心目标 | 产出形态 |
|------|----------|----------|---------|
| Phase A | 0-6 周 | 执行闭环强化 | 可自动推进、可快速执行、可硬性阻断 |
| Phase B | 6-12 周 | 能力中台建设 | 宿主能力统一、工具能力统一、记忆链路统一 |
| Phase C | 12-20 周 | 生态与专项扩展 | 多宿主、浏览器验收、安全审计、专家协作 |

建议理解为：

- `前 6 周`：先把引擎做强
- `中间 6 周`：把平台做稳
- `后 8 周`：把生态做厚

---

## 三、四条并行工作流

### 3.1 Core Execution

负责：

- Auto Loop
- Timeout Supervisor
- Quick Path
- TDD Gate
- Wave Scheduler

价值：

- 这是“系统能不能真正跑起来”的主线

### 3.2 Platform Integration

负责：

- Host Adapters
- Tool Capability Layer
- update / doctor 升级
- viewer / hooks / MCP 统一治理

价值：

- 这是“系统是不是平台”的主线

### 3.3 Memory & Quality

负责：

- Steering
- Session Record
- Persistent Memory
- review / verify 产物强化

价值：

- 这是“系统能不能越跑越稳定、越跑越懂项目”的主线

### 3.4 Specialization

负责：

- Browser verification
- Security audit
- Expert profiles
- Constitution + Delta Spec

价值：

- 这是“系统能不能从研发主流程扩到专项场景”的主线

---

## 四、Phase A 路线图：执行闭环强化

### 4.1 目标

让 Spec-First 从“有流程”升级为“流程可以持续执行”。

### 4.2 时间安排

| 周期 | 里程碑 | 核心任务 | 结果 |
|------|--------|----------|------|
| Week 1-2 | M1 | Auto Loop 深化 | 自动推进链路成型 |
| Week 2-3 | M2 | Timeout Supervisor | 自动执行具备停滞检测 |
| Week 3-4 | M3 | Quick Path | 轻任务短路径可用 |
| Week 4-5 | M4 | TDD Gate | 实现阶段硬门禁初步生效 |
| Week 5-6 | M5 | Wave Scheduler | 并行执行基础能力上线 |

### 4.3 关键依赖

| 任务 | 前置依赖 | 说明 |
|------|----------|------|
| Auto Loop 深化 | 无 | Phase A 启动项 |
| Timeout Supervisor | Auto Loop | watchdog 要绑定执行循环 |
| Quick Path | 无 | 可相对独立推进 |
| TDD Gate | Gate Engine | 依赖现有 Gate 条件扩展 |
| Wave Scheduler | Auto Loop / task dependency | 需明确依赖关系表示 |

### 4.4 阶段完成标准

- 至少一个 Feature 可在无人连续确认下推进多个任务
- 小任务能走 quick path
- 没有测试证据时 implement / verify 不可直接通过
- 并行任务可按依赖拆 wave

### 4.5 风险

- Auto Loop 与现有 orchestrate 逻辑冲突
- TDD Gate 太严格导致误阻塞
- Quick Path 变成绕过全流程的捷径

应对：

- 不做第二套 orchestrator
- 先从“最小硬门禁”开始
- quick 只缩短前置产物，不绕过 verify

---

## 五、Phase B 路线图：能力中台建设

### 5.1 目标

让 Spec-First 的工具、宿主、记忆能力统一表达、统一安装、统一调度。

### 5.2 时间安排

| 周期 | 里程碑 | 核心任务 | 结果 |
|------|--------|----------|------|
| Week 6-7 | M6 | Host Adapter 抽象 | 宿主差异统一建模 |
| Week 7-9 | M7 | Tool Capability Layer | registry / matrix / selection policy 成型 |
| Week 8-10 | M8 | update / doctor 组件化 | 安装与诊断升级为平台入口 |
| Week 9-12 | M9 | Memory Layer | Steering + Session + Persistent Memory 闭环 |

### 5.3 关键依赖

| 任务 | 前置依赖 | 说明 |
|------|----------|------|
| Host Adapter | 无 | 平台层的基础抽象 |
| Tool Capability Layer | Host Adapter | 工具能力要依赖宿主能力表达 |
| update / doctor 组件化 | Host Adapter + Capability Layer | 要输出能力矩阵和组件计划 |
| Memory Layer | 无 | 可并行，但要接入 orchestrate / review |

### 5.4 阶段完成标准

- 不同宿主的支持边界可统一描述
- 工具不再只是“已安装”，而是“可选择”
- `update --component`、`update --dry-run` 可用
- doctor 输出宿主能力与缺失项
- 新会话能恢复最小必要上下文

### 5.5 风险

- 中台抽象过早设计过重
- update / doctor 改造波及范围大
- memory 接口过早强绑具体外部服务

应对：

- 先做最小 capability model
- update 先保留原行为，再增量支持 component / dry-run
- memory 先做 provider interface，不强绑供应商

---

## 六、Phase C 路线图：生态与专项扩展

### 6.1 目标

让 Spec-First 从“研发流程平台”扩展为“带专项能力和多宿主生态的平台”。

### 6.2 时间安排

| 周期 | 里程碑 | 核心任务 | 结果 |
|------|--------|----------|------|
| Week 12-14 | M10 | Browser Verification | 浏览器能力进入 verify / review |
| Week 13-15 | M11 | Research Evidence | fetch / 外部调研结果标准化 |
| Week 14-16 | M12 | Security Audit | 安全 checklist 与报告模板可用 |
| Week 15-18 | M13 | 新宿主接入 | 至少接入 1 个新宿主 |
| Week 16-20 | M14 | Expert Profiles | 专家角色与 orchestrator 模板进入流程 |

### 6.3 关键依赖

| 任务 | 前置依赖 | 说明 |
|------|----------|------|
| Browser Verification | Capability Layer | 需要先知道宿主/工具能力 |
| Research Evidence | Capability Layer | 需要 selection policy |
| Security Audit | review / verify 产物强化 | 要依赖模板化输出能力 |
| 新宿主接入 | Host Adapter | 必须建立统一 adapter 后再扩 |
| Expert Profiles | Host Adapter + Memory Layer | 需要宿主和上下文支持 |

### 6.4 阶段完成标准

- 至少一个新宿主具备基础可用性
- 浏览器验收不再只是口头建议，而是标准产物
- 安全审计具备 checklist + report template
- orchestrate 可按任务类型识别 expert profile

### 6.5 风险

- 多宿主接入吞噬过多资源
- 安全审计模板只停留在文档层，没有进入流程
- expert profile 设计过多，导致复杂度失控

应对：

- 只选 1-2 个高价值宿主做首批试点
- 安全审计必须进入 verify / review 的产物链
- expert profile 先做 3-4 个，不追求大而全

---

## 七、里程碑地图

### 7.1 里程碑清单

| 里程碑 | 阶段 | 名称 | 判定标准 |
|--------|------|------|----------|
| M1 | A | Auto Loop 成型 | 多任务自动推进可用 |
| M2 | A | Timeout 可控 | soft / idle / hard 生效 |
| M3 | A | Quick Path 上线 | 小任务短路径可用 |
| M4 | A | TDD Gate 生效 | 无测试证据不可过门 |
| M5 | A | Wave 基础并行 | 依赖感知并行可用 |
| M6 | B | Host Adapter 成型 | 宿主能力统一表达 |
| M7 | B | Tool Capability 成型 | 工具可按任务选择 |
| M8 | B | update / doctor 升级 | 组件化 + dry-run + 能力矩阵 |
| M9 | B | Memory 闭环 | Steering + Session + Persistent Memory |
| M10 | C | Browser Verification | 浏览器验收模板进入流程 |
| M11 | C | Research Evidence | 外部研究证据标准化 |
| M12 | C | Security Audit | checklist + report 可用 |
| M13 | C | 新宿主试点 | 至少 1 个新宿主可用 |
| M14 | C | Expert Profiles | 角色协作进入流程 |

### 7.2 里程碑优先级

如果必须压缩范围，优先级应如下：

1. `M1-M4`
2. `M6-M9`
3. `M12`
4. `M10-M11`
5. `M13-M14`

原因：

- 先补执行闭环，才能证明系统升级有效
- 再补中台，才能避免后续扩展继续碎片化
- 安全审计优先于专家角色广度

---

## 八、交付物路线图

### 8.1 Phase A 交付物

- `auto-loop` 深化实现
- `timeout-supervisor`
- `quick` 命令
- `tdd gate` 条件
- `wave scheduler`

### 8.2 Phase B 交付物

- `host adapters`
- `tool registry`
- `capability matrix`
- `tool selection policy`
- `componentized update / doctor`
- `steering + session + persistent memory`

### 8.3 Phase C 交付物

- `browser verification template`
- `research evidence template`
- `security audit checklist + report`
- `new host adapter`
- `expert profiles`

---

## 九、资源与组织建议

### 9.1 推荐团队切分

如果按 3-4 人并行推进，建议分工如下：

| 角色 | 负责工作流 |
|------|-----------|
| 工程主程 | Core Execution |
| 平台工程师 | Platform Integration |
| 质量/流程工程师 | Memory & Quality |
| 生态/专项工程师 | Specialization |

如果只有 1-2 人，则必须按顺序做：

1. Phase A
2. Phase B
3. Phase C

### 9.2 周节奏建议

建议固定每周节奏：

- 周一：里程碑拆解与依赖确认
- 周三：中期评审，检查架构漂移
- 周五：里程碑验收，更新路线图状态

### 9.3 文档治理建议

建议每完成一个里程碑，就同步更新：

- `综合升级路线图`
- 对应专题文档
- `Gap Closure Plan` 进度表

避免路线图与实际实施脱节。

### 9.4 当前执行快照（2026-03-15）

- `M6 Host Adapter`：已落地基础形态。
  当前状态：`Claude / Codex / Gemini / Cursor` 已统一纳入 adapter registry，`update / doctor / init / postinstall` 已可消费宿主状态。
- `M7 Tool Capability Layer`：已完成首轮落地。
  当前状态：`tool-registry / capability-matrix / tool-selection` 已进入代码和测试，`doctor` 已输出 `external-research`、`browser-verification` 等场景策略。
- `M8 update / doctor 组件化`：部分完成。
  当前状态：`update --component`、`Component Plan`、结构化宿主摘要已可用；`hooks-only` / `viewer-only` 组件语义已落地。
- `M8.1 uninstall / help / docs 收口`：已完成补强。
  当前状态：`uninstall --host` 已支持定向卸载、`--host all` 全量卸载、非法 host 输入返回 `CONFIG_ERROR`；`update --help`、CLI 参考手册、安装与更新文档已同步真实参数签名；`uninstall --dry-run` 已改为预演语义。
- `M10 Browser Verification`：基础模板已落地。
  当前状态：`browser-verification.md` 已纳入模板层，`verify` 已接入浏览器验收说明。
- `M11 Research Evidence`：基础模板已落地。
  当前状态：`research-evidence.md` 已新增，`research` 已接入 `fetch + context7 + serena` 策略。
- `M12 Security Audit`：基础模板已落地。
  当前状态：`security-audit-report.md`、`tool-integration-review-checklists.md`、`tool-integration-gates.md` 已可用。
- `M13 新宿主接入`：已进入实验性阶段。
  当前状态：`Gemini / Cursor` 已支持 detection、baseline skills/MCP、冲突保留与 partial 诊断，但仍属于 experimental，不应按稳定宿主宣传。

---

## 十、度量指标

### 10.1 执行指标

- 单 Feature 自动推进任务数
- quick path 使用比例
- wave 并行执行成功率

### 10.2 平台指标

- 宿主支持数量
- 可调度工具数量
- `update --dry-run` 覆盖率
- doctor 能力诊断准确率

### 10.3 质量指标

- implement 阶段测试证据覆盖率
- verify 失败拦截率
- 安全审计模板使用率

### 10.4 生态指标

- 新宿主接入数
- expert profile 使用数
- 浏览器 / research / security 模板使用数

---

## 十一、路线图版本管理建议

建议把这份路线图作为动态文档管理，而不是一次性文稿。

建议新增两个维护规则：

1. 每个里程碑更新状态
可选状态：
- `未开始`
- `进行中`
- `已完成`
- `已阻塞`
- `已取消`

2. 每个阶段更新偏差说明
记录：
- 为什么延期
- 为什么缩 scope
- 为什么调整优先级

这样路线图才能持续反映真实项目状态。

---

## 十二、最终建议

如果只做一件事，优先做 `Phase A`。  
如果只做两件事，再补 `Phase B`。  
只有当执行闭环和能力中台都稳定以后，才值得系统性推进 `Phase C`。

最优升级顺序不是：

- 先接很多宿主
- 先做很多模板
- 先做很多工具

而是：

1. 先让核心流程真正跑起来
2. 再让平台能力真正统一
3. 最后让生态能力真正扩出去

这才是 Spec-First 从“规范系统”升级成“工程执行平台”的最短路径。
