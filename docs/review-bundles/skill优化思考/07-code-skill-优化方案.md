# 07-code skill 优化方案 v1

更新时间：2026-03-15  
审查对象：[`skills/spec-first/07-code`](/Users/kuang/xiaobu/spec-first/skills/spec-first/07-code)  
审查方式：以 skill 全目录逐文件审查为主，并对照当前实现真理源与现有测试

## 审查范围

本次覆盖以下 9 个文件：

- [SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/07-code/SKILL.md)
- [code-standards.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/07-code/references/code-standards.md)
- [context-pack-schema.yaml](/Users/kuang/xiaobu/spec-first/skills/spec-first/07-code/references/context-pack-schema.yaml)
- [diff-template.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/07-code/references/diff-template.md)
- [report-template.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/07-code/references/report-template.md)
- [target-env-verification.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/07-code/references/target-env-verification.md)
- [tdd-guard.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/07-code/references/tdd-guard.md)
- [test-template.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/07-code/references/test-template.md)
- [traces-trailer.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/07-code/references/traces-trailer.md)

同时对照以下实现侧文件：

- [parser.ts](/Users/kuang/xiaobu/spec-first/src/core/task-plan/parser.ts)
- [types.ts](/Users/kuang/xiaobu/spec-first/src/core/batch-executor/types.ts)
- [context-packer.ts](/Users/kuang/xiaobu/spec-first/src/core/batch-executor/context-packer.ts)
- [guards.ts](/Users/kuang/xiaobu/spec-first/src/core/batch-executor/guards.ts)
- [checkpoint.ts](/Users/kuang/xiaobu/spec-first/src/core/batch-executor/checkpoint.ts)
- [report-generator.ts](/Users/kuang/xiaobu/spec-first/src/core/batch-executor/report-generator.ts)
- [concurrent-executor.ts](/Users/kuang/xiaobu/spec-first/src/core/batch-executor/concurrent-executor.ts)
- [config-schema.ts](/Users/kuang/xiaobu/spec-first/src/shared/config-schema.ts)
- [code-skill-docs.test.ts](/Users/kuang/xiaobu/spec-first/tests/unit/code-skill-docs.test.ts)

## 文档关系图

```text
                         +----------------------+
                         | 07-code / SKILL.md   |
                         | 主流程 / 守卫 / 边界 |
                         +----------+-----------+
                                    |
           +------------------------+------------------------+
           |                        |                        |
           v                        v                        v
 +----------------------+ +----------------------+ +----------------------+
 | context-pack-schema  | | tdd-guard            | | report-template      |
 | subagent 输入约束    | | TDD 预检与阻断       | | 批量报告格式         |
 +----------+-----------+ +----------+-----------+ +----------+-----------+
            |                        |                        |
            v                        v                        v
 +----------------------+ +----------------------+ +----------------------+
 | context-packer.ts    | | guards.ts            | | report-generator.ts  |
 | 当前上下文打包真理源 | | 当前 TDD/冲突真理源  | | 当前报告真理源       |
 +----------------------+ +----------------------+ +----------------------+

           +------------------------+------------------------+
           |                        |                        |
           v                        v                        v
 +----------------------+ +----------------------+ +----------------------+
 | test-template        | | traces-trailer       | | target-env-verif     |
 | 测试最小模板         | | 尾注单一格式         | | 验证动作清单         |
 +----------+-----------+ +----------+-----------+ +----------+-----------+
            |                        |                        |
            v                        v                        v
 +----------------------+ +----------------------+ +----------------------+
 | 仓库 Vitest 风格     | | 代码追溯检索         | | pnpm test/typecheck  |
 +----------------------+ +----------------------+ +----------------------+

           +------------------------+------------------------+
           |                                                 |
           v                                                 v
 +----------------------+                     +----------------------+
 | code-standards       |                     | diff-template        |
 | 代码风格参考         |                     | 单 TASK 变更预览     |
 +----------+-----------+                     +----------+-----------+
            |                                              |
            v                                              v
 +----------------------+                     +----------------------+
 | 当前仓库代码风格     |                     | review / 用户确认    |
 | 但仍含较多通用模板   |                     | 但仍含过时命令模板   |
 +----------------------+                     +----------------------+
```

## 总体结论

`07-code` 当前已经不是“明显失真”的 skill 了。主文档、TDD 守卫、上下文包、验证清单、测试模板、traces 规范，已经基本和当前实现保持一致，能够指导 agent 做单 TASK 或分层半自动执行。

但它仍然没有达到“完整最佳实践”状态，主要剩两类问题：

