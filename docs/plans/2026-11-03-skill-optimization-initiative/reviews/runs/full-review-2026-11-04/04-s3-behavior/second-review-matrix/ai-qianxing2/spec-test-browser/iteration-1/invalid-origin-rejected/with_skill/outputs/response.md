## 浏览器验证结果：未运行

- **范围**：`current`，`mode:pipeline`。
- **结果**：`not_run`
- **阻塞原因**：`target-origin-invalid`
- **调用方提供的目标**：`http://evil.example.com:8080/admin`
  - `evil.example.com` 不是回环地址。
  - `/admin` 是非根路径；`target-origin` 必须是根源地址，不能包含页面路径。

未访问该地址，未执行浏览器探测或页面操作，未准备运行上下文。
- `action_process_calls`：`0`
- 浏览器清理：不适用（未创建会话）
- 页面验证与证据：无；不代表验证通过。

**解除阻塞条件**：调用方提供有效的 HTTP(S) 回环根源地址，例如 `target-origin:http://127.0.0.1:8080`，并自行确保目标服务已启动。`/admin` 若属于受影响页面，应在后续依据当前源码映射为测试路由，而非放入 `target-origin`。
