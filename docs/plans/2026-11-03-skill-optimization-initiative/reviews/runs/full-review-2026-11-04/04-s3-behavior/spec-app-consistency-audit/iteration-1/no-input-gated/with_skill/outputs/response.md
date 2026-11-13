已加载 `spec-app-consistency-audit` 工作流并完成输入预检，结论如下：

## 预检结果：当前工作区没有可审计的 App 面

当前目录 `/private/var/folders/.../T/skill-up-439864990` 下只有 `.claude/skills/spec-app-consistency-audit`（即本 skill 自身），没有：

- App 源码（Android / iOS / KMP / Compose 等）
- PRD 文档
- Figma 本地上下文（`figma-context.json`）
- `.spec-first/` 工作目录，且此处也不是 git 仓库（headless 模式所需的 `base:<git-ref>` 无法解析）

按本工作流的证据边界（"No evidence, no issue" / 输入不足属于失败模式 `insufficient App surface evidence`），我不会在零输入的情况下编造审计结论。

## 请提供以下输入后我立即开审

把下面任意组合发给我（可直接给路径）：

| 输入 | 形式 | 说明 |
|---|---|---|
| **源码根目录** | `source:<path>` | 必需，至少有其一（源码/PRD） |
| **PRD** | `prd:<path>` | 文档或目录 |
| Figma | `figma-context:<path>`（本地 JSON）或 `figma-ref:<url>` | 仅 `figma-ref` 会被降级为 `input_figma_reference_only`，设计对齐类发现只做提示性输出 |
| 行业视角（可选） | `industry:<name>`（如 金融/医疗/电商） | 只是 lens，不构成 confirmed 证据 |
| 技术方案/任务文档（可选） | `tech-plan:<path>` / `task-doc:<path>` | — |

两点默认约定（除非你另有要求）：

1. **默认 `static_only` 静态审计**：不启动模拟器、真机、构建或任何运行时验证。
2. **默认内联执行、不派发 subagent**：本次请求未授权 delegated/persona 工作，我会由 orchestrator 内联应用各专家 lens，并在产物中如实记录 `dispatch_authorization_missing`，不声称独立多 agent 覆盖。

最简单的开局方式：直接告诉我你们 App 项目的路径（例如 `source:/Users/kuang/projects/our-app prd:/Users/kuang/projects/our-app/docs/prd`），我先跑 scope 预检再展开页面路由 / KMP 分层 / 组件复用 / 埋点 / i18n 各 lens。
