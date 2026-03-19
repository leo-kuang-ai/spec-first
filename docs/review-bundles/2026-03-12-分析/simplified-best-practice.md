# Spec-First 简化方案：回归价值交付

## 核心理念

**从"流程完美"转向"价值交付"**

- ❌ 12个指标 → ✅ 3个核心指标
- ❌ 强制文档 → ✅ 按需文档
- ❌ 复杂豁免 → ✅ 简单配置

---

## 第一部分：3个核心指标

### 1. 需求追踪 (Requirement Traceability)

**目的**: 确保代码有需求依据

**指标**:
```
RT = 有需求关联的代码变更 / 总代码变更
阈值: ≥ 80%
```

**实现**:
- Git commit 关联 Issue/Story ID
- PR 必须引用需求
- 自动检查，不通过不能合并

**示例**:
```bash
git commit -m "feat: 添加登录功能 #123"
# #123 是 Issue ID
```

---

### 2. 测试覆盖率 (Test Coverage)

**目的**: 确保代码质量

**指标**:
```
TC = 测试覆盖的代码行数 / 总代码行数
阈值: ≥ 70%
```

**实现**:
- 使用标准工具 (Jest/Vitest/pytest)
- CI 自动检查
- 低于阈值警告，不阻塞

**示例**:
```yaml
# .github/workflows/test.yml
- name: Test Coverage
  run: npm test -- --coverage
  continue-on-error: true  # 不阻塞
```

---

### 3. 交付速度 (Delivery Velocity)

**目的**: 衡量团队效率

**指标**:
```
DV = 完成的 Story Points / Sprint
```

**实现**:
- 每个 Sprint 统计
- 趋势分析，不强制阈值
- 用于改进，不用于考核

---

## 第二部分：按需文档

### 必需文档（3个）

1. **README.md**
   - 项目介绍
   - 快速开始
   - 核心功能

2. **CHANGELOG.md**
   - 版本历史
   - 重要变更

3. **API 文档**
   - 接口定义
   - 使用示例

### 可选文档

- 架构设计：复杂项目需要
- PRD：大功能需要
- 技术方案：技术难点需要

**原则**: 文档服务于沟通，不是为了完整性

---

## 第三部分：简化流程

### 开发流程（4步）

```
1. 创建 Issue/Story
   ├─ 描述需求
   └─ 定义验收标准

2. 开发 + 测试
   ├─ 编写代码
   ├─ 编写测试
   └─ 本地验证

3. 提交 PR
   ├─ 关联 Issue
   ├─ CI 自动检查
   └─ Code Review

4. 合并 + 部署
   ├─ 合并到主分支
   └─ 自动部署
```

### 质量检查（自动化）

```yaml
# CI Pipeline
stages:
  - lint      # 代码规范
  - test      # 单元测试
  - coverage  # 覆盖率（警告）
  - build     # 构建验证
```

**原则**: 自动化 > 人工检查


---

## 第四部分：工具选型

### 需求管理
- **GitHub Issues** / Jira / Linear
- 轻量级，集成 Git

### 测试覆盖
- **Jest** (JS/TS)
- **pytest** (Python)
- **JUnit** (Java)

### CI/CD
- **GitHub Actions** / GitLab CI
- 自动化检查 + 部署

### 文档
- **Markdown** + Git
- 简单、版本控制

---

## 第五部分：对比分析

### 当前方案 vs 简化方案

| 维度 | 当前方案 | 简化方案 |
|------|----------|----------|
| 指标数量 | 12个 | 3个 |
| 学习成本 | 2-3天 | 30分钟 |
| 操作成本 | 豁免需15分钟 | 无需豁免 |
| 文档要求 | 强制5类 | 必需3类 |
| 流程复杂度 | 8阶段 | 4步骤 |
| 适用场景 | 大型严格项目 | 通用场景 |

### 效果对比

**当前方案**:
- ✅ 追溯完整
- ❌ 学习成本高
- ❌ 操作繁琐
- ❌ 灵活性差

**简化方案**:
- ✅ 简单易用
- ✅ 快速上手
- ✅ 灵活适配
- ⚠️ 追溯粒度粗

---

## 第六部分：迁移建议

### 渐进式迁移

**Phase 1: 保留核心**
```
保留: C3, C4, C6, C8, C9
删除: C1, C2, C5, C7, C10, C11, C-PRD
```

**Phase 2: 简化豁免**
```
当前: RFC + Exception + Matrix
简化: gate-waivers.yaml
```

**Phase 3: 可选模式**
```
strict:   12指标 (当前方案)
standard: 5指标  (Phase 1)
minimal:  3指标  (简化方案)
```

### 配置示例

```yaml
# .spec-first/config.yml
mode: standard  # strict | standard | minimal

gates:
  strict:
    - C1-C11 + C-PRD
  standard:
    - C3, C4, C6, C8, C9
  minimal:
    - RT, TC, DV

waivers:
  enabled: true
  format: simple  # simple | rfc-based
```

---

## 总结

### 核心原则

1. **简单优先**: 3个指标足够
2. **自动化**: CI 检查，不依赖人工
3. **灵活性**: 按需文档，不强制
4. **价值导向**: 关注交付，不是流程

### 实施建议

- 小团队: 使用 minimal 模式
- 中型团队: 使用 standard 模式
- 大型/严格: 使用 strict 模式

**让用户选择复杂度，而不是强制一套方案。**

