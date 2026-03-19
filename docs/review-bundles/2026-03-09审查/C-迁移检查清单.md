# 迁移检查清单

## 重构前准备

### 备份
- [ ] 备份原 SKILL.md 到 `SKILL.md.backup`
- [ ] 创建 git 分支 `refactor/spec-progressive-disclosure`
- [ ] 提交当前状态

### 环境检查
- [ ] 确认 `scripts/package_skill.py` 可用
- [ ] 确认测试环境可用
- [ ] 准备测试用例（Trivial/Simple/Moderate/Complex）

---

## 重构执行

### 文件创建
- [ ] 创建 `references/` 目录
- [ ] 创建 `phase0-prd-workflow.md`
- [ ] 创建 `steps-fr-ac-workflow.md`
- [ ] 创建 `complexity-matrix.md`
- [ ] 创建 `anti-rationalization-guards.md`
- [ ] 创建 `cli-commands-reference.md`
- [ ] 创建 `quality-gates.md`

### 内容迁移
- [ ] 提取 Phase 0 流程（第 154-344 行）
- [ ] 提取 Step 0-7 流程（第 346-635 行）
- [ ] 提取复杂度矩阵（第 384-409 行）
- [ ] 提取反合理化守卫（第 26-47 行）
- [ ] 提取 CLI 命令（第 58-72 行 + 第 685-689 行）
- [ ] 提取质量门禁（分散内容）

### SKILL.md 精简
- [ ] 保留 Frontmatter
- [ ] 保留核心流程概览
- [ ] 保留复杂度自适应规则
- [ ] 保留关键约束摘要
- [ ] 添加引用链接
- [ ] 删除详细内容
- [ ] 验证行数 ≤ 300 行

---

## 重构验证

### 引用链接验证
- [ ] 检查所有 `references/` 链接有效
- [ ] 验证相对路径正确
- [ ] 测试文件加载

### 功能测试
- [ ] 测试 Trivial 路径（Phase 0 + Step 0-1 + Step 7）
- [ ] 测试 Simple 路径（Phase 0 + Step 0-2 + Step 5 + Step 7）
- [ ] 测试 Moderate 路径（Phase 0 + Step 0-5 + Step 7）
- [ ] 测试 Complex 路径（Phase 0 + Step 0-7 全量）

### 打包验证
- [ ] 运行 `scripts/package_skill.py skills/spec-first/03-spec`
- [ ] 验证无错误
- [ ] 检查 .skill 文件包含所有 references

---

## 问题修复验证

### P0 问题
- [ ] P0-1: SKILL.md ≤ 300 行
- [ ] P0-2: ID 类型统一（REQ-PRD 问题解决）
- [ ] P0-3: Gate Check 时机明确

### P1 问题
- [ ] P1-1: Progressive Disclosure 结构完成
- [ ] P1-2: Phase 0.2 vs Step 1 流程合并
- [ ] P1-3: 复杂度判定前移到 Phase 0.2
- [ ] P1-4: CLI 命令错误处理完善

---

## 提交前检查

### 代码质量
- [ ] 所有 markdown 格式正确
- [ ] 所有代码块语法高亮正确
- [ ] 所有表格格式正确
- [ ] 无拼写错误

### 文档完整性
- [ ] 所有 references 文件有文件头说明
- [ ] 所有引用链接有效
- [ ] 所有示例代码可执行

### 版本管理
- [ ] 更新 version 为 3.0.0
- [ ] 更新 last_updated 日期
- [ ] 更新 changelog

---

## 提交与发布

### Git 提交
- [ ] 提交所有文件
- [ ] 编写清晰的 commit message
- [ ] 推送到远程分支

### 测试验证
- [ ] 在测试环境验证
- [ ] 邀请团队成员 review
- [ ] 修复 review 问题

### 合并发布
- [ ] 合并到主分支
- [ ] 打包新版本 skill
- [ ] 更新文档

---

## 回滚计划

### 如果重构失败
- [ ] 恢复 `SKILL.md.backup`
- [ ] 删除 `references/` 目录
- [ ] 回滚 git 提交
- [ ] 分析失败原因
- [ ] 调整方案后重试
