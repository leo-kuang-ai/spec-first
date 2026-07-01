# Team Knowledge Git Init 优化版需求

```yaml
date: 2026-07-01
topic: team-knowledge-git-init
spec_id: 2026-07-01-003-team-knowledge-git-init
status: ready-for-planning
version: v1-optimized
```

---

## 1. Summary

为 `spec-first init` 增加一个可选的团队公共知识 Git 源加载能力。

用户在首次初始化业务项目时，可以显式输入团队知识仓库 Git URL、ref 和要启用的知识包。`spec-first` 将团队知识仓库 clone 到用户级全局目录的一份共享 checkout，并在业务项目中写入可提交的 `docs/knowledge/sources.yaml`。后续 workflow 运行时，通过项目 `sources.yaml` 和用户级 `~/.spec-first/knowledge/registry.json` 找到本机知识 checkout，再通过统一 Knowledge Intake Resolver 按任务画像加载少量高相关 advisory cards。

v1 目标不是建设完整知识平台，也不是把团队知识强制注入所有项目，而是建立一个最小闭环：

```text
团队知识 Git 仓库
  → spec-first init 显式接入
  → 用户级共享 checkout
  → 项目级 sources.yaml 引用
  → 统一 resolver 少量召回 advisory cards
  → Plan / Work / Code Review / Debug 消费
  → 运行时记录 source snapshot
```

v1 明确不做自动 pull、不写项目级 `knowledge-lock.json`、不引入 RAG / MCP / 数据库、不执行知识仓库脚本、不自动晋升 shared standard、不把业务流程和项目画像作为默认共享知识加载对象。

---

## 2. Problem Frame

团队希望把 Bug 经验、排查手册、Review checklist、AI 编码规范等 AI 辅助研发知识沉淀为团队共享资产，而不是散落在每个业务项目、个人文档或单次对话中。

`spec-first` 已有 Knowledge Harness 边界：

```text
file-first
recall-as-advisory
verified promotion
```

但目前还缺一个稳定入口，让团队公共知识库能够被业务项目发现、引用、校验和按边界消费。

真实团队知识不应该打进 `spec-first` npm 包，也不应该默认复制进每个业务项目。更合适的 v1 形态是：

```text
团队知识本身作为独立 Git 工程治理；
开发者本机只缓存一份共享 checkout；
多个业务项目通过 docs/knowledge/sources.yaml 引用同一团队知识源；
workflow 通过统一 resolver 少量加载经验卡；
经验卡默认 advisory，不能直接成为 confirmed 事实。
```

团队公共知识库也不能替代项目内知识。项目内 `docs/standards/**` 和 `docs/solutions/**` 仍然分别承载项目 confirmed standards 和项目经验沉淀。团队公共知识 Git 仓库只承载跨项目可复用的 shared standards 与 shared experiences。`spec-first` 只交付接入机制、schema、resolver、校验器、trust 边界和 workflow 消费合同，不拥有真实业务知识。

---

## 3. v1 Design Goal

v1 聚焦一个可落地的最小目标：

> 建立团队知识 Git 源的可发现、可校验、可引用、可解析、可追溯闭环；首批只让 Bug / Review / Debug 经验以 advisory cards 形式进入 Plan、Work、Code Review、Debug 四个核心 workflow。

v1 重点覆盖两类知识：

| 知识类型                      | v1 处理方式                                                        |
| ------------------------- | -------------------------------------------------------------- |
| Bug / Review / Debug 经验   | 首批支持自动召回，默认 advisory                                           |
| 代码开发规范 / Review 规范 / 测试规范 | 支持 Git 仓结构校验、项目显式采用记录和后续 hard context 预留；v1 默认不自动 hard enforce |

v1 不默认加载：

```text
业务流程
领域规则
项目画像
长期业务 wiki
产品知识库
```

当 workflow 需要理解业务流程时，必须优先读取当前项目代码、接口、测试、PRD、日志或 owner 输入。团队共享知识只能作为历史风险提醒，不能替代当前项目事实。

---

## 4. Non-goals

v1 不做以下事情：

```text
1. 不做 knowledge sync / knowledge update-lock。
2. 不自动 git pull，不静默推进 ref。
3. 不写项目级 knowledge-lock.json。
4. 不按 commit 创建隔离 checkout。
5. 不复制真实知识正文进业务项目。
6. 不把团队知识打进 spec-first npm 包。
7. 不引入 RAG / MCP / 数据库。
8. 不执行知识仓库内脚本、hooks、二进制文件。
9. 不自动召回所有 workflow。
10. 不把 advisory cards 自动晋升为 confirmed rule。
11. 不迁移、复制或集中管理项目 docs/solutions/**。
12. 不把 shared standards 自动注入所有项目。
13. 不把业务流程、领域 wiki 或项目画像作为默认共享知识加载对象。
```

---

## 5. Actors

