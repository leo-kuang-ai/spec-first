# npm 归档测试夹具

来源：npm 官方 registry 的 @upstash/context7-mcp@4.0.7 与 @modelcontextprotocol/server-sequential-thinking@2026.8.31，2026-09-11 下载。

下载字节已按 setup-registry.json 的 SHA-512 integrity 校验。归档保持上游字节原样；Context7 归档含 package/LICENSE，Sequential Thinking 归档不含单独 LICENSE 文件，许可证声明保留在 package/package.json。这些文件仅由 fake runner 复制到隔离目录供真实 hash 校验，不在 unit tests 中执行。版本更改需同时更新 registry pin、归档及其 SHA-512 校验，不允许为了测试通过跳过生产校验。
