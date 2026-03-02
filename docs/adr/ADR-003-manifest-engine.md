# ADR-003: Manifest 迁移引擎

- Status: accepted
- Date: 2026-03-02
- Context: T2 声明式迁移系统

## 决策

引入声明式 Manifest 迁移引擎，通过 YAML 清单描述版本间的文件操作（创建/删除/重命名/复制/补丁/执行），在 `update` 时自动匹配并执行适用的迁移。

## 背景

版本升级时常需要执行结构性变更（目录迁移、文件重命名、配置格式升级等），原先依赖用户手动操作或硬编码脚本：

1. 用户容易遗漏迁移步骤
2. 硬编码脚本与版本耦合，维护成本高
3. 无法声明式描述"从 A 版本到 B 版本需要做什么"

## 方案

### Manifest 结构

```yaml
# templates/migrations/0.5.82-to-0.5.83.yaml
description: "meta/local 目录分离迁移"
versionRange:
  from: "0.5.82"
  to: "0.5.83"
steps:
  - type: mkdir
    path: ".spec-first/meta"
  - type: copy
    from: ".spec-first/config.yaml"
    to: ".spec-first/meta/config.yaml"
    onConflict: skip
```

### 模块划分

| 文件 | 职责 |
|------|------|
| `manifest-schema.ts` | Manifest YAML 类型定义 |
| `manifest-loader.ts` | 从 templates/migrations/ 加载清单 |
| `version-matcher.ts` | 语义化版本区间匹配（基于 semver 包） |
| `manifest-engine.ts` | 步骤执行引擎（含路径安全校验） |
| `index.ts` | 统一导出 |

### 安全措施

- **路径遍历防护**（SEC-002）: `resolveSafePath()` 校验所有路径操作不逃逸 `projectRoot`
- **YAML 反序列化加固**（SEC-004）: 所有 `yaml.load()` 使用 `{ schema: yaml.JSON_SCHEMA }`
- **冲突策略**: `ConflictStrategy.Skip`（默认跳过已存在文件）

### 集成点

`update.ts` 的 `checkAndExecuteManifests()` 在模板哈希检测之后执行：

1. `findManifestForVersion(currentVersion, cwd)` — 查找适用清单
2. `executeManifest(manifest, cwd, strategy)` — 执行迁移步骤
3. 输出执行/跳过/失败统计

## 后果

- 新版本迁移只需添加 YAML 清单文件，无需修改引擎代码
- 回滚机制依赖 T3 快照回滚模块（SEC-005/OPS-002 排除项）
- `version-matcher.ts` 使用 semver 包替代手动比较（BP-LI-002）
