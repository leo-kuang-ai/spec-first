# First Skill 实现计划

> **设计文档**: `docs/plans/2026-02-28-first-skill-design.md`
> **日期**: 2026-02-28

---

## 实现步骤

### Step 1: 创建 SKILL.md

**文件**: `skills/spec-first/00-first/SKILL.md`

编写完整的 Skill 定义文件，包含：
- Front matter（name, description, version, confirm_policy）
- 核心约束：以代码为准，禁止捏造，不确定标注 `[待确认]`
- 触发条件与参数定义（--depth, --skip-db, --db-url）
- P0-P5 六阶段执行指令
  - P0: 项目根目录定位 + 幂等检测（首次→全量生成，已有产物→差异对比→增量更新）
  - P1: 技术栈识别（9语言 + 14框架 + 7端含KMP）+ 外部依赖扫描
  - P2: 代码库概览（overview/deep）+ 架构图 + API 文档 + 本地环境指南
  - P3: 数据库配置检测 + CLI 连接（7种DB + 检测优先级链）
  - P4: ER 文档生成（Mermaid + 表格，NoSQL 适配）
  - P5: 汇总输出
- 成功标准
- 7 个产物模板示例

**产物清单**:
1. `docs/first/tech-stack.md`
2. `docs/first/external-deps.md`
3. `docs/first/codebase-overview.md`
4. `docs/first/architecture.md`
5. `docs/first/api-docs.md`
6. `docs/first/local-setup.md`
7. `docs/first/database-er.md`（如有 DB）

**验收**: 文件存在且格式符合现有 Skill 规范

### Step 2: 更新 README.md

**文件**: `skills/spec-first/README.md`

在 Skill 索引表中添加 00-first 条目。

**验收**: README 中包含 00-first 链接

### Step 3: 更新 CHANGELOG.md

**文件**: `CHANGELOG.md`

添加变更记录。

### Step 4: 验证

- 确认 `skills/spec-first/00-first/SKILL.md` 可被 dispatcher 发现
- 检查 SKILL.md 格式与现有 skill 一致
