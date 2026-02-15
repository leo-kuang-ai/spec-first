# Spec-First v7.1 — CLI 命令体系

> **模块**: 辅助功能模块 #2 | **拆分自**: spec-first-v7.md L1188-1354
> **版本**: v7.1 | **更新**: 2026-02-09

---

## 设计理念

CLI 是 Spec-First 双层架构中的 **能力层**，以 TypeScript ESM 模块实现，提供相同输入必定产生相同输出的确定性操作。CLI 负责 ID 生成、Gate 校验、状态变更执行、度量计算等不应由 AI 推理完成的操作。CLI 不主动编排流程，仅响应 Skill 或人的调用。

## 安装与分发模式（强制）

> 使用人员仅保留 **npm 安装模式**，不提供其他安装方式。

### 使用人员安装方式

- 全局安装：`npm install -g <package-name>`
- 项目内安装：`npm install --save-dev <package-name>`
- 执行方式：安装后使用 `spec-first ...`（或在 npm script 中调用）

### npm 仓库策略

- **内网环境**：发布到公司内网 npm 私有仓库（如 Nexus/Verdaccio/Artifactory 的 npm registry）。
- **外网环境**：发布到自建外网 npm 仓库（独立 registry）。
- 同一版本号在内外网仓库保持一致，避免跨环境协作时版本漂移。
- 仓库切换通过 `.npmrc` 的 `registry` 配置完成，不改变命令签名。

---

## 用户入口与路由（强制）

- 用户统一入口：`/spec-first:xxxx`
- `/spec-first:init` 仅保留无参交互模式：`/spec-first:init`
- `stage/rfc/id/gate/matrix/defect` 等命令通过 `/spec-first:*` 入口路由到 CLI Runtime

| 用户入口 | 路由目标（CLI） |
|------|------|
| `/spec-first:stage ...` | `spec-first stage ...` |
| `/spec-first:rfc ...` | `spec-first rfc ...` |
| `/spec-first:id ...` | `spec-first id ...` |
| `/spec-first:gate ...` | `spec-first gate ...` |
| `/spec-first:matrix ...` | `spec-first matrix ...` |
| `/spec-first:defect ...` | `spec-first defect ...` |

`/spec-first:rfc` 入口支持语义化子命令映射：

- `/spec-first:rfc approve <rfcId> --feature <featureId>` → `spec-first rfc transition <rfcId> approved --feature <featureId>`
- `/spec-first:rfc reject <rfcId> --feature <featureId>` → `spec-first rfc transition <rfcId> rejected --feature <featureId>`

---

## 7 个核心模块

| 模块 | 名称 | 职责 | 规范状态（Normative） | 交付状态（Delivery） |
|------|------|------|----------------------|---------------------|
| **M1** | ProcessEngine（流程引擎） | 阶段状态机、三层规范合并、裁剪引擎 | ✅ Required | ✅ Implemented |
| **M2** | TraceEngine（追踪引擎） | ID 注册/校验、追踪矩阵管理、覆盖率计算 | ✅ Required | ✅ Implemented |
| **M3** | GateEngine（质量门禁引擎） | Gate 条件评估、SCA 校验、Hook 调度 | ✅ Required | 🔧 Partial（自动条件解析链路未完成） |
| **M4** | ChangeMgr（变更管理） | RFC 状态机、缺陷管理、影响分析 | ✅ Required | ✅ Implemented |
| **M5** | AIOrchestrator（AI 编排） | Context Pack 生成、Session Catchup、AI 统计 | ✅ Required | 🔧 Partial（类型签名漂移） |
| **M6** | MetricsEngine（度量引擎） | 12 项指标计算、健康分、瓶颈分析 | ✅ Required | ✅ Implemented |
| **M7** | ToolIntegration（工具集成） | Git Hook 安装、CI 模板生成 | ✅ Required | 📋 Planned |

> 说明：Normative 描述目标能力边界，Delivery 描述当前实现状态；两者不一致时以 Delivery 为准执行风险评估。

---

## 13 个命令组

> **命名规范**：所有命令统一使用 `spec-first <group> <subcommand>` 格式。
> 文档中 `spec-id`、`spec-gate` 等简写仅为阅读便利，实际执行必须使用 `spec-first id`、`spec-first gate` 等完整形式。
> bin 入口唯一：`spec-first`（来自 `package.json:bin`）。

### 1. `spec-first init` ✅ Implemented

初始化 Feature 工作区。

> 用户入口：`/spec-first:init`（无参数，交互引导）。
> Skill 在交互中采集 `feat/mode/size/platforms` 后调用下列 CLI 命令。

```bash
spec-first init --feat <abbr> --mode <N|I> --size <S|M|L> --platforms <p1,p2,...> [--feature-id <id>]
```

