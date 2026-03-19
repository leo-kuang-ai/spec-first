# V2-12 上线路线图与 Go-Live

> **对齐需求**: aux-06-roadmap
> **版本**: v2.1 | **日期**: 2026-02-10 | **原则**: KISS

---

## 1. 目标

把"技术方案正确"转换为"可控上线"，先试点后全量，每阶段有明确准入准出。

### 1.1 边界

| 维度 | 覆盖 | 不覆盖 |
|------|------|--------|
| 上线节奏 | 三阶段（A/B/C）分批交付与准出标准 | 各模块内部实现细节（见 v2-03 ~ v2-11） |
| Go-Live Gate | 公司级推广准入门槛（GL-01 ~ GL-04） | Feature 级阶段 Gate（见 v2-06） |
| 风险与回退 | 上线期间风险矩阵与三级降级策略 | 运行期 SLA 监控（由 APM 平台承载） |

### 1.2 数据结构

Go-Live Gate 评估结果记录在 `specs/_global/golive-history.jsonl`：

```json
{"timestamp":"2026-03-01T10:00:00Z","gate":"GL-01","result":"PASS","evidence":"gate check 三态语义验证通过"}
{"timestamp":"2026-03-01T10:05:00Z","gate":"GL-02","result":"FAIL","evidence":"typecheck 存在 3 处错误","degradation":"降级为 strict 确认策略"}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| timestamp | ISO 8601 | 评估时间 |
| gate | string | Gate ID（GL-01 ~ GL-04） |
| result | enum | PASS / FAIL |
| evidence | string | 评估依据 |
| degradation | string? | FAIL 时的降级策略（可选） |

---

## 2. 分阶段实施

### 2.1 阶段 A — 核心链路可用（P0）

| 交付项 | 说明 | 验收标准 |
|--------|------|---------|
| Runtime Router | Skill 路由 + CLI 路由分发 | `/spec-first:*` 入口可用 |
| M1 ProcessEngine | 阶段状态机 + init/stage 命令 | 8+2 阶段流转无跳跃 |
| M2 TraceEngine | ID 注册/校验 + 矩阵管理 + 覆盖率 | C1-C9 九项覆盖率计算正确 |
| M4 ChangeMgr | RFC 状态机（4 态） + 缺陷管理 | 4 态流转合法性校验通过 |
| 核心 Skill 链路 | plan → code → code-review → verify | 主链 E2E 可走通 |
| Handlebars 模板 | 7 个模板文件就位（详见 v2-10 §5.1） | init 生成完整骨架 |

**阶段 A 准出**：`npm run typecheck` 归零 + 核心模块单元测试覆盖率 ≥ 60% + 核心链路手动走通。

**阶段 A Gate 降级策略**：M3 GateEngine 在阶段 A 尚未就绪，Gate 校验采用显式降级而非默认跳过：

1. `stage advance` 默认仍尝试 Gate 校验；GateEngine 不可用时返回 `GATE_UNAVAILABLE` 状态并阻断
2. 需在 `config.yaml` 中显式设置 `gate.pilot_mode: true` 启用软门禁（允许 GateEngine 不可用时通过）
3. 软门禁通过时，强制写入 findings.md 审计记录：`[PILOT] Gate skipped — GateEngine unavailable, pilot_mode=true`
4. 阶段 B 交付 M3 后，移除 `pilot_mode` 配置，恢复正常 Gate 校验

### 2.2 阶段 B — 质量闭环补齐（P1）

| 交付项 | 说明 | 验收标准 |
|--------|------|---------|
| M3 GateEngine | Gate 自动条件解析 + 豁免校验 | `gate check` 三态语义正确 |
| M5 AIOrchestrator | Context Pack 构建 + Catchup 恢复 | 复杂 Feature 可恢复上下文 |
| M6 MetricsEngine | 度量报告 + 健康分（调用 M2 覆盖率） | 12 项指标 + 健康分输出 |
| M7 ToolIntegration | Git Hook 安装 + CI 模板生成 | prepare-commit-msg + commit-msg + pre-push Hook 可用，CI Pipeline 阻断规则生效 |
| CLI feature 命令组 | feature list/switch/current | 多 Feature 切换正常 |
| 16 Skill 联调验收 | 统一 `/spec-first:xxxx` 入口 | 全部 Skill 可调用 |

**阶段 B 准出**：GL-01 ~ GL-04 全部通过（见第 3 节）。

### 2.3 阶段 C — 扩展与优化（P2）

| 交付项 | 说明 | 验收标准 |
|--------|------|---------|
| Layer 2 端规范扩展 | 更多平台 YAML + 合并验证 | 多端合并无冲突 |
| 性能 SLA 达标 | validateId < 10ms, getCoverage < 50ms, evaluateGate < 200ms | benchmark 通过 |
| E2E 集成测试 | 核心流程自动化验证 | CI 绿灯 |
| CI/CD 平台适配 | Azure DevOps / GitLab CI 模板 | 至少 1 个平台可用 |
| IDE 插件 | ID 自动补全 | 模糊搜索可用 |

---

## 3. Go-Live Gates（公司级上线准入门槛）

> 以下门槛用于判断"是否允许全公司范围推广"，未全部通过前仅允许试点范围使用。

| Gate ID | 准入条件 | 验收标准 | 未达标降级策略 |
|---------|---------|---------|--------------|
| GL-01 | M3 GateEngine 就绪 | Gate 自动条件解析链路完成，`gate check` 三态语义正确 | 限制为人工 Gate Owner 放行，禁止自动推进 |
| GL-02 | M5 AIOrchestrator 稳定 | `ai context/catchup/stats` 签名与核心模块一致，`npm run typecheck` 归零 | 降级为 `strict` 确认策略，禁止 `auto` |
| GL-03 | Context Pack 引用机制可用 | Control + References 协议可用，复杂 Feature 可恢复 | L 规模 Feature 限制试点，不纳入全面推广 |
| GL-04 | 端到端质量门禁闭环 | `plan → code → code-review → verify` E2E 通过且可审计 | 仅允许分团队灰度，不允许全量启用 |

**执行规则**：

1. GL-01 ~ GL-04 全部通过 → 进入"公司级默认流程"
2. 任一 Gate 未通过 → 自动降级到"试点模式 + 人工审查兜底"
3. 已通过的 Gate 回退失败 → 触发降级，直到重新通过

---

## 4. 风险矩阵与回退策略

### 4.1 风险矩阵

| # | 风险 | 概率 | 影响 | 等级 | 缓解措施 |
|---|------|------|------|------|----------|
| R1 | 流程过重导致团队抵触 | 高 | 高 | 🔴 | Mode×Size 裁剪：S 模式降低产出物深度，仅保留核心 Gate |
| R2 | AI 生成内容质量不可控 | 中 | 高 | 🟡 | SCA 三检查点 + 人在回路强制确认 + Gate 阻断 |
| R3 | 规范与实现渐行渐远 | 中 | 高 | 🟡 | 追踪矩阵实时校验 + PR Gate 自动检查 + 覆盖率阈值 |
| R4 | 上下文丢失致 AI 重复劳动 | 中 | 中 | 🟡 | Context Pack + Session Catchup + 运行态三文件 |
| R5 | 工具链学习成本过高 | 中 | 中 | 🟡 | Skill 封装复杂度 + CLI 统一入口 + doctor 自检 |

### 4.2 回退策略（三级降级）

| 级别 | 触发条件 | 回退动作 |
|------|---------|---------|
| L1 轻度 | 单个 Skill 执行异常 | 关闭 `auto` confirm_policy，强制 `strict` |
| L2 中度 | Gate 误判或 SCA 误报 | 关闭自动推进，仅允许手动 `stage advance --force` |
| L3 重度 | 核心链路不可用 | 回退到上个稳定版本模板，人工 Gate Owner 兜底 |

### 4.3 风险应对原则

1. **渐进式推行** — 先在 1-2 个试点 Feature 验证，再逐步推广
2. **裁剪优先** — 默认使用最轻量配置（S + N），按需升级
3. **工具兜底** — 所有人工判断环节都有 CLI 自动化兜底
4. **快速反馈** — Gate 校验失败时给出明确修复建议，而非仅报错

---

## 5. 版本演进映射

| 维度 | v2 | v5 | v6 | v7.1（当前） |
|------|-----|-----|-----|-------------|
| 定位 | 需求规范模板 | CLI 工具链规范 | CLI + Skill 协同基线 | Skill 驱动 + CLI 底层 |
| 架构 | 无 | CLI 单层 | CLI + Skill 双层 | 双层 + M1-M7 模块 |
| 阶段 | 6 阶段 | 8+2 阶段 | 8+2（继承） | 8+2（补终态） |
| 追踪 | 手动矩阵 | 自动矩阵 + 9 覆盖率 | 继承 | 继承 + 健康分 |
| Gate | 无 | 8 Gate + SCA | 继承 | 继承 + Hook 双层 |
| AI 协作 | 无 | Context Pack + Catchup | 3 协同 Skill | 16 Skill 统一入口 |
| 度量 | 无 | 9 覆盖率 | 继承 | 12 指标 + 瓶颈分析 |

---

## 6. 最小实现清单

| # | 实现项 | 阶段 | 依赖 |
|---|--------|------|------|
| 1 | `golive-history.jsonl` 读写工具函数 | A | M1 ProcessEngine |
| 2 | `spec-first golive check` 命令（评估 GL-01 ~ GL-04） | B | M3 GateEngine |
| 3 | GL 评估结果写入 `golive-history.jsonl` | B | #1 |
| 4 | GL 未通过时自动降级策略执行（修改 confirm_policy / 禁止 auto advance） | B | #2 |
| 5 | 三级回退策略触发逻辑（L1/L2/L3） | B | M1 + M3 |

---

## 7. 验收清单

| # | 验收项 | 验收标准 | 对应模块 |
|---|--------|---------|---------|
| 1 | 命令入口一致 | 所有用户操作通过 `/spec-first:*` 入口 | Runtime Router |
| 2 | 阶段状态机无跳跃 | 仅允许合法转换表中的状态流转 | M1 ProcessEngine |
| 3 | ID 唯一性 | 同类型同缩写下无重复 ID | M2 TraceEngine |
| 4 | Gate 三态语义一致 | PASS / PASS_WITH_WAIVER / FAIL 行为正确 | M3 GateEngine |
| 5 | RFC 状态机合法 | 4 态流转无非法跳转 | M4 ChangeMgr |
| 6 | Context Pack 可恢复 | Catchup 后 current_phase + current_task 一致 | M5 AIOrchestrator |
| 7 | 指标口径一致 | 覆盖率分母排除 Deferred/Cancelled/Exception | M6 MetricsEngine |
| 8 | Hook 阻断有效 | prepare-commit-msg 自动预填 + commit-msg 格式不合规时拒绝提交 + pre-push/CI 不一致阻断 | M7 ToolIntegration |
| 9 | Mode I 回归闭环 | 回归报告 + 豁免记录可审计 | 横切 |
| 10 | 模板渲染正确 | init 生成的骨架文件结构完整 | 模板系统 |
