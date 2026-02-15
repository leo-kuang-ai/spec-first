# Code Review Findings

## 测试结果
- **测试通过率**: 100% (443/443 tests passed)
- **测试文件数**: 39 个
- **执行时间**: 2.28s
- **类型检查**: ✅ 通过（npm run typecheck 无错误）

## 已审查模块

### 1. 共享基础设施 (src/shared/)

#### ✅ 优点
- **types.ts**: 类型定义完整，使用 enum 和 ReadonlySet 提升类型安全
- **fs-utils.ts**: 接口简洁，统一封装文件操作
- **logger.ts**: 支持 JSONL 自动轮转（>1000 行），timestamp 自动注入
- **config-schema.ts**: 使用缓存优化性能，默认值合理，校验逻辑清晰

#### ⚠️ 问题与建议

**P2 - fs-utils.ts 错误处理不足**
- 问题：readJson 捕获 JSON.parse 错误但未捕获 readFileSync 错误
- 影响：文件不存在时抛出原生 Node.js 错误，不统一
- 建议：
```typescript
export function readJson<T>(path: string): T {
  try {
    const raw = readFileSync(path, 'utf-8');
    return JSON.parse(raw) as T;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`File not found: ${path}`);
    }
    throw new Error(`Invalid JSON in ${path}: ${(e as Error).message}`);
  }
}
```

**P3 - logger.ts 轮转逻辑可能导致数据丢失**
- 问题：countLines 每次都读取整个文件，大文件性能差
- 建议：使用流式读取或维护行数计数器

**P3 - config-schema.ts 缺少类型导出**
- 问题：SpecFirstConfig 接口未导出，外部模块无法引用
- 建议：添加 `export type { SpecFirstConfig }`

### 2. TraceEngine (src/core/trace-engine/)

#### ✅ 优点
- **id-generator.ts**: 序号生成逻辑正确，支持 6 种 ID 类型
- **id-validator.ts**: 正则表达式准确，性能良好
- **id-search.ts**: 前缀匹配和缩写匹配都支持
- **matrix.ts**: 解析和导出逻辑完整，支持 Markdown 和 YAML

#### ⚠️ 问题与建议

**P1 - id-generator.ts 并发安全问题**
- 问题：多个进程同时调用 nextId 可能生成重复 ID
- 影响：高并发场景下 ID 冲突
- 建议：
  1. 添加文件锁机制（使用 proper-lockfile）
  2. 或在写入前再次校验 ID 唯一性
  3. 文档中明确说明单进程限制

**P2 - matrix.ts parseMatrixContent 解析脆弱**
- 问题：依赖固定列顺序，表格格式变化会导致解析失败
- 建议：
  1. 解析表头获取列索引
  2. 按列名而非位置提取数据
  3. 添加格式校验和错误提示

**P2 - matrix.ts 缺少事务性更新**
- 问题：updateMatrixRow 直接覆盖文件，失败时可能损坏数据
- 建议：先写临时文件，成功后再 rename（原子操作）

**P3 - id-search.ts 性能优化空间**
- 问题：每次搜索都重新解析矩阵文件
- 建议：考虑添加内存缓存（带 TTL）或索引文件

### 3. ProcessEngine (src/core/process-engine/)

#### ✅ 优点
- **stage-machine.ts**: 状态转换表清晰，错误类型专用
- **init.ts**: 初始化逻辑完整，幂等性良好
- **advance.ts**: pilot_mode 降级策略合理
- **layer-merger.ts**: 三层合并逻辑符合设计

#### ⚠️ 问题与建议

**P1 - advance.ts GateEngine 硬编码抛出错误**
- 问题：`throw new GateUnavailableError()` 硬编码，实际应调用 GateEngine
- 影响：阶段 A 临时方案，但代码注释不明确
- 建议：
```typescript
// TODO: Phase A - GateEngine 未就绪，临时抛出错误
// Phase B 需替换为: const result = await gateEngine.check(...)
try {
  throw new GateUnavailableError();
} catch (e) {
  // ...
}
```

