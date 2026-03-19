# Spec-First CLI 命令参考手册

> **版本**: v2.1 | **日期**: 2026-03-09 | **作者**: Leo (况雨平)
> **校准基线**: `src/cli/index.ts` + `src/cli/commands/*.ts`
> **状态**: 与当前代码实现对齐（As-Is）

> **⚠️ 重要说明**：
> - CLI 命令**仅供 Skill 内部调用**，不建议用户直接使用
> - 用户应使用协同 Skill：`/plan`、`/verify`、`/orchestrate`
> - 本文档面向 Skill 开发者和系统维护者
> - 不覆盖外部 AI 资源 `.claude/commands/*`、`.claude/skills/*`、`.claude/hooks/*`

---

## 使用层级

```
用户层（推荐）
  ↓
协同 Skill: /plan, /verify, /orchestrate
  ↓
阶段 Skill: /skill 01-spec-write, /skill 02-design-write, ...
  ↓
CLI 命令层（本文档）: spec-first init, spec-first id next, ...
```

## 命令总览

| # | 命令组 | 子命令数 | 功能域 | 实现状态 |
|---|---|---:|---|---|
| 1 | `spec-first init` | 1 | Feature 初始化 | ✅ |
| 2 | `spec-first stage` | 4 | 阶段管理 | ✅ |
| 3 | `spec-first id` | 4 | ID 管理 | ✅ |
| 4 | `spec-first gate` | 3 | Gate 校验 | ✅ |
| 5 | `spec-first golive` | 1 | 上线检查 | ✅ |
| 6 | `spec-first done` | 1 | 收口到 08_done | ✅ |
| 7 | `spec-first matrix` | 3 | 追踪矩阵 | ✅ |
| 8 | `spec-first metrics` | 3 | 覆盖率与度量 | ✅ |
| 9 | `spec-first rfc` | 5 | RFC 变更管理 | ✅ |
| 10 | `spec-first defect` | 5 | 缺陷追踪 | ✅ |
| 11 | `spec-first ai` | 3 | AI 编排 | ✅ |
| 12 | `spec-first commit` | 1 | 标准化提交 | ✅ |
| 13 | `spec-first feature` | 3 | Feature 切换 | ✅ |
| 14 | `spec-first hooks` | 3 | Git Hooks 管理 | ✅ |
| 15 | `spec-first viewer` | 3 | 可视化面板 | ✅ |
| 16 | `spec-first update` | 1 | 刷新配置 | ✅ |
| 17 | `spec-first setup` | 1 | 宿主注册（兼容入口） | ✅ |
| 18 | `spec-first uninstall` | 1 | 清理配置 | ✅ |
| 19 | `spec-first analyze` | 1 | 一致性分析 | ✅ |
| 20 | `spec-first trace` | 2 | 追溯链修复与校验 | ✅ |
| 21 | `spec-first validate` | 3 | 产物校验 | ✅ |
| 22 | `spec-first doctor` | 1 | 环境诊断 | ✅ |
| | **合计** | **53** | | **100%** |

## 全局选项

| 选项 | 说明 |
|---|---|
| `-h, --help` | 显示帮助信息 |
| `-v, --version` | 显示版本号 |

## 退出码

| 码 | 含义 |
|---:|---|
| 0 | 成功 |
| 1 | Gate 校验失败 |
| 2 | 参数或校验错误 |
| 3 | 配置/模块不可用 |
| 4 | IO 错误 |
| 5 | 未知错误 |

---

## 命名约定（与 Skill 基线一致）

本手册中的交付物命名与 `docs/01需求文档/skill-requirements-v1.md` 对齐。

| 领域 | 统一命名 |
|---|---|
| 任务规划 | `task_plan.md` |
| 需求文档 | `spec.md` |
| 设计文档 | `design.md` |
| 接口契约 | `api-contract.yaml` |
| 测试计划 | `test-plan.md` |
| 测试报告 | `test-report.md` |
| 追踪矩阵 | `traceability-matrix.yaml`（主）/ `traceability-matrix.md`（兼容） |

迁移期兼容映射：`tasks.md -> task_plan.md`、`api.md -> api-contract.yaml`、`test-cases.md -> test-plan.md`。

---

## 1. `spec-first init`

### 1.1 初始化 Feature

```bash
spec-first init --feat <abbr> [options]
```

