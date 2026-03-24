# Traces Trailer Reference

用于 `spec-first:code` 生成代码时附加稳定尾注。

## 标准格式

```typescript
// Related: FR-AUTH-001, DS-AUTH-001
// Task: TASK-AUTH-002
// Author: spec-first:code
// Date: 2026-03-14
```

## 规则

1. 只使用以下 4 行：
   - `Related`
   - `Task`
   - `Author`
   - `Date`
2. 不要扩展成 `Design`、`Tasks` 等多头字段。
3. `Related` 中可包含多个 FR / DS，但保持单行字段名不变。
4. `Task` 默认只记录当前主 TASK。

## 多关联示例

```typescript
// Related: FR-AUTH-001, FR-AUTH-002, DS-AUTH-001
// Task: TASK-AUTH-002
// Author: spec-first:code
// Date: 2026-03-14
```

## 目的

- 便于检索实现与需求/设计的关系
- 保持批量模式下不同 subagent 输出格式一致
- 降低后续解析和审查成本

## 禁止项

- 不要省略字段名
- 不要使用多套字段命名
- 不要在尾注中加入长段落说明
- 不要把多个 TASK 写成自由文本
