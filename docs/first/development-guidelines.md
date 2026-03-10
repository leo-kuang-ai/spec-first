---
mode: deep
generated_at: 2026-03-09T20:06:12.462Z
---

# 研发规范

## 代码规范

### 文件命名
- 使用 `kebab-case.ts` 格式
- 测试文件：`*.test.ts`

### 导出规范
- 使用 Named exports
- 禁止 default export（core 模块）

### 变量命名
- 未使用变量以 `_` 前缀标记

### 类型定义
- 共享类型集中在 `src/shared/types.ts`

## 模块系统

- **ESM Only**: 全项目使用 `"type": "module"`
- 使用 `import/export` 语法

## 测试规范

### 测试结构
```
tests/
├── unit/           # 单元测试
├── integration/    # 集成测试
├── e2e/           # 端到端测试
├── benchmark/     # 性能测试
└── fixtures/      # 测试固件
```

### 覆盖率要求
- Lines/Functions/Statements: ≥75%
- Branches: ≥65%

## Git 工作流

### 提交规范
遵循 Conventional Commits：
- `feat:` 新功能
- `fix:` Bug 修复
- `chore:` 构建/工具变更
- `docs:` 文档更新
- `refactor:` 重构
- `test:` 测试相关

### 分支策略
- `master` - 主分支
- `feature/*` - 功能分支
- `fix/*` - 修复分支

## Stage 枚举

```typescript
00_init       // 初始化
01_specify    // 需求规格
02_design     // 技术设计
03_plan       // 任务拆解
04_implement  // 代码实现
05_verify     // 验证测试
06_wrap_up    // 归档复盘
07_release    // 发布上线
08_done       // 已完成
09_cancelled  // 已取消
```

## 追溯 ID 类型

FR, DS, TASK, TC, RFC, REQ, SYS, ARCH, MOD, ATP, STP, ITP, UTP, Feature
