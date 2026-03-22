# TODOS.md

## P2 — 大型需求文档分块处理
**What:** 产品需求文档或模块需求输入 >10KB 时，提示用户或自动分块处理  
**Why:** 避免 context window 压力导致 `module-demand-split`、`clarify`、`challenge` 产物质量下降  
**Pros:** 支持大型项目和复杂混合型需求  
**Cons:** 增加 skill 文档和输入拼装复杂度，目前未验证是否真实痛点  
**Context:** 一期先用真实需求文档验证。大多数增量需求可能并不需要自动分块。  
**Effort:** M（人工: ~2d / CC: ~30min）  
**Depends on:** `module-demand-split` 上线后真实验证

---

## P2 — Judge 评分趋势看板
**What:** 解析 judge-reports 或 eval 结果目录，输出各 skill 的质量趋势与幻觉类型频率统计  
**Why:** 帮助团队识别最常见的需求工程幻觉类型，针对性优化 Judge prompt 和 skill 模板  
**Pros:** 将 eval 结果转成团队可操作洞察  
**Cons:** 需要实现解析逻辑，一期价值未验证  
**Context:** 每次 Judge 评价都应产出结构化记录；积累足够样本后再做趋势分析才有意义。  
**Effort:** M（人工: ~2d / CC: ~30min）  
**Depends on:** 至少积累 10 次 P0 skill 评价记录

---

## P2 — 多 feature 并行支持
**What:** 为执行追踪状态层支持多 feature 并行（例如按 feature slug 分目录）  
**Why:** 团队同时推进多个需求时，当前单条主链的状态记录会互相覆盖  
**Pros:** 支持真实团队多需求并行开发  
**Cons:** 需要重新设计状态目录和产物路径  
**Context:** 一期当前只要求“最小执行追踪层”，默认按单 feature 主链理解，这是已知限制。  
**Effort:** M（人工: ~3d / CC: ~1h）  
**Depends on:** 一期 P0 skill 稳定后，根据真实使用痛点决定是否实现
