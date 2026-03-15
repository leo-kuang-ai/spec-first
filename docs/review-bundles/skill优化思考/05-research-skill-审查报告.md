# 05-research skill 审查报告

更新时间：2026-03-15  
审查对象：[`skills/spec-first/05-research`](/Users/kuang/xiaobu/spec-first/skills/spec-first/05-research)  
审查方式：全目录逐文件审查，并对照当前阶段映射、artifact 规则、工具可用性与现有测试

## 审查范围

本次覆盖以下文档：

- [SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/05-research/SKILL.md)
- [research-checklist.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/05-research/references/research-checklist.md)
- [evidence-types.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/05-research/references/evidence-types.md)
- [tech-comparison-template.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/05-research/references/tech-comparison-template.md)

同时对照以下实现与治理文件：

- [README.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/README.md)
- [AGENTS.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/AGENTS.md)
- [artifact-checker.test.ts](/Users/kuang/xiaobu/spec-first/tests/unit/artifact-checker.test.ts)
- [skill-catalog.test.ts](/Users/kuang/xiaobu/spec-first/tests/unit/skill-catalog.test.ts)

## 文档关系图

```text
                  +---------------------------+
                  | 05-research / SKILL.md    |
                  | 主流程 / 证据协议 / 输出  |
                  +-------------+-------------+
                                |
          +---------------------+----------------------+
          |                     |                      |
          v                     v                      v
 +------------------+ +--------------------+ +-------------------------+
 | research-checklist| | evidence-types     | | tech-comparison-template|
 | 输出前自检        | | NEEDS VERIFICATION | | 方案对比矩阵模板       |
 +---------+--------+ +----------+---------+ +------------+------------+
           |                     |                         |
           v                     v                         v
 +------------------+ +--------------------+ +-------------------------+
 | research.md      | | 假设标记规范       | | 成本/风险/成熟度对比   |
 +------------------+ +--------------------+ +-------------------------+

                  +---------------------------+
                  | README / AGENTS / tests   |
                  | 阶段映射 / artifact 规则  |
                  +---------------------------+
```

## 总体结论

`05-research` 的核心思路是成立的：强调证据驱动、候选方案对比、`findings.md` 留痕、未验证假设标记，这些都符合 SDD 体系下的最佳实践。

但当前这份 skill 明显存在两类漂移：

1. **阶段定位漂移**
   - 主文档写“任意阶段（不限阶段）”
   - 但仓库其他规范将它定位为 `02_design` 的按需 skill，`research.md` 也是 design 阶段 artifact

2. **工具与治理漂移**
   - 主文档仍声明了当前环境里并不存在的工具名
   - 也缺少专门的文档一致性测试

结论收敛为：

- 这份 skill 的“方法论”是对的
- 但它的“阶段边界”和“工具白名单”已经落后于当前实现与治理规则

## 高优先级问题

### 1. 阶段口径与当前全流程映射冲突

问题：

- [SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/05-research/SKILL.md) 当前写的是：
  - `阶段：任意阶段（不限阶段，但通常在 spec/design 前执行）`
- 但以下文件都把它视为 `02_design` 的按需 skill：
  - [README.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/README.md)
  - [AGENTS.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/AGENTS.md)
- [`artifact-checker.test.ts`](/Users/kuang/xiaobu/spec-first/tests/unit/artifact-checker.test.ts) 也说明 `research.md` 是 design 阶段 artifact

影响：

- agent 可能在错误阶段调用 research
- `research.md` 的生成时机与 artifact 规则不一致
- “任意阶段”会削弱流程阶段边界

最佳优化：

- 把主文档阶段口径改成：
  - `02_design 按需执行`
  - 若在其他阶段调用，必须说明是补充性 research，而不是默认路径

### 2. allowed-tools 中存在当前环境不支持的工具名

问题：

- [SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/05-research/SKILL.md) 当前仍声明：
  - `WebSearch`
  - `mcp__web_reader__webReader`
- 但当前仓库/会话可见的真实工具体系并不是这套名字

影响：

- skill 会误导 agent 以为这些工具一定可用
- 实际执行时会出现“文档允许，但环境没有” 的断层

最佳优化：

- 将 allowed-tools 与实际宿主能力对齐
- 如果需要保留多宿主兼容写法，应明确：
  - `示例工具名`
  - `当前宿主实际工具名`

## 中优先级问题

### 3. 主文档偏重，Operation Types 应下沉到 reference

问题：

- [SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/05-research/SKILL.md) 里保留了：
  - `Operation Types`
  - 操作分工示例
