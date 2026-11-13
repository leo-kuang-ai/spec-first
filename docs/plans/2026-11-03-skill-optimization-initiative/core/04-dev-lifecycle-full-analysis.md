# 研发流程全景审视 - Skill 覆盖分析

日期：2026-11-03  
目标：从完整研发流程视角，审视当前 38 个 Skill 的覆盖情况和缺口

---

## 一、完整研发流程（端到端）

### 标准软件研发生命周期（SDLC）

```
1. 需求阶段
   ├─ 需求收集
   ├─ 需求分析
   ├─ 需求评审
   └─ 需求确认

2. 设计阶段
   ├─ 概要设计
   ├─ 详细设计
   ├─ 设计评审
   └─ 技术选型

3. 开发阶段
   ├─ 环境准备
   ├─ 编码实现
   ├─ 单元测试
   └─ 代码自查

4. 测试阶段
   ├─ 集成测试
   ├─ 系统测试
   ├─ 性能测试
   ├─ 安全测试
   └─ 验收测试

5. 发布阶段
   ├─ 发布准备
   ├─ 发布执行
   ├─ 发布验证
   └─ 回滚准备

6. 运维阶段
   ├─ 监控告警
   ├─ 问题响应
   ├─ 性能优化
   └─ 容量规划

7. 迭代阶段
   ├─ 用户反馈
   ├─ Bug 修复
   ├─ 需求变更
   └─ 技术债处理
```

---

## 二、当前 38 个 Skill 的分类与覆盖

### 核心研发链路（13 个）✅

| Skill | 研发阶段 | 覆盖程度 | 备注 |
|---|---|---|---|
| **spec-ideate** | 需求：需求探索 | ✅ 覆盖 | 从零发散新方向 |
| **spec-brainstorm** | 需求：需求澄清 | ✅ 覆盖 | 目标用户和成功标准明确 |
| **spec-prd** | 需求：需求分析 | ✅ 覆盖 | PRD 产出 |
| **spec-plan** | 设计：详细设计 | ✅ 覆盖 | Implementation-ready plan |
| **spec-write-tasks** | 设计：任务拆分 | ✅ 覆盖 | Task pack 派生 |
| **spec-work** | 开发：编码实现 | ✅ 覆盖 | 系统化执行开发 |
| **spec-debug** | 开发/测试：问题修复 | ✅ 覆盖 | 失败、回归、bug 修复 |
| **spec-code-review** | 开发：代码审查 | ✅ 覆盖 | 结构化审查 |
| **spec-doc-review** | 文档：文档审查 | ✅ 覆盖 | 独立文档评审 |
| **spec-commit** | 发布：代码提交 | ✅ 覆盖 | 内部辅助 |
| **spec-commit-push-pr** | 发布：推送与 PR | ✅ 覆盖 | 受控推送 |
| **spec-resolve-pr-feedback** | 发布：PR 反馈处理 | ✅ 覆盖 | GitHub PR review 反馈 |
| **spec-handoff** | 迭代：跨会话交接 | ✅ 覆盖 | 上下文传递 |

### 辅助与治理（11 个）✅

| Skill | 用途 | 覆盖程度 | 备注 |
|---|---|---|---|
| **using-spec-first** | 入口路由 | ✅ 覆盖 | 选择下一步 |
| **spec-explain** | 知识查询 | ✅ 覆盖 | 解释概念、代码 |
| **spec-compound** | 知识管理 | ✅ 覆盖 | 固化可复用知识 |
| **spec-compound-refresh** | 知识更新 | ✅ 覆盖 | 知识刷新与修复 |
| **spec-strategy** | 战略规划 | ✅ 覆盖 | 技术战略、演化 |
| **spec-pov** | 技术决策 | ✅ 覆盖 | 外部技术采用裁决 |
| **spec-lfg** | 一条龙交付 | ✅ 覆盖 | 端到端到绿 PR |
| **spec-optimize** | 性能优化 | ✅ 覆盖 | Skill 优化框架 |
| **spec-worktree** | 环境管理 | ✅ 覆盖 | Worktree 隔离 |
| **spec-runtime-setup** | 环境设置 | ✅ 覆盖 | Runtime 修复 |
| **spec-project-rules** | 规则挖掘 | ✅ 覆盖 | 项目规则提取 |

### 特定场景与工具（14 个）⚠️

