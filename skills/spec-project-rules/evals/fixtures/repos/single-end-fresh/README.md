# Single App

## 团队约定

- 所有数据请求必须走 `src/api.ts` 的 `request` 封装（统一错误处理与重试都在这里），禁止组件内直接 fetch。