- `--feat <abbr>`（必填）：Feature 缩写，大写字母开头，1-16 字符
- `--mode <N|I>`（默认 N）：开发模式
- `--size <S|M|L>`（默认 M）：项目规模
- `--platforms <p1,p2,...>`（必填）：技术端平台列表（逗号分隔），如 `h5,java-backend`
- `--feature-id <id>`（可选）：指定 Feature ID，默认自动生成

**Feature ID 规范**：

- 格式：`FSREQ-YYYYMMDD-<FEAT>-NNN`
- 正则：`^FSREQ-\d{8}-[A-Z][A-Z0-9]{1,15}-\d{3}$`
- 示例：`FSREQ-20260209-AUTH-001`

**产出**：创建 `specs/<featureId>/` 目录、`stage-state.json`、`constitution.md`（从项目级 `.spec-first/constitution.md` 复制）、注册 FEAT 缩写。

### 2. `spec-first id` ✅ Implemented

ID 生成与校验（M2 TraceEngine）。

```bash
spec-first id next <type> <featAbbr> --feature <featureId>   # 生成下一个 ID（--feature 运行时必填）
spec-first id validate <id>                                   # 校验 ID 格式（<10ms SLA）
spec-first id list --feature <featureId> [--type <type>]      # 列出已注册 ID（--feature 运行时必填）
spec-first id search <keyword> --feature <featureId> [--type <type>]  # 模糊搜索 ID
```

支持 6 种 ID 类型：FR（含 NFR 标签）/ DS（含 API 引用）/ TASK / TC / RFC（含 ADR 子类型）/ Feature。NFR 合入 FR 加 `[NFR:<DIM>]` 标签，API 合入 DS 的 `api_ref` 字段，ADR 归入 RFC 的 `级别: ADR` 标记。

**`search` 子命令说明**：

- 按关键词模糊匹配 ID 标识及其关联描述（如输入 `login` 匹配 `FR-AUTH-001 用户登录`）
- 支持 `--type` 过滤特定类型（如 `--type FR` 仅搜索功能需求）
- 输出格式：`ID | 类型 | 描述摘要 | 状态`，便于开发者在编码时快速定位追踪 ID
- **DX 场景**：开发者写代码注释 `// implements: TASK-???` 时，通过 `spec-first id search login` 快速找到对应 ID

### 3. `spec-first gate` 🔧 Partial

Gate 条件评估（M3 GateEngine）。

```bash
spec-first gate check <featureId> [--stage <stageId>]   # 校验当前阶段 Gate
spec-first gate conditions <featureId> [--stage <stageId>]   # 查看 Gate 条件定义（需 featureId 以读取合并后的 Layer 2 条件）
spec-first gate history <featureId>                       # 查看评估历史
```

评估结果：`PASS`（通过）| `PASS_WITH_WAIVER`（有审批豁免的通过）| `FAIL`（阻断）。

> ⚠️ Gate 自动条件解析器注入链路未完成，Gate 自动评估存在已知缺口。

### 4. `spec-first stage` ✅ Implemented

阶段生命周期管理（M1 ProcessEngine）。

```bash
spec-first stage current <featureId>                      # 查看当前阶段
spec-first stage advance <featureId> [--force]             # 推进到下一阶段（需 Gate = PASS 或 PASS_WITH_WAIVER；--force 跳过 Gate 校验，写入 findings.md 记录）
spec-first stage cancel <featureId> --reason "<reason>"   # 取消 Feature
```

> 阶段流转由 Skill 编排触发，CLI 负责原子执行。

> `PASS_WITH_WAIVER` 必须关联有效豁免条目：`specs/<featureId>/known-exceptions.md` 中已审批、未过期、含回滚点。

### 5. `spec-first matrix` ✅ Implemented

追踪矩阵管理（M2 TraceEngine）。

```bash
spec-first matrix check <featureId>                                # 校验矩阵完整性
spec-first matrix export <featureId> [--format <markdown|yaml>]    # 导出追踪矩阵
```

> ⚠️ `--format` 可选值为 `markdown | yaml`（非 `md | yaml`）。

### 6. `spec-first metrics` ✅ Implemented

覆盖率与度量（M2 + M6）。

```bash
spec-first metrics coverage <featureId>                   # 计算 9 项覆盖率指标（12 项中的 A 类）
spec-first metrics report <featureId>                     # 生成度量报告
spec-first metrics health <featureId>                     # 输出健康分（0-100）+ 瓶颈分析
```

### 7. `spec-first ai` 🔧 Partial

AI 辅助工具（M5 AIOrchestrator）。

```bash
spec-first ai context <featureId> [--stage <stageId>] [--task <taskId>]  # 生成 Context Pack（control<2KB + references）
spec-first ai catchup <featureId>                         # 会话恢复（手动触发 / 自动触发，默认 auto）
spec-first ai stats <featureId>                           # AI 调用统计
```

> `ai context` 输出采用 Control + References 协议：`control`（<2KB）+ `references`（按需读取）。

