# Shop Monorepo 项目说明（团队手写维护）

本节由团队维护，任何自动生成内容不得改写本节。
- 构建：`npm run build`
- 各端发布走 CI，禁止本地 publish。

<!-- spec-rule-miner-start -->
## 编码风格规则（完整库: docs/ai/project-rules.md）
编码风格规则统一放 docs/ai/project-rules.md，此处不重复维护。
<!-- spec-rule-miner-end -->

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