**P2 - init.ts FEAT 注册表并发问题**
- 问题：loadRegistry + registerFeat 非原子操作
- 影响：并发初始化可能导致重复注册
- 建议：使用文件锁或数据库

**P2 - layer-merger.ts 平台 YAML 不存在时阻断**
- 问题：`throw new Error` 阻断初始化，但可能只是平台配置缺失
- 建议：
  1. 提供默认空配置
  2. 或在 init 前校验平台配置完整性
  3. 错误信息提供修复指引

**P3 - advance.ts appendFindings 可能失败**
- 问题：appendFileSync 未捕获异常
- 建议：添加 try-catch，失败时记录到日志但不阻断推进

## 架构合规性检查

### ✅ 符合设计
1. 双层架构：CLI 命令 + 核心模块分离清晰
2. 类型系统：统一使用 shared/types.ts
3. 文件即状态：无数据库依赖
4. JSONL 审计：logger.ts 实现完整
5. 单向依赖：未发现循环依赖

### ⚠️ 待确认
1. **M3 GateEngine 集成点**：advance.ts 中硬编码抛出错误，需在阶段 B 补充
2. **性能 SLA**：未见性能基准测试（getCoverage < 50ms 等）
3. **CLI ExitCode 映射**：部分命令未统一使用 ExitCode 枚举

## 测试覆盖分析

### 已覆盖
- 单元测试：443 个测试用例
- 核心模块：stage-machine, rfc-machine, defect-machine, id-validator
- CLI 命令：router, id, matrix 命令

### 缺失或不足
- **集成测试**：缺少端到端流程测试（init → advance → cancel）
- **边界测试**：大文件场景（矩阵 >1000 行）
- **并发测试**：多进程同时操作
- **性能测试**：getCoverage 基准测试

## 安全性检查

### ✅ 良好实践
- 输入校验：ID 格式、FEAT 缩写格式
- 路径安全：使用 path.join 避免路径遍历
- 类型安全：严格模式 TypeScript

### ⚠️ 潜在风险
**P2 - 文件操作无权限检查**
- 问题：writeJson/writeMarkdown 未检查目录写权限
- 建议：添加权限检查或提供友好错误提示

**P3 - YAML 解析未限制大小**
- 问题：yaml.load 可能被恶意大文件攻击
- 建议：添加文件大小限制（如 1MB）

## 性能考虑

### 已优化
- config-schema.ts 使用缓存
- id-validator.ts 正则匹配高效

### 待优化
- matrix.ts 每次操作都重新解析文件
- logger.ts countLines 读取整个文件
- id-search.ts 无缓存机制

## 代码质量评分

| 维度 | 评分 | 说明 |
|------|------|------|
| 类型安全 | 9/10 | TypeScript 严格模式，类型定义完整 |
| 错误处理 | 7/10 | 部分模块缺少异常捕获 |
| 测试覆盖 | 8/10 | 单元测试充分，缺少集成测试 |
| 架构合规 | 9/10 | 符合技术方案设计 |
| 可维护性 | 8/10 | 代码清晰，注释适当 |
| 性能 | 7/10 | 基本满足，有优化空间 |
| 安全性 | 8/10 | 基本安全，需加强边界检查 |
| 文档 | 7/10 | 代码注释良好，缺少 API 文档 |

**综合评分**: 7.9/10

### 4. ChangeMgr (src/core/change-mgr/)

#### ✅ 优点
- **rfc.ts**: RFC 状态流转逻辑清晰，submitRfc 自动同步 known-exceptions
- **defect.ts**: 缺陷管理完整，支持逃逸率计算
- 序号生成逻辑与 id-generator 一致

#### ⚠️ 问题与建议

**P2 - rfc.ts syncKnownExceptionsFromWaivers 解析脆弱**
- 问题：依赖固定表格格式，与 matrix.ts 类似问题
- 建议：统一表格解析逻辑，提取为共享工具函数

**P3 - defect.ts 缺少批量操作**
- 问题：无批量更新缺陷状态的接口
- 建议：添加 `batchTransitionDefects` 方法

### 5. 模板系统 (src/core/template/)

