# Spec-First 全量 Skill 整改点汇总

**整理日期**: 2026-03-18  
**结论口径**: 仅保留经当前仓库核实后仍然成立、且值得进入整改计划的问题；剔除已过时、证据不足或严重性被夸大的结论。

## 当前进展快照（2026-03-18）

- 已完成：
  - 全量正式 skill frontmatter discovery 收口
  - `00-onboarding` 命名空间收口
  - `README.md` 的 discovery governance 规则补齐
  - frontmatter / catalog / governance 文档门禁测试补强
  - `17-feature` 的 CLI 输出契约与实现级测试收口
  - `14-status` 的最小实现闭环与实现级输出回归补齐
  - `07-code` 的目标态声明与当前可执行态边界进一步压平
  - `02-catchup` 的 confirm policy / 路由控制型声明补齐
  - `13-orchestrate` 的 `07_release / 08_done` 文档责任说明补齐
  - `SHARED` 的声明位置约定与最小示例补齐
  - `03-spec` references 的角色分层与发现边界收口
  - `15-doctor` 默认 dry-run、显式 `--fix` 才应用修复的安全模型已实现，并补齐实现级与文档级测试
  - `02-catchup -> /spec-first:status` 的错误补救语义已收口为只读状态检查，不再误导为“补写 findings”
  - `06-task` 的 canonical 状态枚举已统一到 `todo / in_progress / blocked / done`
  - 正式文档中的遗留模板占位符已清理，并补治理测试拦截回归
- 未完成：
  - 暂无新的高优先级整改项；后续主要是持续治理与新增变更回归
- 最近一次定向验证：
  - `pnpm -s vitest run`
  - 结果：`172 passed`, `1524 passed | 2 skipped (1526)`

---

## 1. 总体结论

当前 `skills/spec-first` 的主要风险，已经不再是“旧引用没有清干净”，而是以下 3 类系统性问题：

1. **项目级共享契约与单 skill 文档之间仍有断裂**
2. **部分控制面/编排类 skill 的文档 contract 强于实现闭环**
3. **实现级与门禁级测试仍弱于文档治理目标**

说明：
- `discovery/frontmatter` 这一主线已在文档与测试层完成第一轮收口：全量正式 skill 已统一到 `spec-first:*` 命名空间与 `Use when...` 触发式描述，并补入 catalog / governance 测试
- `doctor / feature / status / catchup / task` 这几条最容易误导真实链路的文档-实现断层，已完成当前最小实现闭环
- 后续整改重点应从“补规则”转到“验证实现是否兑现文档 contract”

---

## 2. P0 级整改点

### P0-1. 统一收口 discovery governance（frontmatter + 测试门禁）

**状态**  
已完成（文档与测试层）

**问题**  
当前多数核心 skill 的 frontmatter `description` 仍然是“总结能力/流程”的写法，而不是纯触发条件描述。这会让宿主在 discovery 阶段过早根据 `description` 做判断，形成 `description trap`。

**影响**  
- Skill 可能被错误发现或过早命中
- 宿主可能跳过正文，只基于 summary 化 `description` 执行
- 全量 skill 在“被稳定加载”这一前提上并不稳

**涉及 skill**
- `01-init`
- `02-catchup`
- `03-spec`
- `04-design`
- `05-research`
- `06-task`
- `07-code`
- `08-review`
- `10-archive`
- `11-plan`
- `12-verify`
- `13-orchestrate`
- `14-status`
- `15-doctor`
- `16-sync`
- `17-feature`
- `20-spec-review`
- `21-analyze`

**完成情况**
- 全量正式 skill 的 `description` 已收口到 trigger-only 规范
- 正式 skill 的 `name` 已统一进入 `spec-first:*` 命名空间
- `README.md` 已补 discovery governance 规则
- 已新增/强化 frontmatter governance tests 与 onboarding 命名空间测试

**剩余关注**
- 继续观察后续新增 skill 是否遵守同一 frontmatter 约束

---

### P0-2. 收回 `00-onboarding` 的体系外命名与发现方式

**状态**  
已完成（文档层）

**问题**  
`00-onboarding` 仍使用 `name: onboarding`，没有进入 `spec-first:*` 命名空间，且其 description 也未遵循 discovery 规范。

**影响**
- 命名空间不统一
- skill catalog 与宿主发现规则存在特例
- onboarding 成为体系外节点，增加维护和路由复杂度

**完成情况**
- `00-onboarding` 已切回 `spec-first:onboarding`
- 已与其他 core skill 使用同一 trigger-only frontmatter discovery 规则

---

## 3. P1 级整改点

### P1-1. README 补齐项目级 discovery / authoring 治理说明

**状态**  
已完成（文档层）

**问题**  
项目级 `skills/spec-first/README.md` 目前更偏目录与流程导航，没有明确声明：
- frontmatter 规范
- description trap 禁止规则
- naming 规范
- 哪些字段属于项目扩展、哪些属于正式要求

