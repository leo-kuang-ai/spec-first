# Spec-First 全量 Skill 审查报告

- 审查日期：2026-03-18
- 审查范围：`skills/spec-first` 全量 skills、shared contracts、项目级治理文档、相关实现与测试
- 审查基线：[/Users/kuang/xiaobu/hs_h_report/参考资料/prompt相关/gpt版本.md](/Users/kuang/xiaobu/hs_h_report/参考资料/prompt相关/gpt版本.md)
- 审查方法：按“规范 → 设计 → 实现 → 验证 → 门禁 → 全流程协同”执行

## 一、总审查结论

本报告是 2026-03-18 首轮全量审查的原始结论记录。经过后续修复与回归，当前状态已明显改善，不应再直接把本页顶部结论理解为“现状仍不通过”。

首轮审查时的核心结论不是“这套 skill 不能工作”，而是：

1. 单点内容层面，大多数 skill 已达到“可用”水平。
2. 多 skill 协同层面，主要流程链路基本可跑通。
3. 但在宿主发现 / 加载层面，仍缺少统一、稳定、可验证的治理。

首轮审查时，状态被定义为：

- 单 Skill 内容可用性：大体通过
- 多 Skill 编排稳定性：部分通过
- Skill 发现 / 加载治理：不通过
- 生产门禁结论：不通过

## 进展更新（2026-03-18）

本报告形成后，以下问题已完成整改，不再应继续按“当前阻断”理解：

1. 全量正式 skill 的 frontmatter `description` 已收口到 `Use when...` 触发式规则
2. `00-onboarding` 已收口到 `spec-first:onboarding`
3. `README.md` 已补项目级 discovery governance 规则
4. `skill-catalog` / `skill-governance-docs` / `onboarding-skill-docs` 已补相应测试门禁
5. `17-feature` 已补最小实现闭环与实现级测试
6. `14-status` 已补最小实现闭环与实现级测试
7. `15-doctor` 已改为默认 dry-run、显式 `--fix` 才应用修复，并补测试
8. `02-catchup` 对 `/spec-first:status` 的错误补救语义已修正
9. `06-task` 的 canonical 状态枚举已统一
10. 正式文档中的遗留模板占位符已清理，并补治理测试

因此，本报告后续章节中凡涉及上述已修复事项，应理解为“审查发现的原始问题”，而不是“当前仍未修复的问题”。
当前仍然成立、且优先级最高的风险，主要集中在：

- 暂无新的高优先级阻断项
- 后续重点转为持续治理：新增 skill 变更是否继续满足 discovery / shared contract / reference layering 门禁

## 二、阻断问题

### 1. 全量 Skill 的 frontmatter `description` 发现契约系统性不合规

**当前状态**：已完成文档层修复，本节保留为原始审查记录

依据：

