---
title: "当前 spec-first 按宿主分开的 using-spec-first 集成技术方案"
type: archive
status: superseded
created: 2026-04-17
archived_at: 2026-06-14
archive_reason: "legacy plan-status backfill; retained as historical evidence only, not an active implementation plan"
---
# 当前 spec-first 按宿主分开的 using-spec-first 集成技术方案

> Lifecycle: historical plan archive. This document is retained as historical evidence only and is not an active implementation plan.

**Goal:** 参考 `using-superpowers` 的真实宿主拆分实现，为当前仅支持 `Claude Code` 与 `Codex` 的 `spec-first` 设计一套按宿主分开的 `using-spec-first` 集成方案。目标不是做“统一但虚假的对称方案”，而是让 `Claude` 走 `SessionStart` 自动注入增强，让 `Codex` 走 native skill discovery + repo 指令 bootstrap，最终把 `using-spec-first` 落成 `spec-first` 的会话级入口治理层。

**Architecture:** 采用“三层分离、按宿主落地”的方案。统一 skill 真源继续放在 `skills/using-spec-first/SKILL.md`；双宿主共享 repo-root bootstrap 指令层，但不复制完整路由规则；`Claude` 额外增加 project-level `SessionStart` hook，在每次会话启动时把运行时 `SKILL.md` 全文注入上下文；`Codex` 不做 speculative hook，实现上维持 runtime skill 安装与 `AGENTS.md` bootstrap。

**Tech Stack:** Node.js CommonJS, Markdown skill contracts, `CLAUDE.md` / `AGENTS.md` managed blocks, Claude project hooks via `.claude/settings.json`, dual-host governance contract, Jest unit tests, shell smoke tests

---

## 1. 背景与已确认事实

### 1.1 参考实现：using-superpowers 不是单一方案，而是按宿主分开

外部参考 `using-superpowers` 的关键事实已经确认：

1. 在 `Claude` 上，它依赖 `SessionStart` hook，把 `using-superpowers` 的全文在新会话启动时注入上下文。
2. 在 `Codex` 上，它已经切到 native skill discovery，依赖 `~/.agents/skills/` 的自动发现，不再依赖旧的 `AGENTS bootstrap` block。
3. 因此，`using-superpowers` 的真正经验不是“所有宿主都用同一种注入机制”，而是“每个宿主走自己真实存在、稳定、可验证的能力面”。

对 `spec-first` 的直接启示是：

1. 不应为了表面一致，给 `Codex` 发明不存在的 `SessionStart` 或 hook 能力。
2. `Claude` 上如果要对齐 `using-superpowers` 的真正体验，必须做会话启动注入，而不是只安装 skill 文件。
3. `Codex` 上如果当前稳定面仍是 skill discovery + repo 指令文件，就应该承认这种不对称，而不是掩盖它。

### 1.2 当前 spec-first 的代码事实

当前仓库已经具备以下真实基础：

1. `skills/using-spec-first/SKILL.md` 已存在，并且正文已明确：
   - `workflow-first`，不是 `brainstorming-first`
   - substantial work 之前先做 workflow 判定
   - 允许在不适用 `spec-first` 时直接回答
2. `src/cli/contracts/dual-host-governance/skills-governance.json` 已将 `using-spec-first` 登记为 `dual_host + standalone_skill`，并声明：
   - `claude -> skill`
   - `codex -> skill`
3. `src/cli/plugin.js` 当前已经能基于 governance 把 standalone skill 同步到宿主运行时目录。
4. `tests/unit/using-spec-first-runtime-contracts.test.js` 已经证明：
   - `init --claude` 会安装 `.claude/skills/using-spec-first/SKILL.md`
   - `init --codex` 会安装 `.agents/skills/using-spec-first/SKILL.md`
5. `src/cli/commands/init.js` 当前主链在 asset sync 后，只会做：
   - developer profile 写入
   - state 写入
   - adapter runtime cleanup/sync
   - `writeLangPolicy(...)`
   - `bootstrapChangelog(...)`