| 选项 | 必填 | 说明 |
|---|---|---|
| `--feat <abbr>` | 是 | Feature 缩写（大写字母开头，1-16 字符） |
| `--mode <N\|I>` | 否 | 开发模式，默认 `N` |
| `--size <S\|M\|L>` | 否 | 项目规模，默认 `M` |
| `--platforms <p1,p2,...>` | 是 | 平台列表（逗号分隔），必须来自 `.spec-first/layer2/*.yaml` |
| `--feature-id <id>` | 否 | 指定 Feature ID |
| `--title <title>` | 否 | Feature 标题，默认等于 `--feat` |
| `--bootstrap` | 否 | 先执行宿主 bootstrap 检查 |

示例：

```bash
spec-first init --feat AUTH --mode N --size M --platforms h5,java-backend --title "用户认证"
```

---

## 2. `spec-first stage`

### 2.1 查看当前阶段

```bash
spec-first stage current <featureId>
```

### 2.2 建议下一步动作

```bash
spec-first stage suggest <featureId>
```

### 2.3 推进下一阶段

```bash
spec-first stage advance <featureId> [--force]
```

### 2.4 取消 Feature

```bash
spec-first stage cancel <featureId> --reason "原因"
```

---

## 3. `spec-first id`

### 3.1 生成下一个 ID

```bash
spec-first id next <type> <abbr> --feature <featureId> [--level <UT|IT|E2E|ST>]
```

| 参数/选项 | 必填 | 说明 |
|---|---|---|
| `<type>` | 是 | `FR`/`DS`/`TASK`/`TC`/`RFC`/`REQ`/`SYS`/`ARCH`/`MOD`/`ATP`/`STP`/`ITP`/`UTP` |
| `<abbr>` | 是 | FEAT 缩写 |
| `--feature <featureId>` | 是 | Feature ID |
| `--level <UT\|IT\|E2E\|ST>` | 否 | TC 级别（仅 type=TC 时需要） |

### 3.2 校验 ID 格式

```bash
spec-first id validate <id>
```

### 3.3 搜索 ID

```bash
spec-first id search <query> --feature <featureId> [--type <type>]
```

### 3.4 列出 ID

```bash
spec-first id list --feature <featureId> [--type <type>]
```

---

## 4. `spec-first gate`

### 4.1 执行 Gate 校验

```bash
spec-first gate check <featureId>
```

### 4.2 查看阶段 Gate 条件

```bash
spec-first gate conditions <featureId>
```

### 4.3 查看 Gate 历史

```bash
spec-first gate history <featureId>
```

---

## 5. `spec-first golive`

### 5.1 上线就绪检查

```bash
spec-first golive check <featureId>
```

---

## 6. `spec-first matrix`

### 6.1 校验追踪矩阵

```bash
spec-first matrix check <featureId>
```

### 6.2 导出追踪矩阵

```bash
spec-first matrix export <featureId> [--format markdown|yaml]
```

### 6.3 更新追踪矩阵行

```bash
spec-first matrix update <featureId> <rowId> [options]
```

---

## 7. `spec-first metrics`

### 7.1 查看覆盖率

```bash
spec-first metrics coverage <featureId> [--json]
```

### 7.2 生成度量报告

```bash
spec-first metrics report <featureId>
```

### 7.3 查看健康分

```bash
spec-first metrics health <featureId>
```

---

## 8. `spec-first rfc`

### 8.1 创建 RFC

```bash
spec-first rfc create <featureId> --title <title> [options]
```

| 选项 | 必填 | 说明 |
|---|---|---|
| `--title <title>` | 是 | RFC 标题 |
| `--level <Minor\|Major\|Critical>` | 否 | RFC 级别，默认 `Minor` |
| `--by <submittedBy>` | 否 | 提交人 |
| `--motivation <motivation>` | 否 | 变更动机 |
| `--description <description>` | 否 | 变更描述 |

### 8.2 提交 RFC（draft -> approved）

```bash
spec-first rfc submit <rfcId> --feature <featureId>
```

### 8.3 RFC 状态转换

```bash
spec-first rfc transition <rfcId> <status> --feature <featureId>
```

### 8.4 列出 RFC

```bash
spec-first rfc list <featureId>
```

### 8.5 查看 RFC 详情

```bash
spec-first rfc get <rfcId> --feature <featureId>
```

---

## 8. `spec-first defect`

