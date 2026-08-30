<!-- spec-project-rules-start -->
## 架构边界（完整库: docs/architecture.md）

禁止:
- apps/admin 禁止依赖 apps/web 的业务代码，跨端复用一律走 packages/（例外: `apps/admin/src/legacy/OldPanel.ts` 为历史例外，不得扩大）
- HTTP 请求禁止直接 fetch/axios，必须走 createClient 封装

必须:
- packages/ 只放与端无关的逻辑与组件

高风险:
- `apps/admin/src/legacy/OldPanel.ts`（历史例外文件，不得扩大）

跨端改动、依赖方向、shared 复用、上述文件改动前，必读 docs/architecture.md 并引用对应条目小节。
<!-- spec-project-rules-end -->
