# 测试质量检查清单

## 核心原则

**测试必须验证实际代码，而非重新实现逻辑**

## 检查项

### 1. 导入实际代码

**✅ 正确示例**:
```typescript
import { getCache, setCache } from '../scripts/stage-viewer/app.js';

test('should cache features', () => {
  setCache('features', { data: 'test' });
  const result = getCache('features');
  expect(result).toEqual({ data: 'test' });
});
```

**❌ 错误示例**:
```typescript
test('should cache features', () => {
  // 重新实现了 getCache 逻辑
  const getCache = (key) => cache[key];
  const result = getCache('features');
  expect(result).toBeDefined();
});
```

### 2. 函数调用一致性

**检查命令**:
```bash
# 检查函数定义
grep -n "function getCache\|const getCache" app.js

# 检查所有调用
grep -n "getCache(" app.js

# 验证名称一致
```

**阻断条件**:
- 定义是 `getCache` 但调用是 `getFromCache` → FAIL

### 3. 前端代码必须在浏览器环境测试

**配置要求**:
```typescript
/**
 * @jest-environment jsdom
 */
```

**或使用真实浏览器**:
```json
{
  "test:e2e": "playwright test"
}
```

## 验证流程

1. **静态检查**: 运行 ESLint 检查未定义引用
   ```bash
   eslint --rule 'no-undef: error' scripts/
   ```

2. **测试执行**: 确保测试导入实际代码
   ```bash
   npm test -- --coverage
   ```

3. **手动验证**: 在目标环境中运行
   - 前端: 打开浏览器检查控制台
   - 后端: 启动服务调用 API

## 失败处理

如果测试覆盖率 100% 但未导入实际代码:
- 标记为测试质量不合格
- 要求重写测试或增加 E2E 测试
- 不允许推进到下一阶段