1. `code-standards.md` 和 `diff-template.md` 仍保留大量通用教程/模板内容，和当前仓库真实命令、真实实现边界不完全一致。
2. 主文档虽然已明确“当前以人工/半自动执行为主”，但实现侧 [`concurrent-executor.ts`](/Users/kuang/xiaobu/spec-first/src/core/batch-executor/concurrent-executor.ts) 仍是占位执行，因此 skill 仍属于“高质量执行手册”，不是真正的“自动批量运行手册”。

结论收敛为：

- `SKILL.md`：可用，且已接近当前最佳状态
- `references`：大部分已对齐
- 剩余最值得优化的文件：`diff-template.md`、`code-standards.md`

## 逐文件审查结论

### 1. [SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/07-code/SKILL.md)

状态：`已基本对齐`

合理性：

- 已明确区分“当前模式”和“目标模式”
- 已绑定真实配置入口 `runtime.auto_orchestrate.max_parallel`
- 已补齐 `Simplicity First`、`Surgical Changes`、`最小实现`
- 已明确共享文件写入边界和批量 checkpoint 真理源

仍需注意：

- 文档中有“如宿主已接线真实 subagent，则可并发派发”的描述，这是合理保留，但必须继续强调“默认不要假设当前仓库已接线”

优化建议：

- 保持现状，不建议继续扩写章节
- 后续若 batch executor 真正接线，再把“当前模式”升级为“自动模式”，不要提前写

### 2. [context-pack-schema.yaml](/Users/kuang/xiaobu/spec-first/skills/spec-first/07-code/references/context-pack-schema.yaml)

状态：`已对齐`

合理性：

- 字段名已与 [`context-packer.ts`](/Users/kuang/xiaobu/spec-first/src/core/batch-executor/context-packer.ts) 对齐
- 已明确 2KB 限制
- 已写明超限裁剪顺序

优化建议：

- 保持现状
- 如果未来 `ContextPack` 类型扩展，再同步改这里，不要先写预期字段

### 3. [tdd-guard.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/07-code/references/tdd-guard.md)

状态：`已对齐`

合理性：

- 已明确当前真理源是 [`guards.ts`](/Users/kuang/xiaobu/spec-first/src/core/batch-executor/guards.ts)
- 已说明当前只检查 `[TDD-RED] TASK-ID` / `[TDD-WAIVER] TASK-ID`
- 已把阻断阈值写成缺失率 `> 50%`

优化建议：

- 保持现状
- 若未来把预检升级为结构化解析，再更新证据格式要求

### 4. [target-env-verification.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/07-code/references/target-env-verification.md)

状态：`已基本对齐`

合理性：

- 已收敛到当前仓库真实命令：
  - `pnpm test -- --run`
  - `pnpm typecheck`
- 已明确“运行态验证只在必要时补充”

优化建议：

- 后续可补一行“优先定向验证，再决定是否跑全量”，降低单 TASK 交付成本
- 但当前版本已经可用

### 5. [report-template.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/07-code/references/report-template.md)

状态：`已基本对齐`

合理性：

- 结构已经和 [`report-generator.ts`](/Users/kuang/xiaobu/spec-first/src/core/batch-executor/report-generator.ts) 保持一致
- 已区分 `failure` / `blocked`
- 已保留 halt section

小缺口：

- 当前实现里 `TaskResult` 没有显式 `blocked` 类型字段，运行时仍用 `success: boolean` 和 message 表达
- 模板比当前实现略理想化，但没有造成误导

优化建议：

- 可以在模板里补一句“当前 blocked 可能仍通过 message 表达，而非独立字段”

### 6. [test-template.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/07-code/references/test-template.md)

状态：`已对齐`

合理性：

- 已对齐 Vitest
- 去掉了 Jest 专属内容
- 保留了最小有效模板，不再像教学手册

优化建议：

- 保持现状

### 7. [traces-trailer.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/07-code/references/traces-trailer.md)

状态：`已对齐`

合理性：

- 已统一成四行格式
- 可检索、稳定、适合多 agent 输出收敛

优化建议：

- 保持现状

### 8. [code-standards.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/07-code/references/code-standards.md)

状态：`部分对齐，仍明显偏重`

主要问题：

- 内容仍然过长，保留了大量通用 TypeScript 教程型内容
- 含有和当前仓库无直接绑定的示例：
  - Express
  - 通用 API controller
  - Redis/OTP 类业务示例
- 文档前半段像“代码规范大全”，后半段才开始出现当前 skill 真正需要的约束

为什么这是问题：

