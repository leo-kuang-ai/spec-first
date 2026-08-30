# Shop Monorepo

## 架构边界（团队约定）

- apps/web 与 apps/admin 是两个独立前端；**admin 不得依赖 apps/web 的业务代码，跨端复用一律走 packages/**。
- packages/ 只放与端无关的逻辑与组件。
