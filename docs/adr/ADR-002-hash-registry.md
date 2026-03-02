# ADR-002: 模板哈希注册表

- Status: accepted
- Date: 2026-03-02
- Context: T1 模板变更检测

## 决策

引入基于文件哈希的模板变更检测机制，通过 `hash-registry.ts` 记录每个模板文件的 SHA-256 哈希值，在 `update` 时比对新旧哈希判断变更。

## 背景

`spec-first update` 需要检测包内模板是否在版本升级后发生变化，以决定是否需要更新用户项目中的对应文件。无哈希机制时：

1. 无法区分"模板未变"和"模板已变但用户也改过"
2. 每次 update 都全量覆盖，可能丢失用户修改
3. 无法实现分级更新策略（auto/prompt/block）

## 方案

### 注册表结构

```yaml
# .spec-first/meta/template-hashes.json
{
  "version": "1.0.0",
  "generatedAt": "2026-03-02T...",
  "templates": {
    "path/to/template.hbs": {
      "hash": "sha256:abc123...",
      "size": 1024,
      "lastModified": "2026-03-02T..."
    }
  }
}
```

### 核心流程

1. `computeTemplateHashes()` — 异步递归遍历模板目录，计算每个文件的 SHA-256
2. `loadHashRegistry()` — 从 `.spec-first/meta/template-hashes.json` 加载旧注册表
3. `compareHashes()` — 比对新旧注册表，输出 added/modified/deleted 三类差异
4. `saveHashRegistry()` — 保存新注册表（非 dry-run 时）

### 与 update-decision 协作

`compareHashes` 的差异结果传入 `decideBatchUpdate()`，结合 `change-classifier` 的变更分级（critical/major/minor）生成决策矩阵：

| 变更级别 | 用户未修改 | 用户已修改 |
|----------|-----------|-----------|
| minor | auto update | auto update |
| major | auto update | prompt |
| critical | prompt | block |

## 后果

- 所有文件 I/O 使用 `fs/promises` 异步操作（PERF-001 修复）
- 注册表存储在 `meta/` 目录，随包更新
- 首次运行时旧注册表为空，所有模板视为 added
