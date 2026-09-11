# npm 归档测试夹具

来源：npm 官方 registry 的 @upstash/context7-mcp@4.0.7 与 @modelcontextprotocol/server-sequential-thinking@2026.8.31，2026-09-11 下载。

下载字节已按 setup-registry.json 的 SHA-512 integrity 校验。归档保持上游字节原样；Context7 归档含 package/LICENSE，Sequential Thinking 归档不含单独 LICENSE 文件，许可证声明保留在 package/package.json。这些文件仅由 fake runner 复制到隔离目录供真实 hash 校验，不在 unit tests 中执行。版本更改需同时更新 registry pin、归档及其 SHA-512 校验，不允许为了测试通过跳过生产校验。

CodeGraph 夹具：`@colbymchenry/codegraph@1.6.0`，2026-09-11 从 npm 官方下载，归档 267196 bytes，SHA-512 `nCN40MqmYxF7gH1QTKqlxJ1d2mzwhw3fzSdGV2wjnQKsymjM3JZnH/5rpGqhBkcUEom0qWq0WjDRvOZh2t8mFA==`。许可证声明为 MIT，保留在 package/package.json。此夹具在 launcher 集成测试中提取原始 npm-shim.js/package.json；只在隔离 HOME、禁用网络下载且配置 benign 本地 launcher 的环境执行，观察 self-heal cache 副作用及 guard 行为；不执行上游 CodeGraph 平台二进制。