| Actor                         | 说明                                                                    |
| ----------------------------- | --------------------------------------------------------------------- |
| A1. 项目初始化用户                   | 在业务项目中运行 `spec-first init`，决定是否加载团队公共知识库                              |
| A2. 业务项目仓库                    | 保存团队知识源引用，不保存知识正文和本机绝对路径                                              |
| A3. 团队知识 Git 仓库               | 保存 `catalog.yaml`、taxonomy、packs、manifest、cards，是团队知识 source-of-truth |
| A4. 用户级 spec-first 目录         | 保存共享知识 checkout 和本机 registry                                          |
| A5. Knowledge Intake Resolver | 统一解析 sources、registry、catalog、manifest、cards，并输出少量 advisory cards     |
| A6. 后续 spec-first workflow    | 通过 resolver 消费知识，把 cards 作为风险提醒、检查清单或根因假设                             |

---

## 6. Key Decisions

1. 团队知识仓库是独立 Git 工程，是团队知识 source-of-truth。
2. v1 只保留 `shared-latest` 模式：同一用户机器上一份共享 checkout，多个业务项目共同引用。
3. 业务项目只提交 `docs/knowledge/sources.yaml`，不提交本机缓存路径，不默认复制知识正文。
4. 本机 checkout 路径只记录在 `~/.spec-first/knowledge/registry.json`。
5. `init` 只做首次加载和 ensure，不做自动更新。
6. cards 默认 `advisory`，不得绕过 Knowledge Harness 的 recall trust boundary。
7. workflow 消费知识前必须先构造任务画像，至少包含 stage。
8. v1 首批接入 resolver 的 workflow 只包括 `$spec-plan`、`$spec-work`、`$spec-code-review`、`$spec-debug`。
9. 每次 workflow 消费团队知识时，必须记录本次 source snapshot，包括 ref、resolved commit、pack、card id、card version 和 trust。
10. shared standard 只有经过 owner review、lifecycle active、scope 命中，并被项目显式 adoption 后，才能作为 hard context。
11. 项目内 `docs/standards/**` 和 `docs/solutions/**` 跟随项目走；团队公共知识仓库只承载跨项目 shared standards 与 shared experiences。
12. 共享经验只能提醒；项目经验只在当前项目 recall；跨项目强约束必须通过 standards governance 和项目显式采用。

---

## 7. Key Flows

### F1. 首次 init 加载团队公共知识库

**Trigger:** 用户在业务项目中运行 `spec-first init`，并在“是否加载团队知识库”问题中选择 Yes。

**Steps:**

```text
1. 用户输入 Git URL、ref 和 pack 列表。
2. spec-first 规范化 Git URL + ref，计算 source_hash。
3. spec-first clone 到用户级共享 checkout。
4. checkout 到用户选择的 ref。
5. 校验 catalog.yaml、pack manifest、card frontmatter 和安全读取边界。
6. 校验通过后，原子写入项目级 docs/knowledge/sources.yaml。
7. 写入用户级 ~/.spec-first/knowledge/registry.json。
8. 输出 source id、ref、pack、checkout 路径和 resolved commit。
```

**Outcome:**
业务项目记录团队公共知识源，用户本机有一份可被多个项目共用的知识 checkout。

---

### F2. init 检测已有知识配置

**Trigger:** 用户再次运行 `spec-first init`，业务项目已存在 `docs/knowledge/sources.yaml`。

**Steps:**

```text
1. spec-first 展示已配置 source。
2. 查询用户级 registry.json。
3. 如果本地 checkout 存在，则复用。
4. 如果本地 checkout 缺失，则询问是否重新 clone。
5. v1 不自动 pull、不推进 ref、不改写知识仓内容。
```

**Outcome:**
已配置项目可以复用团队共享知识 checkout。

---

### F3. workflow 运行时解析本地知识路径

**Trigger:** `$spec-plan`、`$spec-work`、`$spec-code-review`、`$spec-debug` 需要加载团队经验卡。

**Steps:**

```text
1. workflow 构造任务画像：stage、surface、domain、trigger、paths。
2. resolver 读取项目 docs/knowledge/sources.yaml。
3. resolver 用 source id / url / ref 查询用户级 registry.json。
4. resolver 获取 checkout_path。
5. resolver 读取 catalog.yaml、pack manifest 和 cards。
6. resolver 按 stage / surface / domain / trigger / paths 过滤排序 cards。
7. resolver 默认最多返回 5 张高相关 advisory cards。
8. resolver 输出 included cards、excluded_context、source_snapshot 和 conflicts。
9. workflow 将 cards 作为 advisory 上下文消费。
```

**Outcome:**
workflow 可以稳定找到团队公共知识本地路径，但不会把经验卡直接当作 confirmed rule。

---

### F4. skill 节点按任务画像加载经验卡

**Trigger:** 某个允许消费团队知识的 `$spec-*` workflow 进入计划、开发、评审或排障阶段。

**Steps:**

```text
1. 识别当前 stage。
2. 从用户请求、origin artifact、diff、路径或任务文本中提取 surface、domain、trigger。
3. 调用统一 Knowledge Intake Resolver。
4. 只加载少量高相关 cards。
5. 记录 used cards 和 excluded candidate reason。
6. 把 cards 作为风险提醒、检查清单或根因假设消费。
7. 如 workflow 输出 confirmed 结论，必须回源到当前 source、test、log、doc 或人工确认。
```

**Outcome:**
不同 skill 使用同一套知识解析与 trust 边界，而不是各自发明读取规则或全量扫描知识库。

---

### F5. 项目经验晋升为团队共享经验或规范

