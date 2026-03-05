# 诊断报告输出格式

> Doctor Skill 的标准输出格式与示例

---

## 标准报告格式

```
🏥 Spec-First 环境诊断报告

项目路径: {project_root}
当前 Feature: {feature_id}
诊断时间: {timestamp}

---

✅ 基线检查

| 检查项 | 状态 | 详情 |
|--------|------|------|
| Node.js | {status} | {details} |
| Git | {status} | {details} |
| Git Hooks | {status} | {details} |
| 项目配置 | {status} | {details} |
| Current Feature | {status} | {details} |

---

🔌 MCP 服务器检查

{host_name} 配置: {status}

必需 MCP 服务器:
- {status} {mcp_name}
...

---

📦 Skills 检查

{host_name} Skills 目录: {status}

必需 Skills:
- {status} {skill_name}
...

---

📊 文件健康检查

- 临时文件: {count} 个
- node_modules: {size}
- 状态: {status}

---

🔧 诊断结论

整体状态: {overall_status}

需要修复的项:
{repair_items}

建议操作:
{suggestions}
```

---

## 状态图标

| 状态 | 图标 | 说明 |
|------|------|------|
| 通过 | ✅ | 检查通过 |
| 警告 | ⚠️ | 有问题但不阻塞 |
| 失败 | ❌ | 检查失败 |
| 信息 | ℹ️ | 仅供参考 |

---

## 示例 1: 健康环境

```
🏥 Spec-First 环境诊断报告

项目路径: /Users/kuang/xiaobu/spec-first
当前 Feature: FSREQ-20260305-SPECOPT-001
诊断时间: 2026-03-05 12:00:00

---

✅ 基线检查

| 检查项 | 状态 | 详情 |
|--------|------|------|
| Node.js | ✅ 通过 | v22.21.1 (要求 ≥20.0.0) |
| Git | ✅ 通过 | v2.51.0 |
| Git Hooks | ✅ 已安装 | pre-commit 存在 |
| 项目配置 | ✅ 正常 | config.yaml 存在 |
| Current Feature | ✅ 已设置 | FSREQ-20260305-SPECOPT-001 |

---

🔌 MCP 服务器检查

Claude Code 配置: ✅ 已配置

必需 MCP 服务器:
- ✅ sequential-thinking
- ✅ context7
- ✅ serena
- ✅ fetch

---

📦 Skills 检查

Claude Skills 目录: ✅ 存在

Spec-First Skills: ✅ 通过包级安装可用

---

📊 文件健康检查

- 临时文件: 15 个
- node_modules: 320 MB
- 状态: ✅ 正常

---

✅ 诊断结论

整体状态: ✅ 健康

所有必需组件已就绪，环境配置正常。

💡 下一步: 可以继续使用 Spec-First 工作流
```

---

## 示例 2: 需要修复

```
🏥 Spec-First 环境诊断报告

项目路径: /Users/dev/my-project
诊断时间: 2026-03-05 12:00:00

---

⚠️ 基线检查

| 检查项 | 状态 | 详情 |
|--------|------|------|
| Node.js | ⚠️ 警告 | v18.20.0 (建议升级到 ≥20.0.0) |
| Git | ✅ 通过 | v2.45.0 |
| Git Hooks | ❌ 缺失 | pre-commit 不存在 |
| 项目配置 | ❌ 缺失 | config.yaml 不存在 |
| Current Feature | ℹ️ 未设置 | 未初始化 Feature |

---

⚠️ MCP 服务器检查

Claude Code 配置: ⚠️ 部分缺失

必需 MCP 服务器:
- ✅ sequential-thinking
- ❌ context7 (缺失)
- ❌ serena (缺失)
- ✅ fetch

---

⚠️ Skills 检查

Claude Skills 目录: ✅ 存在

Spec-First Skills: ⚠️ 未检测到用户级安装

---

📊 文件健康检查

- 临时文件: 85 个
- node_modules: 650 MB
- 状态: ⚠️ 建议清理

---

🔧 诊断结论

整体状态: ⚠️ 需要修复

需要修复的项:
1. ❌ Git Hooks 缺失
2. ❌ 项目配置文件缺失
3. ❌ MCP 配置缺失: context7, serena
4. ⚠️ Node.js 版本建议升级
5. ⚠️ 临时文件过多

建议操作:
- 运行自动修复安装 Git Hooks 和 MCP 配置
- 运行 /spec-first:init 初始化项目配置
- 手动升级 Node.js 到 v20+
```

---

## 修复计划格式

```
🔧 修复计划

自动修复项（无需确认）:
- ✅ 安装 Git Hooks
- ✅ 补充 MCP 配置: context7, serena

需要确认的修复项:
- ⚠️ 清理 85 个临时文件
- ⚠️ 清理 node_modules (650 MB)

需要手动修复的项:
- ℹ️ 升级 Node.js 到 v20+ (当前 v18.20.0)
- ℹ️ 运行 /spec-first:init 初始化项目配置

是否执行自动修复？[Y/n]
```

---

## 修复完成报告格式

```
✅ 修复完成

修复前后对比:
| 检查项 | 修复前 | 修复后 |
|--------|--------|--------|
| Git Hooks | ❌ 缺失 | ✅ 已安装 |
| MCP: context7 | ❌ 缺失 | ✅ 已配置 |
| MCP: serena | ❌ 缺失 | ✅ 已配置 |

仍需手动处理:
- Node.js 版本升级（当前 v18.20.0 → 建议 v20+）
- 项目配置初始化（运行 /spec-first:init）

💡 提示: 运行 /spec-first:doctor 可再次检查环境状态
```

---

## 错误报告格式

```
❌ 修复失败

失败项:
- Git Hooks 安装失败: 权限不足

错误详情:
Error: EACCES: permission denied, open '.git/hooks/pre-commit'

建议操作:
1. 检查 .git/ 目录权限
2. 手动运行: chmod +x .git/hooks/pre-commit
3. 或使用 sudo: sudo spec-first hooks install

备份文件已保存: .git/hooks/pre-commit.bak
```
