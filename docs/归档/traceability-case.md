# Traceability Case：用户认证（Auth）

> 目的：演示 `FR/NFR -> Design -> API/Data -> Task -> Test -> PR` 的全链路追踪。

## 1) 需求定义（Spec）

| ID | 需求描述 |
|----|----------|
| `FR-AUTH-001` | 用户可使用账号密码登录并获得访问令牌与刷新令牌 |
| `FR-AUTH-002` | 连续 5 次密码错误后账号锁定 15 分钟 |
| `NFR-SEC-001` | 登录接口具备暴力破解防护与审计日志 |
| `NFR-PERF-001` | 登录接口在 500 RPS 下 `P95 < 200ms` |

## 2) 设计映射（Design/API/Data）

| ID | Design Ref | API/Data Ref |
|----|------------|--------------|
| `FR-AUTH-001` | `plan.md#认证流程` | `API-AUTH-001` |
| `FR-AUTH-002` | `plan.md#登录失败策略` | `data-model.md#login_attempt` |
| `NFR-SEC-001` | `ADR-014` | `API-AUTH-001` |
| `NFR-PERF-001` | `plan.md#性能预算` | `API-AUTH-001` |

API 约定：
- `API-AUTH-001`：`POST /auth/login`
- `API-AUTH-002`：`POST /auth/refresh`

## 3) 任务拆解（Tasks）

| TASK ID | 描述 | 关联需求 |
|---------|------|----------|
| `TASK-AUTH-0001` | 实现密码校验与令牌签发 | `FR-AUTH-001` |
| `TASK-AUTH-0002` | 实现失败计数与锁定机制 | `FR-AUTH-002` |
| `TASK-AUTH-0003` | 增加限流与审计日志 | `NFR-SEC-001` |
| `TASK-AUTH-0004` | 性能压测与查询优化 | `NFR-PERF-001` |

## 4) 测试映射（Test Cases）

| TC ID | 级别 | 覆盖需求 |
|-------|------|----------|
| `TC-UT-AUTH-0001` | `UT` | `FR-AUTH-001` |
| `TC-IT-AUTH-0002` | `IT` | `FR-AUTH-002` |
| `TC-E2E-AUTH-0003` | `E2E` | `FR-AUTH-001, FR-AUTH-002` |
| `TC-IT-AUTH-0004` | `IT` | `NFR-SEC-001` |
| `TC-IT-AUTH-0005` | `IT` | `NFR-PERF-001` |

## 5) 追踪矩阵（完整示例）

| requirement_id | design_ref | api_or_data_ref | task_ids | test_case_ids | pr_links | status |
|----------------|------------|-----------------|----------|---------------|----------|--------|
| `FR-AUTH-001` | `plan.md#认证流程` | `API-AUTH-001` | `TASK-AUTH-0001` | `TC-UT-AUTH-0001, TC-E2E-AUTH-0003` | `PR-128` | `accepted` |
| `FR-AUTH-002` | `plan.md#登录失败策略` | `data-model.md#login_attempt` | `TASK-AUTH-0002` | `TC-IT-AUTH-0002, TC-E2E-AUTH-0003` | `PR-131` | `accepted` |
| `NFR-SEC-001` | `ADR-014` | `API-AUTH-001` | `TASK-AUTH-0003` | `TC-IT-AUTH-0004` | `PR-134` | `verified` |
| `NFR-PERF-001` | `plan.md#性能预算` | `API-AUTH-001` | `TASK-AUTH-0004` | `TC-IT-AUTH-0005` | `PR-136` | `verified` |

## 6) PR 模板片段（强制字段）

```markdown
## Traceability
Req IDs: FR-AUTH-001, NFR-SEC-001
Task IDs: TASK-AUTH-0001, TASK-AUTH-0003
Test IDs: TC-UT-AUTH-0001, TC-IT-AUTH-0004
```

## 7) 覆盖率计算（本 Case）

- FR 总数：2；满足 `Task + TC + 合并 PR` 的 FR：2；FR 覆盖率 = `2 / 2 = 100%`
- NFR 总数：2；具备验证证据（安全测试/压测报告）的 NFR：2；NFR 覆盖率 = `2 / 2 = 100%`
- 孤儿项（无需求关联的 Task/TC/PR）：0；孤儿项率 = `0%`