**Trigger:** 某个项目通过 `$spec-compound` 或 `$spec-compound-refresh` 在 `docs/solutions/**` 中沉淀的问题经验被多次复用，或 owner 判断它具有跨项目价值。

**Steps:**

```text
1. 项目经验先保持在项目 docs/solutions/**。
2. 如果具备跨项目复用价值，提炼为团队知识仓库中的 shared experience card。
3. 如果需要成为强约束，进入 team standards governance。
4. owner review 通过后，成为 shared standard。
5. 项目如需 hard enforce，需要在 docs/standards/adoptions.yaml 中显式采用。
```

**Outcome:**
项目经验不会自动污染全团队，团队共享知识也不会越过项目 source-of-truth 和 owner 决策。

---

## 8. Recording Surfaces

| Surface                  | Path                                           | Owned by | Should record                                                                                             | Must not record                                              |
| ------------------------ | ---------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| 用户级共享 checkout           | `~/.spec-first/knowledge/repos/<source-hash>/` | 当前开发者机器  | 团队知识 Git 仓库的一份 checkout                                                                                   | 项目启用策略、业务项目绝对路径、项目 durable knowledge                         |
| 用户级知识 registry           | `~/.spec-first/knowledge/registry.json`        | 当前开发者机器  | `schema_version`、source id、type、规范化 Git URL、ref、source_hash、checkout_path、last_checked_at、resolved_commit | token、项目 owner 决策、项目启用列表                                     |
| 项目级知识源配置                 | `docs/knowledge/sources.yaml`                  | 业务项目仓库   | source id、type、Git URL、ref、`load_mode: shared-latest`、启用 packs、默认 trust                                   | checkout_path、`~/.spec-first/**`、本机绝对路径、resolved commit lock |
| 项目级 shared standard 采用记录 | `docs/standards/adoptions.yaml`                | 业务项目仓库   | 项目显式采用的 shared standard、scope、version_range、owner、enforcement                                             | 团队知识正文、本机路径                                                  |
| 运行时 source snapshot      | workflow 产物 / context bundle                   | 当前执行产物   | 本次实际使用的 source id、ref、resolved commit、pack、card id、card version、trust                                     | 不作为项目长期 lock，不改写 sources.yaml                                |
| 开发者 profile              | `~/.spec-first/.developer`                     | 当前开发者机器  | 开发者姓名、语言、用户级偏好                                                                                            | 团队知识 Git 源、checkout 路径、项目启用列表                                |

---

## 9. Project Configuration

### 9.1 `docs/knowledge/sources.yaml`

项目级 `sources.yaml` 是团队协作的可提交 contract。它说明项目从哪里加载团队知识，但不记录本机绝对路径，也不记录 resolved commit lock。

```yaml
schema_version: 1

sources:
  - id: team-ai-knowledge
    type: git
    url: git@git.example.com:arch/team-ai-knowledge.git
    ref: main
    load_mode: shared-latest
    trust_default: advisory

    enabled_packs:
      - bug-experience
      - code-review
      - debug-playbook

    disabled_packs:
      - domain-wiki
      - project-profile
```

规则：

```text
1. sources.yaml 可以提交到业务项目 Git。
2. sources.yaml 不得保存 checkout_path。
3. sources.yaml 不得保存 ~/.spec-first/**。
4. sources.yaml 不得保存 token。
5. sources.yaml 不得被用户级 registry 反向覆盖。
```

---

### 9.2 `docs/standards/adoptions.yaml`

项目显式采用 shared standard 时，必须记录在 adoption manifest 中。

```yaml
schema_version: 1

adopted_shared_standards:
  - source_id: team-ai-knowledge
    standard_id: coding-money-bigdecimal
    version_range: "^1.0.0"
    lifecycle: active

    scope:
      paths:
        - "src/**"
      modules:
        - account
        - order

    enforcement: hard
    adopted_by: architecture-team
    adopted_at: 2026-07-01
```

规则：

```text
1. 没有 adoption 记录的 shared standard 不得作为 hard context。
2. adoption 必须声明 scope。
3. adoption 必须声明 enforcement。
4. shared standard 与项目 standard 冲突时，workflow 不得自动裁决。
```

---

## 10. Team Knowledge Repo Structure

团队知识仓库建议使用以下最小结构：

```text
team-ai-knowledge/
  catalog.yaml

  packs/
    bug-experience/
      manifest.yaml
      cards/
        field-mapping-null.md
        enum-compatibility.md
        amount-precision.md

    code-review/
      manifest.yaml
      cards/
        api-field-review.md
        transaction-review.md

    debug-playbook/
      manifest.yaml
      cards/
        log-tracing.md
        cache-inconsistency.md

    shared-standards/
      manifest.yaml
      standards/
        money-bigdecimal.md
        api-compatibility.md

  taxonomy/
    surfaces.yaml
    domains.yaml
    triggers.yaml
    stages.yaml

  schemas/
    catalog.schema.json
    manifest.schema.json
    card.schema.json
    standard.schema.json

  examples/
    sources.yaml
    adoptions.yaml
```

---

## 11. Minimum Schema

### 11.1 `catalog.yaml`

