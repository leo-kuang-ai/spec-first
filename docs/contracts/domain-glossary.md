# Project Domain Glossary

本文件是 spec-first 项目级 **canonical 领域语言** 的 source-of-truth，但对单次需求 workflow 只作为 advisory calibration source。它解决跨 PRD 术语漂移；它 does not automatically override 当前 Product Contract / PRD-local meaning，也不因文件名、年龄或 canonical 标签静默赢得冲突。

这是 `docs/contracts/` 拓扑下的一个 contract artifact,**不是** 独立的 `CONTEXT.md` 或 `docs/adr/` 文件树。它是 glossary,不是 spec、不是 scratchpad、不是实现决策仓库。

## 定位

- **PRD 内 `## Glossary` section** = 单个 PRD 草稿层的术语,session-local。
- **本文件** = 跨 PRD 晋升后的 canonical 层。一个术语被 ≥2 个 PRD 磨锐过,且用户确认后,才从草稿层晋升到这里。
- 需求 workflow 只输出 candidate-only promotion 记录，不写本文件。实际晋升由后续显式知识维护或文档编辑请求授权；当前产品确认不隐含项目级 mutation 权限。

## 写作纪律

沿用 `skills/spec-prd/references/domain-language-and-decision-ledger.md` 的 Canonical Term Handling:

- **Opinionated**:同一概念多个叫法,选一个 canonical,会让 planning 混淆或不应继续使用的说法进 `avoid`。
- **只收领域专属术语**:本项目/领域独有的概念才进;通用工程概念(timeout、retry、cache、pagination)即使高频也不收。
- **定义 IS not DOES**:一两句说清"它是什么",不写行为、流程或实现。这是 `WHAT not HOW` 在术语粒度的落地。

## 字段契约 (Light contract)

每个术语条目使用下列字段,以 prose 表达,不引入独立 JSON schema 引擎:

| 字段 | 含义 |
|---|---|
| `canonical_name` | 唯一规范术语名 |
| `definition` | 一两句说明它 IS 什么(无实现细节) |
| `avoid` | 应避免的别名或历史说法,防止 planning 混淆;v1 drift 检测只消费此字段 |
| `source_tag` | 证据等级,复用 `confirmed` / `advisory`;不引入第二套 enum |
| `first_seen_prd` | 首次确立该术语的 PRD 路径(repo-relative) |
| `referenced_by` | 引用该术语的 PRD 路径列表(repo-relative) |
| `status` | `active` / `deprecated` / `superseded_by: <canonical_name>` |

`source_tag` 词表应与 active workflow evidence labels 保持一致,不另造枚举。

## 条目格式

```md
### {canonical_name}

{definition — one or two sentences, IS not DOES}

- avoid: {alias1}, {alias2}
- source_tag: confirmed | advisory
- first_seen_prd: docs/brainstorms/YYYY-MM-DD-NNN-<slug>-requirements.md
- referenced_by: <repo-relative paths>
- status: active
```

退役术语保留条目并标 `status: deprecated` 或 `superseded_by`,不删除——保留历史可追溯。

`avoid` 是 `spec-prd` v1 术语 drift 检测的唯一输入字段。若未来需要记录可接受别名,必须另起不参与 drift 检测的字段(例如 `accepted_aliases`),不能把它与应避免术语混写。

## 冲突治理

新 PRD 的术语与本 glossary 的 canonical 条目冲突时,立即 surface(不静默漂移),按 `skills/spec-prd/references/evidence-and-topology.md` 的 Contradiction Handling 三方处理:`user` vs `confirmed-source` vs `prior-PRD glossary`。

## 消费者

- `spec-prd`:负责 PRD-local 术语磨锐与冲突挑战，作为 advisory consumer 读取本文件，并只生产 project-level promotion candidate；不拥有本文件的 mutation。
- `spec-brainstorm` / `spec-plan` / `spec-doc-review`:可作为 advisory consumer 读取对齐；需求 workflow 需要跨 release 复用时同样只生产 candidate。
- 实际项目 glossary mutation 由后续显式知识维护或文档编辑 workflow 在独立授权后拥有和执行。

## 术语条目

<!-- 由后续显式知识维护或文档编辑 workflow 在独立授权后写入。需求 workflow 只产生 candidate。 -->

_(暂无条目)_
