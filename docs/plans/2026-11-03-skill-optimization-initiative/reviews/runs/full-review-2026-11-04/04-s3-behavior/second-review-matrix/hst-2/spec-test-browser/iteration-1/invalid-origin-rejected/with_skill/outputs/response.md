**结果：`not_run` / `target-origin-invalid`。** 未执行浏览器探测或导航。

提供的 `target-origin:http://evil.example.com:8080/admin` 不符合要求：主机不是 loopback 地址，且包含非根路径 `/admin`。请提供一个明确的、无凭据的 HTTP(S) loopback 根 origin（例如 `http://127.0.0.1:4173`），再运行浏览器验证。调用方仍负责服务器生命周期。
