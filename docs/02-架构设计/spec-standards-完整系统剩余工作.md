# spec-standards 完整系统剩余工作

本文从“以终为始”的角度说明：当前 `spec-standards` MVP 已经完成轻量闭环，但距离“最终完整规范系统 v1”还需要补齐哪些能力。

当前状态判断：

```text
MVP 目标达成：是
可以进入真实项目 dogfood：是
可以作为最终完整规范系统发布：还不够
```

当前已经具备：

```text
从项目事实生成规范草案
→ 人工确认
→ 沉淀正式规范
→ 建索引
→ plan/work/review 按需加载
→ check/refresh 做辅助闭环
```

尚未完全具备：

```text
跨团队共享规范仓库
→ 规范 normalize/sync
→ 更强 Profile Registry
→ 更成熟的规范检查
→ 规范随代码长期演进的自动化闭环
```

## 1. 总体差距判断

| 最终目标 | 当前产物支撑 | 判断 |
| --- | --- | --- |
| 基于 `spec-graph-bootstrap` 产物提升规范生成质量 | `.spec-first/workflows/spec-standards/**` 中有 `evidence-map.json`、`detected-profiles.json`、`preview.md`、`drafts/**` | 基本达到 MVP |
| 生成真正的规范文档，而不是 repo-profile 摘要 | `docs/specs/**/*.md` 正式规范资产 | 达到 |
| 人工确认后才正式生效 | proposal run + `promote-report.json` + `docs/specs/**` | 达到 |
| 支持手动规范接入 | `docs/specs/custom/**`、无 frontmatter 文档可索引 | 部分达到，缺 normalize 命令 |
| 高效索引，避免全量加载 | `docs/specs/_index/specs-index.json`、`rules-map.json` | 达到 MVP |
| LLM / workflow 按需加载规范 | `.spec-first/workflows/<consumer>/<task-id>/{resolve-result.json,implement.jsonl,check.jsonl}` | 达到 MVP |
| 规范检查 | `docs/specs/reports/spec-check-report.*`、`spec-check/**` context | 部分达到，当前是 review-assistance |
| 规范刷新 | `refresh --index-only`、`refresh --changed/files` proposal request | 部分达到，changed refresh 不直接改规范 |
| 团队共享规范 | `docs/specs/**` 可提交共享 | 基础达到，shared standards repo / attach / pinned ref 未实现 |
| 完整规范资产治理系统 | schema、index、proposal、resolve、check、refresh 初步闭环 | 未完全达到 |

## 2. P0：真实项目 Dogfood 与质量评估

这是最先做的工作。当前结构已经完整，但规范草案质量还没有足够真实项目验证。

| 工作 | 目标 | 产物 |
| --- | --- | --- |
| 在 `spec-first` 自身跑完整 `$spec-graph-bootstrap → $spec-standards → promote → resolve/check/refresh` | 验证草案是否真的有用 | dogfood 报告 |
| 在参考项目 `Trellis-0.5.0-beta.8` 跑同样流程 | 验证非本项目、真实复杂项目适配性 | 跨项目验证报告 |
| 在 `spec-kit` 跑同样流程 | 验证 constitution / specs / plan / tasks 类项目的规范抽取能力 | 对照报告 |
| 对比 CRG-first 与 direct-only 草案 | 验证 CRG 是否真正提升规范质量 | A/B quality report |
| 统计草案采纳率 | 判断生成内容是否值得 promote | adoption metrics |

最低通过标准：

```text
1. CRG-first 草案明显优于 direct-only
2. promote 后的 docs/specs/** 能提升 plan/work/review 质量
3. rejected / uncertain / conflict 分类有实际帮助
4. 人工编辑成本可接受
5. 不出现“把代码现状错误写成规范”的高频问题
```

## 3. P1：Profile Registry 做实

当前 detected profiles 还偏轻，只能支撑 MVP。最终系统需要更明确地识别不同端、语言、框架和路径归属。

