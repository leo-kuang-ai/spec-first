---
doc_role: template-source-pointer
artifact_kind: prd-template-guide
status: retired-as-runtime-source
created: 2026-05-30
last_updated: 2026-07-10
author: leokuang
---

# 标准需求文档模板 — Source Pointer

本目录原先保存 `spec-prd` 的 human-facing 标准模板。`spec-first` 是通过 npm 分发的 workflow harness，普通 `docs/` 路径不会作为安装用户的稳定 runtime 资产，因此这里已经退役为 runtime authoring source。

当前 canonical source：

| 资产 | Source-of-truth |
| --- | --- |
| 通用 PRD 正文骨架 | `skills/spec-prd/assets/templates/00-generic.md` |
| App surface | `skills/spec-prd/assets/templates/10-app.md` |
| Admin surface | `skills/spec-prd/assets/templates/20-admin.md` |
| Backend surface | `skills/spec-prd/assets/templates/30-backend.md` |
| H5/PC surface | `skills/spec-prd/assets/templates/40-h5-pc.md` |
| CLI/DevTool surface | `skills/spec-prd/assets/templates/50-cli-devtool.md` |
| Mixed surface | `skills/spec-prd/assets/templates/60-mixed.md` |
| 大需求总索引 | `skills/spec-prd/assets/templates/70-large-requirement-index.md` |
| 可选证券行业 overlay | `skills/spec-prd/assets/overlays/securities.md` |
| 机器安全字段、readiness、trace、finalize 合同 | `skills/spec-prd/references/prd-output-template.md` |

运行时组合规则：

```text
machine-safe output contract
  + 00 generic template
  + one primary surface template
  + optional built-in industry overlay
  + consumer-project local overlay
  + confirmed source / 当前执行对话用户裁决
```

维护规则：

- 本目录不作为 runtime authoring contract，不再保存模板正文镜像。
- 修改通用或 surface 模板时只修改 `skills/spec-prd/assets/templates/`。
- 证券行业内容只修改 `skills/spec-prd/assets/overlays/securities.md`，没有证券/交易信号时不得加载。
- 用户项目自己的术语、合规规则、监管辖区和团队模板仍保存在消费方项目中，作为 project-local overlay。
- 所有人类问题都询问当前执行对话的用户；兼容字段中的 `owner` 不表示外部联系人路由。
- `ready-for-planning`、`readiness_verified_*` 等 machine-owned 字段不能由 human-facing 模板预填。

历史原始材料仍保存在 `docs/需求文档模版/原始模版/`，仅供维护者校准，不是当前 runtime source。
