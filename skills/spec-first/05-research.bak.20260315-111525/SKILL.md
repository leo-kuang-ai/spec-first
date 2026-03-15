---
name: "spec-first:research"
description: "定位 Feature 上下文并生成调研结论"
version: 1.4.0
last_updated: 2026-03-05
changelog: |
  v1.4.0: 新增 Operation Types 章节、模板引用路径、metadata.version 分离
  v1.3.0: 新增 hooks 配置（PreToolUse/PostToolUse/Stop）、allowed-tools 约束、user-invocable 标记
  v1.2.0: 新增 references/ 目录、Don't Skip Research When、Evidence Protocol、Review Checklist
  v1.1.0: 补充字面即精神原则、模板驱动约束、决策流程图、Plan Mode 协同、示例输出
  v1.0.0: Initial version with standardized metadata
user-invocable: true
allowed-tools: "Read, Write, Edit, Bash, Glob, Grep, WebSearch, mcp__fetch__fetch, mcp__web_reader__webReader"
metadata:
  version: "1.4.0"
  phase: "stable"
  category: "spec-phase"
hooks:
  PreToolUse:
    - matcher: "WebSearch|mcp__fetch__fetch|mcp__web_reader__webReader"
      hooks:
        - type: reminder
          message: "[research] 查阅资料后立即更新 findings.md（2-Action Rule）"
    - matcher: "Write|Edit"
      hooks:
        - type: reminder
          message: "[research] 写入文件前检查是否同步 findings.md"
  PostToolUse:
    - matcher: "Write|Edit"
      hooks:
        - type: reminder
          message: "[research] 文件已更新，检查是否需同步 findings.md"
    - matcher: "WebSearch|mcp__fetch__fetch|mcp__web_reader__webReader"
      hooks:
        - type: reminder
          message: "[research] 资料已查阅，提取关键结论到 findings.md"
  Stop:
    - hooks:
        - type: reminder
          message: "[research] 会话结束前确保 findings.md 已包含：当前结论、证据路径、待验证项"
        - type: checkpoint
          message: "[research] 检查清单：research.md 完整？findings.md 同步？假设已标记？"
---

# Skill: research

执行技术调研，输出方案对比与推荐结论。

## Announce at Start

```
I'm using the research skill to evaluate [调研主题].
```

## 字面即精神原则

**Violating the letter of these rules is violating the spirit of these rules.**

### 字面即精神反合理化表

| AI 的借口 | 封堵 |
|-----------|------|
| "我理解核心思想，可以灵活执行" | 字面规则的违反就是精神的违反，不存在灵活变通 |
| "这是精神而非仪式" | 仪式（字面规则）是精神的体现，跳过仪式就是违背精神 |
| "实质重于形式" | 在流程守卫上，形式（字面规则）= 实质（精神） |
| "具体情况具体分析" | 规则已考虑常见情况，例外需明确讨论而非自行变通 |

### 反合理化守卫

当你产生以下念头时，立即停止并回到流程：

| AI 的借口 | 封堵 |
|-----------|------|
| "调研结论很明显，不需要对比" | 你认为明显 != 无需证据，必须提供对比依据 |
| "这个技术栈我熟悉，跳过资料查阅" | 熟悉度 != 无需验证，技术选型需可追溯证据 |
| "临时假设就够了，后面再验证" | 未验证假设 = 技术债，必须标记为 `[NEEDS VERIFICATION]` |
| "用户没说要备选方案" | 用户不提 != 不需要，调研职责是提供充分选项 |
| "先写个大概结论，后面补细节" | 模糊结论会放大后续设计风险 |

## When to Use

用于任何需要技术决策的场景：
- 技术栈选型（框架、库、工具）
- 第三方服务评估（云服务、SaaS、API）
- 架构方案对比（单体 vs 微服务、SQL vs NoSQL）
- 性能优化方案（缓存策略、并发模型）
- 安全方案评估（认证、加密、合规）

**Use this ESPECIALLY when**：
- 技术选型影响后续 6+ 个月开发
- 涉及安全、合规、隐私相关决策
- 迁移成本高或回滚困难
- 多个方案各有优劣，难以判断

## Don't Skip Research When

**即使情况看似简单，也不应跳过调研**：

