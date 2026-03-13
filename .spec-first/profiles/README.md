# Spec-First Profile 使用指南

## 快速开始

### 1. 选择合适的 Profile 模板

根据项目类型选择：

- **frontend.yaml** - 纯前端项目（React/Vue/Angular）
- **backend.yaml** - 后端服务（Node.js/Python/Go）
- **mobile.yaml** - 移动应用（Android/iOS）

### 2. 复制到项目根目录

```bash
cp .spec-first/profiles/frontend.yaml .spec-first/profile.yaml
```

### 3. 根据项目调整

编辑 `.spec-first/profile.yaml`，调整：
- 命令（如 `npm run lint` → `pnpm lint`）
- blocking 属性（根据团队标准）
- 添加/删除条件

## 配置说明

### blocking 属性

- `blocking: true` - 失败时阻断流程，必须修复或豁免
- `blocking: false` - 失败时仅警告，不阻断流程

### 常见场景

**场景1：前端项目无测试**
```yaml
- id: G-FE-TEST
  command: "npm test"
  blocking: false  # 设为 non-blocking
```

**场景2：工具可能未安装**
```yaml
- id: G-ANDROID-LINT
  command: "ktlint"
  blocking: false  # 避免环境问题阻断
```

**场景3：严格质量要求**
```yaml
- id: G-BE-COVERAGE
  command: "npm run test:coverage"
  blocking: true  # 强制要求
```

## 最佳实践

1. **默认 blocking=true**，只在特殊情况设为 false
2. **环境相关的检查**（如平台工具）设为 non-blocking
3. **核心质量检查**（如单测覆盖率）设为 blocking
4. **使用 RFC 豁免机制**处理临时例外

## 示例

完整的前端项目配置：

```yaml
profile: default-simplified

gateConditions:
  04_implement:
    - id: G-FE-LINT
      description: "ESLint check"
      command: "npm run lint"
      blocking: true

    - id: G-FE-TEST
      description: "Unit test pass"
      command: "npm test -- --run"
      blocking: false  # 很多前端项目无测试框架
```
