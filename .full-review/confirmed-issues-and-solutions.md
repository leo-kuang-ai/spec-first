# 已确认问题与解决方案

**审查基线**: 当前工作区源码实现  
**来源**: `.full-review` 全量审查结果经源码复核后的保留项  
**目标**: 仅保留已经确认成立的问题，以及对应解决方案

---

## 1. `advance()` 在 `07_release -> 08_done` 使用递归自动收口

### 问题

- 文件: [advance.ts](/Users/kuang/xiaobu/spec-first/src/core/process-engine/advance.ts)
- 当前实现中，`to === Stage.RELEASE` 时会再次调用 `advance(featureId, projectRoot, _options)`
- 这不是无限递归，但属于**受控递归**

### 风险

- 可读性一般，流程理解成本高
- 后续如果在 `07_release` 增加更多逻辑，递归链更容易被误用
- 不利于后续扩展为更复杂的发布阶段状态处理

### 解决方案

改为**显式迭代推进**：

1. 将“推进一次”的核心逻辑抽成内部函数，例如 `advanceOnce()`
2. 在外层用 `while` 或有限循环处理 `release -> done` 的自动收口
3. 明确设置最大自动推进步数，避免未来逻辑扩展后出现意外递归

### 建议优先级

`P1`

---

## 2. `init.ts`、`hard-gate.ts`、`host-bootstrap.ts` 复杂度偏高

### 问题

以下文件承担了较多职责，已形成明显的维护压力：

- [init.ts](/Users/kuang/xiaobu/spec-first/src/cli/commands/init.ts)
- [hard-gate.ts](/Users/kuang/xiaobu/spec-first/src/core/skill-runtime/hard-gate.ts)
- [host-bootstrap.ts](/Users/kuang/xiaobu/spec-first/src/shared/host-bootstrap.ts)

### 风险

- 新功能接入时更容易破坏已有行为
- 单测隔离成本高
- 局部变更难以判断副作用边界
- 后续多人协作时更容易产生重复逻辑

### 解决方案

按职责拆分：

1. `init.ts`
   - 拆出参数解析
   - 拆出 bootstrap 流程
   - 拆出交互式引导输出
   - 拆出 post-init setup

2. `hard-gate.ts`
   - 将 TDD 检查、Plan 审批检查、Git 工作区检查、高风险判定拆成独立策略函数
   - 用组合式 `Rule[]` 或策略表代替长函数串行判断

3. `host-bootstrap.ts`
   - 抽离宿主级写入器
   - 抽离备份/回滚/原子写公共能力
   - 抽离 MCP baseline 计算与配置迁移逻辑

### 建议优先级

`P1`

---

## 3. 项目文档中的统计口径存在历史漂移

### 问题

当前代码和文档中的一些统计口径并不完全一致，例如：

- `src/core/` 当前一级模块目录数为 `15`
- `README.md` 当前写 `28 deterministic command groups`
- `skills/spec-first/` 当前一级目录数为 `21`，但对外主口径通常仍按 `20 Skills`

### 风险

- 新成员会基于错误规模认知理解系统
- 评审和规划文档容易继续复制过时数字
- 架构/能力演进无法被准确追踪

### 解决方案

建立**单一统计事实源**：

1. 在文档中明确“对外口径”和“目录扫描数”的区别
2. 将核心统计口径统一到：
   - CLI 命令组
   - 核心模块
   - 对外公开 Skills
3. 在 README / CLAUDE / 用户文档中统一引用同一套数字
4. 增加一个轻量校验脚本或测试，防止统计口径继续漂移

### 建议优先级

`P1`

---

## 4. Git 命令执行面仍可继续收敛

### 问题

- 文件: [hard-gate.ts](/Users/kuang/xiaobu/spec-first/src/core/skill-runtime/hard-gate.ts)
- 当前实现已经使用 `execFileSync('git', args, ...)`，不存在 `.full-review` 中声称的 shell 注入形式
- 但 Git 命令面仍然偏宽，仍有进一步硬化空间

### 风险

- 后续新增调用点时，可能继续扩展未经约束的 Git 子命令集合
- 统一审计和超时治理成本较高