> `ai catchup` 采用文件单通道 7 步恢复：读取 `stage-state.json` + `task_plan.md` + `progress.md` + `findings.md`，定位当前阶段/TASK，扫描必需文件缺失项，输出恢复摘要。不扫描 transcript/会话日志。支持自动触发（默认 `auto`，可通过 `config.yaml` 切换为 `prompt` / `off`）。

> ⚠️ 命令签名存在与核心模块的类型漂移，`npm run typecheck` 当前不通过。

### 8. `spec-first rfc` ✅ Implemented

变更请求管理（M4 ChangeMgr）。

```bash
spec-first rfc create <featureId> --title "<title>" [--level <Minor|Major|Critical>] [--by <submittedBy>] [--motivation "<motivation>"] [--description "<description>"]
spec-first rfc submit <rfcId> --feature <featureId>
spec-first rfc transition <rfcId> <status> --feature <featureId>
spec-first rfc list <featureId>
spec-first rfc get <rfcId> --feature <featureId>
```

> ⚠️ 参数为 `--title`/`--level`/`--motivation`，**无** `--impact` 参数。

RFC 4 状态 FSM：`draft → approved → closed`，可从 `draft` / `approved` → `rejected`。执行过程由 Skill 和任务计划驱动，不在 RFC 状态机内建模。

### 9. `spec-first defect` ✅ Implemented

缺陷管理（M4 ChangeMgr）。

```bash
spec-first defect register <featureId> --title "<title>" --severity <S1|S2|S3|S4> --reporter "<reporter>" [--description "<desc>"] [--discovered-in <stage>] [--linked-fr <frId>]
spec-first defect update <featureId> <seq> --status <status> [--actor <actor>]
spec-first defect list <featureId>
spec-first defect get <featureId> <seq>
spec-first defect escape-rate <featureId>
```

> ⚠️ 严重级别为 `S1/S2/S3/S4`（非 `critical/major/minor`）。

### 10. `spec-first doctor` ✅ Implemented

环境诊断。

```bash
spec-first doctor
```

检查项：Node.js 版本（≥20）、npm 可用性、Git 配置、`specs/` 目录状态、CLI 版本。

---

### 11. `spec-first feature` 📋 Planned

Feature 工作区管理（跨 Feature 切换与概览）。

```bash
spec-first feature list                          # 列出所有 Feature 及阶段状态
spec-first feature switch <featureId>            # 切换当前工作 Feature
spec-first feature current                       # 显示当前 Feature
```

**`list` 输出示例**：

```text
  ID                          Stage         Health
  FSREQ-20260209-AUTH-001     04_implement  ██████░░ 72%
▸ FSREQ-20260209-PAY-001      01_specify    ██░░░░░░ 25%
  FSREQ-20260208-NOTIFY-001   08_done       ████████ 100%
```

`▸` 标记当前 Feature。

**状态文件**：`.spec-first/current`（纯文本，存储当前 Feature ID，纳入 `.gitignore`）。

---

### 12. `spec-first commit` 📋 Planned

Git Commit 辅助封装（M7 ToolIntegration）。

```bash
spec-first commit [--task <taskId>] [--message "<message>"]   # 交互式生成格式化 commit
```

- 未指定 `--task` 时，从 `.spec-first/current` + `task_plan.md` 读取当前进行中的 TASK，交互式选择
- 自动生成 commit message 前缀：`[TASK-<FEAT>-NNN]`
- `--message` 可选，未提供时提示输入描述
- 内部调用 `git commit`，确保格式符合 `commit-msg` Hook 校验规则

**DX 价值**：避免开发者手动拼写 TASK ID，消除 Hook 拒收导致的心流中断。

---

### 13. `spec-first golive` 📋 Planned

Go-Live 准入评估（公司级上线门槛校验）。

```bash
spec-first golive check                                    # 评估 GL-01 ~ GL-04 准入条件
```

- 逐项评估 GL-01（GateEngine 就绪）、GL-02（AIOrchestrator 稳定）、GL-03（Context Pack 可用）、GL-04（E2E 质量闭环）
- 输出各 Gate 的 PASS / FAIL 状态及证据摘要
- 评估结果追加写入 `specs/_global/golive-history.jsonl`
- 任一 Gate FAIL 时输出对应降级策略建议

> `golive check` 与 Feature 级 `gate check` 的区别：`gate` 管单 Feature 阶段准出，`golive` 管全局上线准入。

---

## Exit Code 规范

> 以 `src/shared/types.ts` ExitCode enum 为准。

| Code | 常量名 | 含义 |
|------|--------|------|
| 0 | `SUCCESS` | 成功 |
| 1 | `GATE_FAILED` | Gate 校验失败 |
| 2 | `VALIDATION_ERROR` | 参数/ID 校验失败 |
| 3 | `CONFIG_ERROR` | 配置错误 |
| 4 | `IO_ERROR` | 文件 I/O 错误 |
| 5 | `UNKNOWN_ERROR` | 未知错误 |

---

*aux-02-cli-system.md 完成 — 下一篇：[aux-03-multi-platform.md](aux-03-multi-platform.md)*
