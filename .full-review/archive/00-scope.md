# Review Scope

## Target

T1 + U5 + T2 + confirm-1 模块代码变更审查

本次审查针对以下优化任务的代码实现：

### U5 - meta/local 目录分离
- 四层架构扩展 (L0→L1→L2→L3)
- 配置三级合并 (meta→local→config.yaml)
- 模板三级查找链 (local→meta→包内)
- 迁移脚本实现
- update 命令只写 meta 目录

### T1 - 模板哈希 + 变更分级更新
- 哈希注册表管理
- 变更分级分类器
- 更新决策逻辑
- 集成到 update 命令

### T2 - Manifest 迁移引擎
- Manifest 结构定义
- 加载与校验
- 版本匹配
- 执行引擎
- 集成到 update 命令
- 迁移模板目录

### confirm-1 - 确认策略接入
- 路由层策略评估

## Files

### 新建文件 (10 个)

**U5 模块：**
- `src/core/migrations/split-meta-local.ts` — meta/local 分离迁移脚本

**T1 模块：**
- `src/core/template/hash-registry.ts` — 哈希注册表管理
- `src/core/template/change-classifier.ts` — 变更分级分类器
- `src/core/template/update-decision.ts` — 更新决策逻辑

**T2 模块：**
- `src/core/migrations/manifest-schema.ts` — Manifest 结构定义
- `src/core/migrations/manifest-loader.ts` — 加载与校验
- `src/core/migrations/version-matcher.ts` — 版本匹配
- `src/core/migrations/manifest-engine.ts` — 执行引擎
- `templates/migrations/manifest-template.yaml` — 迁移模板
- `templates/migrations/v1.0.0-to-v1.1.0-meta-local-split.yaml` — 示例 manifest

### 修改文件 (5 个)

- `src/core/process-engine/layer-merger.ts` — 四层架构扩展
- `src/shared/config-schema.ts` — meta/local 配置合并
- `src/core/template/renderer.ts` — 三级模板查找链
- `src/cli/commands/update.ts` — 集成 T1/T2 检测逻辑
- `src/cli/router.ts` — confirm-policy 接入

## Flags

- Security Focus: yes（涉及文件操作、目录遍历、命令执行）
- Performance Critical: no（工具类代码，非热路径）
- Strict Mode: yes（核心基础设施代码）
- Framework: TypeScript/Node.js ESM

## Review Phases

1. Code Quality & Architecture
2. Security & Performance
3. Testing & Documentation
4. Best Practices & Standards
5. Consolidated Report
