# 2026-03-06 Skill 治理与质量审查报告

## 1. 审查范围

- 全链路流程：`00-first -> 01-init -> 03-spec -> 04-design/05-research -> 06-task -> 07-code -> 08-code-review -> 09-test/12-verify -> 10-archive`
- skill runtime：`dispatcher.ts`、`hard-gate.ts`
- skill 资产：`skills/spec-first/*/SKILL.md` 与关键 `references/*.md`

## 2. 总体结论

本轮审查后，`spec-first` 的主流程已经满足“文档约束 = 运行时约束 = 自动化校验”这三个层面的基本一致性：

1. 所有 stage-bound 核心 skill 现在都受 runtime hard-gate 保护。
2. 关键 skill 资产已经补齐命令声明、引用路径、版本元数据和缺失参考文档。
3. 新增 catalog 级自动化校验，后续 skill 漂移会被测试直接打断。

## 3. 已修复问题

### P0. Stage-bound skills 运行时治理不完整

问题：
- `spec`
- `spec-review`
- `research`
- `task`
- `test`

文档写明了阶段要求，但 runtime 未真正阻断。

修复：
- 在 [hard-gate.ts](/Users/kuang/xiaobu/spec-first/src/core/skill-runtime/hard-gate.ts) 中补齐 stage 映射。

结果：
- 上述 skill 在错误阶段会被 `BLOCKED`，不会再出现“文档严格、运行时放行”。

### P0. Skill 资产可发现性与可审计性缺口

修复项：
- [00-onboarding/SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-onboarding/SKILL.md)：补充命令声明
- [11-plan/SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/11-plan/SKILL.md)：补充命令声明
- [06-task/SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/06-task/SKILL.md)：修复 `metadata.version` 漂移
- [10-archive/SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/10-archive/SKILL.md)：把不可审计的 `references/*.md` 示例改成显式文件
- [20-spec-review/SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/20-spec-review/SKILL.md)：修复审查清单来源为真实相对路径

### P1. `00-first` 文档编排资产缺失

问题：
- 缺 `subagent-architecture.md`
- 缺 `testing-strategy.md`
- 主 `SKILL.md` 少证据抽检、第三波依赖、Phase 3 模式策略与测试策略引用

修复：
- 新增 [subagent-architecture.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/subagent-architecture.md)
- 新增 [testing-strategy.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/references/testing-strategy.md)
- 更新 [00-first/SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-first/SKILL.md)

## 4. 逐个 Skill 审查结论

| Skill | 结论 | 审查重点 |
|------|------|----------|
| `00-first` | PASS | 补齐并行架构/测试策略参考文档，主文档与测试契约重新一致 |
| `00-onboarding` | PASS | 补充命令声明，保留 utility 定位 |
| `01-init` | PASS | 前置条件与初始化职责清晰 |
| `02-catchup` | PASS | 会话恢复与运行态补齐职责清晰 |
| `03-spec` | PASS | 已纳入 `01_specify` runtime hard-gate |
| `04-design` | PASS | 阶段约束与产物前置条件一致 |
| `05-research` | PASS | 已纳入 `02_design` runtime hard-gate |
| `06-task` | PASS | 已纳入 `03_plan` runtime hard-gate，版本元数据已对齐 |
| `07-code` | PASS | TDD / findings / worktree 约束齐全 |
| `08-code-review` | PASS | 层级参数与阶段约束一致 |
| `09-test` | PASS | 已纳入 `05_verify` runtime hard-gate |
| `10-archive` | PASS | 引用示例显式化，可审计 |
| `11-plan` | PASS | 命令声明补齐，计划职责边界清晰 |
| `12-verify` | PASS | 阶段验收与证据铁律一致 |
| `13-orchestrate` | PASS | 编排主入口，依赖 runtime context |
| `14-status` | PASS | 状态总览职责清晰 |
| `15-doctor` | PASS | 宿主/环境诊断职责清晰 |
| `16-sync` | PASS | trace 与状态同步职责清晰 |
| `17-feature-list` | PASS | feature 枚举职责清晰 |
| `18-feature-switch` | PASS | feature 切换职责清晰 |
| `19-feature-current` | PASS | 当前 feature 只读查询职责清晰 |
| `20-spec-review` | PASS | 引用路径修复，已纳入 `01_specify` runtime hard-gate |
| `21-analyze` | PASS | 跨产物分析职责清晰，保持读分析定位 |

## 5. 自动化验证

执行命令：

```bash
npx vitest run tests/unit/hard-gate.test.ts tests/unit/skill-runtime.test.ts tests/unit/skill-catalog.test.ts tests/unit/archive-skill-docs.test.ts tests/unit/code-skill-docs.test.ts tests/unit/phase1-enhancement-docs.test.ts tests/unit/first-skill-docs.test.ts tests/unit/skill-commands.test.ts
```

结果：
- `8` 个测试文件通过
- `95` 个测试通过
- 仍有 1 条非阻断 warning：`skill-runtime.test.ts` 中本地 git 历史不足时，高风险 diff 检测降级告警仍会打印，但不影响判定

## 6. 剩余建议

本轮已达到“流程合理 + skill 逐个审查 + 质量守卫补齐”的完成标准。下一批若继续提升，建议做两件事：

1. 做平台 capability check，避免 Layer 2 平台声明与真实仓库能力脱节。
2. 为 `plan/status/analyze` 增加更细的 catalog 级语义测试，继续压缩文档漂移空间。