6. `src/cli/lang-policy.js` 当前只管理 `<!-- spec-first:lang:start -->` 语言与 changelog 规则块，没有 workflow bootstrap block。
7. 当前仓库里还没有以下能力：
   - `src/cli/instruction-bootstrap.js`
   - `src/cli/claude-settings.js`
   - `templates/claude/hooks/session-start`
   - `templates/claude/hooks/run-hook.cmd`
   - `doctor / clean / state` 对 `using-spec-first` hook 层的生命周期管理

### 1.3 现状结论

当前 `spec-first` 已经完成的是：

1. `using-spec-first` 的 skill 本体
2. dual-host governance 登记
3. runtime skill 安装

当前 `spec-first` 还没有完成的是：

1. 双宿主 repo-root bootstrap 层
2. `Claude` 的 `SessionStart` 自动注入层
3. 相关的 state / doctor / clean 闭环

因此，当前最正确的设计任务不是“重新定义 using-spec-first 是什么”，而是“把它从已安装 skill 提升为真正的宿主级入口治理层”。

## 2. 设计目标

本方案需要满足以下目标：

1. 明确只覆盖当前支持的两个宿主：`Claude Code` 与 `Codex`。
2. 保留 `skills/using-spec-first/SKILL.md` 作为唯一的路由语义真源。
3. 在 `Claude` 上对齐 `using-superpowers` 的核心价值：新会话第一轮前，`using-spec-first` 已在上下文中。
4. 在 `Codex` 上不做 speculative hook，继续依赖 native skill discovery。
5. 保留 repo-root instruction file 的价值：让项目级治理、语言策略、workflow bootstrap 常驻存在。
6. 让 `init / doctor / clean` 能解释、修复、清理所有新增受管资产。
7. 不把 `using-spec-first` 变成新的 command，也不让它退化成“任何请求都先 brainstorm”。

### 2.8 已落地基线 vs 本方案新增范围

本方案后续所有 `init / doctor / clean / state` 讨论都只覆盖“新增”列；已落地基线列保持复用现有 generic 主链，不重新发明。

| 层 | 已落地基线（不再改造） | 本方案新增 |
| --- | --- | --- |
| Source of Truth | `skills/using-spec-first/SKILL.md` + `docs/10-prompt/skills/using-spec-first/SKILL.md` | 无新增真源 |
| Governance | `skills-governance.json` 中 `using-spec-first` dual-host standalone 条目 | 无新增 governance 条目；hook / bootstrap / settings 不进入 governance |
| Runtime install | `.claude/skills/using-spec-first/` / `.agents/skills/using-spec-first/` | Claude hook 文件、`CLAUDE.md` / `AGENTS.md` bootstrap block、`.claude/settings.json` 受管 matcher |
| `state.json` | `state.skills` 已跟踪 `using-spec-first` | 首轮不强制扩展 schema；bootstrap block 由 marker 自管，hook / matcher 若后续确有精确回收需求再评估是否入 state |
| `init` 主链 | `syncBundledAssets → writeState → adapter.syncRuntimeFiles → writeLangPolicy → bootstrapChangelog` 已覆盖 runtime skill | 在 `writeLangPolicy` 之后追加 `writeInstructionBootstrap` 与 `syncHostBootstrapRuntime` |
| `doctor` | 已基于 installed skills 做存在性检查 | 新增 bootstrap block / hook files / settings matcher 的存在性、内容与漂移检查 |
| `clean` | 已按 `state.skills` 删除 runtime skill | 新增 bootstrap block / hook files / settings matcher 的受管清理 |

## 3. 非目标

本方案明确不做以下事情：

1. 不为 `Codex` 设计未经验证的 hook / session-start 兼容层。
2. 不把 `using-spec-first` 改造成 `spec-using`。
3. 不在 hook 脚本里复制第二套路由规则摘要。
4. 不用 `AGENTS.md` 模拟 `using-superpowers` 旧时代的 bootstrap 命令块。
5. 不改变现有统一 `spec-*` 产品面。

## 4. 推荐方案总览

推荐采用按宿主分开的三层方案：

### 4.1 统一真源层

`skills/using-spec-first/SKILL.md` 是唯一真源，负责：

