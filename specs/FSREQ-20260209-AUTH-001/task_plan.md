---
featureId: FSREQ-20260209-AUTH-001
featAbbr: AUTH
title: 登录流程优化开发任务计划（含邮箱登录扩展 RFC-002）
stage: 03_plan
mode: I
size: M
platforms: [h5, java-backend]
updatedAt: 2026-02-10
---

# 开发任务文档（Task Plan）

## 1. 交付目标

1. 完成短信验证码登录端到端可用。
2. 保证原密码登录无回归。
3. 满足安全、性能与可观测性要求。
4. 完成邮箱验证码登录端到端可用（RFC-002）。

## 2. 阶段计划

### Phase 1: 需求与方案基线确认
- **Status:** complete
- [x] 对齐 FR/NFR 与 AC
- [x] 完成 API 与数据模型设计
- [x] 完成风险识别与灰度策略

### Phase 2: 核心功能实现
- **Status:** in_progress
- [x] TASK-AUTH-001 H5 登录页新增短信登录入口
- [x] TASK-AUTH-002 后端发送验证码接口
- [ ] TASK-AUTH-003 后端验证码登录接口
- [ ] TASK-AUTH-004 OTP 会话状态机与防重放

### Phase 3: 风控与观测
- **Status:** pending
- [ ] TASK-AUTH-005 手机号/IP 频控策略
- [ ] TASK-AUTH-006 埋点、日志与告警接入

### Phase 4: 验证与发布准备
- **Status:** pending
- [ ] TASK-AUTH-007 测试用例与自动化验证
- [ ] TASK-AUTH-008 安全扫描与回归测试
- [ ] TASK-AUTH-009 UAT 与发布检查清单

### Phase 5: 邮箱登录扩展（RFC-002）
- **Status:** pending
- [ ] TASK-AUTH-010 H5 邮箱登录入口与表单
- [ ] TASK-AUTH-011 otp_sessions 表结构扩展（channel + email）
- [ ] TASK-AUTH-012 发送邮箱验证码 API
- [ ] TASK-AUTH-013 邮箱验证码登录 API
- [ ] TASK-AUTH-014 邮箱维度频控策略
- [ ] TASK-AUTH-015 邮箱登录测试用例与自动化

## 3. 任务明细

| TASK ID | 标题 | Owner | 预计工期 | traces | depends_on | 验收标准 | 状态 |
|---|---|---|---|---|---|---|---|
| TASK-AUTH-001 | H5 短信登录入口与倒计时 | FE | 1d | FR-AUTH-002 | - | UI 可切换，倒计时准确 | complete |
| TASK-AUTH-002 | 发送验证码 API | BE | 1d | FR-AUTH-002,NFR-SEC-001,NFR-PERF-001 | TASK-AUTH-001 | 正常发送 + 频控错误码 | complete |
| TASK-AUTH-003 | 验证码登录 API | BE | 1d | FR-AUTH-002,NFR-SEC-001,NFR-REL-001 | TASK-AUTH-002 | 正确登录、错误码完整 | in_progress |
| TASK-AUTH-004 | OTP 状态机与防重放 | BE | 1d | NFR-SEC-001 | TASK-AUTH-003 | 一次性消费、重放拦截 | pending |
| TASK-AUTH-005 | 手机号/IP 双维频控 | BE | 0.5d | NFR-SEC-001 | TASK-AUTH-002 | 超限拦截、日志可查 | pending |
| TASK-AUTH-006 | 埋点日志与监控告警 | FE/BE | 0.5d | NFR-OBS-001 | TASK-AUTH-003 | 指标可观测、告警生效 | pending |
| TASK-AUTH-007 | 测试用例与自动化 | QA | 1d | FR-AUTH-001,FR-AUTH-002,NFR-SEC-001 | TASK-AUTH-003,TASK-AUTH-004 | 主逆向用例覆盖 | pending |
| TASK-AUTH-008 | 安全扫描与回归 | QA/SEC | 0.5d | NFR-SEC-001,NFR-REL-001 | TASK-AUTH-007 | 无高危，密码登录回归通过 | pending |
| TASK-AUTH-009 | UAT 与发布检查 | PM/QA | 0.5d | FR-AUTH-002,NFR-REL-001 | TASK-AUTH-008 | UAT 签核完成 | pending |
| TASK-AUTH-010 | H5 邮箱登录入口与表单 | FE | 0.5d | FR-AUTH-003 | TASK-AUTH-001 | UI 可切换至邮箱登录，表单校验正确 | pending |
| TASK-AUTH-011 | otp_sessions 表结构扩展 | BE | 0.5d | FR-AUTH-003,DS-AUTH-005 | TASK-AUTH-004 | DDL 执行成功，现有 SMS 查询不受影响 | pending |
| TASK-AUTH-012 | 发送邮箱验证码 API | BE | 1d | FR-AUTH-003,NFR-SEC-001,NFR-PERF-001 | TASK-AUTH-011 | 正常发送 + 频控错误码 | pending |
| TASK-AUTH-013 | 邮箱验证码登录 API | BE | 1d | FR-AUTH-003,NFR-SEC-001,NFR-REL-001 | TASK-AUTH-012 | 正确登录、错误码完整 | pending |
| TASK-AUTH-014 | 邮箱维度频控策略 | BE | 0.5d | NFR-SEC-001 | TASK-AUTH-012 | 超限拦截、日志可查 | pending |
| TASK-AUTH-015 | 邮箱登录测试用例与自动化 | QA | 1d | FR-AUTH-003,NFR-SEC-001 | TASK-AUTH-013 | 主逆向用例覆盖 | pending |

## 4. Definition of Done（DoD）

每个 TASK 完成必须满足：

1. 代码、文档、测试均有更新记录。
2. `traces` 完整，能映射到 FR/NFR。
3. `progress.md` 与 `task_plan.md` 同步更新。
4. 通过对应阶段的 quick/full 校验。

## 5. 风险与阻塞项

1. 短信通道不稳定可能阻塞联调。
处理：准备 mock 通道与降级开关。

2. 频控参数不合理可能误伤用户。
处理：先灰度参数，监控后调优。

3. 旧登录代码耦合度高。
处理：封装认证服务层，减少侵入改动。

## 6. 执行节拍（轻量）

1. Phase 完成时必须同步更新 `task_plan.md` 与 `progress.md`。
2. 关键决策/风险才写入 `findings.md`。
3. 会话中断后先执行 `catchup + status` 再继续。

## 7. 建议执行命令

```bash
/spec-first:task FSREQ-20260209-AUTH-001
/spec-first:code FSREQ-20260209-AUTH-001 --task TASK-AUTH-003
/spec-first:code-review FSREQ-20260209-AUTH-001 --task TASK-AUTH-003
/spec-first:verify FSREQ-20260209-AUTH-001 quick
```