- 这类内容更像协作约定，不是 research 主流程的核心部分

影响：

- 主文档信息密度下降
- 和 `06-task` 之前的问题类似，主文档承担了过多补充说明

最佳优化：

- 把 `Operation Types` 下沉到新的 `references/coordination-conventions.md`
- 主文档只保留流程、证据协议、输出物、成功标准

### 4. Evidence Protocol 与 evidence-types.md 存在重复

问题：

- 主文档中已经定义了：
  - 证据强度
  - 来源可信度
  - 反证据原则
- [evidence-types.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/05-research/references/evidence-types.md) 又定义了：
  - `PERF / COMPAT / COST / SEC / SCALE`
  - 证据强度等级
  - 来源可信度
  - 反证据原则

影响：

- 同一规则分散在两处
- 后续一旦修改，容易再次双真理源

最佳优化：

- 主文档只保留“必须标记 `[NEEDS VERIFICATION][TYPE]`”和证据协议摘要
- 强度等级、来源可信度、反证据原则下沉到 [evidence-types.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/05-research/references/evidence-types.md)

### 5. CLI 依赖过弱，和输出要求不完全匹配

现状：

- 主文档只列了 `spec-first ai context`
- 但 research skill 实际上高度依赖：
  - 本地文档读取
  - 外部资料抓取
  - findings 留痕

影响：

- CLI 依赖说明不能真实反映执行所需能力
- 对 agent 的帮助较弱

最佳优化：

- 把 CLI 依赖改成“必要能力”说明，而不是只列一个命令
- 例如：
  - Feature 上下文定位
  - specs 文档读取
  - 外部资料检索
  - findings 落盘

## 低优先级问题

### 6. references 命名和用途说明可再清晰

现状：

- 模板引用路径里：
  - `调研输出 | research-checklist.md | 检查清单`
  - 命名有些混

最佳优化：

- 统一改成：
  - `检查清单`
  - `证据类型`
  - `对比模板`

### 7. 缺少专门的 research skill 文档一致性测试

现状：

- 当前没有像 `06-task`、`07-code` 那样的专门 `research-skill-docs.test.ts`

影响：

- 阶段口径、工具名、关键锚点漂移后，没有专门测试兜底

最佳优化：

- 增加最小文档一致性测试，至少断言：
  - 主文档包含 `findings.md`
  - 主文档阶段口径与 README/AGENTS 一致
  - `[NEEDS VERIFICATION]` 约定存在

## 逐文件结论

### [SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/05-research/SKILL.md)

状态：`需要收敛`

优点：

- 证据驱动意识强
- 2-Action Rule、findings 留痕、假设标记都符合最佳实践
- 候选方案对比和推荐结论结构清楚

问题：

- 阶段口径不准
- 工具白名单漂移
- 主文档承载了过多补充性章节

### [research-checklist.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/05-research/references/research-checklist.md)

状态：`可用`

结论：

- 结构合理，可继续保留
- 后续只需按阶段口径和增强项分类微调

### [evidence-types.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/05-research/references/evidence-types.md)

状态：`可用，但与主文档重复`

结论：

- 本身质量不错
- 应升级为证据规则的主真理源

### [tech-comparison-template.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/05-research/references/tech-comparison-template.md)

状态：`可用`

结论：

- 模板结构清楚
- 适合作为主文档的对比矩阵引用源

## 推荐整改顺序

### 批次 1

- 修正 [SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/05-research/SKILL.md) 的阶段口径
- 修正 allowed-tools 到当前真实工具名

### 批次 2

- 把 `Operation Types` 下沉到新的 reference
- 精简主文档中的 Evidence Protocol，只保留摘要

### 批次 3

- 为 `05-research` 补一份最小文档一致性测试

## 验证

本次只读复审时，实际跑了：

```bash
pnpm vitest run tests/unit/skill-catalog.test.ts tests/unit/artifact-checker.test.ts
```

结果：

- [artifact-checker.test.ts](/Users/kuang/xiaobu/spec-first/tests/unit/artifact-checker.test.ts) 通过
- `skill-catalog.test.ts` 失败，但失败点是与本次审查无关的 [07-code/SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/07-code/SKILL.md) 缺少显式命令声明，不是 `05-research` 问题

## 最终结论

`05-research` 当前最需要做的不是重写方法论，而是把“阶段边界”和“工具边界”收紧到当前仓库真实状态。  
只要先修这两点，它就能进入和 `06-task`、`07-code` 同一层级的可执行 quality bar。  
