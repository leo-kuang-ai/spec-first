# Requirements: spec-first Skill 系统架构优化

**Defined:** 2026-03-23
**Core Value:** Skill 系统必须能够轻松添加新技能、维护现有技能、并确保技能质量通过自动化验证

## v1 Requirements

### 架构审计 (ARCH)

- [ ] **ARCH-01**: 所有 placeholder 被记录在 Placeholder Registry 中，包含输入/输出文档
- [ ] **ARCH-02**: gen-skill-docs.ts 使用 resolver 插件模式，无 `if (skillName === 'special-case')` 分支
- [ ] **ARCH-03**: CI 新鲜度检查通过，确保生成的 SKILL.md 与 .tmpl 同步
- [ ] **ARCH-04**: .gitattributes 正确标记 SKILL.md 为生成文件
- [ ] **ARCH-05**: 架构决策被记录在 ADR 文档中

### 模块解耦 (DECO)

- [ ] **DECO-01**: 共享库被提取到 lib/ 目录（context.ts, preamble.ts, output.ts）
- [ ] **DECO-02**: 所有技能描述包含明确的触发短语
- [ ] **DECO-03**: 所有 SKILL.md 文件保持 <800 行
- [ ] **DECO-04**: 大型技能使用 resources/ 目录存储详细内容
- [ ] **DECO-05**: 所有路径使用 HostPaths 接口，无硬编码路径

### 清晰边界 (BOND)

- [ ] **BOND-01**: 所有技能可独立运行，无隐式依赖
- [ ] **BOND-02**: 技能前置条件被明确记录
- [ ] **BOND-03**: 技能间通信通过显式文件契约实现
- [ ] **BOND-04**: SkillManifest 接口定义完成

### 质量基础设施 (QUAL)

- [ ] **QUAL-01**: diff-based 测试选择优化完成
- [ ] **QUAL-02**: LLM judge 提示词优化
- [ ] **QUAL-03**: eval 比较工具增强
- [ ] **QUAL-04**: 质量指标仪表板可用

## v2 Requirements

### 可扩展性 (SCAL)

- **SCAL-01**: 技能创建器交互式 Q&A 流程
- **SCAL-02**: 插件打包用于团队分发
- **SCAL-03**: Subagent forking 实现上下文隔离
- **SCAL-04**: 公共技能注册表

### 高级功能 (ADVN)

- **ADVN-01**: 阶段定义支持进度跟踪
- **ADVN-02**: 依赖图显式声明
- **ADVN-03**: 跨技能编排标准化

## Out of Scope

| Feature | Reason |
|---------|--------|
| Browse 浏览器模块重构 | 本次只关注 Skill 系统 |
| 性能优化 | 后续里程碑考虑 |
| 新功能开发 | 本次只做架构优化 |
| Python 工具支持 | 不必要的复杂性 |
| 框架迁移（Mastra/LangGraph） | 现有模式工作良好，迁移风险高 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ARCH-01 | Phase 1 | Pending |
| ARCH-02 | Phase 1 | Pending |
| ARCH-03 | Phase 1 | Pending |
| ARCH-04 | Phase 1 | Pending |
| ARCH-05 | Phase 1 | Pending |
| DECO-01 | Phase 2 | Pending |
| DECO-02 | Phase 2 | Pending |
| DECO-03 | Phase 2 | Pending |
| DECO-04 | Phase 2 | Pending |
| DECO-05 | Phase 2 | Pending |
| BOND-01 | Phase 3 | Pending |
| BOND-02 | Phase 3 | Pending |
| BOND-03 | Phase 3 | Pending |
| BOND-04 | Phase 3 | Pending |
| QUAL-01 | Phase 4 | Pending |
| QUAL-02 | Phase 4 | Pending |
| QUAL-03 | Phase 4 | Pending |
| QUAL-04 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-23*
*Last updated: 2026-03-23 after initial definition*