### 8.1 注册缺陷

```bash
spec-first defect register <featureId> --title <title> --severity <S1|S2|S3|S4> --reporter <reporter> [options]
```

| 选项 | 必填 | 说明 |
|---|---|---|
| `--title <title>` | 是 | 缺陷标题 |
| `--severity <S1\|S2\|S3\|S4>` | 是 | 严重级别 |
| `--reporter <reporter>` | 是 | 报告人 |
| `--description <description>` | 否 | 缺陷描述 |
| `--discovered-in <stage>` | 否 | 发现阶段 |

### 8.2 更新缺陷状态

```bash
spec-first defect update <featureId> <seq> --status <status> [--actor <actor>]
```

状态可选：`open`、`fixing`、`fixed`、`verified`、`wontfix`。

### 8.3 列出缺陷

```bash
spec-first defect list <featureId> [--status <status>] [--severity <severity>]
```

### 8.4 查看缺陷详情

```bash
spec-first defect get <featureId> <seq>
```

### 8.5 计算缺陷逃逸率

```bash
spec-first defect escape-rate <featureId>
```

---

## 9. `spec-first ai`

### 9.1 生成 ContextPack

```bash
spec-first ai context <featureId> [--full] [--expand <path1,path2>]
```

### 9.2 执行 Session Catchup

```bash
spec-first ai catchup <featureId>
```

### 9.3 查看 AI 使用统计

```bash
spec-first ai stats <featureId>
```

---

## 10. `spec-first doctor`

### 10.1 运行诊断

```bash
spec-first doctor [featureId]
```

---

## 11. `spec-first done`

### 11.1 收口到 08_done

```bash
spec-first done <featureId>
```

将 Feature 从 `07_release` 阶段推进到终态 `08_done`。

---

## 12. `spec-first hooks`

### 12.1 安装 Git Hooks

```bash
spec-first hooks install
```

### 12.2 卸载 Git Hooks

```bash
spec-first hooks uninstall
```

### 12.3 查看 Hooks 状态

```bash
spec-first hooks status
```

---

## 13. `spec-first viewer`

### 13.1 启动可视化面板

```bash
spec-first viewer start
spec-first viewer open          # 启动并打开浏览器
spec-first viewer url           # 输出当前地址
```

---

## 14. `spec-first update`

### 14.1 刷新配置

```bash
spec-first update [--dry-run] [--skip-mcp] [--skip-hooks] [--host <target>] [--component <set>]
```

---

## 15. `spec-first uninstall`

### 15.1 清理配置

```bash
spec-first uninstall [--dry-run] [--keep-mcp] [--host <target>]
```

---

## 16. `spec-first analyze`

### 16.1 一致性分析

```bash
spec-first analyze <featureId>
```

---

## 17. `spec-first trace`

### 17.1 修复追溯链

```bash
spec-first trace fix <featureId>
```

### 17.2 校验追溯链

```bash
spec-first trace validate <featureId>
```

---

## 18. `spec-first validate`

### 18.1 格式校验

```bash
spec-first validate format <featureId>
```

### 18.2 矩阵校验

```bash
spec-first validate matrix
```

### 18.3 执行全部校验

```bash
spec-first validate all <featureId>
```

---

## 附录：阶段与常用命令映射（As-Is）

| 阶段 | 常用命令 |
|---|---|
| `00_init` | `spec-first init ...` |
| `01_specify` | `spec-first id next FR ...`、`spec-first id validate ...` |
| `02_design` | `spec-first id next DS ...`、`spec-first matrix check ...` |
| `03_plan` | `spec-first id next TASK ...`、`spec-first metrics coverage ...` |
| `04_implement` | `spec-first stage current ...`、`spec-first matrix export ...` |
| `05_verify` | `spec-first metrics report ...`、`spec-first gate check ...` |
| `06_wrap_up` | `spec-first matrix check ...`、`spec-first gate history ...` |
| `07_release` | `spec-first gate check ...`、`spec-first stage advance ...` |
| 任意阶段（变更） | `spec-first rfc ...`、`spec-first defect ...` |
| 任意阶段（AI） | `spec-first ai context ...`、`spec-first ai catchup ...` |

---

> 注：本手册按当前代码实现收敛，不包含尚未落地的规划型命令（如 `jira`、`completion`、`gate status`、`matrix show/trace/migrate`、`metrics trend/ai-stats`）。
