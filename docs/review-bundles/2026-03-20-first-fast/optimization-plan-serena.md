# First Skill 优化方案（Serena LSP 快路径，兼容现有合同）

> 分析日期：2026-03-20
> 目标：在不破坏当前 `wave + subagent + evidence-pack` 正式合同的前提下，降低起步认知成本、重复读取和 `[待确认]` 频率。

---

## 0. 基准原则

当前 `first` 的正式约束仍以这些文档为准：

- `SKILL.md`
- `references/execution-flow.md`
- `references/subagent-architecture.md`
- `references/main-thread-contract.md`
- `references/evidence-pack-spec.md`
- `references/agent-output-schema.md`

因此，这份方案不是推翻现有执行模型，而是给它加一条更快、更稳的前置路径。

---

## 1. 当前问题

### 1.1 起步慢的主要原因

1. 主线程和多个 subagent 重复读取同一批基础文件。
2. 代码理解仍偏向全文读取和字符串搜索，符号级索引利用不足。
3. 在全局约束允许的范围内，多个执行单元仍会重复消耗同一份正文证据。
4. `evidence-pack` 已经结构化了，但前置证据仍然过大。
5. 当前提示词里没有足够明确地说明“先激活项目、先拿符号概览、再读正文”。

### 1.2 需要保留的东西

以下内容不能删，也不应该改成另一套模型：

- wave 分段
- subagent 分工
- `SKILL.md` 规定的 7 个全局 reference 读取约束
- `manifest/shared/runtime/docs` 证据包结构
- `main-thread-contract` / `evidence-pack-spec` / `agent-output-schema`
- runtime 真源优先于 docs

---

## 2. 可行优化方向

### 2.1 Serena LSP 作为前置快路径

把项目激活和符号索引放到 `first` 的最前面，先拿符号概览，再进入文件正文。

适合用来替代的动作：

- `list_dir` 看目录拓扑
- `find_file` 定位 manifest、README、config、入口
- `find_symbol` 定位入口函数、导出、主要类/模块
- `get_symbols_overview` 快速理解单文件结构
- `find_referencing_symbols` 看引用链

这一步的目标不是“完全不读文件”，而是“先用索引把读文件范围压窄”。

### 2.2 最小证据包做轻量化

当前 `evidence-pack-spec.md` 的方向是对的，但可以再收紧：

- 先读最小必读层
- 再按 wave 追加证据 slice
- 主线程共享结构化摘要，避免把长证据正文复制给每个 subagent

这里不建议把 `evidence-pack` 扁平化成单文件，也不建议删除目录结构。
共享证据建议优先落在 `evidence-pack/shared/summary.json`，必要时再补 `shared/context.json` 或同类结构化摘要。

### 2.3 Reference 读取按职责收敛

不要再让每个 subagent 重复消耗与本轮无关的正文证据。

更好的方式是：

- 主线程保留少量核心合同
- 所有执行仍遵守 `SKILL.md` 规定的 7 个全局 reference
- 公共规则只放一处，减少重复维护和重复解释
- Serena/LSP 负责把正文读取范围压窄，而不是删除全局 reference

这里的收益来源必须明确：

- 不减少 7 个全局 reference 的加载要求
- 只减少额外主题文档的无差别扩散
- 只减少代码正文的重复读取与重复传递

### 2.4 保留 wave，但优化 wave 内并发质量

当前并发上限和 wave 顺序已经是正式合同的一部分，所以优化点应是：

- 波次内尽量并行
- 避免波次间重复取证
- 让后续 wave 直接复用前一波的结构化结果

---

## 3. 推荐执行流程

### Step 0: 激活项目

如果 Serena MCP 可用，先激活项目并建立符号索引。

如果不可用或激活超时，按 30 秒作为软阈值降级到现有的文件读取方式，但仍然保持同样的流程边界。

推荐采用渐进降级顺序：

1. `activate_project`
2. `list_dir` / `find_file`
3. `find_symbol` / `get_symbols_overview`
4. `find_referencing_symbols`
5. 仅在前述步骤不足时回退到正文读取

### Step 1: 收集最小证据包

先读以下角色：

- Manifest
- README
- Entry
- Config
- Lockfile

只收结构化摘要，不把原始正文扩散给每个 subagent。

### Step 2: 产出第一批结构化上下文

把以下信息写进共享证据：

- 项目主类型
- 入口与启动路径
- 关键配置
- 依赖入口
- wave 相关的最小事实切片

推荐最小共享文件：

- `evidence-pack/shared/summary.json`
- `evidence-pack/shared/context.json`

### Step 3: 按现有合同派发 wave / subagent

仍然保持当前编排，不改正式边界。

可以优化的只是：

- 每个 subagent 读取更少的额外主题文档与正文证据
- 每个 subagent 直接消费共享证据
- 优先使用符号索引命中的入口和引用关系

### Step 4: 写入 runtime 与 docs

仍然遵循：