```yaml
schema_version: 1
source_id: team-ai-knowledge
source_type: git
title: 团队 AI Coding 知识仓库

default_packs:
  - bug-experience
  - code-review

packs:
  - id: bug-experience
    type: experience-cards
    path: packs/bug-experience/manifest.yaml
    trust_default: advisory

  - id: code-review
    type: experience-cards
    path: packs/code-review/manifest.yaml
    trust_default: advisory

  - id: shared-standards
    type: shared-standards
    path: packs/shared-standards/manifest.yaml
    trust_default: confirmed_after_adoption
```

---

### 11.2 `manifest.yaml`

```yaml
schema_version: 1
pack_id: bug-experience
type: experience-cards
title: Bug 经验卡
lifecycle: active
cards_path: cards

default_max_cards: 5

supported_stages:
  - plan
  - work
  - code-review
  - debug

supported_surfaces:
  - app
  - backend
  - frontend
  - database

supported_domains:
  - interface
  - display
  - transaction
  - permission
  - cache
```

---

### 11.3 Experience Card Frontmatter

```yaml
id: bug-field-mapping-null
title: 字段映射空值处理经验
type: experience
trust: advisory
lifecycle: active
version: 1.0.0

surface:
  - app
  - backend

domain:
  - interface
  - display

trigger:
  - field_mapping
  - null_handling

applies_to:
  - plan
  - work
  - code-review
  - debug

severity: medium
owner: qa-team
updated_at: 2026-07-01

source_refs:
  - type: bug
    id: BUG-123
    description: 历史字段映射空值问题
```

---

### 11.4 Shared Standard Frontmatter

```yaml
id: coding-money-bigdecimal
title: 金额字段 BigDecimal 规范
type: shared-standard
trust: confirmed_after_adoption
lifecycle: active
version: 1.0.0

scope:
  language:
    - java
  domain:
    - financial
  paths:
    - "**/service/**"
    - "**/domain/**"

severity: must
owner: architecture-team
reviewed_by:
  - qa-team
  - security-team
updated_at: 2026-07-01

evidence_required:
  - unit_test
  - boundary_case
  - code_review_check
```

---

## 12. Knowledge Scope Governance

团队知识治理分为四类。workflow 不得混用它们的 trust 和 source-of-truth。

| Knowledge type      | Source                                        | Default trust              | Scope | Consumer rule                                                                 |
| ------------------- | --------------------------------------------- | -------------------------- | ----- | ----------------------------------------------------------------------------- |
| Shared standards    | `team-ai-knowledge/packs/shared-standards/**` | `confirmed_after_adoption` | 跨项目   | 只有 owner reviewed、lifecycle active、scope 命中、项目显式 adoption 后，才可作为 hard context |
| Project standards   | `docs/standards/**`                           | confirmed                  | 当前项目  | 优先于共享经验；按项目标准合同消费                                                             |
| Shared experiences  | `team-ai-knowledge/packs/*/cards/*.md`        | advisory                   | 跨项目   | 只作为风险提醒、checklist 或 hypothesis；必须回源确认                                         |
| Project experiences | `docs/solutions/**`                           | advisory                   | 当前项目  | 跟随项目仓库演进；可 recall，但不自动晋升为团队共享知识                                               |

消费优先级必须保持：

```text
当前用户指令 / 当前需求 / 当前源码 / 当前测试 / 当前日志
  > 项目 confirmed standards
  > 项目显式采用的共享 confirmed standards
  > 项目 experiences
  > 共享 experiences
```

冲突处理规则：

```text
1. 当 shared standard 与 project standard 冲突时，workflow 不得自动裁决。
2. workflow 必须记录 conflict、source refs、affected scope 和 owner next action。
3. 冲突解决前，不得 hard enforce 任一方。
```

---

## 13. Knowledge Intake Resolver Contract

所有消费团队知识的 workflow 必须通过统一 Knowledge Intake Resolver。

### 13.1 Resolver Input

```json
{
  "stage": "plan",
  "surface": ["app", "backend"],
  "domain": ["interface"],
  "trigger": ["field_mapping", "compatibility"],
  "paths": ["app/src/**"],
  "max_cards": 5,
  "allowed_pack_types": ["experience-cards"]
}
```

字段说明：

| Field              | Required | Description                                     |
| ------------------ | -------- | ----------------------------------------------- |
| stage              | 是        | 当前 workflow stage，如 plan、work、code-review、debug |
| surface            | 否        | app、backend、frontend、database 等                 |
| domain             | 否        | interface、transaction、permission、cache 等        |
| trigger            | 否        | field_mapping、null_handling、compatibility 等     |
| paths              | 否        | 当前任务涉及路径                                        |
| max_cards          | 否        | 默认 5                                            |
| allowed_pack_types | 否        | v1 默认 `experience-cards`                        |

---

### 13.2 Resolver Output

```json
{
  "source_snapshots": [
    {
      "source_id": "team-ai-knowledge",
      "url": "git@git.example.com:arch/team-ai-knowledge.git",
      "ref": "main",
      "resolved_commit": "abc1234",
      "load_mode": "shared-latest"
    }
  ],
  "included_cards": [
    {
      "id": "bug-field-mapping-null",
      "title": "字段映射空值处理经验",
      "trust": "advisory",
      "version": "1.0.0",
      "reason": "matched stage=plan, trigger=field_mapping",
      "source_ref": "packs/bug-experience/cards/field-mapping-null.md"
    }
  ],
  "excluded_context": [
    {
      "id": "bug-cache-refresh",
      "reason_code": "trigger_not_matched"
    }
  ],
  "conflicts": []
}
```

