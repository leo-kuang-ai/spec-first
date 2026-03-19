# Spec-First Skill Audit Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 对 `skills/spec-first` 全量 skill 执行一次企业级、面向生产的质量审计，输出可用于门禁决策的发现与整改结论。

**Architecture:** 审计按“项目级规范 → 共享契约 → 单 skill 深审 → 多 skill 链路审查 → 测试与门禁验证”推进。每一批先收集证据，再形成 findings，最后执行必要的文档/测试修正并回归验证，避免边审边改导致结论漂移。

**Tech Stack:** Markdown skills, TypeScript/Vitest, Spec-First CLI, repository governance docs

---

### Task 1: 建立审计基线

**Files:**
- Read: `skills/spec-first/README.md`
- Read: `skills/spec-first/AGENTS.md`
- Read: `skills/spec-first/SHARED.md`
- Read: `skills/spec-first/shared/background-quality-contract.md`
- Read: `skills/spec-first/shared/orchestration-governance-contract.md`
- Read: `/Users/kuang/xiaobu/hs_h_report/参考资料/prompt相关/gpt版本.md`
- Write: `specs/<featureId>/findings.md` 或当前审查记录载体

**Step 1: 读取项目级规范**

Run:
```bash
sed -n '1,260p' skills/spec-first/README.md
sed -n '1,260p' skills/spec-first/AGENTS.md
sed -n '1,260p' skills/spec-first/SHARED.md
sed -n '1,220p' skills/spec-first/shared/background-quality-contract.md
sed -n '1,220p' skills/spec-first/shared/orchestration-governance-contract.md
```

**Step 2: 提炼审计基准**

检查：
- 阶段流、命令流、统一契约、shared contract
- 评分与问题分级方法
- 文档与实现冲突时的优先级

**Step 3: 写入基线 findings**

记录：
- 审计边界
- 优先级规则
- 本轮阻断项判断标准

### Task 2: 批次审查高风险编排链

**Files:**
- Read: `skills/spec-first/01-init/SKILL.md`
- Read: `skills/spec-first/11-plan/SKILL.md`
- Read: `skills/spec-first/12-verify/SKILL.md`
- Read: `skills/spec-first/13-orchestrate/SKILL.md`
- Read: `skills/spec-first/14-status/SKILL.md`
- Read: `skills/spec-first/15-doctor/SKILL.md`
- Read: `skills/spec-first/16-sync/SKILL.md`
- Read: `skills/spec-first/17-feature/SKILL.md`
- Read: 对应 `references/*.md`
- Read: 对应 `tests/unit/*skill-docs*.test.ts`

**Step 1: 审查编排入口与控制面**

重点：
- feature/current 指针副作用
- plan/orchestrate 边界
- verify 与 stage advance 证据链
- status 汇总语义
- sync 真源与 doctor 诊断边界

**Step 2: 审查 references 是否支撑真实链路**

重点：
- 失败标准
- 恢复策略
- 降级策略
- 多宿主/多会话/自动定位隐式依赖

**Step 3: 审查测试覆盖是否足以证明契约**

重点：
- docs test 是否只测关键词
- 是否缺 dedicated 测试
- shared coverage 是否覆盖关键 consumer

**Step 4: 写入 findings 并分级**

每个 skill 至少写：
- 阻断/高风险/一般/优化
- 证据路径
- 影响链路

### Task 3: 批次审查核心产物型 skill

**Files:**
- Read: `skills/spec-first/00-first/**`
- Read: `skills/spec-first/03-spec/**`
- Read: `skills/spec-first/04-design/**`
- Read: `skills/spec-first/05-research/**`
- Read: `skills/spec-first/06-task/**`
- Read: `skills/spec-first/07-code/**`
- Read: `skills/spec-first/08-review/**`
- Read: `skills/spec-first/10-archive/**`
- Read: `skills/spec-first/20-spec-review/**`
- Read: `skills/spec-first/21-analyze/**`
- Read: 对应 `src/**` 真实实现与测试

**Step 1: 对照设计与实现**

检查：
- 目标、边界、成功标准、失败标准
- 输入输出契约
- 是否存在无设计实现
- 是否存在文档已改、实现未跟

**Step 2: 对照门禁与覆盖率**

检查：
- Gate 条件是否与项目规范一致
- 覆盖率指标口径是否一致
- analyze/spec-review/archive 是否形成闭环

**Step 3: 对照多 skill 协同**

检查：
- spec → design → task → code → review → verify → archive
- 失败回退路径
- findings / matrix / gate history 是否可持续消费

### Task 4: 批次审查会话与辅助型 skill

**Files:**
- Read: `skills/spec-first/00-onboarding/**`
- Read: `skills/spec-first/02-catchup/**`
- Read: `skills/spec-first/05-research/**`
- Read: `skills/spec-first/21-analyze/**`
- Read: 对应 tests

**Step 1: 审查恢复/交接/辅助输入契约**

重点：
- catchup 的恢复报告是否足够支撑会话恢复
- onboarding 是否给出错误路由
- analyze 是否只是报告生成，还是能稳定支撑 gate

**Step 2: 审查薄文档和历史提案**

重点：
- 文档过薄是否不足以进入生产链路
- 历史提案是否仍在误导当前行为

### Task 5: 修正文档与测试

**Files:**
- Modify: 审查发现涉及的 `skills/spec-first/**.md`
- Modify: 对应 `tests/unit/*skill-docs*.test.ts`
- Create: 必要的缺失 docs tests

**Step 1: 先修测试能证明的契约**

原则：
- 先 RED：补测试暴露缺口
- 再 GREEN：修文档/契约
- 最后 REFACTOR：合并重复规则

**Step 2: 每次只修一类风险**

顺序：
- 共享契约误导
- 指标/状态漂移
- 控制面副作用未声明
- 真源冲突
- 占位符与元数据治理

### Task 6: 验证与审计报告

**Files:**
- Read/Test: `tests/unit/*skill-docs*.test.ts`
- Read/Test: `tests/unit/shared-contract-coverage.test.ts`
- Read/Test: `tests/unit/*governance*.test.ts`
- Write: `docs/04-审查报告/` 下审计报告或当前输出结论

**Step 1: 运行定向文档与治理回归**

Run:
```bash
pnpm -s vitest run tests/unit/*skill-docs*.test.ts tests/unit/shared-contract-coverage.test.ts tests/unit/*governance*.test.ts
```

**Step 2: 必要时运行全量回归**

Run:
```bash
pnpm -s vitest run
```

**Step 3: 形成最终审计结论**

输出必须包含：
- 全量 skill 审查状态
- 分级问题清单
- 是否建议通过门禁
- 后续整改批次建议
