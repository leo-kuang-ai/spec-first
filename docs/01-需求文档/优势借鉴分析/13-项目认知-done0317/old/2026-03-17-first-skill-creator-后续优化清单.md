---
title: First Skill Creator 后续优化清单
date: 2026-03-17
status: active
owner: codex
---

# First Skill Creator 后续优化清单

> 目标：基于当前 `skills/spec-first/00-first` 的真实状态，记录本轮优化的完成情况与剩余低优先级收尾项。

## 结论

`00-first` 这轮 `skill-creator + writing-skills` 收口已经基本完成。当前默认心智已经稳定为：

- 默认入口：`spec-first first --yes`
- 正式真源：`.spec-first/runtime/first/`
- 正式文档：`docs/first/*.md` 仅为 projection
- 主文件：轻量触发说明
- 主题 reference：保留
- agent spec：降级为增强路径执行提示

## 已完成

### 主文件

- `description` 已改成严格 `Use when...` 触发式
- `SKILL.md` frontmatter 已收紧为最小集合：`name + description`
- 主文件已明确 CLI 为默认路径
- 主文件已显著减负，只保留：
  - 默认命令
  - 正式 contract
  - 最小执行流程
  - reference 读取规则
  - 核心硬约束
  - `Common Mistakes`
- 版本与维护信息已迁到正文

### Reference 组织

- reference 已按“默认 / 增强 / 低频专项”分层
- `execution-flow.md` 已改成“CLI 默认、增强按需”
- `subagent-architecture.md` 已压缩为增强路径最小提示
- 保留主题 reference，把 agent spec 改成了更薄的执行提示：
  - `agents-code-analysis.md`
  - `agents-api-deps.md`
  - `agent-guidelines-setup.md`
  - `agent-database.md`
  - `agent-domain-model.md`

### 质量与门禁

- `quality-assurance-rules.md` 已从 Agent 矩阵改成“分析主题 / runtime 资产最低要求矩阵”
- 中文输出 contract 已升级成强门禁：
  - projection 输出与中文 contract 不一致时，优先修 renderer 与测试
  - 不接受“规范要求中文、实现临时英文”的漂移状态

### 元数据与测试

- 已补 `agents/openai.yaml`
- `first-skill-docs.test.ts` 已删除：
  - 历史升级轨迹断言
  - 旧波次超时策略断言
  - 未来规划态语义断言
- `testing-strategy.md` 已从旧编排语义收敛到“增强路径与 Gate”语义

## 当前剩余项

这些已经不再是主阻塞，只是低优先级收尾：

1. `first-skill-docs.test.ts` 继续压缩实现细节断言  
目标：进一步只守正式 contract，少守文案实现细节。

2. `testing-strategy.md` 继续去历史编排词汇  
目标：如果后续继续收口，可以把少量 `Gate`/增强路径测试命名再进一步抽象化。

3. `subagent-architecture.md` 继续弱化存在感  
目标：如果后续还要减负，可以把它进一步缩到更短的 fallback 提示。

## 当前建议

当前不建议再做大重构。更合适的策略是：

1. 保持 `00-first` 当前结构稳定
2. 后续只在真实使用中发现歧义时再做小修
3. 优先保证 renderer、tests、skill docs 三者持续一致

## 一句话结论

`00-first` 这轮优化已经从“重型总说明书 + 编排导向”收口成了“CLI 默认 + runtime-first + 按需增强”的稳定状态。剩余工作只需做低优先级清扫，不需要再做结构性重写。