| 场景 | 常见借口 | 实际风险 |
|------|----------|----------|
| 技术栈看似熟悉 | "我做过类似项目" | 版本差异可能有 breaking changes |
| 有现成方案 | "大家都用这个" | 可能不符合当前场景的特殊需求 |
| 时间紧 | "先做再说" | 错误选型返工成本是调研成本的 10x |
| 用户说"你决定" | "用户不关心" | 用户不承担技术债，责任在开发者 |
| 小功能 | "影响范围小" | 小功能可能演变成核心依赖 |
| 临时方案 | "以后再重构" | 临时方案往往变成永久方案 |

> **Iron Law**: "NO TECHNICAL DECISION WITHOUT EVIDENCE."

## 模板驱动约束

research 阶段输出技术选型依据，不输出实现方案：
- **必须写**：调研目标、候选方案、对比维度（成本/风险/成熟度/生态）、优劣分析、推荐结论
- **禁止写**：具体实现代码、类/函数设计、部署细节（这些属于 design/code 阶段）
- **自我修正上限**：`{{MAX_SELF_CORRECTION}}` 轮（默认 3）
- **假设标记**：当结论依赖未验证假设时，必须标记 `[NEEDS VERIFICATION][TYPE]`
  - `PERF`（性能假设）
  - `COMPAT`（兼容性假设）
  - `COST`（成本假设）
  - `SEC`（安全假设）
  - `SCALE`（可扩展性假设）

## Evidence Protocol

### 证据强度要求

| 结论类型 | 必需证据 | 证据强度 | 示例 |
|---------|---------|----------|------|
| 性能声明 | Benchmark 数据 | 🔴 强 | 压测报告、官方性能数据 |
| 安全声明 | 安全审计/官方文档 | 🔴 强 | 安全白皮书、合规认证 |
| 成本声明 | 官方报价单 | 🔴 强 | 厂商报价、TCO 计算表 |
| 成熟度声明 | 用户案例/社区数据 | 🟡 中 | GitHub stars、案例研究 |
| 易用性声明 | 文档/教程质量 | 🟢 弱 | 文档完整性、学习曲线 |

### 证据来源可信度

| 来源 | 可信度 | 说明 |
|------|--------|------|
| 官方文档 | ⭐⭐⭐⭐⭐ | 厂商官方发布，权威最高 |
| 技术白皮书 | ⭐⭐⭐⭐ | 深度分析，但可能有营销倾向 |
| 开源社区 | ⭐⭐⭐ | GitHub issues、StackOverflow |
| 案例研究 | ⭐⭐⭐ | 实际用户经验，参考价值高 |
| 媒体报道 | ⭐⭐ | 需交叉验证，避免营销话术 |
| 个人博客 | ⭐ | 个人经验，仅供参考 |

### 反证据原则

当发现与当前结论相反的证据时：
1. **必须记录**：在 `research.md` 中记录反证据
2. **分析原因**：解释为什么反证据不影响当前结论
3. **更新结论**：如反证据更强，必须更新推荐方案

## Research 流程决策图

```dot
digraph research_flow {
  rankdir=TB;
  node [shape=box];

  Start [label="开始 research"];
  Start -> LocateFeature [label="定位 Feature"];

  LocateFeature [label="加载上下文"];
  LocateFeature -> DefineGoal [label="读取当前阶段状态"];

  DefineGoal [label="定义调研目标"];
  DefineGoal -> CollectOptions [label="目标明确"];

  CollectOptions [label="收集候选方案"];
  CollectOptions -> HasOptions [label="≥2 个候选"];

  HasOptions [label="候选方案检查"];
  HasOptions -> SearchMore [label="< 2 个"];
  HasOptions -> Compare [label="≥ 2 个"];

  SearchMore [label="搜索更多方案"];
  SearchMore -> HasOptions;

  Compare [label="方案对比分析"];
  Compare -> HasEvidence [label="有对比依据"];

  HasEvidence [label="证据完整性检查"];
  HasEvidence -> FixEvidence [label="证据不足"];
  HasEvidence -> RecordFinding [label="证据充分"];

  FixEvidence [label="补充证据"];
  FixEvidence -> HasEvidence;

  RecordFinding [label="记录到 findings.md"];
  RecordFinding -> ConfirmWithUser;

  ConfirmWithUser [label="用户确认结论"];
  ConfirmWithUser -> WriteResearch [label="确认"];
  ConfirmWithUser -> Compare [label="拒绝/修订"];

  WriteResearch [label="写入 research.md"];
  WriteResearch -> Done;

  Done [label="完成调研"];
}
```

## Plan Mode 协同

