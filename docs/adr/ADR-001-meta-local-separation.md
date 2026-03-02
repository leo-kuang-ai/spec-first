# ADR-001: meta/local 目录分离

- Status: accepted
- Date: 2026-03-02
- Context: T1+U5 实现

## 决策

将 `.spec-first/` 配置目录拆分为 `meta/`（包级基线）和 `local/`（用户定制）两个子目录。

## 背景

原先所有配置集中在 `.spec-first/config.yaml` 单文件中，存在以下问题：

1. **版本控制冲突** — 包级默认配置与用户个性化配置混在同一文件，`npm update` 时容易覆盖用户修改
2. **多环境不一致** — 团队成员无法共享基线配置的同时保留个人偏好
3. **升级不可控** — 无法区分"包提供的默认值"和"用户主动修改的值"

## 方案

采用四层配置合并架构（L0→L1→L2→L3），优先级递增：

| 层级 | 路径 | 用途 | 版本控制 |
|------|------|------|----------|
| L0 | 代码内 `DEFAULT_SPEC_FIRST_CONFIG` | 硬编码默认值 | ✅ 随包发布 |
| L1 | `.spec-first/meta/config.yaml` | 包级基线配置 | ✅ 可提交 |
| L2 | `.spec-first/local/config.yaml` | 用户定制配置 | ❌ gitignore |
| L3 | `.spec-first/config.yaml` | 旧版兼容（优先级最高） | ✅ 兼容旧版 |

合并逻辑在 `config-schema.ts` 的 `loadConfig()` 中实现，使用递归 `deepMerge`。

## 后果

- `update` 命令只写入 `meta/` 目录，不触碰 `local/` 和旧版 `config.yaml`
- 旧版 `config.yaml` 仍然生效（L3 最高优先级），确保向后兼容
- 用户可将 `local/` 加入 `.gitignore` 保护个人配置
- **BREAKING**: 升级后首次运行 `spec-first update` 会自动创建 `meta/` 目录结构
