# Large Shop Monorepo

## 架构边界（团队约定）

- apps/web、apps/admin、apps/h5 是三个独立前端；**admin 与 h5 不得依赖 apps/web 的业务代码，跨端复用一律走 packages/**。
- packages/ 只放与端无关的逻辑与组件；packages/utils 是全端共享的工具函数唯一住址。
