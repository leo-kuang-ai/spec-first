全部 STOP 点已过：3.3b 无同前提冗余（三条安全发现各有独立修正项），3.9 压制了 2 条与 actionable finding 重复的 residual/deferred 项。合成完成，输出最终报告。

---

## 评审公告

- **Roster（standard）**：`coherence-reviewer`、`feasibility-reviewer`（always-on）+ `security-lens-reviewer`（条件命中：文档涉及 auth/token/credential/哈希存储）。`adversarial` 具备触发信号（认证属高风险域）但超出 standard 预算被跳过。
- **Dispatch 边界**：本次调用未显式授权 subagent/persona 分派 → `dispatch_authorization_missing`，三位评审按选定 persona 资产**串行 inline** 执行；跨模型同行评审为零（同样需要显式授权）。

```yaml
worker_context_isolation: unknown
worker_model_override: unsupported
worker_bounded_parallelism: unknown
worker_dispatch_outcome: dispatch_authorization_missing
```

```text
cost-shape: profile=standard N=3 personas=[coherence,feasibility,security-lens] skipped_conditional=[adversarial:budget] doc_bytes=404 slices=full isolation=degraded_inherited
```

---

Document review complete.

delivery_mode: headless
mutation_policy: report-only
mutation_reason: default-review-report-only
review_status: complete
task_pack_outcome: not-applicable
fixes_applied: 0
producer_fix_candidates: 0
proposed_fixes_count: 1
decisions_count: 4
fyi_count: 2
p0_p1_actionable_count: 4

Proposed fixes (concrete fix, requires user confirmation):

[P1] Section: Implementation Units / U1 登录接口加固 — 凭据哈希未指明算法与盐值 (security-lens, confidence 75)
  Why: 实现者若选用快速无盐哈希，数据库泄露后攻击者可离线批量破解全部凭据。文档只写了"哈希存储"，没有锁定这一决定，两名实现者会做出强度不同的选择。
  Suggested fix: 在 Approach 中写明口令哈希算法（argon2id 或 bcrypt）与每凭据独立盐值。

Decisions (requires user judgment):

[P1] Section: Implementation Units / U1 登录接口加固 — 刷新令牌生命周期未定义：吊销、轮换、失效路径全缺 (security-lens, confidence 75；合并 feasibility 的错误路径发现)
  Why: 刷新令牌一旦泄露，攻击者可连续换取新令牌长达 7 天，期间没有任何吊销或登出手段能终止访问。刷新失败时返回什么、是否终止会话，实现者只能自行猜测并各自实现。
  Suggested fix: 补充刷新令牌生命周期：无效或重放的刷新令牌返回 401 并吊销会话；每次刷新轮换旧令牌；增加登出/吊销路径与对应测试场景。

[P1] Section: Implementation Units / U1 登录接口加固 — 存量凭据迁移与既有客户端兼容未处理 (feasibility, confidence 75)
  Why: 上线当天，存量旧格式凭据不会自动变成哈希，既有客户端拿到的登录响应结构也会改变。不做迁移设计，首次登录会失败，或旧客户端全量报错。
  Suggested fix: 写明迁移策略（如下次登录时透明重哈希，或强制重置口令），并说明旧响应结构的兼容或版本化方式。

[P1] Section: Implementation Units / U1 登录接口加固 — 计划指向的代码库在工作区不存在 (feasibility, confidence 75)
  Why: 实现者从当前工作区无法开工：这里没有任何源码，计划要修改的登录模块文件也不存在。评审同样无法核对既有技术栈与既有实现。
  Suggested fix: 确认目标仓库并在计划中补充代码库上下文，或将计划放回正确的代码环境重新评审。

[P2] Section: Implementation Units / U1 登录接口加固 — 令牌机制本身未选定 (feasibility, confidence 75)
  Why: 令牌格式、签名密钥的管理与轮换、刷新令牌采用服务端存储还是无状态校验，全部留给实现者决定。这些是本方案的核心架构决策，不同选择会得到行为完全不同的系统。
  Suggested fix: 在 Approach 中写明令牌格式与签名校验方式、密钥存储/轮换策略，以及刷新令牌的存储与校验模型。

FYI observations (anchor 50, no decision required):

[P3] Section: 文件名/标题 — 文件名为 monthly-summary，内容是 Auth Hardening 计划 (coherence, confidence 50)
  Why: 按文件名查找"月度总结计划"的人会打开一份登录加固计划；下游按文件名引用产物时会指向错误对象。建议由产物所有者确认命名或归位。

[P3] Section: Implementation Units / U1 登录接口加固 — 登录/刷新端点未提速率限制说明 (security-lens, confidence 50)
  Why: 本计划目标是加固认证，但暴力尝试口令与刷新端点滥用未列入任何措施。补充限流或锁定说明可让加固闭环。

Residual concerns:
- 上游产物不可得：frontmatter 声明的 `origin: auth-hardening` 与 `product_contract_source: spec-brainstorm` 在磁盘上均不存在，15min/7d 期限与哈希存储决定无法对照产品契约核验；若上游另有定论，本计划可能与源头不一致而不被发现。(intake)

Restated: 2 (residual/deferred items suppressed as duplicates of actionable findings)

Coverage:
- coherence: 1 finding（1 FYI，0 actionable）
- feasibility: 4 findings（3 actionable 保留；1 条与 security-lens 的刷新令牌条目合并计数）
- security-lens: 3 findings（2 actionable + 1 FYI）

Limitations:
- 未获 subagent/persona 分派授权（dispatch_authorization_missing）：三个评审视角以串行 inline 方式在同一编排上下文执行，属生产者自查，不构成独立 persona 覆盖或上下文隔离（isolation=degraded_inherited）。
- 未启动跨模型同行评审（该路径需要显式分派授权，本轮为零）。
- 工作区内无代码库且上游产物不可解析，feasibility 与 security 检查仅基于文档文本。
- report-only：本次未修改文档；所有修复归产物所有者（如 spec-plan 重新产出）决定。

Review complete
