# Shared Contract Coverage Minimal Design

**Date:** 2026-03-09
**Scope:** 为 `spec-first` 已落地的 shared contracts 增加统一 coverage 清单与数据驱动测试，降低后续 skill 文档和 contract 漂移风险。

## Problem

当前 `spec-first` 已形成两类共享约定：

- `skills/spec-first/shared/background-quality-contract.md`
- `skills/spec-first/shared/orchestration-governance-contract.md`

但测试覆盖仍主要是“手工散落式”：

- 一部分断言在 `background-quality-contract.test.ts`
- 一部分断言在各自的 `*-skill-docs.test.ts`
- 新增 consumer 时，需要手工决定改哪几个测试文件
- 是否“某 skill 应引用哪个 contract”，目前没有统一清单真源

这会导致两个问题：

1. **覆盖范围不可见**：很难一眼看出哪些 skill 已纳入共享 contract，哪些没有
2. **新增节点易漏测**：后续新增/调整 consumer 时，可能改了文档却没补 contract coverage

## Goal

建立一个**最小可维护**的 shared contract coverage 机制：

- 有一个统一的 coverage 清单
- 有一份数据驱动测试遍历清单做基础校验
- 不替代现有细粒度 skill-docs 测试
- 不引入复杂 DSL 或模板系统

## Non-Goals

本轮不做：

- 不删除现有 `*-skill-docs.test.ts`
- 不把所有文档测试重写成数据驱动
- 不把 runtime 行为测试也并入 coverage 清单
- 不做自动扫描推断“谁应该接入 contract”
- 不把 contract 清单做成 YAML/JSON 配置系统

## Options

### Option A — 继续维持手工测试分散维护

做法：继续像现在一样，新增 consumer 时手工修改多个测试文件。

**优点**
- 零额外抽象
- 上手简单

**缺点**
- 覆盖边界不透明
- 仍高度依赖维护者记忆
- 随着 contract 增多，重复断言会越来越散

### Option B — 直接把所有 skill-docs 测试重写成数据驱动

做法：用单个 registry 接管所有文档测试。

**优点**
- 表面统一

**缺点**
- 一次性改动过大
- 容易把细粒度语义断言和基础覆盖断言混在一起
- 迁移成本高，风险不必要

### Option C — 新增“coverage 清单 + 基础数据驱动测试”，保留现有细粒度测试（推荐）

做法：

- 增加一个小型 TS registry，声明：
  - 哪些 contract 存在
  - 哪些 skill / reference file 应引用哪些 contract
  - 每个 consumer 至少应包含哪些关键 token
- 增加一份通用测试遍历 registry
- 现有的 `background-quality-contract.test.ts`、`orchestration-governance-contract.test.ts` 和各 `*-skill-docs.test.ts` 继续保留

**优点**
- 最小补丁
- 边界清晰
- 不影响现有测试价值
- 后续新增 consumer 时，只需补一条 registry + 必要的细粒度测试

**缺点**
- 会在短期内同时存在“registry 测试”和“局部测试”两层

## Decision

采用 **Option C**。

## Design

### 1. Coverage 清单文件

建议新增：`tests/unit/shared-contract-coverage.data.ts`

职责：

- 作为共享 contract 覆盖面的单一测试清单
- 只描述“基础覆盖”事实，不承载复杂业务语义

建议结构：

```ts
export interface SharedContractCoverageItem {
  contractName: 'background-quality' | 'orchestration-governance';
  contractPath: string;
  targetPath: string;
  mustContain: string[];
}

export const SHARED_CONTRACT_COVERAGE: SharedContractCoverageItem[] = [
  {
    contractName: 'background-quality',
    contractPath: 'skills/spec-first/shared/background-quality-contract.md',
    targetPath: 'skills/spec-first/11-plan/SKILL.md',
    mustContain: [
      'shared/background-quality-contract.md',
      'backgroundInputStatus',
      'background_input_status',
    ],
  },
];
```

### 2. 数据驱动测试文件

建议新增：`tests/unit/shared-contract-coverage.test.ts`

职责：

- 遍历 registry
- 校验 contract 文件存在
- 校验目标文件存在
- 校验目标文件包含所声明的 contract 引用和最小 token

### 3. 覆盖边界

registry 只负责**基础覆盖断言**：

- contract 是否存在
- consumer 是否引用了正确 contract
- consumer 是否包含最小命名边界 token

不负责：

- 复杂模板内容
- 风险分级语义细节
- 完整报告格式
- runtime 计算行为

这些仍由现有专项测试负责。

### 4. 合同分层

registry 应按 contract 分层维护，至少覆盖两类：

#### Background Quality

覆盖对象：

- `01-init`
- `03-spec`
- `04-design`
- `06-task`
- `07-code`
- `08-review`
- `11-plan`
- `12-verify`
- `14-status`
- `15-doctor`
- `21-analyze`
- `02-catchup`

其中：

- `11-plan` 仍属于 background contract consumer
- `02-catchup` 属于 display-only consumer

#### Orchestration Governance

覆盖对象：

- `11-plan`
- `13-orchestrate`

### 5. 与现有测试的关系

保留现有测试分层：

- `background-quality-contract.test.ts`：验证 contract 语义与关键 consumer 语义
- `orchestration-governance-contract.test.ts`：验证治理 contract 语义
- `*-skill-docs.test.ts`：验证某 skill 的特有边界与模板要求
- `shared-contract-coverage.test.ts`：验证整体 coverage 面没有遗漏或错误引用

也就是说，新的 coverage 测试是“总账”，不是“替代品”。

## Migration Strategy

### Phase 1

先引入：

- `shared-contract-coverage.data.ts`
- `shared-contract-coverage.test.ts`

并先覆盖：

- 已完成的 background contract consumer
- 已完成的 orchestration governance consumer

### Phase 2

如果实践稳定，再逐步把 `background-quality-contract.test.ts` 中“纯覆盖型断言”迁移到 registry，保留 contract 语义断言与代表性消费者断言。

### Phase 3

如后续 shared contract 数量继续增加，再考虑是否需要把 registry 拆成：

- `background-quality-coverage.data.ts`
- `orchestration-governance-coverage.data.ts`

本轮先不做。

## Testing Strategy

推荐验证顺序：

1. `tests/unit/shared-contract-coverage.test.ts`
2. `tests/unit/background-quality-contract.test.ts`
3. `tests/unit/orchestration-governance-contract.test.ts`
4. 相关 `*-skill-docs.test.ts`
5. `pnpm test`

## Expected Outcome

完成后会得到一套更稳的维护方式：

- contract 自身有语义测试
- skill 各自有边界测试
- 覆盖范围有统一总账测试

这样以后再新增 shared contract consumer 时，不需要靠记忆去猜“还要改哪几个测试文件”，只需要：

1. 补 registry
2. 补必要的 skill 专项断言
3. 跑统一 coverage test