输出要求：

```text
1. 必须包含 source_snapshots。
2. 必须包含 included_cards。
3. 必须复用 excluded_context + reason_code 记录未加载候选。
4. 如发现 shared standard 与 project standard 冲突，必须输出 conflicts。
5. included card 必须保留 trust，不得被 workflow 静默升级为 confirmed。
```

---

## 14. Skill Knowledge Usage

v1 首批真正接入 resolver 的 workflow 只有四个：

| Workflow            | Stage       | Knowledge usage boundary                                                  |
| ------------------- | ----------- | ------------------------------------------------------------------------- |
| `$spec-plan`        | plan        | 可读取 Bug / Review / Debug 经验卡，把 cards 转成风险、实现单元、测试场景和验证重点；必须保留 advisory 来源 |
| `$spec-work`        | work        | 读取与当前 implementation unit 相关的 cards，作为开发前自检和完成前 checklist                 |
| `$spec-code-review` | code-review | 读取 Bug / Review 经验形成 review lens；finding 必须回到 diff、source、test 或 log 证据   |
| `$spec-debug`       | debug       | 读取 Bug / Debug 经验生成根因假设与排查顺序；结论必须由复现、日志、源码或测试确认                           |

其他 workflow v1 只保留消费边界，不自动接入 resolver：

| Workflow                 | v1 行为                                    |
| ------------------------ | ---------------------------------------- |
| `using-spec-first`       | 不读取团队知识库，只做入口路由                          |
| `$spec-brainstorm`       | 暂不自动读取团队知识，避免历史经验影响需求发散                  |
| `$spec-prd`              | 暂不自动读取团队知识，避免 cards 发明产品需求               |
| `$spec-write-tasks`      | 只消费 plan 已选定或已引用的 cards，不重新扩大 scope      |
| `$spec-compound`         | 可产出 card 草稿或 contribution 建议，不直接写团队仓     |
| `$spec-compound-refresh` | 后续版本再接入，用于 card 刷新、合并、废弃                 |
| `$spec-doc-review`       | 后续版本再接入，用于检查文档是否误把 advisory 写成 confirmed |
| `$spec-skill-audit`      | 后续版本再接入，用于审查 skill 是否遵守知识边界              |

---

## 15. Security Boundary

`spec-first` 加载团队知识仓库时，必须遵守以下安全边界：

```text
1. 不执行知识仓库内任何脚本、hook、二进制或自定义命令。
2. 只读取 catalog / manifest 声明范围内的 Markdown、YAML 和可选 CSV。
3. 忽略 symlink。
4. 忽略 Git submodule。
5. 忽略 Git LFS 指针对应的大文件内容。
6. 忽略二进制文件。
7. 忽略超出大小限制的文件。
8. 不允许路径穿越。
9. 不读取 checkout 目录外内容。
10. 不保存 token。
11. 不把本机绝对路径写入项目 Git。
```

默认限制：

```text
单个 card 最大：32KB
单个 manifest 最大 cards 数：500
单次 workflow 默认最多加载 cards：5
单次 workflow 硬上限 cards：10
```

---

## 16. Requirements

### Init 交互与输入

* R1. `spec-first init` 在普通 host、语言、目标项目选择之后，必须提供可选问题“是否加载团队知识库”，默认 No。
* R2. 选择 Yes 时，用户必须能输入 Git URL、ref 和要加载的 pack 列表。
* R3. ref 默认可为 `main`。
* R4. pack 列表为空时，使用知识仓库 `catalog.yaml` 声明的 `default_packs`。
* R5. 非交互 `spec-first init -y` 不得默认联网加载知识；只有显式传入知识参数时才允许加载。
* R6. CLI 参数命名建议为 `--knowledge-url`、`--knowledge-ref`、`--knowledge-pack`，多 pack 可重复传入。

---

### 用户级共享缓存

* R7. 团队知识 Git 仓库必须 clone 到用户级全局目录，不写入业务项目源码目录。
* R8. 推荐 checkout 目录为 `~/.spec-first/knowledge/repos/<source-hash>/`。
* R9. `source_hash` 必须基于规范化 Git URL + ref 计算。
* R10. 同一规范化 Git URL + ref 在同一用户机器上只维护一份共享 checkout，多个业务项目共同引用。
* R11. v1 不按 commit 创建隔离目录，也不创建项目专属 checkout。
* R12. 用户级知识 registry 固定路径为 `~/.spec-first/knowledge/registry.json`。
* R13. registry 可以保存本机绝对路径 `checkout_path`。
* R14. registry 不得保存 token。
* R15. 团队知识 Git 源、checkout 路径、项目启用列表不得写入 `~/.spec-first/.developer`。

---

### 项目级配置

* R16. 成功加载后，业务项目必须写入 `docs/knowledge/sources.yaml`。
* R17. `sources.yaml` 必须记录 source id、type、url、ref、`load_mode: shared-latest`、enabled packs、disabled packs 和默认 trust。
* R18. `sources.yaml` 不得记录 `checkout_path`、`~/.spec-first/**`、用户本机绝对路径、token 或 resolved commit lock。
* R19. v1 不写 `knowledge-lock.json`。
* R20. 如果 clone 或结构校验失败，`spec-first` 不得写入半成品 `sources.yaml`。
* R21. 写入 `sources.yaml` 必须使用原子写策略：先写临时文件，全部校验通过后 rename。