**影响**
- 项目知道“有哪些 skill”，但没有定义“宿主如何正确发现 skill”
- authoring 规范散落在别处，项目主索引不具备治理能力

**完成情况**
- README 已增加 discovery governance 小节
- 已明确项目级最小 frontmatter contract 与扩展字段边界

---

### P1-2. `feature` 从“文档 contract”补到“实现闭环”

**状态**  
已完成（当前最小实现闭环）

**问题**  
`17-feature` 文档已补到控制面 contract，但实现输出仍偏轻，只保证“切换成功”类信息；没有完全兑现文档中更强的控制面语义。

**影响**
- `.spec-first/current` 是当前需求目录的定位指针，用于指向 `specs/{featureId}`；`orchestrate / sync / archive / catchup` 等自动定位链路都会消费它
- 文档与实现之间存在伪稳定
- 控制面问题会放大为多 skill 编排问题

**完成情况**
- `current` 输出已补定位来源与恢复建议
- `switch` 成功输出已补 `.spec-first/current` 写入确认、阶段信息与 `/spec-first:catchup`
- `switch` 失败输出已补“未改写 current 指针”语义
- 已补实现级测试，绑定成功/失败路径输出

**剩余关注**
- 若后续引入并发会话保护，需要把冲突提示也补入真实 CLI

---

### P1-3. `status` 文档口径已收口，但仍需补实现级验证

**状态**  
已完成（当前最小实现闭环）

**问题**  
`14-status` 的文档与 references 已收口到 canonical 指标和状态枚举，但现有保障主要是文档级测试，尚不足以证明 CLI 展示层完全一致。

**影响**
- 汇总视图如果继续漂移，会误导 plan/orchestrate/人工判断
- 文档层正确，不代表运行输出层正确

**完成情况**
- 已新增顶层 `status` CLI 命令
- 已输出 `background_input_status / runtime 真源 / docs 投影视图 / 同步状态`
- 已输出 `C1 (Design Coverage)`、canonical 任务状态和下一步建议
- 已补实现级测试，验证状态面板输出

**剩余关注**
- 如后续要完全追平 skill 模板中的扩展字段，可在现有命令之上继续增量补充，不必推翻当前最小实现

---

### P1-4. `doctor` 的确认/修复安全模型需要兑现到实现

**状态**  
已完成（实现与文档层）

**问题**  
`15-doctor` 文档原先承诺“先展示诊断结果，再确认执行自动修复”，但实现默认直接进入宿主配置写入，会让诊断命令在未确认情况下修改环境。

**影响**
- 诊断与修复边界不清
- 用户对 `doctor` 的副作用预期不稳定
- 宿主配置类命令缺少可审计性

**完成情况**
- `doctor` 默认改为 dry-run，不再自动写宿主配置
- 显式 `spec-first doctor --fix --yes` 才进入 apply 模式
- 已补 CLI 实现级测试与文档级测试，绑定 dry-run / apply 两条路径

**剩余关注**
- 若后续需要更细粒度修复项选择，可在现有 `--fix` 模式之上做增量设计

---

### P1-5. `catchup -> status` 的错误补救动作需要和真实副作用对齐

**状态**  
已完成（文档层）

**问题**  
`catchup` 文档原先把 `/spec-first:status` 写成“生成状态/补写 findings”的动作，但 `status` 的真实实现是只读输出。

**影响**
- 恢复建议会误导用户执行一个没有写入副作用的命令
- 会话恢复链路容易制造“执行了但没有补齐”的假象

**完成情况**
- `catchup` 主文档与 reboot checklist 已统一改成“读取当前状态 / 由 catchup 生成恢复摘要”
- 不再把 `status` 描述成写入型修复动作

---

### P1-6. `task` 的 canonical 状态枚举需要和汇总层保持一致

**状态**  
已完成（文档层）

**问题**  
`06-task` 原先仍把 `verified` 作为主示例状态，和 `status / sync / orchestrate` 已收口的 canonical 状态集合冲突。

**影响**
- 容易把 legacy 状态重新注入汇总层
- 下游实现者会被 task 文档误导

**完成情况**
- 主示例状态已统一为 `todo / in_progress / blocked / done`
- 已补文档测试，防止 `verified` 再次回流为 canonical 示例

---

### P1-7. `code` skill 的“目标态声明 vs 当前可执行态”仍需进一步收口

**状态**  
已完成（当前文档层收口）

**问题**  
`07-code` 已经比之前诚实很多，但仍有几处会让使用者把“目标态能力”误读成“当前稳定能力”，例如：
- changelog 中仍保留失败率控制表述
- 与共享约束的衔接不够显式

**影响**
- 使用者容易高估批量执行成熟度
- 批量自动化边界不够稳定