- 对高风险技术选型（如新框架引入、架构迁移、安全敏感方案），优先在 Plan Mode 中先收敛结论
- Plan Mode 的关键结论必须同步到 `findings.md`，包含：
  - 目标阶段
  - 推荐方案
  - 风险等级
  - 待验证项
  - 建议下一步命令

## 2-Action Rule（Planning-with-Files P0-1）

- 每连续完成 2 个关键动作（查阅资料、对比方案、得出结论）后，必须把结论写入 `findings.md`
- 若中断会话，至少留下：调研目标、已确认结论、待验证假设
- 最小落盘字段：
  - **当前结论**：本次调研确定的技术选型或方案
  - **证据路径**：参考文档链接或 `research.md` 中的位置
  - **下一步**：待验证的假设或需要补充的调研项
- 未落盘的信息一律视为不可靠上下文

## Hooks 行为规范

本 skill 配置了自动化 hooks，用于强化 2-Action Rule 和证据留存：

### PreToolUse（工具调用前提醒）

| 匹配工具 | 提醒内容 | 目的 |
|---------|---------|------|
| `WebSearch` / `mcp__fetch__fetch` / `mcp__web_reader__webReader` | 查阅资料后立即更新 findings.md | 强化证据收集后的落盘 |
| `Write` / `Edit` | 写入文件前检查是否同步 findings.md | 确保 findings.md 与研究结论同步 |

### PostToolUse（工具调用后提醒）

| 匹配工具 | 提醒内容 | 目的 |
|---------|---------|------|
| `Write` / `Edit` | 文件已更新，检查是否需同步 findings.md | 确保变更反映到 findings.md |
| `WebSearch` / `mcp__fetch__fetch` / `mcp__web_reader__webReader` | 资料已查阅，提取关键结论到 findings.md | 提醒及时处理检索到的信息 |

### Stop（会话结束前检查）

会话结束时触发 checkpoint，检查：
- `research.md` 是否完整
- `findings.md` 是否同步
- 未验证假设是否已标记 `[NEEDS VERIFICATION]`

### 工具白名单（allowed-tools）

| 工具类别 | 包含工具 | 用途 |
|---------|---------|------|
| 文件操作 | `Read`, `Write`, `Edit` | 读写调研文档 |
| 命令执行 | `Bash` | 执行 CLI 命令 |
| 代码搜索 | `Glob`, `Grep` | 搜索代码库 |
| 网络检索 | `WebSearch`, `mcp__fetch__fetch`, `mcp__web_reader__webReader` | 查阅技术资料 |

**注意**：超出白名单的工具调用将被拦截。

## Operation Types

| 标记 | 含义 | 执行者 |
|------|------|--------|
| `[AI]` | Bash 脚本或工具调用 | AI |
| `[USER]` | 需要用户确认的决策 | 用户 |

### 操作分工示例

```bash
# [AI] 自动执行
- 搜索技术文档
- 读取现有方案
- 生成对比矩阵
- 写入 research.md

# [USER] 需要确认
- 推荐方案确认
- 风险接受决策
- 调研范围调整
- 下一步动作确认
```

## 模板引用路径

本 skill 使用的模板位于：

| 模板类型 | 路径 | 用途 |
|---------|------|------|
| 调研输出 | `references/research-checklist.md` | 检查清单 |
| 对比矩阵 | `references/tech-comparison-template.md` | 标准对比模板 |
| 证据标记 | `references/evidence-types.md` | 假设类型规范 |

**使用方式**：在输出前引用对应模板，确保格式一致。

## 触发条件

- **阶段**：任意阶段（不限阶段，但通常在 spec/design 前执行）
- **Command**：`/spec-first:research`
- **典型场景**：
  - 新技术栈选型
  - 第三方服务对比
  - 架构方案评估
  - 性能瓶颈分析
  - 安全方案调研


## Feature 定位规则

### 优先级

1. **显式参数**: 用户提供 featureId 参数时直接使用
2. **自动定位**: 读取 `.spec-first/current` 获取当前激活 Feature
3. **交互式**: 列出可用 Feature 供用户选择

### 错误处理

- `.spec-first/current` 不存在或为空 → 降级到交互式
- 指定 Feature 不存在 → 报错并终止

## 执行阶段

- **P0**: 定位 Feature 上下文
- **P1**: 加载当前阶段交付物、constitution.md，识别调研目标
- **P2**: 收集候选方案（至少 2 个），执行对比分析
- **P3**: 与用户确认调研发现
- **P4**: 将调研笔记写入 `research.md`，更新 `findings.md`
- **P5**: 执行 review checklist 自检

