**Readiness：未完成，setup 在安全门处阻止。**

已按要求对当前宿主执行 bare 调用，并通过共置入口运行；调用设置了 `MCP_SETUP_HOST=claude` 和 `HOME="$PWD/.eval-home"`。入口返回退出码 `2`，提示：`host-invocation-surface-unverified`。

因此本次没有确认基线依赖、Provider 或 setup facts 已就绪；也不能报告完整 setup ready。未追加 `--check` 或 `--plan`。下一步需先让 setup 能验证当前 Claude 的宿主调用面，再重新执行 bare 调用。