| 工作 | 目标 | 产物 |
| --- | --- | --- |
| 定义 profile registry schema | 固化 profile contract | `docs/contracts/specs/profile-registry-v1.schema.json` |
| 内置 common/backend/frontend/mobile/desktop profile | 支持多端项目 | `src/cli/commands/specs/profiles/**` 或等价目录 |
| 支持 path rules | 让 resolve 更准 | `profiles.json` 增强 |
| 支持 profile evidence | profile 为什么被识别出来可审计 | `detected-profiles.json` 增强 |
| 支持 profile confidence | 不确定时不强行加载 | `confidence=low/medium/high` |

Profile Registry 应做：

```text
路径、语言、框架、端类型的确定性辅助
```

Profile Registry 不应做：

```text
替 LLM 判断规范是否应该成为团队长期约束
```

## 4. P1：Manual Standards Normalize

当前已经支持用户直接放 Markdown 并索引，但最终系统需要更好地接入人工规范。

| 工作 | 目标 | 产物 |
| --- | --- | --- |
| `spec-first specs normalize <file>` | 给无 frontmatter 文档补 metadata 草案 | normalize proposal / patch |
| `spec-first specs validate --fix-preview` | 只生成修复建议，不直接改 | validate report |
| 支持人工确认 normalize | 避免工具误改人工规范 | confirm flow |
| 给 custom/manual 更明确优先级 | 团队规范优先 | index priority 稳定 |
| 支持 summary 抽取 | resolve 时可只读 Summary | `Summary for Agent` 补齐 |

关键边界：

```text
normalize 可以建议 metadata；
但不应擅自改写人工规范正文。
```

## 5. P2：Refresh Changed 接入完整 proposal 流程

当前 `refresh --changed/files` 只生成 proposal request，这是正确边界。下一步需要让它顺畅接入 `$spec-standards` 主流程。

| 工作 | 目标 | 产物 |
| --- | --- | --- |
| `$spec-standards` 可读取 refresh request | 从 changed refresh 请求继续生成草案 | proposal run |
| refresh request 到 proposal payload 的转换规则 | 稳定 LLM 输入 | prompt / skill contract |
| refresh adoption report | 记录哪些变更最终进入规范 | adoption metrics |
| 保持不覆盖 manual/custom | 保护人工规范 | overwrite guard |
| changed refresh 质量评估 | 判断是否真的发现规范演进点 | refresh quality report |

继续保持：

```text
refresh --changed/files 不直接改写 docs/specs/**。
真正进入正式规范仍需要 proposal → human promote。
```

## 6. P2：Sync Host Instructions

最终系统需要把入口同步到 `AGENTS.md` / `CLAUDE.md` / Cursor rules，但不能复制规范正文。

| 工作 | 目标 | 产物 |
| --- | --- | --- |
| `spec-first specs sync` | 同步规范入口说明 | managed block |
| 只写 start/end marker 区域 | 避免破坏用户内容 | safe update |
| 不复制规范正文 | 避免 host 文件膨胀和双真相源 | compact instruction |
| 写入加载策略 | 告诉 agent 先读 index 再 resolve | host guidance |
| 支持 dry-run | 可审查 diff | sync preview |

sync 应只写类似：

```text
本项目规范源位于 docs/specs/**
先读 docs/specs/_index/specs-index.json
不要全量读取 docs/specs/**
custom/manual 优先
如发现新约定，运行 refresh --changed
```

sync 不应写：

```text
完整 API 规范
完整测试规范
完整团队规范正文
```

## 7. P3：Shared Standards Repo / Attach

这是团队之间共享规范的关键能力。当前 `docs/specs/**` 可以随项目 Git 共享，但还不支持外挂共享规范仓库。

