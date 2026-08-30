# Plain App

## 团队约定

- 网络请求统一走 `lib/net` 的 `request` 封装，禁止在其他目录直接 fetch。
- `app/` 只放组装层，业务逻辑放 `lib/` 对应域目录。