| Skill | 用途 | 覆盖程度 | 问题 |
|---|---|---|---|
| **spec-test-browser** | 浏览器测试 | ⚠️ 特定平台 | 只覆盖浏览器 |
| **spec-test-xcode** | iOS 测试 | ⚠️ 特定平台 | 只覆盖 iOS |
| **spec-prototype** | 原型开发 | ⚠️ 特定阶段 | 需求验证阶段 |
| **spec-polish** | 代码优化 | ⚠️ 定位不清 | 与 simplify-code 重叠？ |
| **spec-simplify-code** | 代码简化 | ⚠️ 定位不清 | 与 polish 重叠？ |
| **spec-sweep** | 批量清理 | ⚠️ 低频 | 技术债清理 |
| **spec-app-consistency-audit** | 一致性审计 | ⚠️ 低频 | 跨文件一致性 |
| **spec-dogfood** | 自我测试 | ⚠️ 内部 | spec-first 自用 |
| **spec-promote** | 知识提升 | ⚠️ 低频 | 知识晋升 |
| **spec-write-skill** | Skill 开发 | ⚠️ 内部 | 写新 Skill |
| **spec-product-pulse** | 产品脉搏 | ⚠️ 定位不清 | 产品健康度？ |
| **spec-riffrec-feedback-analysis** | 反馈分析 | ⚠️ 特定工具 | RiffRec 专用 |
| **spec-rule-miner** | 规则挖掘 | ⚠️ 低频 | 与 project-rules 重叠？ |
| **autoresearch** | 自动研究 | ⚠️ 定位不清 | 用途？ |

---

## 三、研发流程关键缺口分析

### 缺口 1：测试阶段严重不足 ❌

**当前覆盖**：
- ✅ spec-test-browser（浏览器测试）
- ✅ spec-test-xcode（iOS 测试）
- ❌ **通用测试策略设计**
- ❌ **测试用例生成**
- ❌ **集成测试**
- ❌ **性能测试**
- ❌ **安全测试**
- ❌ **测试覆盖率分析**

**影响**：
- 代码质量无法保障
- 回归风险高
- 重构困难

**建议新增**：
- **spec-test-design**：测试策略设计与用例生成
- **spec-test-integration**：集成测试执行与验证
- **spec-test-coverage**：测试覆盖率分析与补充

---

### 缺口 2：发布与部署阶段缺失 ❌

**当前覆盖**：
- ✅ spec-commit-push-pr（代码推送与 PR）
- ❌ **CI/CD 配置**
- ❌ **发布准备（Changelog、版本号、迁移脚本）**
- ❌ **发布验证（冒烟测试、回归测试）**
- ❌ **灰度发布策略**
- ❌ **回滚计划**

**影响**：
- 发布风险高
- 回滚困难
- 用户影响大

**建议新增**：
- **spec-release-prepare**：发布准备（Changelog、版本、迁移）
- **spec-release-verify**：发布验证（冒烟测试、健康检查）
- **spec-release-rollback**：回滚执行与验证

---

### 缺口 3：运维与监控阶段完全缺失 ❌

**当前覆盖**：
- ❌ **日志分析**
- ❌ **性能监控**
- ❌ **告警响应**
- ❌ **容量规划**
- ❌ **故障复盘**

**影响**：
- 生产问题响应慢
- 无法提前发现问题
- 重复故障

**建议新增**：
- **spec-ops-monitor**：监控配置与告警设置
- **spec-ops-incident**：故障响应与复盘
- **spec-ops-performance**：性能分析与优化

---

### 缺口 4：质量保障体系不完整 ⚠️

**当前覆盖**：
- ✅ spec-code-review（代码审查）
- ⚠️ **架构审查**（部分在 spec-plan 中）
- ❌ **安全审查**
- ❌ **性能审查**
- ❌ **可访问性审查**
- ❌ **合规性审查**

**影响**：
- 安全漏洞
- 性能问题
- 合规风险

**建议新增/增强**：
- **NEW-06**（已规划）：spec-code-review 深层问题发现（架构、反模式）
- **spec-security-review**：安全审查（OWASP、敏感数据、权限）
- **spec-performance-review**：性能审查（慢查询、N+1、内存泄漏）

---

### 缺口 5：用户反馈与数据驱动决策 ⚠️

**当前覆盖**：
- ⚠️ spec-product-pulse（定位不清）
- ⚠️ spec-riffrec-feedback-analysis（特定工具）
- ❌ **用户反馈收集与分析**
- ❌ **数据指标分析**
- ❌ **A/B 测试设计**
- ❌ **用户行为分析**

**影响**：
- 需求不准确
- 优化方向不明确
- 无法验证效果