---

### 已有配置处理

* R22. 再次运行 `spec-first init` 时，如果发现项目已有 `docs/knowledge/sources.yaml`，必须展示已配置 source。
* R23. v1 只支持 ensure shared checkout exists。
* R24. v1 不得自动 `git pull`、不得推进 ref、不得改写用户已有知识仓库内容。
* R25. 如果本地 checkout 缺失但项目 source 配置存在，可以提示用户重新 clone。
* R26. 是否联网补齐必须由用户显式确认。

---

### 团队知识仓 schema 校验

* R27. 团队知识仓库必须包含 `catalog.yaml`。
* R28. `catalog.yaml` 必须声明 `schema_version`、`source_id`、`source_type`、`packs`。
* R29. 每个 pack 必须包含 `manifest.yaml`。
* R30. `manifest.yaml` 必须声明 `schema_version`、`pack_id`、`type`、`lifecycle` 和 cards 或 standards 路径。
* R31. experience card 必须包含最小 frontmatter：`id`、`title`、`type`、`trust`、`lifecycle`、`version`、`applies_to`。
* R32. shared standard 必须包含最小 frontmatter：`id`、`title`、`type`、`trust`、`lifecycle`、`version`、`owner`。
* R33. v1 首批自动召回只支持 `type: experience-cards`。
* R34. shared standards 在 v1 支持结构校验和 adoption 预留，但默认不自动 hard enforce。

---

### 运行时消费边界

* R35. 后续 workflow 必须通过项目 `docs/knowledge/sources.yaml` 和用户级 `~/.spec-first/knowledge/registry.json` 找到 checkout path。
* R36. workflow 不得从项目配置读取本机绝对路径。
* R37. workflow 不得仅凭用户级 registry 推断项目启用了哪些知识。
* R38. cards 默认作为 `advisory` 候选经验。
* R39. workflow 必须回源到 source、test、log、doc 或人工确认后，才能把结论升为 confirmed。
* R40. 多张 cards 命中时，resolver 必须按 stage、surface、domain、trigger、paths 过滤排序。
* R41. 单次 workflow 默认只加载最多 5 张高相关 cards。
* R42. 未加载候选必须复用 `excluded_context` + `reason_code` 记录排除原因。
* R43. workflow 每次消费团队知识时，必须在输出产物或 context bundle 中记录 source id、url、ref、resolved commit、pack id、card id、card version、trust 和 matched reason。
* R44. v1 不写项目级 knowledge lock，但单次执行必须可追溯。

---

### Skill 知识消费合同

* R45. 允许消费知识的 workflow 必须先构造任务画像，至少包含 stage。
* R46. 任务画像可推断时，应包含 surface、domain、trigger 和 paths。
* R47. workflow 不得在缺少任务画像时全量扫描团队知识库。
* R48. `using-spec-first` 不得读取团队知识库。
* R49. `$spec-plan` 可以把命中的 cards 转化为风险、implementation unit、测试场景和验证重点，但必须保留 advisory 来源。
* R50. `$spec-work` 可以把 cards 作为开发前自检和完成前 checklist。
* R51. `$spec-code-review` 可以把 cards 用作 review lens，但 finding 必须回到当前 diff、source、test 或 log 证据。
* R52. `$spec-debug` 可以把 cards 用作根因假设和排查顺序，但 root cause 必须由复现、日志、源码或测试确认。
* R53. `$spec-write-tasks` v1 只能消费 plan 已引用或已选定的 cards，不得重新扩大产品 scope。
* R54. `$spec-compound` v1 只能产出 card 草稿或 contribution 建议，不得直接写入团队知识仓或晋升 confirmed standard。
* R55. 所有消费知识的 workflow 必须复用统一 Knowledge Intake Resolver。

---

### 知识作用域与治理

* R56. `spec-first` 必须区分 shared standards、project standards、shared experiences 和 project experiences。
* R57. 不得把团队公共知识仓库、项目 `docs/standards/**` 和项目 `docs/solutions/**` 合并成单一知识真相源。
* R58. 项目 `docs/standards/**` 继续作为项目 confirmed standards 的 source surface。
* R59. 项目 `docs/solutions/**` 继续作为项目经验沉淀和 recall source，默认 advisory。
* R60. 团队公共知识仓库可以提供 shared standards 与 shared experiences。
* R61. shared experiences 默认 advisory，只作为风险提醒、checklist 或 hypothesis。
* R62. shared standards 只有经过 owner review、lifecycle active、scope 命中并被项目显式采用后，才能作为项目 hard context。
* R63. 项目采用 shared standard 必须写入 `docs/standards/adoptions.yaml`。
* R64. 知识消费优先级必须保持：当前用户指令 / 需求 / 源码 / 测试 / 日志 > 项目 confirmed standards > 项目显式采用的共享 confirmed standards > 项目 experiences > 共享 experiences。
* R65. 当项目规范与共享规范冲突时，workflow 必须记录 conflict、source refs、affected scope 和 owner next action。
* R66. 冲突解决前，不得自动选择任一规则 hard enforce。
* R67. 项目经验晋升链路必须是：`docs/solutions/**` 项目经验 → shared experience → shared standard proposal → owner-reviewed shared standard。
* R68. 不得从一次 Bug 或单次 review finding 直接晋升为团队 confirmed standard。
* R69. `spec-first` npm 包不得打包真实 shared standards、shared experiences、project standards 或 project experiences。
* R70. `spec-first` 只交付 schema、模板、resolver、校验器和 workflow 消费合同。