| 工作 | 目标 | 产物 |
| --- | --- | --- |
| `spec-first specs attach <git-url> --ref <sha/tag>` | 挂载共享规范仓库 | `.spec-first/standards/adoptions/*.json` |
| pinned ref | 保证可复现 | `ref`、`resolved_sha` |
| read-only import | 防止双真相源 | local adoption record |
| conflict report | 本地 custom 和 shared 冲突时提示人工判断 | `docs/specs/reports/shared-standards-conflicts.*` |
| shared index merge | 让 resolve 可看见 shared summary | merged resolve input |
| credential redaction | 不泄露私有 Git 信息 | redacted reports |

核心原则：

```text
shared standards repo 不能成为第二个真相源。
```

推荐模型：

```text
shared repo = 外部只读输入
target repo = 采用记录 + 本地覆盖 + 最终 resolve 入口
docs/specs/custom/** = 最高优先级
```

## 8. P3：更成熟的 Check / Refresh 闭环

当前 `check` 是 review-assistance，`refresh --changed` 是 proposal request。最终系统可以增强，但仍应保持 light contract。

| 工作 | 目标 | 产物 |
| --- | --- | --- |
| check report 引入 source evidence | 每个 review item 标注来自规范 / diff / test / CRG | richer report |
| 支持 changed files + rules map 更精准匹配 | 降低噪音 | check context |
| 支持 LLM review prompt contract | 让 reviewer 明确如何使用 check report | skill prose |
| refresh request 接入 `$spec-standards` 主流程 | 形成 changed refresh 闭环 | refresh proposal run |
| refresh 不覆盖 manual/custom | 保护人工规范 | overwrite guard |
| refresh adoption report | 记录哪些变更最终进入规范 | adoption metrics |

仍然不建议做成强规则引擎：

```text
manual critical/high 可以给 blocking_suggestion
但 hard_gate 仍应保持 false
最终判断交给 LLM/reviewer + human
```

## 9. 发布前横向工作

| 工作 | 目标 |
| --- | --- |
| 完整 CLI help 文档 | 用户知道每个命令何时用 |
| artifacts map 完整覆盖 | 所有产物路径有说明 |
| schema fixtures 覆盖所有关键 artifact | 防 contract 漂移 |
| smoke / integration / e2e 覆盖主链路 | 发布前稳定 |
| 迁移说明 | 老用户如何从无 standards 升级 |
| 示例项目 | 展示真实 `docs/specs/**` 长什么样 |
| 安全 redaction 审计 | 不泄露本地绝对路径、token、私有 Git URL |
| 性能 / token 预算评估 | resolve 不退化成全量读取 |

## 10. 建议实施顺序

推荐顺序：

```text
P0: Dogfood + 质量评估
P1: Profile Registry 做实
P1: Manual normalize
P2: Refresh changed 接入完整 $spec-standards proposal 流程
P2: Sync host instructions
P3: Shared standards repo attach
P3: 更强 check / refresh metrics
```

原因：

```text
如果草案质量没有验证，shared repo 只是在共享不确定内容；
如果 profile 不准，resolve/check 会噪音高；
如果 manual normalize 不好，团队已有规范接入体验会差。
```

## 11. 最小可发布完整版标准

达到下面条件后，才可以说是“完整规范系统 v1”：

```text
1. 至少 3 个真实项目 dogfood 通过
2. CRG-first 质量优于 direct-only 有记录
3. backend/frontend/common profile registry 可用
4. manual markdown 可 validate / normalize / index
5. resolve 能稳定按任务加载 full/summary/reference
6. check report 对 reviewer 有实际帮助且噪音可控
7. refresh --changed 能顺畅进入 proposal → promote 流程
8. sync 只写入口说明，不复制规范正文
9. shared standards repo 有只读 attach + pinned ref + conflict report
10. 所有 artifact 有 schema/fixture/contract test 或明确不需要 schema
```

当前状态已经完成第 5 条的大部分，以及第 6、7 条的 MVP 版本。真正要补的是：

```text
质量验证
Profile Registry
manual normalize
sync
shared attach
```