**完成情况**
- changelog 已明确 `stop_on_failure_rate` 等仍属目标态
- 已新增“当前未兑现的目标态能力”小节
- 已补测试，防止把目标态能力重新写成当前稳定承诺

**剩余关注**
- 若未来真实实现这些能力，应以实现和测试证据驱动文档升级，而不是先改 skill 表述

---

## 4. P2 级整改点

### P2-1. `spec` references 治理仍需做一次结构化清理

**状态**  
已完成（文档层）

**问题**  
`03-spec` 整体质量较高，但 references 仍存在：
- 部分文件未被主文档显式发现
- 个别文件职责重叠
- 引用率统计曾被误判，也说明结构不够清晰

**完成情况**
- 主文档已区分 `Primary References` 与 `Secondary / Helper References`
- 已把未直接参与主流程的 helper references 明确标成内部辅助
- 已补测试，锁定 references 分层说明

---

### P2-2. `catchup` 的共享契约衔接需要收口，但不宜误定为 P0

**状态**  
已完成（文档层）

**问题**  
`catchup` 目前缺少 `confirm_policy` frontmatter，也没有显式声明“路由控制型”。

**说明**  
这确实是治理缺口，但当前没有足够证据证明它已经造成运行时阻断，因此不宜继续当作 P0。

**完成情况**
- 已补 `confirm_policy: auto`
- 已显式声明“类型：路由控制型”
- 已写明不套用默认产物型 `P0-P5`
- 已补测试，绑定共享契约声明

---

### P2-3. 共享契约文档继续补“声明位置”和“示例”

**状态**  
已完成（文档层）

**问题**
- SHARED 对默认执行模型、例外类型、confirm policy 已有定义
- 但对“各 skill 应该在哪里声明”的指引还可更明确
- background/orchestration 共享契约也还可补示例

**完成情况**
- SHARED 已新增“声明位置约定”
- 已补 `confirm_policy`、skill 类型、小节位置和最小示例
- 已补测试，验证共享声明位置指引存在

---

### P2-4. `orchestrate` 的 release/done 文档责任说明仍需显式收口

**状态**  
已完成（文档层）

**问题**  
当前代码真源已经把 `07_release` 和 `08_done` 交给 runtime route 承接，但 `13-orchestrate` 文档和 `references/skill-mapping.md` 仍只写到 `06_wrap_up`。

**影响**
- 文档会制造“主工作流只到归档”的假象
- 编排责任链对读者和维护者仍不完整

**完成情况**
- 主文档已新增 `07_release / 08_done` 责任说明
- `references/skill-mapping.md` 已补 `golive / done` runtime route
- 已补测试，锁定该责任链说明

---

### P2-5. 正式文档中的模板占位符需要持续治理

**状态**  
已完成当前轮清理，并已建立门禁

**问题**  
此前仍有 `{{DATE}}`、`{{MAX_SELF_CORRECTION}}` 一类未渲染占位符残留在正式 skill/shared 文档中，会降低契约文档可信度。

**完成情况**
- 已清理当前发现的正式占位符
- 已补治理测试，禁止正式文档再次带入未渲染模板值

**剩余关注**
- 新增文档仍需走同一门禁；这类问题更适合作为持续治理项，而不是再单独开一轮整改

---

## 5. 明确不应继续作为当前整改主项的问题

以下问题在旧报告里被写得过重，但按当前仓库状态，不应再继续作为主要整改驱动：

1. **`REMOVED_SKILLS` 数据污染**
   - 当前真源中并未看到产物路径污染
   - 旧报告属于事实错误

2. **`RUNTIME_COMMANDS` 必须覆盖全部 CLI 命令**
   - 当前 runtime 命令集与 skill 路由集是两套概念
   - 不能简单用“未覆盖全部 CLI”推导出 P0 阻断

3. **`catchup` 两个问题都属于已证明阻断**
   - 目前更准确的定级应是治理缺口/高优先级文档契约问题

4. **`orchestrate` 缺 07_release/08_done = 运行时无法推进**
   - 当前更准确的表述是：文档责任链未完全显式收口
   - 不是已证实的运行时不可用

---

## 6. 建议整改顺序

### 当前阶段：进入持续治理

1. 新增或修改 skill 时，继续遵守 frontmatter / shared contract / reference layering 门禁
2. 新实现若补齐 `code` 目标态能力，应先补测试再回写文档
3. 若 `status` 需要追平更多模板字段，应在现有 CLI 之上增量扩展，不回退已建立的实现级门禁

---

## 7. 最终判断

如果以“当前项目的所有 skills 能否稳定被宿主发现、加载，并在多 skill 编排下长期工作”为标准，那么：

- **文档层 discovery governance 已完成第一轮收口**
- **控制面、汇总面与共享契约的高优先级整改项已完成当前最小闭环**
- **后续重点转为持续治理与新增变更回归**

换句话说，后续整改应从“文档润色模式”切换到“门禁治理模式”。