- [writing-skills/SKILL.md](/Users/kuang/.codex/superpowers/skills/writing-skills/SKILL.md#L95) 明确要求：
  - `description` 只描述触发条件
  - 以 `Use when...` 开头
  - 不得总结流程或能力

当前大量核心 skill 不满足该规则，例如：

- [03-spec/SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/03-spec/SKILL.md#L1)
- [07-code/SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/07-code/SKILL.md#L1)
- [12-verify/SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/12-verify/SKILL.md#L1)
- [13-orchestrate/SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/13-orchestrate/SKILL.md#L1)
- [15-doctor/SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/15-doctor/SKILL.md#L1)
- [21-analyze/SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/21-analyze/SKILL.md#L1)

风险：

- 宿主可能按 frontmatter description 直接判断行为
- 宿主可能跳过正文，造成 description trap
- skill 正文再完整，也可能无法被正确进入

原始结论：

- 阻断

### 2. `00-onboarding` 仍未纳入统一命名与发现体系

**当前状态**：已完成文档层修复，本节保留为原始审查记录

依据：

- [00-onboarding/SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/00-onboarding/SKILL.md#L1) 仍使用：
  - `name: onboarding`
  - 非 `Use when...` 触发式 description

风险：

- 与 `spec-first:*` 命名体系不一致
- 影响 host 包装、一致性发现、目录治理与 catalog 统一性

原始结论：

- 阻断

### 3. 文档测试未覆盖 Skill 发现契约

**当前状态**：已完成第一轮测试补强，本节保留为原始审查记录

依据：

当前 `*skill-docs*.test.ts` 主要断言关键词存在，未验证：

- `description` 是否触发式
- `description` 是否包含流程摘要
- `name` 是否符合命名空间
- formal skills 是否满足统一 authoring 规范

证据：

- [spec-skill-docs.test.ts](/Users/kuang/xiaobu/spec-first/tests/unit/spec-skill-docs.test.ts#L14)
- [task-skill-docs.test.ts](/Users/kuang/xiaobu/spec-first/tests/unit/task-skill-docs.test.ts#L1)
- [review-skill-docs.test.ts](/Users/kuang/xiaobu/spec-first/tests/unit/review-skill-docs.test.ts#L1)
- [analyze-skill-docs.test.ts](/Users/kuang/xiaobu/spec-first/tests/unit/analyze-skill-docs.test.ts#L1)
- [onboarding-skill-docs.test.ts](/Users/kuang/xiaobu/spec-first/tests/unit/onboarding-skill-docs.test.ts#L1)

风险：

- 测试全绿不等于宿主能稳定发现并加载 skill
- 当前测试只能证明“文档里写了这些词”，不能证明“发现机制不会出错”

原始结论：

- 阻断

## 三、高风险问题

### 1. `front-matter` 测试只覆盖解析器，不覆盖 formal skills 合规性

证据：

- [front-matter.test.ts](/Users/kuang/xiaobu/spec-first/tests/unit/front-matter.test.ts#L1)

问题：

- 目前只证明 parser 能读
- 没证明 `skills/spec-first/*/SKILL.md` 写得符合发现规范

结论：

- 高风险

### 2. `skill-catalog` 治理过弱

**当前状态**：已完成第一轮测试补强，本节保留为原始审查记录

证据：

- [skill-catalog.test.ts](/Users/kuang/xiaobu/spec-first/tests/unit/skill-catalog.test.ts#L42)

当前仅校验：

- 有 `name`
- 有 `description`

未校验：

- `Use when...`
- 不得 summary workflow
- `spec-first:*` 命名空间
- formal skill 发现规则统一性

原始结论：

- 高风险

### 3. `feature` 是全局控制面脆弱点

**当前状态**：已完成最小实现闭环，本节保留为原始审查记录

实现证据：

- [feature.ts](/Users/kuang/xiaobu/spec-first/src/cli/commands/feature.ts#L88)
- [feature.ts](/Users/kuang/xiaobu/spec-first/src/core/process-engine/feature.ts#L29)
- [orchestrate.ts](/Users/kuang/xiaobu/spec-first/src/cli/commands/orchestrate.ts#L40)

说明：

- `switch` 直接写 `.spec-first/current`
- `orchestrate / sync / archive / catchup` 都依赖它自动定位

风险：

- 它不是普通查询命令，而是控制面真源
- 任何文档/实现漂移都会放大到全链路

原始状态：

- 文档层已增强
- 实现输出层还未完全体现恢复建议、写入确认和并发风险反馈

原始结论：

- 高风险

### 4. 项目级 README 未纳入发现契约治理

**当前状态**：已完成文档层修复，本节保留为原始审查记录

证据：

- [README.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/README.md#L11)

问题：

- 只列有哪些 skill
- 不定义宿主如何正确发现这些 skill
- 不定义 frontmatter 门禁

原始结论：

- 高风险

### 5. 文档与实现存在局部伪稳定

典型：

- `feature` 文档契约已经强于当前 CLI 输出
- `status` 文档已经收口到 canonical 口径，但未看到对应 CLI 输出层的实现级门禁

证据：

- [17-feature/SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/17-feature/SKILL.md#L44)
- [feature.ts](/Users/kuang/xiaobu/spec-first/src/cli/commands/feature.ts#L107)
- [14-status/SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-first/14-status/SKILL.md#L99)
- [status-skill-docs.test.ts](/Users/kuang/xiaobu/spec-first/tests/unit/status-skill-docs.test.ts#L48)

**当前状态**：`feature/status/doctor` 已完成最小实现闭环；`code` 文档边界、`catchup/orchestrate/SHARED/spec/task` 的治理尾项也已完成当前轮收口

原始结论：

- 高风险

## 四、逐个 Skill 审查结果

说明：下表反映的是首轮审查时的定级，仅保留为历史审查记录；当前真实状态应以“进展更新”和“当前门禁判断”为准。

| Skill | 结论 | 说明 |
| --- | --- | --- |
| `00-first` | 通过 | 唯一明显接近发现规范，frontmatter 最健康 |
| `00-onboarding` | 不通过 | 命名空间、description、体系一致性不达标 |
| `01-init` | 高风险 | 正文契约较完整，但 discovery contract 不合规 |
| `02-catchup` | 高风险 | 恢复逻辑清楚，但 frontmatter 不合规 |
| `03-spec` | 高风险 | 正文强，但 description 明显 summary 化 |
| `04-design` | 高风险 | 正文成熟，discovery contract 不合规 |
| `05-research` | 高风险 | 工具策略清楚，frontmatter 不合规 |
| `06-task` | 高风险 | 内容成熟，但 tests 证明力度弱、frontmatter 不合规 |
| `07-code` | 高风险 | 正文诚实，description 仍在总结执行模式 |
| `08-review` | 高风险 | 两阶段协议清楚，discovery contract 不合规 |
| `10-archive` | 高风险 | 复盘正文较强，但 frontmatter 不合规 |
| `11-plan` | 高风险 | 治理口径清楚，frontmatter 不合规 |
| `12-verify` | 高风险 | 关键门禁 skill，但 frontmatter 不合规 |
| `13-orchestrate` | 高风险 | 主编排文档完整，但 frontmatter 不合规 |
| `14-status` | 一般风险 | 文档口径已收口，剩余主要是 discovery 与实现闭环不足 |
| `15-doctor` | 高风险 | 多宿主边界清楚，但 discovery contract 不合规 |
| `16-sync` | 一般风险 | 真源冲突改善明显，剩余主要是 discovery contract |
| `17-feature` | 高风险 | 控制面契约已补，但实现输出未完全闭环 |
| `20-spec-review` | 高风险 | 正文可用，frontmatter 不合规 |
| `21-analyze` | 高风险 | 分析正文清楚，但发现契约与 tests 证明力度不足 |

## 五、验证证据

### 1. 全量测试基线

执行：

```bash
pnpm -s vitest run
```

首轮结果：

- `170 passed`
- `1502 passed | 2 skipped (1504)`

当前最新结果：

- `172 passed`
- `1524 passed | 2 skipped (1526)`

### 2. 解释

这说明：

- 当前实现和已有测试基线没有明显回归
- 文档关键词与局部契约基本稳定

但不能说明：

- 宿主会按正确方式发现 skill
- frontmatter 不会覆盖正文
- 全量 formal skills 满足统一 authoring 规范

## 六、当前门禁判断（基于修复后状态）

| 维度 | 结论 |
| --- | --- |
| 单 Skill 内容可用性 | 通过 |
| 多 Skill 编排稳定性 | 基本通过 |
| Skill 发现 / 加载治理 | 已完成第一轮收口 |
| 生产门禁建议 | 当前无新的高优先级阻断，转入持续治理 |

## 七、整改建议

### 已完成的关键整改

1. 建立 frontmatter governance 门禁
2. 全量修正 `description` 为 trigger-only 规范
3. 将 `00-onboarding` 收口到 `spec-first:*` 命名体系
4. 补 discovery governance tests
5. 给 `feature` 增加实现级输出回归
6. 给 `status` 增加实现级展示回归
7. 将 `doctor` 改为默认 dry-run、显式 `--fix` 才应用修复
8. 修正 `catchup -> status` 的错误补救语义
9. 收口 `task` 的 canonical 状态枚举
10. 清理正式文档占位符并补治理测试

### 后续持续治理方向

1. 新增或修改 skill 时，继续满足 discovery / shared contract / reference layering 门禁
2. `code` 若补齐目标态能力，先补实现和测试，再升级文档承诺
3. 如 `status` 未来补更多模板字段，在现有 CLI 之上增量扩展，不回退最小实现闭环
4. 持续防止未渲染模板占位符回流到正式文档

## 八、最终结案意见

到当前这一步，`skills/spec-first` 的首轮全量审查和首轮整改都已经完成。

当前更准确的结论不是“skill 集群不可用”，而是：

`当前 skill 集群已经完成第一轮发现治理、关键控制面闭环和文档门禁补强；后续工作重点是持续治理，而不是继续以高优先级阻断项的方式推进。`
