# 主流程审计报告

**审计日期**: 2026-03-09
**审计对象**: Feature 初始化 → ID 生成 → 阶段推进链路

---

## 一、Feature 初始化流程审计

### 1.1 流程追踪

**入口**: `src/core/process-engine/init.ts:707 init()`

```
init(opts)
  ↓
validateFeat(opts.feat)  // 校验缩写
  ↓
resolveFeatureInitTargets()  // 解析目标路径
  ↓
loadRegistry()  // 读取注册表
  ↓
exists(featureDir) ?
  ├─ YES → recoverExistingFeature()  // 幂等返回
  └─ NO  → 继续创建
      ↓
      writeFeatureSkeleton(tmpDir)  // 写临时目录
      ↓
      commitFeatureInit()  // 原子提交
          ↓
          withRegistryLock()  // 加锁
          ↓
          renameSync(tmpDir, featureDir)  // 原子重命名
          ↓
          registerFeatUnlocked()  // 写注册表
          ↓
          writeCurrentFeature()  // 写 current 文件
```

### 1.2 幂等性验证

**代码**: init.ts:718-727

```typescript
if (exists(targets.featureDir)) {
  return recoverExistingFeature(...);  // ✅ 幂等
}
```

**结论**: ✅ Feature 初始化幂等性良好

---

### 1.3 并发安全性验证

**锁机制**: init.ts:126-143 `withRegistryLock()`

```typescript
function withRegistryLock<T>(specsDir: string, action: () => T): T {
  const lockPath = join(specsDir, REGISTRY_LOCK_FILE);
  while (true) {
    try {
      const lockFd = openSync(lockPath, 'wx');  // ✅ 独占创建
      try {
        return action();
      } finally {
        releaseRegistryLock(lockFd, lockPath);
      }
    } catch (error) {
      shouldRetryRegistryLock(error, lockPath, start);  // ✅ 重试逻辑
    }
  }
}
```

**结论**: ✅ Feature 注册表有锁保护

---

### 1.4 问题发现

#### 🔴 问题 1: current 文件无锁保护

**位置**: init.ts:499-503

```typescript
function writeCurrentFeature(projectRoot: string, featureId: string): void {
  const currentPath = join(projectRoot, '.spec-first', 'current');
  ensureDir(join(projectRoot, '.spec-first'));
  writeMarkdown(currentPath, `${featureId}\n`);  // ❌ 无锁
}
```

**风险**: 并发 init 可能导致 current 文件被覆盖

**证据**: commitFeatureInit 在锁内调用 writeCurrentFeature，但 advance 调用时无锁

---

#### 🔴 问题 2: 临时目录清理不完整

**位置**: init.ts:740-742

```typescript
if (commitResult === 'idempotent') {
  rmSync(targets.tmpFeatureDir, { recursive: true, force: true });
}
```

**风险**: commitResult === 'created' 时，tmpDir 未清理

**证据**: 查看 commitFeatureInit 返回值，'created' 分支未清理临时目录

---