**建议新增**：
- **spec-feedback-analysis**：用户反馈收集、分类、优先级
- **spec-metrics-analysis**：数据指标分析与洞察
- **spec-ab-test-design**：A/B 测试设计与分析

---

### 缺口 6：协作与沟通 ⚠️

**当前覆盖**：
- ✅ spec-handoff（跨会话交接）
- ✅ spec-resolve-pr-feedback（PR 反馈处理）
- ❌ **技术文档编写**
- ❌ **API 文档生成**
- ❌ **团队知识分享**
- ❌ **跨团队协作**

**影响**：
- 知识孤岛
- 协作成本高
- 新人上手慢

**建议新增**：
- **spec-doc-api**：API 文档生成与维护
- **spec-doc-tech**：技术文档编写（架构、设计、决策）
- **spec-knowledge-share**：知识分享（Wiki、分享会）

---

### 缺口 7：技术债管理 ⚠️

**当前覆盖**：
- ⚠️ spec-sweep（批量清理，低频）
- ⚠️ spec-simplify-code（代码简化，定位不清）
- ❌ **技术债识别**
- ❌ **技术债评估（优先级、成本）**
- ❌ **技术债还债计划**
- ❌ **重构执行**

**影响**：
- 技术债累积
- 维护成本上升
- 开发速度下降

**建议新增**：
- **spec-tech-debt-identify**：技术债识别与评估
- **spec-refactor**：重构执行（安全重构、测试保障）

---

## 四、按研发流程的 Skill 覆盖热力图

```
研发阶段            覆盖程度    缺口
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. 需求阶段         ████████░   10% 缺口
   需求收集         ✅ ideate, brainstorm
   需求分析         ✅ prd
   需求评审         ⚠️ 部分（doc-review）
   需求确认         ✅ prd

2. 设计阶段         ███████░░   20% 缺口
   概要设计         ✅ plan
   详细设计         ✅ plan
   设计评审         ⚠️ 部分（doc-review）
   技术选型         ⚠️ 部分（pov）

3. 开发阶段         ████████░   10% 缺口
   环境准备         ✅ runtime-setup, worktree
   编码实现         ✅ work
   单元测试         ⚠️ 部分（work 中）
   代码自查         ✅ code-review

4. 测试阶段         ██░░░░░░░   70% 缺口 ❌
   集成测试         ❌ 缺失
   系统测试         ⚠️ 部分（test-browser, test-xcode）
   性能测试         ❌ 缺失
   安全测试         ❌ 缺失
   验收测试         ❌ 缺失

5. 发布阶段         ███░░░░░░   60% 缺口 ❌
   发布准备         ❌ 缺失
   发布执行         ✅ commit-push-pr
   发布验证         ❌ 缺失
   回滚准备         ❌ 缺失

6. 运维阶段         ░░░░░░░░░   90% 缺口 ❌
   监控告警         ❌ 缺失
   问题响应         ⚠️ 部分（debug）
   性能优化         ❌ 缺失
   容量规划         ❌ 缺失

7. 迭代阶段         ████░░░░░   40% 缺口
   用户反馈         ⚠️ 部分（product-pulse?）
   Bug 修复         ✅ debug
   需求变更         ✅ prd, plan
   技术债处理       ⚠️ 部分（sweep, simplify-code）
```

**总体覆盖率**：约 **55%**

---

## 五、优先级建议（基于研发流程完整性）

### Tier 1：关键缺口（必须补）

| 优先级 | 缺口 | 影响 | 建议新增 Skill |
|---|---|---|---|
| **P0** | 测试阶段 | 代码质量无保障 | spec-test-design, spec-test-integration |
| **P0** | 发布验证 | 发布风险高 | spec-release-verify |
| **P1** | 安全审查 | 安全漏洞 | spec-security-review |

### Tier 2：重要缺口（应该补）

| 优先级 | 缺口 | 影响 | 建议新增 Skill |
|---|---|---|---|
| **P1** | 发布准备 | 发布流程不规范 | spec-release-prepare |
| **P1** | 性能审查 | 性能问题频发 | spec-performance-review |
| **P2** | 技术文档 | 知识孤岛 | spec-doc-tech, spec-doc-api |

### Tier 3：可选缺口（可以补）

| 优先级 | 缺口 | 影响 | 建议新增 Skill |
|---|---|---|---|
| **P2** | 运维监控 | 生产问题响应慢 | spec-ops-monitor, spec-ops-incident |
| **P2** | 用户反馈 | 需求不准确 | spec-feedback-analysis |
| **P3** | 技术债管理 | 维护成本上升 | spec-tech-debt-identify, spec-refactor |

---

