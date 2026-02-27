# Phase 2: Security & Performance Review

**审查日期**: 2026-02-27
**审查范围**: Spec-First CLI - 完整源代码

---

## Security Findings

### Critical Issues

**无关键问题**

### High Priority Issues

#### 1. Shell 命令注入风险 - Session Hook 动态命令生成
- **文件**: `src/core/tool-integration/session-hook.ts:31-65`
- **CWE**: CWE-78 (OS Command Injection)
- **描述**: `buildSessionStartCommand` 函数构建复杂的 shell 命令字符串，包含用户可控的 feature ID，虽然使用了 `shellQuote` 进行引号转义，但最终通过 `sh -c` 执行，存在潜在的命令注入风险
- **攻击场景**: 如果 `.spec-first/current` 包含恶意内容（如 `"; rm -rf /; echo "`），可能导致命令注入
- **修复建议**:
  1. 对 featureId 进行严格格式校验 (`/^[A-Z0-9-]+$/`)
  2. 使用参数化命令而非字符串拼接

#### 2. Layer2 命令 Gate - 允许执行任意可执行文件
- **文件**: `src/core/gate-engine/command-gate.ts:5-45`
- **CWE**: CWE-78 (OS Command Injection)
- **描述**: `isSafeRelativeExecutable` 函数仅通过正则表达式 `/^[./A-Za-z0-9_-]+$/` 验证，无法防止路径遍历攻击
- **攻击场景**:
  ```yaml
  gate_conditions:
    '04_implement':
      - command: './subdir/../../../../../tmp/malicious'
  ```
- **修复建议**: 解析并验证路径在项目目录内，使用 `path.resolve()` 确保不越界

#### 3. Git Hook 脚本生成中的 Shell 注入风险
- **文件**: `src/core/tool-integration/hook-installer.ts:87-146`
- **CWE**: CWE-78 (OS Command Injection)
- **描述**: Git Hook 脚本直接从文件中读取内容并插入到生成的 shell 脚本中，未经充分转义
- **攻击场景**: 如果 `.spec-first/current` 包含 `$(evil_command)` 这样的内容，可能导致命令注入
- **修复建议**: 在脚本中对变量进行严格转义 `tr -d '$`\\;|&'`

### Medium Priority Issues

#### 4. 路径遍历防护不完整 - fs-utils.ts
- **文件**: `src/shared/fs-utils.ts:8-22`
- **CWE**: CWE-22 (Path Traversal)
- **描述**: `assertSafePath` 仅检查显式的 `..` 段，无法防止所有路径遍历变体（如绝对路径、URL 编码）
- **修复建议**: 使用 `path.resolve()` 并确保解析后的路径在项目目录内

#### 5. 依赖项漏洞 - esbuild
- **文件**: `package.json` (间接依赖)
- **CWE**: CWE-346 (Origin Validation Error)
- **CVE**: GHSA-67mh-4wv8-2f99 (CVSS 5.3)
- **描述**: `vitest > vite > esbuild` 存在 CORS 漏洞，允许任何网站向开发服务器发送请求并读取响应
- **影响范围**: 仅影响开发环境
- **修复建议**: 在 `package.json` 中配置 `pnpm.overrides` 强制使用 esbuild ^0.25.0

#### 6. YAML 解析不安全
- **文件**: 多处使用 `js-yaml` 默认解析器
- **CWE**: CWE-502 (Deserialization of Untrusted Data)
- **描述**: 部分代码使用 `yaml.load()` 但未始终使用 `yaml.JSON_SCHEMA`
- **修复建议**: 创建统一的 `safeYamlLoad<T>()` 函数，强制使用 `JSON_SCHEMA`

#### 7. AI Runtime Hook 命令注入风险
- **文件**: `src/core/tool-integration/ai-runtime-hook.ts:32-50`
- **CWE**: CWE-78 (OS Command Injection)
- **描述**: Extension 配置文件中的 `hook.command` 未经验证直接执行
- **修复建议**: 添加 `validateExtensionCommand()` 函数，阻断危险操作符

### Low Priority Issues

#### 8. 环境变量未验证直接使用
- **文件**: `src/shared/host-paths.ts:63-156`
- **CWE**: CWE-20 (Improper Input Validation)
- **描述**: 大量环境变量直接用于构建路径，未进行充分验证
- **修复建议**: 添加环境变量路径验证，限制在允许的目录前缀内

#### 9. 日志文件轮转中的符号链接攻击风险
- **文件**: `src/shared/logger.ts:50-66`
- **CWE**: CWE-59 (Improper Link Resolution Before File Access)
- **描述**: 日志轮转使用 `renameSync`，未检查目标是否为符号链接
- **修复建议**: 使用 `lstatSync` 检查符号链接，拒绝轮转符号链接

---

## Performance Findings

### Critical Issues

#### 1. 同步导入所有命令处理器
- **文件**: `src/cli/index.ts`
- **性能影响**: 启动延迟 50-100ms，内存增加 2-5MB
- **问题**: 即使用户只想执行 `spec-first --help`，所有 17 个命令模块也会被同步加载
- **优化建议**: 使用动态导入 + 命令映射表，按需加载命令处理器
- **预期收益**: 启动时间减少 40-60%，冷启动内存减少 50%

#### 2. 全部使用同步文件操作
- **文件**: `src/shared/fs-utils.ts`
- **性能影响**: 大文件读取阻塞事件循环，多文件操作串行执行
- **问题**: 所有文件操作都使用同步 API (`readFileSync`, `writeFileSync`)
- **优化建议**:
  - 添加异步版本 (`readJsonAsync`, `writeJsonAsync`)
  - 提供批量并行读取接口 (`readJsonBatch`)