---

### 安全要求

* R71. `spec-first` 不得执行知识仓库内脚本、hooks 或任意二进制。
* R72. v1 只读取 YAML、Markdown 和可选 CSV。
* R73. resolver 必须忽略 symlink。
* R74. resolver 必须忽略 Git submodule。
* R75. resolver 必须忽略二进制文件。
* R76. resolver 必须忽略超出大小限制的文件。
* R77. resolver 不得跟随路径穿越。
* R78. resolver 不得读取 checkout 目录外内容。
* R79. 单个 card 默认最大 32KB。
* R80. 单个 pack 默认最多索引 500 张 cards。
* R81. 单次 workflow 默认最多加载 5 张 cards，硬上限 10 张。

---

## 17. Acceptance Examples

### AE1. 首次 init 加载团队知识库

Given 用户在业务项目运行 `spec-first init` 并选择加载团队知识库，
When 输入 Git URL、ref 和 `bug-experience` pack，
Then `spec-first` 将知识仓库 clone 到用户级共享目录，并在项目内写入 `docs/knowledge/sources.yaml`。

Covers: R1, R2, R7, R16

---

### AE2. 非交互 init 不默认联网

Given 用户运行 `spec-first init -y` 且没有传知识参数，
When init 执行，
Then 不发生联网 clone / fetch，也不写 `docs/knowledge/*`。

Covers: R5

---

### AE3. 多项目复用同一 checkout

Given 项目 A 和项目 B 引用同一个团队知识 Git URL + ref，
When 两个项目都加载知识，
Then 它们读取同一份用户级 checkout；本机绝对路径只存在 `~/.spec-first/knowledge/registry.json`，不出现在项目 `sources.yaml` 中。

Covers: R9, R10, R12, R13, R18

---

### AE4. clone 或结构校验失败不写半成品

Given Git 地址不可访问或知识仓库缺少 `catalog.yaml`，
When 用户选择加载知识库，
Then init 报错并不写半成品 `sources.yaml`，也不创建 `knowledge-lock.json`。

Covers: R19, R20, R21, R27

---

### AE5. 再次 init 不自动更新

Given 项目已有 `docs/knowledge/sources.yaml`，
When 用户再次运行 init，
Then `spec-first` 展示已配置 source，只确保共享 checkout 存在，不自动 pull 最新版本。

Covers: R22, R23, R24

---

### AE6. plan 只加载少量 advisory cards

Given `$spec-plan` 命中 6 张经验卡，
When workflow 消费知识，
Then resolver 默认只返回最多 5 张最相关 cards，并把它们标为 advisory；未加载 cards 记录在 `excluded_context` 中。

Covers: R38, R40, R41, R42, R49

---

### AE7. workflow 输出 source snapshot

Given `$spec-code-review` 使用了 3 张团队经验卡，
When review 输出结果，
Then 输出产物必须记录 source id、ref、resolved commit、pack id、card id、card version、trust 和 matched reason。

Covers: R43, R44, R51

---

### AE8. 不执行知识仓脚本

Given 团队知识仓库内含 `setup.sh`、`hooks/` 或自定义脚本，
When `spec-first` 加载并校验该仓库，
Then 只读取 YAML、Markdown 和可选 CSV，不执行仓库内任何脚本、hook 或二进制。

Covers: R71, R72

---

### AE9. using-spec-first 不读取团队知识

Given 用户请求只是询问下一步应该用哪个 workflow，
When `using-spec-first` 判断入口，
Then 它不读取团队知识库，只基于当前请求和 spec-first 路由规则选择入口。

Covers: R48

---

### AE10. review finding 必须回源

Given `$spec-code-review` 命中接口字段和 UI 展示 cards，
When review 输出 finding，
Then finding 必须引用当前 diff、source、test 或 log 证据，不能只引用 card。

Covers: R51

---

### AE11. debug root cause 必须确认

Given `$spec-debug` 命中历史缓存不一致经验卡，
When debug 输出根因，
Then root cause 必须由复现、日志、源码或测试确认，不能只基于经验卡。

Covers: R52

---

### AE12. shared standard 需要项目显式采用

Given 团队知识仓库中存在 `coding-money-bigdecimal` shared standard，
When 项目没有在 `docs/standards/adoptions.yaml` 中显式采用，
Then workflow 不得把该 shared standard 作为 hard context。

Covers: R62, R63

---

### AE13. shared standard 与 project standard 冲突

Given shared standard 和 project standard 对同一金额计算规则冲突，
When workflow 命中两者，
Then 输出 conflict、source refs、affected scope 和 owner next action，不自动选择任一规则。

Covers: R65, R66

---

### AE14. 项目经验不能直接晋升团队规范