1. 定义 substantial work
2. 定义 workflow 决策树
3. 定义 Claude `spec-*` 与 Codex `spec-*` 入口
4. 定义负向约束：
   - 不是 brainstorming-first
   - 不采用 `using-superpowers` 的 1% 强制 skill 纪律
   - 不把 standalone skill 伪装成 command

### 4.2 双宿主 bootstrap 层

新增 repo-root managed bootstrap block：

1. `Claude` 写入 `CLAUDE.md`
2. `Codex` 写入 `AGENTS.md`

这层只承担“始终在场的入口提示”职责，不复制完整规则。它要表达的核心只有：

1. 当前项目安装了 `using-spec-first`
2. substantial work 前先做 workflow 判定
3. `Claude` 主入口是 `spec-*`
4. `Codex` 主入口是 `spec-*`

### 4.3 Claude 会话启动注入层

`Claude` 额外增加 project-level `SessionStart` hook：

1. `init --claude` 时安装 `.claude/hooks/session-start`
2. 幂等 merge `.claude/settings.json`
3. 新会话 `startup|resume|clear|compact` 时读取 `.claude/skills/using-spec-first/SKILL.md`
4. 默认直接调用 `.claude/hooks/session-start`；`run-hook.cmd` 只在后续确认需要 wrapper 时再引入
5. 通过 `hookSpecificOutput.additionalContext` 把全文注入会话

### 4.4 Codex 宿主集成层

`Codex` 不做 hook，保持：

1. `.agents/skills/using-spec-first/SKILL.md`
2. `AGENTS.md` bootstrap block
3. 依赖重启后的 native skill discovery

这不是“旧 bootstrap 命令块”的延续，而是 repo-local instruction layer。它与 `using-superpowers` 旧方案不同，职责是：

1. 补足项目级治理信息
2. 让 `spec-first` workflow 入口在仓库级常驻
3. 与已有 `AGENTS.md` 语言/治理块共存

## 5. 为什么 spec-first 不能机械照搬 using-superpowers

### 5.1 Claude 可以对齐，Codex 不能伪造

`using-superpowers` 的宿主拆分告诉我们：

1. `Claude` 有真实 hook 能力，所以它用 hook。
2. `Codex` 当前真实能力是 skill discovery，所以它用 skill discovery。

`spec-first` 应继承的是这种“按宿主真实能力落地”的原则，而不是继承某个单一机制。

### 5.2 spec-first 比 superpowers 多一层项目级治理责任

`using-superpowers` 的 `Codex` 路线可以只靠 skill discovery，是因为它是偏用户级、全局技能库模型。

`spec-first` 不一样。它是项目级 runtime 资产安装器，还负责：

1. 写 repo-root instruction file
2. 写 developer/lang/changelog 治理
3. 对项目内 workflow 行为做收敛

因此，`Codex` 上保留 `AGENTS.md` bootstrap 是合理的，但它的角色必须定义准确：

1. 它不是旧式 bootstrap 命令块。
2. 它不是 `SessionStart` 替身。
3. 它是 repo-local 持久指令层，用来承载项目级 workflow 入口治理。

## 6. 详细设计

### 6.0 治理面划分

为避免 governance / adapter / marker 三种治理面互相侵占，固定如下边界：

1. `skills-governance.json` **只**治理“哪个 skill / command 在哪个宿主以什么形态交付”。它不描述宿主特化 runtime support（hook 文件、`.claude/settings.json` matcher、bootstrap block）。
2. 宿主特化 runtime support 的真源是 **adapter + 模板文件 + install contract**：`templates/claude/hooks/*`、`claude-settings.js` 的 matcher builder、`instruction-bootstrap.js` 的 block builder。它们不进 `skills-governance.json`。
3. `using-spec-first` 在 governance 中保持 `dual_host + standalone_skill + { claude: skill, codex: skill }` 不变；host split 行为完全由 adapter / bootstrap / settings 层表达，不通过扩展 governance 字段来承载。

### 6.0.1 真源与校验矩阵