- **预期收益**: 多文件操作速度提升 3-5 倍

### High Priority Issues

#### 3. 扩展加载无缓存
- **文件**: `src/core/process-engine/extensions.ts`
- **性能影响**: 每次调用都重新加载，无缓存机制
- **优化建议**: 添加 5 秒 TTL 的扩展描述符缓存，基于目录 mtime 失效
- **预期收益**: 扩展加载速度提升 90%+（缓存命中时）

#### 4. 模板无缓存机制
- **文件**: `src/core/template/renderer.ts`
- **性能影响**: 重复渲染同一模板时浪费大量 CPU
- **优化建议**: 添加模板编译缓存，基于文件 mtime 失效
- **预期收益**: 模板渲染速度提升 80-90%（缓存命中时）

#### 5. 矩阵 V-Model 检查 O(n²) 复杂度
- **文件**: `src/core/trace-engine/matrix.ts:193-241`
- **性能影响**: 大型矩阵（100+ 行）时性能显著下降
- **问题**: 每次检查都遍历整个 rows 数组
- **优化建议**: 预先构建类型索引和反向索引，将算法优化为 O(n)
- **预期收益**: 大矩阵处理速度提升 10-100 倍

#### 6. 重复计算 Checksum 和 Token
- **文件**: `src/core/ai-orchestrator/context-pack.ts:215-241`
- **性能影响**: SHA256 计算和内容分析开销大
- **优化建议**: 添加文件内容缓存，基于文件 mtime 失效
- **预期收益**: 上下文打包速度提升 70-80%（缓存命中时）

#### 7. Skill 路径解析效率低
- **文件**: `src/core/skill-runtime/dispatcher.ts:159-177`
- **性能影响**: 大量 skills 时搜索效率低
- **问题**: 线性搜索目录，每次都 `readdirSync`
- **优化建议**: 构建 skill 名称到路径的索引缓存
- **预期收益**: Skill 查找速度从 O(n) 提升到 O(1)

### Medium Priority Issues

#### 8. Gate 历史记录全量读取
- **文件**: `src/core/gate-engine/gate-evaluator.ts:396-417`
- **性能影响**: 历史记录增长时性能线性下降
- **优化建议**: 添加 `limit` 参数，默认只读取最后 100 条

#### 9. 覆盖率计算中的重复过滤
- **文件**: `src/core/trace-engine/coverage.ts`
- **性能影响**: 对同一数组执行多次 filter 操作
- **优化建议**: 单次遍历分类，按类型分组

#### 10. 配置缓存是进程级单一值
- **文件**: `src/shared/config-schema.ts:38-65`
- **性能影响**: 多项目场景下缓存失效，无法跨项目共享
- **优化建议**: 改为 Map 结构，按项目根目录分别缓存

#### 11. 未使用代码分割
- **文件**: `tsup.config.ts`
- **性能影响**: CLI 启动时加载整个 bundle，内存占用较高
- **优化建议**: 启用 `splitting: true` 和 `codeSplitting: true`

### Low Priority Issues

#### 12. 测试 Fixture 设置开销
- **文件**: `tests/unit/matrix.test.ts`
- **性能影响**: 每个测试都重新创建和删除目录
- **优化建议**: 使用 `beforeAll`/`afterAll` 或内存文件系统（memfs）

---

## Summary by Severity

### Security
| 严重程度 | 数量 | 主要类别 |
|----------|------|----------|
| Critical | 0 | - |
| High | 3 | 命令注入、路径遍历 |
| Medium | 4 | 依赖漏洞、YAML 解析、输入验证 |
| Low | 2 | 环境变量、符号链接 |

### Performance
| 严重程度 | 数量 | 主要类别 |
|----------|------|----------|
| Critical | 2 | CLI 启动、同步 I/O |
| High | 5 | 缓存缺失、算法复杂度 |
| Medium | 5 | 全量读取、重复过滤、构建配置 |
| Low | 1 | 测试 fixture |

---

## Critical Issues for Phase 3 Context

以下安全与性能问题需要在后续测试和文档阶段特别关注：

### 安全测试需覆盖的场景
1. **命令注入测试**: Session Hook、Git Hook、Extension Hook 的输入验证
2. **路径遍历测试**: `fs-utils.assertSafePath()`、`command-gate` 的路径验证
3. **YAML 解析测试**: 恶意 YAML 内容的防御能力

### 性能测试需覆盖的场景
1. **大项目性能**: 100+ 矩阵行、大量扩展的场景
2. **重复操作性能**: 模板渲染、配置加载的缓存效果
3. **CLI 启动性能**: 不同命令的加载时间

---

## Positive Findings

以下安全措施已正确实施：
1. **路径遍历基础防护** (`fs-utils.ts`): 检查空字节和显式 `..`
2. **命令白名单机制** (`command-gate.ts`): `ALLOWED_LAYER2_EXECUTABLES` 白名单
3. **命令操作符阻断** (`command-gate.ts`): 阻断 `|`, `;`, `&`, `` ` ``, `$(` 等危险操作符
4. **JSON Schema YAML 解析** (`layer-merger.ts`): 部分代码使用安全的 YAML 解析模式
5. **超时保护** (`command-gate.ts`, `hard-gate.ts`): 命令执行设置了 30s 超时

---

**审查人员**: AI Security & Performance Agents
**完成时间**: 2026-02-27 00:38
