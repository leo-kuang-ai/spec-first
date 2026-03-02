# Review Scope

## Target

**Spec-First 项目全面审查**（重点审查 first skill）

Spec-First 是一个基于规范优先理念的全链路研发闭环工具。本次审查重点：
- **first skill** (skills/spec-first/00-first/) — 项目快速认知技能，支持 quick/deep 双模式
- **核心实现模块** (src/core/) — skill-runtime、template、process-engine 等
- **整体研发流程质量** — 确保从需求到上线的闭环质量

## Files

### First Skill 核心文件
```
skills/spec-first/00-first/
├── SKILL.md                    # Skill 编排中枢（~680 行）
├── references/
│   ├── detection-rules.md      # 语言/框架/端类型检测规则
│   ├── subagent-architecture.md # Subagent-Driven 架构设计
│   ├── quality-assurance-rules.md # 统一 QA 规则
│   ├── agents-code-analysis.md # A1/A2/A3 代码分析规格
│   ├── agents-api-deps.md      # B/C1 API与依赖规格
│   ├── agent-guidelines-setup.md # C2 规范与环境规格
│   ├── agent-database.md       # D 数据库分析规格
│   ├── agent-domain-model.md   # A4 领域模型规格
│   ├── testing-strategy.md     # 测试策略矩阵
│   ├── 端类型产物映射.md        # 端类型→产物映射
│   └── templates/              # 端类型定制模板
└── README.md                   # Skill 说明文档
```

### 核心实现模块
```
src/core/
├── skill-runtime/
│   ├── first-args.ts           # First 参数解析
│   ├── first-index.ts          # First 索引管理
│   ├── first-change-detector.ts # 变更检测
│   ├── first-resume.ts         # 上下文恢复
│   ├── dispatcher.ts           # Skill 分发器
│   └── front-matter.ts         # Frontmatter 解析
├── template/
│   ├── change-classifier.ts    # 变更分类
│   ├── hash-registry.ts        # 哈希注册表
│   ├── update-decision.ts      # 更新决策
│   └── renderer.ts             # 模板渲染器
├── process-engine/
│   └── layer-merger.ts         # 层级合并器
├── ai-orchestrator/
│   ├── completion-detector.ts  # 完成检测
│   └── slop-checker.ts         # SLO 检查
└── tool-integration/
    └── session-hook.ts         # Session 钩子
```

### CLI 入口
```
src/cli/
├── commands/ai.ts              # AI 命令
├── commands/doctor.ts          # 诊断命令
├── commands/setup.ts           # Setup 命令
├── commands/update.ts          # Update 命令
└── router.ts                   # 命令路由
```

### 配置与共享类型
```
src/shared/
├── config-schema.ts            # 配置模式
└── skill-commands.ts           # Skill 命令定义
```

### 测试文件
```
tests/unit/
├── first-args.test.ts
├── first-change-detector.test.ts
├── first-index.test.ts
├── first-resume.test.ts
├── change-classifier.test.ts
├── hash-registry.test.ts
├── update-decision.test.ts
└── manifest-engine.test.ts
```

### 关键文档
```
CLAUDE.md                       # 项目规范与工作流
README.md                       # 项目说明
CHANGELOG.md                    # 变更日志
docs/01-需求文档/               # 需求规格文档
```

## Flags

- **Security Focus**: yes — 重点审查凭证脱敏、注入防护、权限控制
- **Performance Critical**: no — 本地工具，无并发压力
- **Strict Mode**: yes — Spec-First 作为工具自身需要高质量标准
- **Framework**: TypeScript/Node.js (ESM, Vitest, tsup)

## Review Phases

1. **Code Quality & Architecture** — 代码质量、模块边界、依赖管理
2. **Security & Performance** — 安全漏洞、性能瓶颈
3. **Testing & Documentation** — 测试覆盖、文档完整性
4. **Best Practices & Standards** — TypeScript/Node.js 最佳实践
5. **Consolidated Report** — 综合报告与行动计划

## Focus Areas

1. **First Skill 完整性**
   - SKILL.md 编排逻辑是否清晰
   - Agent 规格文档是否完整
   - Quick/Deep 模式是否正交

2. **实现与规范一致性**
   - 代码是否遵循 SKILL.md 定义的流程
   - 质量保障规则是否被实现

3. **整体架构质量**
   - 模块边界是否清晰
   - 依赖方向是否正确
   - 是否存在循环依赖

4. **测试覆盖**
   - First skill 相关逻辑是否有测试
   - 测试质量是否足够