所有 `doctor` / tests / clean 都以下表为唯一判定基准，避免每层各自发明“正确”标准。

| 被检测对象 | 真源 | 判定规则 | 漂移分类 |
| --- | --- | --- | --- |
| runtime `SKILL.md` | `skills/using-spec-first/SKILL.md` 经对应 adapter 的 `transformSkillContent(...)` 输出 | 字节级 byte-equal | 不存在 → `Partial`；内容不等 → `Drifted` |
| docs mirror | 源 skill | byte-equal（由源码 contract tests 守护，doctor 不检查） | 不影响 runtime 诊断 |
| bootstrap block | `instruction-bootstrap.js` 的 `buildBlock(hostId)` 输出 | marker 必须成对；受管区块文本 byte-equal | marker 缺失或只剩一侧 → `Partial`；内容不等 → `Drifted` |
| Claude hook files | `templates/claude/hooks/session-start`（若未来采用 wrapper，再加 `run-hook.cmd`） | byte-equal | 缺文件 → `Partial`；内容不等 → `Drifted` |
| `.claude/settings.json` 受管 matcher | `claude-settings.js` 的 `buildManagedMatcher()` | 以 command 路径作为身份指纹；命中后字段 deep-equal | 缺 matcher → `Partial`；命中但字段不等 → `Drifted` |
| hook 运行时降级行为 | skill 文件存在 | hook 运行时在 skill 缺失时只做非阻断降级；状态必须被 doctor 显式暴露为 `Partial` | `Partial` |

### 6.1 Source of Truth 分层

建议固定为三层真源：

| 层级 | 真源 | 责任 |
| --- | --- | --- |
| 路由真源 | `skills/using-spec-first/SKILL.md` | workflow 决策树、宿主入口、负向约束 |
| bootstrap 生成器 | `src/cli/instruction-bootstrap.js` | 生成 `CLAUDE.md` / `AGENTS.md` 的受管提示块 |
| Claude hook 运行时 | `templates/claude/hooks/session-start` | 把 runtime skill 全文注入会话 |

约束如下：

1. 路由顺序只能改 `skills/using-spec-first/SKILL.md`
2. bootstrap block 不能复制完整决策树
3. hook 不能再写一份第二套 rules summary

### 6.2 init 主链改造

当前 `src/cli/commands/init.js` 在 `writeLangPolicy(...)` 前后没有 bootstrap 或 hook 安装逻辑。本方案建议把主链扩成：

1. `syncBundledAssets(...)`
2. `writeState(...)`
3. `adapter.syncRuntimeFiles(...)`
4. `writeLangPolicy(...)`
5. `writeInstructionBootstrap(...)`
6. `syncHostBootstrapRuntime(...)`
   - `Claude`：upsert `.claude/settings.json` + 安装 `.claude/hooks/*`
   - `Codex`：无 hook 动作
7. `bootstrapChangelog(...)`

实现约束：`syncHostBootstrapRuntime(...)` 只是编排入口，内部必须拆成两个独立子步骤：
- `installClaudeSessionStartHooks(projectRoot)`：只负责拷贝 / 校验 `.claude/hooks/*`
- `upsertClaudeSettingsMatcher(projectRoot)`：只负责 `.claude/settings.json` 受管 matcher 的 upsert
- Codex 分支保持空实现；不在此入口塞入其它宿主特化逻辑。单元测试按这两个子单元覆盖，而非对合并入口做黑盒测试。

这样做的原因：

1. bootstrap block 依赖 `adapter.instructionFile`
2. Claude hook 安装依赖 runtime skill 已经存在
3. changelog bootstrap 仍保持当前位置，不与 workflow bootstrap 混用

### 6.3 instruction bootstrap 模块

新增 `src/cli/instruction-bootstrap.js`，职责：

1. 定义新的 marker：
   - `<!-- spec-first:bootstrap:start -->`
   - `<!-- spec-first:bootstrap:end -->`
2. 提供与 `lang-policy.js` 同级的幂等 block 写入能力
3. 根据宿主生成不同 block 内容

block 内容建议保持轻量：

#### Claude block