Given 某个项目 `docs/solutions/**` 中的 Bug 经验被多次复用，
When 团队想共享它，
Then 先提炼为 shared experience advisory；只有经过 standards governance 和 owner review 后，才可能成为 shared standard。

Covers: R67, R68

---

### AE15. 业务流程仍以当前项目证据为准

Given `$spec-plan` 需要理解某个交易业务流程，
When 团队知识库中存在旧的领域说明但当前项目代码和 PRD 可读取，
Then workflow 必须以当前项目证据为业务事实来源，只把团队 Bug 经验作为风险提醒。

Covers: R61, R64

---

## 18. Success Criteria

v1 成功标准如下：

```text
1. 团队公共知识 Git 仓库可以在首次 init 时被显式加载到用户级全局目录。
2. 业务项目可以提交 docs/knowledge/sources.yaml，团队成员共享同一知识源配置。
3. 同一用户机器上的多个业务项目可以共用同一份团队知识 checkout。
4. 本机绝对路径只保存在 ~/.spec-first/knowledge/registry.json，不进入业务项目 Git。
5. v1 不自动 pull、不写 knowledge-lock.json、不引入 RAG/MCP/数据库。
6. clone / 校验失败时不留下半成品项目配置。
7. catalog / manifest / card schema 有最小校验。
8. resolver 输入输出合同明确。
9. $spec-plan、$spec-work、$spec-code-review、$spec-debug 可以通过统一 resolver 少量加载 advisory cards。
10. workflow 输出 source snapshot，保证单次执行可追溯。
11. shared standards 不会自动 hard enforce，必须项目显式 adoption。
12. 项目 standards、项目 solutions、shared standards、shared experiences 的 source-of-truth、trust 和消费优先级清晰。
13. v1 默认共享知识路径聚焦 Bug / Review / Debug 经验，业务流程仍从当前项目证据读取。
```

---

## 19. Dependencies / Assumptions

```text
1. 依赖用户本机已有 Git 凭据。
2. spec-first 不保存 token。
3. 依赖团队知识仓库遵循 catalog.yaml + packs/<pack-id>/manifest.yaml + cards 的最小结构。
4. 依赖 Knowledge Harness 的 file-first、recall-as-advisory 和 verified promotion 边界。
5. 依赖项目 docs/standards/** 继续作为项目 confirmed standards。
6. 依赖项目 docs/solutions/** 继续作为项目 durable learning，不被团队知识 init 流程接管。
7. 接受 shared-latest 语义：团队知识 ref 后续更新可能影响未来执行结果。
8. v1 通过运行时 source snapshot 保证单次执行可追溯，不提供项目级完全可复现 knowledge lock。
```

---

## 20. Deferred to Planning

以下问题进入 Planning 阶段细化：

```text
1. CLI 参数最终命名：--knowledge-url、--knowledge-ref、--knowledge-pack 是否采用。
2. 多 source 表达方式。
3. source_hash 规范化算法。
4. registry.json 最小字段结构。
5. 原子写入 sources.yaml 的实现方式。
6. Knowledge Intake Resolver 是否提供 internal CLI，例如 spec-first internal knowledge-resolve --json。
7. card 排序算法：stage、surface、domain、trigger、path、severity、updated_at 的权重。
8. excluded_context 输出位置。
9. source snapshot 写入哪个产物：context bundle、plan、review report、debug report 或 evidence。
10. 多 host / workspace / multi-repo 模式是否 v1 降级为 single-repo。
11. shared standard conflict JSON 字段形态。
12. schema 校验深度：只校验必填字段，还是校验 taxonomy 枚举。
13. 团队知识仓 demo 目录是否正式收敛为 packs + taxonomy + schemas。
```

---

## 21. Recommended v1 Implementation Slices

### Slice 1：Init 接入

```text
1. init 交互问题
2. CLI 参数
3. clone 到用户级 checkout
4. registry.json
5. sources.yaml
6. 失败原子回滚
```

### Slice 2：Knowledge Repo Schema

```text
1. catalog.yaml schema
2. manifest.yaml schema
3. card frontmatter schema
4. shared standard frontmatter schema
5. 安全读取校验
```

### Slice 3：Resolver

```text
1. 读取 sources.yaml
2. 查询 registry.json
3. 读取 catalog / manifest / cards
4. 构造 source snapshot
5. 过滤排序 cards
6. 输出 included cards / excluded_context / conflicts
```

### Slice 4：Workflow 接入

```text
1. $spec-plan
2. $spec-work
3. $spec-code-review
4. $spec-debug
```

### Slice 5：Adoption 预留

```text
1. docs/standards/adoptions.yaml schema
2. shared standard discover
3. shared standard not hard enforce by default
4. conflict 输出预留
```

---

## 22. Final Positioning

本需求的最终定位是：

> 为 spec-first 建立团队公共知识 Git 源的初始化、引用、解析和 advisory 消费机制，使团队 Bug 经验、Review 经验、Debug 经验和共享规范可以通过 Git 被治理，通过项目配置被显式采用，通过 resolver 被少量召回，通过 workflow 被可追溯消费。

一句话：

```text
Git 承载团队知识源头，
sources.yaml 承载项目显式引用，
registry 承载本机 checkout 解析，
resolver 承载统一知识 intake，
workflow 承载 advisory 使用，
source snapshot 承载执行可追溯。
```
