# 输出格式

> Feature-Current Skill 的标准输出格式与示例

---

## 标准输出格式

```
📍 当前 Feature

Feature ID: {featureId}
标题: {title}
模式: {mode} ({mode_desc})
规模: {size} ({size_desc})
阶段: {stage_icon} {stage_name} ({stage_code})
状态: {status}
创建时间: {created}
更新时间: {updated}

---

💡 下一步:
- 使用 /spec-first:status 查看详细状态
- 使用 /spec-first:feature-switch 切换到其他 Feature
```

---

## 模式说明

| 代码 | 说明 |
|------|------|
| N | 新功能 (New Feature) |
| I | 迭代优化 (Iteration) |

---

## 规模说明

| 代码 | 说明 | 预计工作量 |
|------|------|-----------|
| S | 小型 (Small) | < 2 天 |
| M | 中型 (Medium) | 2-5 天 |
| L | 大型 (Large) | > 5 天 |

---

## 阶段图标

| 阶段 | 图标 | 名称 |
|------|------|------|
| 00_init | 🔧 | 初始化 |
| 01_specify | 📝 | 需求规格 |
| 02_design | 🎨 | 技术设计 |
| 03_plan | 📋 | 任务拆解 |
| 04_implement | 💻 | 代码实现 |
| 05_verify | ✅ | 验证测试 |
| 06_wrap_up | 📦 | 归档复盘 |
| 07_release | 🚀 | 发布上线 |
| 08_done | ✔️ | 已完成 |
| 09_cancelled | ❌ | 已取消 |

---

## 示例 1: 标准输出

```
📍 当前 Feature

Feature ID: FSREQ-20260305-SPECOPT-001
标题: spec-first:spec 命令优化
模式: N (新功能)
规模: M (中型)
阶段: 📋 任务拆解 (03_plan)
状态: 🔄 进行中
创建时间: 2026-03-05 09:00:00
更新时间: 2026-03-05 12:00:00

---

💡 下一步:
- 使用 /spec-first:status 查看详细状态
- 使用 /spec-first:task 开始任务拆解
```

---

## 示例 2: 已完成 Feature

```
📍 当前 Feature

Feature ID: FEAT-20260304-002
标题: 文档补充
模式: I (迭代优化)
规模: S (小型)
阶段: ✔️ 已完成 (08_done)
状态: ✔️ 已完成
创建时间: 2026-03-04 10:00:00
完成时间: 2026-03-04 18:00:00

---

💡 提示:
- 此 Feature 已完成
- 使用 /spec-first:feature-switch 切换到其他 Feature
- 使用 /spec-first:init 创建新 Feature
```

---

## 示例 3: 未设置 Feature

```
ℹ️  未设置当前 Feature

当前项目尚未初始化 Feature 工作区。

💡 下一步:
- 运行 /spec-first:init 创建第一个 Feature
- 或运行 /spec-first:feature-list 查看已有 Feature
- 或运行 /spec-first:feature-switch {id} 切换到已有 Feature
```

---

## 示例 4: 带进度信息

```
📍 当前 Feature

Feature ID: FEAT-20260305-001
标题: Skill 优化
模式: N (新功能)
规模: M (中型)
阶段: 💻 代码实现 (04_implement)
状态: 🔄 进行中
进度: 60% (3/5 任务已完成)
创建时间: 2026-03-05 09:00:00
更新时间: 2026-03-05 12:00:00

当前任务:
- ✅ TASK-001: 需求分析
- ✅ TASK-002: 技术设计
- ✅ TASK-003: 核心实现
- 🔄 TASK-004: 测试编写
- ⏳ TASK-005: 文档更新

---

💡 下一步:
- 使用 /spec-first:code 继续代码实现
- 使用 /spec-first:status 查看详细状态
```

---

## 简洁格式

```
📍 FSREQ-20260305-SPECOPT-001 | spec-first:spec 命令优化 | 📋 任务拆解
```

---

## JSON 格式

```json
{
  "featureId": "FSREQ-20260305-SPECOPT-001",
  "title": "spec-first:spec 命令优化",
  "mode": "N",
  "size": "M",
  "stage": "03_plan",
  "status": "active",
  "created": "2026-03-05T09:00:00Z",
  "updated": "2026-03-05T12:00:00Z"
}
```