## CLI 依赖

- `spec-first ai context`

## 输出路径

- `specs/{featureId}/research.md`
- `specs/{featureId}/findings.md`（同步更新）

## 确认策略

根据调研风险等级选择：
- **strict**（高风险）：涉及安全、合规、核心架构变更
- **assisted**（中风险）：常规技术选型、第三方服务对比（默认推荐）
- **auto**（低风险）：非阻断性调研、信息收集类任务

## 成功标准

- `research.md` 已写入，包含：
  - 调研目标与背景
  - 候选方案列表（≥2 个）
  - 对比矩阵（成本/风险/成熟度/生态）
  - 优劣分析
  - 推荐结论与依据
- `findings.md` 已同步更新
- 用户已确认研究结论
- 所有未验证假设已标记 `[NEEDS VERIFICATION]`
- Review Checklist 已通过自检

## Review Checklist

输出前必须通过自检（见 `references/research-checklist.md`）：

### 必查项（A-F）
- [ ] 调研目标清晰、可衡量
- [ ] 至少 2 个候选方案
- [ ] 对比维度完整（成本/风险/成熟度/生态）
- [ ] 每个结论有证据支撑
- [ ] 推荐方案明确、理由充分
- [ ] findings.md 已同步更新

### 特定场景（G）
- 性能敏感：包含 Benchmark 数据
- 安全敏感：包含安全评估
- 成本敏感：包含 TCO 计算
- 迁移场景：包含迁移成本评估

### 常见陷阱（H）
- 无"我觉得"等主观表述
- 无"大概"、"可能"等模糊词汇
- 无单一来源依赖
- 无忽视反面证据

## 示例（research.md 输出格式）

```markdown
# Research: 短信验证码服务选型

## 调研目标

为 FR-AUTH-001（短信验证码登录）选择短信服务商。

**约束条件**：
- 目标用户主要在中国大陆
- 预算 < ¥5000/月
- 需要支持 10万+ 日发送量

## 候选方案

| 方案 | 成本 | 延迟 | 可达率 | 生态 |
|------|------|------|--------|------|
| 阿里云 SMS | ¥0.045/条 | <200ms | 99% | ⭐⭐⭐⭐⭐ |
| 腾讯云 SMS | ¥0.045/条 | <200ms | 99% | ⭐⭐⭐⭐⭐ |
| Twilio | ¥0.08/条 | <500ms | 95% | ⭐⭐⭐⭐ |

## 对比分析

### 阿里云 SMS
**优势**：国内覆盖率最高、价格适中、文档完善
**劣势**：需企业认证、海外覆盖弱
**证据**：官方文档、GitHub 案例

### 腾讯云 SMS
**优势**：微信生态集成、价格与阿里云持平
**劣势**：需企业认证、API 限流较严格
**证据**：官方文档、社区反馈

### Twilio
**优势**：全球覆盖、开发体验最佳
**劣势**：价格约为国内 2 倍、跨境合规复杂
**证据**：官方文档、StackOverflow 讨论

## 推荐结论

**推荐**：阿里云 SMS

**理由**：
1. 成熟度：国内大规模验证，稳定可靠 ⭐⭐⭐⭐⭐
2. 成本：价格适中，符合预算（¥0.045/条）
3. 集成：SDK 完善，接入成本低
4. 生态：文档完善、社区活跃

**风险与依赖**：
- [NEEDS VERIFICATION][PERF] 实际延迟需在 POC 中验证（目标 < 200ms）
- [NEEDS VERIFICATION][COST] 月成本需验证（预计 ¥4500/月）
- 风险：单一供应商依赖
- 依赖：需完成企业认证流程

**下一步**：
1. 执行 POC 验证实际可达率
2. 完成企业认证
3. 评估备选方案（腾讯云）作为 fallback

## 参考文档

- [阿里云 SMS 文档](https://help.aliyun.com/product/44282.html)
- [腾讯云 SMS 文档](https://cloud.tencent.com/product/sms)
- [Twilio SMS Pricing](https://www.twilio.com/sms/pricing)
```

## References

本 skill 的参考文档位于 `references/` 目录：

- `research-checklist.md` — 调研质量检查清单
- `tech-comparison-template.md` — 技术对比标准模板
- `evidence-types.md` — 证据类型分类与标记规范