1. 当前项目已安装 `using-spec-first`
2. 在 substantial work 前，先按 `using-spec-first` 做 workflow 判定
3. Claude workflow 入口使用 `spec-*`
4. 不要把 `using-spec-first` 本身当作 command

#### Codex block

1. 当前项目已安装 `using-spec-first`
2. 在 substantial work 前，先按 `using-spec-first` 做 workflow 判定
3. Codex workflow 入口使用 `spec-*`
4. 不要把 `using-spec-first` 本身写成 `spec-*`

### 6.4 Claude settings merge

新增 `src/cli/claude-settings.js`，只负责一个问题：安全地 upsert / remove 受管 `SessionStart` matcher。

目标 matcher：

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|resume|clear|compact",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/session-start"
          }
        ]
      }
    ]
  }
}
```

设计约束：

1. 只 append-or-upsert，不覆盖整个 `SessionStart` 数组
2. 以 command 路径为 spec-first 托管标识
3. `clean --claude` 只移除该受管 matcher
4. 保留用户已有 permissions、hooks、其他设置

### 6.5 Claude hook 文件

新增：

1. `templates/claude/hooks/session-start`
2. `templates/claude/hooks/run-hook.cmd`（仅在后续确认 wrapper 必要时再引入）

`session-start` 的行为固定为：

1. 读取 `.claude/skills/using-spec-first/SKILL.md`
2. 做 JSON escape
3. 包装一层 introduction wrapper
4. 输出：

```json
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "..."
  }
}
```

注意：

1. wrapper 负责说明“这是 using-spec-first 的 SessionStart 注入内容”
2. 正文必须来自 runtime `SKILL.md`
3. 若 skill 缺失，hook 只做非阻断降级：返回空 `additionalContext` 或最小诊断信息，不挂起会话。静默降级**不是健康状态**，必须由 `doctor` 按 §6.0.1 矩阵暴露为 `Partial`，否则安装漂移会被会话降级永久掩盖。

### 6.6 Codex 集成定义

`Codex` 当前健康态定义为：

1. `.agents/skills/using-spec-first/SKILL.md` 已安装
2. `AGENTS.md` bootstrap block 存在
3. 不存在伪造的 `.codex/hooks`
4. 不存在误写的 `spec-*` 主入口

也就是说，`Codex` 没有 hook 不是缺陷；在当前阶段，这就是它的目标健康态。

## 7. 生命周期与受管状态

建议把 `using-spec-first` 的受管状态定义为：

| 状态 | Claude | Codex |
| --- | --- | --- |
| `NotInstalled` | 无 runtime skill / bootstrap / hooks | 无 runtime skill / bootstrap |
| `BootstrapInstalled` | 有 runtime skill + `CLAUDE.md` block | 有 runtime skill + `AGENTS.md` block |
| `SessionStartInstalled` | `BootstrapInstalled` + `.claude/hooks/*` + `.claude/settings.json` matcher | 不适用 |
| `Partial` | 只装了一部分受管项 | 只装了一部分受管项 |
| `Drifted` | 文件或配置存在，但内容、路径、matcher 漂移 | 文件或 block 漂移 |
| `Cleaned` | clean 后无受管残留 | clean 后无受管残留 |

状态转移：

1. `init --claude`
   - `NotInstalled / Partial / Drifted / Cleaned -> SessionStartInstalled`
2. `init --codex`
   - `NotInstalled / Partial / Drifted / Cleaned -> BootstrapInstalled`
3. `clean --claude`
   - `SessionStartInstalled / BootstrapInstalled / Partial / Drifted -> Cleaned`
4. `clean --codex`
   - `BootstrapInstalled / Partial / Drifted -> Cleaned`

## 8. doctor / clean / state 设计

### 8.1 state

首轮实现不把 `using-spec-first` 的 hook / matcher 管理强制下沉到 `state.json`。推荐的托管边界是：

1. **Governance + 现有 state**
   - runtime skill 继续由 `state.skills` + `skills-governance.json` 管理，本方案不改
2. **Marker 自管**
   - `CLAUDE.md` / `AGENTS.md` 里的 `<!-- spec-first:bootstrap:start -->` 区块由 `instruction-bootstrap.js` 幂等写入与回收，**不进 state**
3. **谓词识别**
   - `.claude/settings.json` 中的受管 `SessionStart` matcher 由 command 路径谓词识别
   - `.claude/hooks/session-start` 由受管目标路径识别

理由：当前首轮目标是“先完成自动注入闭环”，而不是“先完成完整控制面”。若后续实践证明 `clean`/`doctor` 的精确回溯确实需要 `state.hooks` 或 `state.settings.managedMatchers`，再作为加固项追加，不把它们设为 Phase 2 阻塞条件。

### 8.2 doctor

所有“内容正确 / 漂移”的判定以 §6.0.1 的真源矩阵为准；本节只列检查项与输出分类。

#### Claude

1. `.claude/skills/using-spec-first/SKILL.md` 存在性 + 与源 skill 经 adapter transform 后的字节对比 → `Partial / Drifted`
2. `CLAUDE.md` 受管 bootstrap block marker 成对性 + 区块文本与 `buildBlock('claude')` 一致性 → `Partial / Drifted`
3. `.claude/hooks/session-start` 存在性 + 与模板文件字节对比 → `Partial / Drifted`
4. `.claude/settings.json` 中受管 `SessionStart` matcher：按 command 路径定位，找到后与 `buildManagedMatcher()` 字段 deep-equal → `Partial / Drifted`
5. 若 runtime skill 缺失而 hook 在运行时会静默降级：独立报 `Partial`，不允许仅凭会话降级掩盖安装缺失

#### Codex

1. `.agents/skills/using-spec-first/SKILL.md` 存在性 + 与源 skill 经 codex adapter transform 后的字节对比
2. `AGENTS.md` 受管 bootstrap block marker 成对性 + 区块文本与 `buildBlock('codex')` 一致性
3. 否定性断言：不存在 `.codex/hooks`、不存在误写成 `spec-*` 的 Codex 主入口

### 8.3 clean

`clean` 的约束必须是“最小破坏”：

#### Claude

1. 删除 `.claude/skills/using-spec-first`
2. 删除 bootstrap block
3. 删除 `.claude/hooks/*`
4. 从 `.claude/settings.json` 中只移除 spec-first 受管 matcher
5. 不删除用户自定义 skills 或 unrelated hooks

#### Codex

1. 删除 `.agents/skills/using-spec-first`
2. 删除 bootstrap block
3. 不触碰用户自定义 `.agents/skills/*`
4. 不发明 `.codex/hooks` 的清理逻辑

## 9. 实施单元

### Unit 1：Bootstrap 模块化

**Files**

1. Create: `src/cli/instruction-bootstrap.js`
2. Modify: `src/cli/commands/init.js`
3. Add tests: `tests/unit/instruction-bootstrap.test.js`

**Goal**

建立与 `lang-policy.js` 平行的第二个 managed block 主链。

**Key decisions**

1. 独立 marker，不混入 `spec-first:lang`
2. 只写轻量入口提示，不复制决策树

**Test scenarios**

1. 首次写入 block
2. 重复 init 不产生重复 block
3. 与语言 block 共存：已有 `<!-- spec-first:lang:* -->` 块时，bootstrap 追加不破坏原块，两块顺序稳定
4. marker 损坏时按 append-or-repair 策略恢复（只剩 start 或只剩 end）
5. 用户在 bootstrap 块之外手写的内容完整保留
6. 老项目只有 skill 无 bootstrap block 时，再次 `init` 升级到含 block 的状态

### Unit 2：Claude SessionStart hook 安装

**Files**

1. Create: `templates/claude/hooks/session-start`
2. Create: `src/cli/claude-settings.js`
3. Modify: `src/cli/commands/init.js`

**Goal**

让 `Claude` 在新会话第一轮前自动拿到 `using-spec-first` 全文上下文。

**Key decisions**

1. runtime skill 是 hook 的读取对象
2. settings merge 用 upsert，不用整块覆盖
3. matcher 默认覆盖 `startup|resume|clear|compact`

**Test scenarios**

1. 空 `.claude/settings.json` 可创建 matcher
2. 已有 settings 时追加受管 matcher
3. 重复 init 不产生重复 matcher
4. hook 输出格式正确，且包含 wrapper + skill 正文
5. `.claude/settings.json` 已存在**非受管** `SessionStart` matcher（例如用户自定义的其它 hook）：追加受管 matcher 不改写、不删除它
6. `.claude/settings.json` 已存在他人的 `PreToolUse` / `Stop` 等其它 hook：与受管 matcher 互不干扰
7. 受管 matcher 的 `command` 字段被用户手改：`doctor` 报 `Drifted`，`init` 按身份指纹回写到基线
8. runtime skill 缺失场景：hook 返回非阻断降级输出，doctor 独立上报 `Partial`

### Unit 3：state / doctor / clean 生命周期闭环

**Files**

1. Modify: `src/cli/commands/doctor.js`
2. Modify: `src/cli/commands/clean.js`
3. Add tests: `tests/unit/claude-settings.test.js`
4. Optional future hardening: `src/cli/state.js` / `managed-state` tests

**Goal**

让新增资产从“存在”变成“可诊断、可修复、可清理”。

**Test scenarios**

1. Claude hook 资产缺失时报告 `Partial`
2. settings matcher 漂移时报告 `Drifted`
3. `clean --claude` 只删受管项
4. `clean --codex` 不伤及用户自定义 skills
5. 升级路径：老项目只有 `.claude/skills/using-spec-first`（无 bootstrap、无 hook、无 settings matcher），再 `init --claude` 升级到 `SessionStartInstalled`
6. 升级路径：老 Codex 项目只有 skill，再 `init --codex` 升级到 `BootstrapInstalled`，不产生任何 `.codex/hooks`
7. 共存：`clean --claude` 后，用户自定义 hook 文件（例如 `.claude/hooks/my-own.cmd`）与用户自定义 settings 段落完整保留
8. 漂移：bootstrap block marker 只剩一侧 / 完全缺失 → doctor 分别报 `Partial`，`init` 幂等恢复

### Unit 4：Runtime + smoke 验证

**Files**

1. Extend: `tests/unit/using-spec-first-runtime-contracts.test.js`
2. Extend: `tests/smoke/cli.sh`

**Goal**

把“文件存在”和“宿主集成闭环”一起锁住。

**Test scenarios**

1. `init --claude` 后：
   - `.claude/skills/using-spec-first/SKILL.md` 存在
   - `CLAUDE.md` bootstrap block 存在
   - `.claude/hooks/session-start` 存在
   - `.claude/settings.json` 存在受管 matcher
2. `init --codex` 后：
   - `.agents/skills/using-spec-first/SKILL.md` 存在
   - `AGENTS.md` bootstrap block 存在
   - 不存在 `.codex/hooks`
3. `clean` 后受管项被正确删除

### 9.5 升级与共存路径

本节固化本方案在现实仓库上最容易踩坑的三种路径，Unit 1–4 的 test scenarios 必须覆盖这里枚举的每一步转移。

升级矩阵（以 Claude 为主线，Codex 去掉 hook / settings 行后适用）：

| 起点 | 终点 | 期望行为 |
| --- | --- | --- |
| baseline（无任何资产） | `BootstrapInstalled` | `init` 首装 skill + bootstrap block |
| `skill-only`（老版本只装 skill） | `BootstrapInstalled` | `init` 增补 bootstrap block，不重装 skill，不改动 marker 之外的指令文件内容 |
| `BootstrapInstalled` | `SessionStartInstalled` | `init --claude` 增补 hook 文件与受管 matcher |
| `SessionStartInstalled` | `SessionStartInstalled` | 幂等：重复 `init --claude` 不追加重复 matcher、不覆盖用户自定义 hooks、不改动 bootstrap block 外的指令文件文本 |
| `Drifted`（用户改过 matcher / hook / block） | `SessionStartInstalled` | `doctor` 先报 `Drifted`，`init` 按 §6.0.1 真源矩阵回写到基线 |
| `SessionStartInstalled` | `Cleaned` | `clean --claude` 仅删除受管 skill / hook / matcher / bootstrap block；用户自定义 hooks、自定义 skills、其它 settings 段落完整保留 |

共存约束（必须由测试锁住）：

1. `.claude/settings.json` 中用户自定义 `SessionStart` matcher 与受管 matcher 并存时，两者互不影响；`clean` 只回收受管那一项
2. `CLAUDE.md` / `AGENTS.md` 用户手写内容与 bootstrap block、lang policy block 三者共存时顺序稳定、互不覆盖
3. `.claude/hooks/` 下用户自定义脚本与受管 hook 并存；`clean` 只删除受管目标路径，不误删其它脚本
4. 升级过程中任一中间失败不得产生半写状态：bootstrap 写入与 hook/matcher 安装需在 `init` 主链中顺序保证可重试幂等

## 10. 风险与缓解

### 风险 1：把 Codex 错做成旧 bootstrap 命令块方案

**缓解**

1. 文档明确 `AGENTS.md` 是 repo-local instruction layer，不是旧 bootstrap block
2. 测试明确禁止写入 `superpowers-codex bootstrap` 这类旧模式

### 风险 2：bootstrap 与 skill 真源漂移

**缓解**

1. bootstrap 只写轻量提示
2. 决策树只保留在 `skills/using-spec-first/SKILL.md`
3. 改路由顺序时必须先改 skill，再改测试

### 风险 3：Claude settings merge 破坏用户配置

**缓解**

1. command 路径作为受管 matcher 唯一标识
2. 只 upsert / remove 命中的 spec-first 项
3. 单测覆盖 append、idempotent、remove

### 风险 4：using-spec-first 退化成默认先 brainstorm

**缓解**

1. skill contract 固定 `workflow-first`
2. doc + tests 同时锁定“不默认先 brainstorm”

## 11. 验收标准

满足以下条件时，方案算完成：

1. `Claude`：
   - `using-spec-first` 已安装为 runtime skill
   - `CLAUDE.md` bootstrap block 存在
   - `.claude/hooks/session-start` 存在
   - `.claude/settings.json` 存在受管 `SessionStart` matcher
   - 新会话第一轮前可获得 `using-spec-first` 注入上下文
2. `Codex`：
   - `using-spec-first` 已安装为 runtime skill
   - `AGENTS.md` bootstrap block 存在
   - 不存在伪造 hook 资产
   - 入口文案仍是 `spec-*`
3. `doctor` 至少能区分 `NotInstalled / BootstrapInstalled / SessionStartInstalled / Partial / Drifted`
4. `clean` 不误删用户自定义 hooks 或 skills
5. 所有路由语义变更都能回溯到 `skills/using-spec-first/SKILL.md`

## 12. 推荐落地顺序

1. 先做 Unit 1：把 bootstrap 层独立出来。
2. 再做 Unit 2：只给 `Claude` 加 `SessionStart`。
3. 然后做 Unit 3：补 `state / doctor / clean`。
4. 最后做 Unit 4：把 runtime 与 smoke 闭环锁住。

这个顺序的好处是：

1. 先把双宿主共同层稳定下来
2. 再给 `Claude` 叠加增强
3. 避免一开始就把问题扩成“跨宿主统一 hook 基础设施”

## 13. 最终结论

参考 `using-superpowers` 的正确姿势，不是“抄它的 hooks”，也不是“抄它的 Codex 历史 bootstrap”，而是抄它的**宿主分流原则**：

1. `Claude` 用真实存在的会话启动注入能力
2. `Codex` 用真实存在的 native skill discovery
3. 项目级治理继续通过 `CLAUDE.md` / `AGENTS.md` 常驻

对于当前 `spec-first`，最正确的目标态是：

1. `Claude = runtime skill + CLAUDE.md bootstrap + SessionStart hook`
2. `Codex = runtime skill + AGENTS.md bootstrap + skill discovery`

这既对齐了 `using-superpowers` 的真实宿主拆分逻辑，也符合 `spec-first` 作为项目级 runtime 资产安装器的产品边界。