- 对 agent 来说，过长的通用规范会冲淡真正重要的硬规则
- skill reference 最重要的是“当前仓库必须遵守什么”，不是“通用 TS 应该怎么写”

最佳优化方案：

- 将它收缩成“仓库强约束版 code standards”
- 只保留以下内容：
  - 命名规则
  - import 组织
  - 注释与 traces trailer
  - 最小实现 / 不预埋扩展点
  - `findings.md` 记录范围外问题
  - `entryPoints` / `likelyChangeAreas` / `changeHazards`
- 删除大段通用教程式样例：
  - 通用错误类体系
  - 大量 TypeScript 基础范例
  - 与当前项目无关的业务示例

结论：

- 这是当前最值得继续精简的 reference 之一

### 9. [diff-template.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/07-code/references/diff-template.md)

状态：`仍有明显过时内容`

主要问题：

- 仍然使用过时命令：
  - `npm run lint`
  - `npm run typecheck`
  - `npm test`
  - `npm run test:coverage`
  - `npm run build`
- 后半段还有通用配置校验命令：
  - `npm run config:verify`
- 模板整体过长，且很多场景并不是 `07-code` 的默认交付方式

为什么这是问题：

- 当前仓库标准命令是 `pnpm`
- 主文档已经收敛成“最小执行手册”，这个模板却仍像“泛化 PR 模板库”
- agent 容易直接抄旧命令，导致验证命令漂移

最佳优化方案：

- 将 `diff-template.md` 拆成两层：
  - 默认简版：单 TASK 常规变更预览
  - 附录扩展版：删除/迁移/重构/配置变更特殊模板
- 全部命令改成当前仓库真实命令
- 删除与当前仓库不稳定绑定的内容：
  - 覆盖率强制命令
  - 构建命令
  - 通用 `config:verify`

建议直接保留的核心块：

- 变更概要
- 文件清单
- 范围确认
- 风险说明
- 拟执行验证命令
- 下一步

结论：

- 这是当前最需要继续整改的文件

## 当前实现对齐度判断

### 已对齐的真理源

- task plan 稳定字段来自 [`parser.ts`](/Users/kuang/xiaobu/spec-first/src/core/task-plan/parser.ts)
- 上下文包字段来自 [`context-packer.ts`](/Users/kuang/xiaobu/spec-first/src/core/batch-executor/context-packer.ts)
- TDD 预检来自 [`guards.ts`](/Users/kuang/xiaobu/spec-first/src/core/batch-executor/guards.ts)
- checkpoint 来自 [`checkpoint.ts`](/Users/kuang/xiaobu/spec-first/src/core/batch-executor/checkpoint.ts)
- 报告格式来自 [`report-generator.ts`](/Users/kuang/xiaobu/spec-first/src/core/batch-executor/report-generator.ts)
- 并发配置来自 [`config-schema.ts`](/Users/kuang/xiaobu/spec-first/src/shared/config-schema.ts)

### 尚未达到目标态的实现

- [`concurrent-executor.ts`](/Users/kuang/xiaobu/spec-first/src/core/batch-executor/concurrent-executor.ts) 仍是占位执行：
  - `packContext(...)`
  - `setTimeout(100)`
  - 返回 success

这意味着：

- `07-code` 目前是“可指导执行的 skill”
- 不是“已自动化接线完成的 runtime”

## 优先级排序

### P0

- 精简 [diff-template.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/07-code/references/diff-template.md)，全部切到当前仓库真实命令和最小模板

### P1

- 精简 [code-standards.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/07-code/references/code-standards.md)，删除通用教程型内容，只保留仓库强约束

### P2

- 在 [report-template.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/07-code/references/report-template.md) 里补一行说明当前 `blocked` 的表达方式

### P3

- 等 batch executor 真正接线后，再升级 [SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/07-code/SKILL.md) 的“当前模式”章节

## 最终结论

`07-code` 现在已经从“目标态蓝图”收敛成“当前可执行手册”，这一轮最大的目标已经完成。当前不需要再重写主文档，应该停止继续给 `SKILL.md` 加章节。

后续真正该做的是：

1. 精简 `diff-template.md`
2. 精简 `code-standards.md`
3. 等 runtime 真正接线后，再回头升级主 skill

## 验证

已对照当前实现和现有文档一致性测试：

- [code-skill-docs.test.ts](/Users/kuang/xiaobu/spec-first/tests/unit/code-skill-docs.test.ts)

本次复审时实际验证：

```bash
pnpm vitest run tests/unit/code-skill-docs.test.ts
```

结果：8 个测试通过。