#### ✅ 优点
- **renderer.ts**: Handlebars 集成简洁，跳过已存在文件避免覆盖
- **artifact-checker.ts**: Mode×Size 裁剪逻辑完整，产出物定义清晰

#### ⚠️ 问题与建议

**P2 - renderer.ts 缺少模板校验**
- 问题：模板语法错误在运行时才发现
- 建议：添加 `validateTemplate` 方法，在构建时校验所有模板

**P3 - artifact-checker.ts ARTIFACT_DEFS 硬编码**
- 问题：产出物定义硬编码在代码中，扩展性差
- 建议：考虑从配置文件加载（如 artifacts.yaml）

### 6. CLI 命令层 (src/cli/)

#### ✅ 优点
- **router.ts**: 命令注册机制清晰，错误处理统一
- **init.ts**: 参数校验完整，错误提示友好
- **stage.ts**: GateUnavailableError 专用处理，ExitCode 映射正确
- **id.ts**: 子命令分发清晰，帮助信息完整

#### ⚠️ 问题与建议

**P2 - 缺少全局参数支持**
- 问题：无法指定 --project-root，只能在当前目录运行
- 建议：添加全局参数解析，支持 `--project-root` 和 `--verbose`

**P3 - 帮助信息不一致**
- 问题：部分命令使用 console.log，部分使用 console.error
- 建议：统一帮助信息输出到 stdout

**P3 - 缺少命令别名**
- 问题：命令名较长，无简写形式
- 建议：添加常用命令别名（如 `init` → `i`, `stage` → `s`）

## 关键风险

### 🔴 高优先级（P1）
1. **并发安全**：id-generator 和 FEAT 注册表无锁机制
2. **GateEngine 集成**：advance.ts 硬编码临时方案需在阶段 B 修复

### 🟡 中优先级（P2）
1. **错误处理**：fs-utils, advance 等模块异常处理不完善
2. **数据完整性**：matrix 更新无事务保护
3. **平台配置**：layer-merger 对缺失配置处理过于严格
4. **表格解析**：matrix.ts 和 rfc.ts 解析逻辑脆弱
5. **模板校验**：renderer.ts 缺少构建时模板校验

### 🟢 低优先级（P3）
1. **性能优化**：matrix/logger 文件操作可优化
2. **类型导出**：config-schema 接口未导出
3. **文档完善**：缺少 API 使用文档
4. **CLI 增强**：缺少全局参数、命令别名
5. **扩展性**：artifact-checker 产出物定义硬编码

## 建议行动

### 🚀 立即修复（阻断上线）
1. **添加 id-generator 并发保护**
   - 使用 proper-lockfile 或文件锁机制
   - 或在写入前再次校验 ID 唯一性
   - 文档中明确说明单进程限制

2. **完善 fs-utils 错误处理**
   ```typescript
   export function readJson<T>(path: string): T {
     try {
       const raw = readFileSync(path, 'utf-8');
       return JSON.parse(raw) as T;
     } catch (e) {
       if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
         throw new Error(`File not found: ${path}`);
       }
       throw new Error(`Invalid JSON in ${path}: ${(e as Error).message}`);
     }
   }
   ```

3. **在 advance.ts 添加 TODO 注释**
   ```typescript
   // TODO: Phase A - GateEngine 未就绪，临时抛出错误
   // Phase B 需替换为: const result = await gateEngine.check(...)
   try {
     throw new GateUnavailableError();
   } catch (e) {
     // ...
   }
   ```

### 📋 阶段 B 补充
- [ ] 集成真实 GateEngine（替换 advance.ts 硬编码）
- [ ] 添加集成测试套件（端到端流程）
- [ ] 实现性能基准测试（getCoverage < 50ms）
- [ ] 统一表格解析逻辑（提取共享工具）

### 🔧 技术债务（可延后）
- [ ] matrix 操作添加事务保护（临时文件 + rename）
- [ ] 优化文件解析性能（添加缓存机制）
- [ ] 补充 API 文档和使用示例
- [ ] 添加 CLI 全局参数支持
- [ ] 模板校验工具（构建时检查）