### 解决方案

做**命令面收敛**而不是“大修”：

1. 抽一个统一 `runGitCommand()` 封装
2. 对可用子命令建立 allowlist
3. 统一超时、输出长度、错误处理策略
4. 对高风险命令和只读命令做分类

### 建议优先级

`P2`

---

## 5. JSON / 配置 / 输入规模校验仍可系统化

### 问题

当前项目已经有部分校验能力，但整体上仍然偏分散：

- JSON 读取与结构验证并未完全统一
- 配置读取、文件大小、字符串长度、命令超时等限制没有形成统一安全边界

### 风险

- 同类问题在不同模块重复出现
- 新模块更容易绕开既有保护模式
- 安全与稳定性策略难以统一落地

### 解决方案

建立统一的输入与资源边界层：

1. 统一 JSON 读取入口
2. 统一配置校验入口
3. 为大文件、长字符串、外部命令执行设置共享限制常量
4. 将现有分散的“局部防护”收敛到 shared 层

### 建议优先级

`P2`

---

## 6. 同步 I/O 较多，适合按热点优化

### 问题

当前代码中存在较多 `readFileSync` / `writeFileSync` / `appendFileSync`：

- [fs-utils.ts](/Users/kuang/xiaobu/spec-first/src/shared/fs-utils.ts)
- [config-schema.ts](/Users/kuang/xiaobu/spec-first/src/shared/config-schema.ts)
- [host-bootstrap.ts](/Users/kuang/xiaobu/spec-first/src/shared/host-bootstrap.ts)
- 以及多个流程命令和日志路径

### 风险

- 在 auto-loop、批量流程、频繁 CLI 调用下会放大阻塞成本
- 后续并发能力增强时更容易形成性能瓶颈

### 解决方案

不要全量异步化，按热点治理：

1. 先对高频路径做 profiling
2. 优先优化：
   - 配置加载
   - gate/history 读取
   - trace/matrix 解析
3. 对纯启动期、一次性 CLI 路径保持同步实现即可
4. 对高频热路径增加缓存或异步实现

### 建议优先级

`P2`

---

## 7. `config` 缓存 TTL 是否合适仍需压测验证

### 问题

- 文件: [config-schema.ts](/Users/kuang/xiaobu/spec-first/src/shared/config-schema.ts)
- 当前 `CONFIG_CACHE_TTL_MS = 30_000`
- 这是事实，但“是否过短”目前缺少压测证据

### 风险

- 如果 auto-loop 高频读取配置，可能带来额外磁盘开销
- 如果 TTL 调得过长，又可能导致配置变更感知滞后

### 解决方案

基于测量调整，而不是拍脑袋改值：

1. 对 auto-loop / orchestrate 场景加配置读取计数
2. 统计真实读取频率和命中率
3. 再决定：
   - 调整 TTL
   - 增加 request-level cache
   - 为特定流程显式失效缓存

### 建议优先级

`P3`

---

## 8. 治理型改进项仍有价值，但不属于当前缺陷

### 范围

以下项值得做，但不应当被写成当前阻断问题：

- ADR 体系
- Repository 抽象
- branded types
- `types.ts` 进一步拆分

### 解决方案

作为治理路线图处理：

1. 进入架构治理 backlog
2. 不与当前功能修复混排
3. 只在有明确收益或触发新一轮模块拆分时推进

### 建议优先级

`P3`

---

## 9. 最终保留问题清单

### P1

1. `advance()` 的递归自动收口应改为迭代
2. `init.ts` / `hard-gate.ts` / `host-bootstrap.ts` 需要按职责拆分
3. 文档统计口径需要统一到单一事实源

### P2

1. Git 命令执行面进一步收敛
2. JSON / 配置 / 输入规模校验系统化
3. 同步 I/O 按热点优化

### P3

1. `config` 缓存 TTL 用压测验证再调整
2. ADR / Repository / 类型治理类改进

---

## 10. 一句话结论

当前真正确认成立的问题，主要集中在**复杂度、边界一致性、统计口径和可维护性治理**；`.full-review` 中原本那些安全 `Critical` 和“未实现模块”类结论，已不应继续保留。
