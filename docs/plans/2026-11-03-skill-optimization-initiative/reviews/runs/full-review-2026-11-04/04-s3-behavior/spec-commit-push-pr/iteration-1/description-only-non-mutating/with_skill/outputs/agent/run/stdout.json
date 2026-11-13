模板与配置探针完成：仓库无 PR 模板、无 `.spec-first/config.local.yaml`、无 remote。当前 diff 即 README.md 标题行的未提交修改（`# MiniLedger` → `# MiniLedger (edited)`），基线为 `693fc99`。按 Steps A–H 完成分类（单簇文档改动、无证据需求、无新概念、无关联工作），定级「Small + simple」：1–2 句、无标题、不超 300 字符。审计通过：伞形结论为结果导向（标题现在可区分于基线），无机制化表述、无差异复述。

## 模式与依据

- **模式**：description-only（Step 6 组合，跳过 Step 4–5 与 Step 1 决策树；本轮不落盘、不应用）
- **描述范围**：工作区 diff（`git diff HEAD`）——仅 `README.md:1` 一行；未跟踪的 `.claude/` 为 harness 文件，未纳入描述
- **Pre-A 披露**：仓库无 remote（`origin/HEAD` 解析失败，exit 128），无既有 PR；所述内容为**未提交的工作区改动**，并非已发布的 PR 内容
- **PR 正文契约**：未发现 `PULL_REQUEST_TEMPLATE.md` / `.github/` / `docs/` 模板，按默认布局

## PR 描述草案

**标题**

```
docs: 在 README 标题中标注已编辑状态
```

**正文**

```markdown
README 标题现在读作「MiniLedger (edited)」，使当前版本与基线版本在标题上即可直观区分。纯文档改动，无任何运行时影响。

---

Built with [Spec-First](https://github.com/sunrain520/spec-first)
```

## 边界确认

未暂存、未提交、未推送、未创建或编辑任何 PR，仓库状态与运行前一致（HEAD 仍为 `693fc99`，README 修改仍为未暂存状态）。如需将此描述应用到实际 PR，请明确告知。
