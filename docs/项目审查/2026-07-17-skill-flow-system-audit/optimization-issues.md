---
title: Skill 关联关系需要优化的问题清单
doc_role: audit-issue-list
review_date: 2026-07-17
status: review-evidence
origin_report: docs/项目审查/2026-07-17-skill-flow-system-audit/review-report.md
---

# Skill 关联关系需要优化的问题清单

共 27 个需要优化的问题：P0 0、P1 11、P2 13、P3 3。

本清单从同批次审查报告提取，只用于后续 plan/work 消费，不表示问题已经获得修复授权或完成闭环。

## P1：优先修复

1. **SF-01 Internal helper 运行时不可达**
   - 7 个 internal helper 仅 `spec-worktree` 被五宿主投射。
   - 优化方向：逐个决定投射、内联替代或退役。

2. **SF-02 Knowledge promotion 缺失必需字段**
   - `spec-compound` 未强制 `source_refs` 和 `invalidation_condition`。
   - 优化方向：恢复 schema、模板和负向测试。

3. **SF-03 Runtime Setup 错标活跃配置项**
   - `plan_output`、`brainstorm_output` 已被消费，却仍标为 reserved。
   - 优化方向：统一 Skill、配置模板和测试。

4. **SF-04 Task pack 缺少正确的审查 consumer**
   - `spec-write-tasks` 把高风险 task pack 交给 `spec-doc-review`，但后者不识别 task-pack 类型。
   - 优化方向：增加 intake、专属 lens 和 source-plan fidelity 检查。

5. **SF-05 Code review mutation authority 冲突**
   - 主 Skill、action rubric、schema、subagent template 对是否应用修复说法不一致。
   - 优化方向：统一 report-only、review-and-fix、`mode:agent` 三类合同。

6. **SF-06 Maintainability reviewer 被共享模板抵消**
   - 模板会压掉 maintainability persona 应发现的结构性问题。
   - 优化方向：区分主观风格意见与真实结构回归。

7. **SF-07 Dogfood/Polish 权限边界混用**
   - workflow invocation、切分支、修复和 commit 被混为一体。
   - 优化方向：分别建立 mutation、branch、commit、landing 授权。

8. **SF-08 Brainstorm 使用不存在的 `lfg` 名称**
   - 实际 governed target 是 `spec-lfg`。
   - 优化方向：修正规范名称并增加 target-resolution 测试。

9. **SF-09 LFG 与 browser helper 缺少 N/A 握手**
   - LFG 接受 browser verification N/A，但 helper 只返回 PASS/FAIL/PARTIAL。
   - 优化方向：增加 `not-applicable + reason`。

10. **SF-10 Current docs 保留旧 artifact/consumer 关系**
    - 仍存在旧 brainstorm 路径、旧 run-artifact integration 状态和旧字段。
    - 优化方向：统一当前合同、用户手册和窄一致性测试。

11. **SF-27 Dispatch authorization 未被各 Skill 继承**
    - 18 个会派发 generic worker 的 package 中，仅 6 个完整遵守授权和降级合同，12 个存在缺口。
    - 优化方向：统一显式授权、缺授权 fallback、能力缺失 fallback 和 reason code。

## P2：第二批优化

12. **SF-11 HTML renderer 的 doc-review 能力说明过期。**

13. **SF-12 Universal Proof 分支没有先生成必需的本地 Markdown。**

14. **SF-13 Ideate 与 Brainstorm 对后续 Plan 链路的描述冲突。**

15. **SF-14 App audit 声明 code-review 集成，但对端没有 caller/intake。**

16. **SF-15 Optimize 声称 `spec-work` 是 consumer，却没有真实 handoff。**

17. **SF-16 Compound session-historian 的写文件与返回合同冲突。**

18. **SF-17 Worktree helper 声称 Work/Code Review 会调用，但实际只有 Dogfood 接线。**

19. **SF-18 LFG 与 Work 各自维护不一致的 tracker-defer 合同。**

20. **SF-19 Figma mutating worker 缺少 changed paths、verification 和禁止 commit 的返回约束。**

21. **SF-20 Repo-profile cache 对 NO-CACHE 的 fallback 说法不一致。**

22. **SF-21 Maintainability persona 与 synthesis 的 confidence gate 不一致。**

23. **SF-22 Sweep/Riffrec 分别复制同一 analyzer，但没有 canonical owner 或 parity test。**

24. **SF-23 `spec-test-xcode` 与 `spec-resolve-pr-feedback` 缺少真实 public caller，形成孤儿 helper。**

## P3：文案和低风险合同修正

25. **SF-24 Deployment prompt 的 activation 范围比 orchestrator gate 更宽。**

26. **SF-25 Validator 将 `why_it_matters` 说成必填，但 orchestrator 允许缺失。**

27. **SF-26 LFG 声称 Simplify 会跑完整测试，实际只运行受影响范围测试。**

## 建议工作包

1. 修复 caller-target/runtime reachability。
2. 统一 dispatch、mutation、branch、commit、landing authority。
3. 校准 knowledge、config、task-pack 和 artifact producer-consumer 合同。