## 六、需要整理的现有 Skill

### 定位不清或重叠的 Skill

| Skill | 问题 | 建议 |
|---|---|---|
| **spec-polish** | 与 simplify-code 重叠？ | 明确边界或合并 |
| **spec-simplify-code** | 与 polish 重叠？ | 明确边界或合并 |
| **spec-product-pulse** | 定位不清 | 明确用途或废弃 |
| **spec-rule-miner** | 与 project-rules 重叠？ | 明确边界或合并 |
| **autoresearch** | 定位不清 | 明确用途或废弃 |

### 低频或特定场景的 Skill

| Skill | 使用频率 | 建议 |
|---|---|---|
| **spec-test-xcode** | 低频（仅 iOS 项目） | 保留，但不作为核心优化对象 |
| **spec-sweep** | 低频（批量清理） | 保留，但不作为核心优化对象 |
| **spec-dogfood** | 内部专用 | 保留，但不作为核心优化对象 |
| **spec-write-skill** | 内部专用 | 保留，但不作为核心优化对象 |

---

## 七、调整后的优化方案

### 原 12 项优化（O01-O12）

保留，但调整优先级：
- O01-O07：效率优化 → 降级到 P2
- O08：handoff → 保持 P1
- O09-O10：knowledge → 保持 P1
- O11-O12：Git 安全 → 保持 P0

### 新增 4 项核心能力（NEW-04 to NEW-07）

保留，保持 P0/P1

### 新增 Tier 1 关键缺口（NEW-08 to NEW-11）⭐

| 编号 | Skill | 优先级 | 理由 |
|---|---|---|---|
| **NEW-08** | **spec-test-design** | **P0** | 测试是代码质量保障的基础 |
| **NEW-09** | **spec-test-integration** | **P0** | 集成测试是质量把关的关键 |
| **NEW-10** | **spec-release-verify** | **P0** | 发布验证是生产安全的底线 |
| **NEW-11** | **spec-security-review** | **P1** | 安全是不可妥协的 |

---

## 八、最终建议

### 短期（Phase 1）：聚焦核心质量

**P0 项目**（必须做）：
1. NEW-04：spec-prd 需求审查
2. NEW-01：spec-work 代码质量
3. NEW-02：spec-code-review 审查有效性
4. **NEW-08**：**spec-test-design 测试策略**（新增）⭐
5. **NEW-09**：**spec-test-integration 集成测试**（新增）⭐
6. O11/O12：Git 操作安全

**P1 项目**（应该做）：
7. NEW-05：spec-plan 行业方案
8. NEW-06：spec-code-review 深层问题
9. NEW-07：spec-debug 举一反三
10. **NEW-10**：**spec-release-verify 发布验证**（新增）⭐
11. **NEW-11**：**spec-security-review 安全审查**（新增）⭐

### 中期（Phase 2）：补齐测试与发布

- spec-test-coverage：测试覆盖率分析
- spec-release-prepare：发布准备
- spec-release-rollback：回滚执行
- spec-performance-review：性能审查

### 长期（Phase 3）：完善运维与协作

- spec-ops-monitor：监控告警
- spec-ops-incident：故障响应
- spec-doc-tech：技术文档
- spec-feedback-analysis：用户反馈

### Skill 整理

- 明确 polish、simplify-code、product-pulse、autoresearch 的定位
- 整理重叠的 Skill（rule-miner vs project-rules）

---

## 九、总结

### 当前问题

**原 12 项优化过于聚焦"效率"，忽略了研发流程的完整性**：
- ❌ 测试阶段 70% 缺口
- ❌ 发布阶段 60% 缺口
- ❌ 运维阶段 90% 缺口

### 核心洞察

**"高质量完成需求交付，产出高质量、可维护的代码"不只是写代码，而是完整的研发闭环**：
1. 需求审查 → 发现问题、提供更优方案
2. 设计审查 → 符合行业标准、可演化
3. 开发质量 → 代码高质量、可维护
4. **测试保障 → 功能正确、性能达标、安全无漏洞**（关键缺口）
5. **发布验证 → 安全发布、快速回滚**（关键缺口）
6. 运维监控 → 提前发现问题、快速响应

### 建议

**Phase 1 增加 4 个关键 Skill（NEW-08 to NEW-11）**：
- NEW-08：spec-test-design（测试策略设计）
- NEW-09：spec-test-integration（集成测试）
- NEW-10：spec-release-verify（发布验证）
- NEW-11：spec-security-review（安全审查）

**从 12 项扩展到 15 项核心优化**，覆盖完整研发流程。
