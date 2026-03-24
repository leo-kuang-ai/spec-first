# `/implement-tdd` 模板接入清单

这份清单不是 skill 本身，而是把 [`implement-tdd-SKILL-draft.md`](./implement-tdd-SKILL-draft.md)
真正接入 gstack 生成链路时要做的对齐项。

## 1. 目标

把当前草案从：

- `docs/` 下的可执行设计稿

推进到：

- 仓库根级新 skill 目录
- `SKILL.md.tmpl`
- `bun run gen:skill-docs` 可生成
- `.agents/skills/gstack-implement-tdd/SKILL.md` 可消费

## 2. 已经对齐的部分

当前草案已经基本具备这些模板级元素：

- frontmatter
  - `name`
  - `version`
  - `description`
  - `benefits-from`
  - `allowed-tools`
- specialist persona
- gstack 风格的 AskUserQuestion 继承
- Boil the Lake 价值观继承
- artifact 输出
- handoff rules
- completion status

## 3. 还需要做的模板级改造

### 3.1 建立正式 skill 目录

建议目录：

```text
implement-tdd/
├── SKILL.md.tmpl
└── agents/
   └── openai.yaml   (后续可补)
```

### 3.2 使用共享宏替换重复 boilerplate

当前草案里仍然保留了展开版 preamble。

正式模板化时，优先考虑：

- `{{PREAMBLE}}`

如果后面发现还需要复用公共段，可考虑增加新的生成宏，但不要先发明一堆模板变量。

### 3.3 明确是否需要额外共享宏

当前 skill 可能还会受益于一个共享块：

- `{{PLAN_ARTIFACT_DETECT}}` 或同类 helper

但这一步不一定现在做。  
更稳妥的做法是先直接在模板里写清检测逻辑，等第二个 skill 也需要时再抽共享宏。

### 3.4 决定 codex/claude 路径兼容策略

现有模板里存在：

- `~/.claude/skills/...`
- `~/.codex/skills/...`

生成脚本会做宿主适配。  
所以正式模板里应尽量沿用现有写法模式，而不是在草案里硬编码某一宿主。

### 3.5 决定是否需要额外 references

当前草案正文已经较长。  
如果正式模板继续增长，建议把这些内容拆出去：

- `references/mode-selection.md`
- `references/tdd-artifact-format.md`

原则：

- `SKILL.md.tmpl` 保留核心 workflow
- 细节参考放到 `references/`

## 4. 建议接入顺序

### 第一步

把当前草案复制为：

- `implement-tdd/SKILL.md.tmpl`

### 第二步

把展开式 preamble 收敛成：

- `{{PREAMBLE}}`

### 第三步

运行：

```bash
bun run gen:skill-docs
bun run gen:skill-docs --host codex
```

### 第四步

检查生成结果：

- `.agents/skills/gstack-implement-tdd/SKILL.md`
- Codex host 输出

### 第五步

做一次风格内审：

- 是否仍保持 specialist persona
- AskUserQuestion 是否一致
- 与 `/plan-eng-review`、`/review`、`/qa` 的边界是否清楚

## 5. 风险点

### 5.1 草案已经偏长

风险：

- 正式模板过长
- 占上下文窗口太多

缓解：

- 后续把模式判定细则和 artifact 细则移入 references

### 5.2 `context-backed mode` 容易被滥用

风险：

- 用户绕过 `/plan-eng-review`
- skill 退化成直接编码器

缓解：

- 在正式模板里保留强 gate
- 把“何时不允许用 context-backed mode”写得更硬

### 5.3 与现有流程的接缝需要真实验证

风险：

- `/review` 不一定天然消费这份 artifact
- `/qa` 不一定天然理解这个 stage 状态

缓解：

- 第一版先把 artifact 写清楚
- 第二版再考虑增强下游 skill 消费逻辑

## 6. 接入完成的判定标准

只有满足以下条件，才算真正接入成功：

1. 模板文件存在并能生成 SKILL.md
2. 生成后的正文风格与现有 gstack skill 一致
3. `/implement-tdd` 能清楚承接：
   - `/plan-eng-review`
   - 或小改动的 context-backed mode
4. `/implement-tdd` 结束时能清楚移交：
   - `/review`
   - `/qa`
   - `/ship`

## 7. 一页速记

```text
接入 implement-tdd 的最短路径：

docs/tdd需求/implement-tdd-SKILL-draft.md
  -> implement-tdd/SKILL.md.tmpl
  -> {{PREAMBLE}} 宏收敛
  -> bun run gen:skill-docs
  -> 检查 .agents 输出
  -> 做一次风格内审
```