- runtime 先落 `.spec-first/runtime/first/*`
- docs 再落 `docs/first/*`
- docs 不回灌为真源

---

## 4. 具体改动建议

### 4.1 `SKILL.md`

补一段 `Fast Path`，强调：

- 先激活项目
- 先拿符号索引
- 先读最小必读层
- 再进入 wave 执行

同时把一些“重复解释性文字”收敛掉，避免主线程提示词过长。

### 4.2 `execution-flow.md`

新增或前移一个明确步骤：

1. 激活项目
2. 建立符号索引
3. 收集最小证据包
4. 再按 wave 派发 subagent

### 4.3 `evidence-pack-spec.md`

保留当前目录结构，继续强化：

- 最小必读层
- 结构化摘要优先
- wave 共享证据 slice

不建议改成单文件，不建议移除 Lockfile 角色。

建议新增 `shared/summary.json` 的最小 schema：

```json
{
  "project_type": "node-cli",
  "subtypes": ["typescript"],
  "root_manifest": ["package.json"],
  "root_readme": ["README.md"],
  "entry_points": ["src/cli/index.ts"],
  "key_configs": ["tsconfig.json"],
  "lockfiles": ["pnpm-lock.yaml"],
  "symbol_hints": {
    "main_symbols": ["handleFirst"],
    "key_files": ["src/cli/commands/first.ts"]
  },
  "wave_inputs": {
    "wave_1": ["project_type", "entry_points", "key_configs"],
    "wave_2": ["symbol_hints", "key_files"],
    "wave_3": ["key_files"]
  }
}
```

主线程负责生成这份摘要；subagent 只消费，不反向修改。

### 4.4 主题 reference

在保留 7 个全局 reference 的前提下，再按需加载主题参考，不要把额外的主题文档塞进所有执行单元。

---

## 5. 验证方式

### 5.1 功能验证

检查是否满足：

- 仍然遵守现有 wave/subagent 合同
- `evidence-pack` 结构未被破坏
- runtime / docs 输出不变

### 5.2 性能验证

以同一仓库、同一入口、同一变更集测量：

- 首次激活时间
- 最小证据包收集时间
- subagent 平均启动成本
- 总执行时间
- `[待确认]` 的数量变化

测量协议必须固定：

- 区分冷启动与热启动
- 冷启动包含 Serena 首次项目激活与索引建立
- 热启动复用已存在的 Serena 项目状态
- 固定样本仓库、分支、变更集与入口命令
- token 口径统一为主线程 + 全部 subagent 的总消耗
- 每组至少执行 3 次，记录中位数

### 5.3 预期范围

以当前仓库已观测基线约 `30 分钟 / 159k tokens` 为参照，首轮优化的暂定目标是：

- Serena 可用时：`18-25 分钟`，`125k-145k tokens`
- Serena 不可用但仍按兼容流程执行时：`25-35 分钟`，`145k-155k tokens`
- `[待确认]` 数量：减少 `30-50%`

以上均为首轮验证前的预期区间，不作为最终验收承诺。

这些收益主要应来自：

- Serena 缩小代码取证范围
- 共享摘要减少正文重复传递
- wave 之间减少重复补证据

### 5.4 质量验证

检查是否出现：

- 错误删除正式合同文档
- 把 docs 当真源
- 把 Serena 失败后续流程写断
- 让某个 wave 失去依赖输入
- `shared/summary.json` 与实际最小证据不一致

### 5.5 试点顺序

不要一开始就改完整个 `first`。

建议按以下顺序试点：

1. 仅在 `collect evidence pack` 阶段引入 Serena 快路径
2. 先让 Wave 1 消费 `shared/summary.json`
3. 验证收益后，再扩展到 Wave 2 / Wave 3
4. 最后再收紧 `SKILL.md` 和主题 reference 的提示词

---

## 6. 实施时间表

建议按 4 个阶段推进，总周期约 `6-10 天`：

1. `1-2 天`：基准测量 + Serena 激活验证
2. `1-2 天`：`SKILL.md` 与 `execution-flow.md` 的 fast path 改造
3. `1-2 天`：`evidence-pack` 共享摘要与降重
4. `1-2 天`：Wave 1 试点、回归验证、参数收敛、文档定稿

---

## 7. 不做的事

- 不删除 wave
- 不删除 subagent
- 不扁平化 evidence-pack
- 不删除 `main-thread-contract.md`
- 不删除 `subagent-architecture.md`
- 不把 `Agent` 作为新的正式执行模型
- 不把性能目标写成不可验证的硬承诺

---

## 8. 结论

这份方案的正确打开方式是：

- Serena/LSP 作为前置加速器
- 现有正式合同继续保留
- evidence pack 继续结构化
- reference 继续按职责收敛

如果要真正落地，下一步应该改的是 `SKILL.md`、`execution-flow.md` 和 `evidence-pack-spec.md`，而不是重写整套执行模型。
