已按要求执行当前 Claude 宿主的 **bare 调用**，未添加 `--check` 或 `--plan`：

```bash
HOME="$PWD/.eval-home" MCP_SETUP_HOST=claude node "$SKILL_DIR/scripts/setup.cjs"
```

**结果：被安全门阻止，完整 setup 未就绪。**

- 退出码：`2`
- 原因码：`host-invocation-surface-unverified`
- 原始输出：`Runtime 设置被阻止：host-invocation-surface-unverified`

原因是当前加载位置为 `.claude/skills/spec-runtime-setup`，而共置脚本只将 `.claude/spec-first/workflows` 识别为 Claude 的有效投射根。即使显式设置了 `MCP_SETUP_HOST=claude`，也未通过入口绑定验证（见 `.claude/skills/spec-runtime-setup/scripts/lib/host-authority.cjs:13`、`:53`）。

| Readiness 项目 | 本次结果 |
|---|---|
| 必需 MCP/helper 依赖、Provider 安装与图/query readiness | 未取得验证结果 |
| Generated runtime manifest freshness | 未取得验证结果 |
| Host 配置、本地配置与 verification profile | 未取得验证结果 |
| Setup facts | 未生成 `.spec-first/` |
| 隔离 HOME | 已在调用中设置；未观察到 `.eval-home/` 创建 |

未绕过宿主验证、移动入口或追加修复参数。下一步需先修正评测夹具的 Claude 投射位置与脚本入口识别规则之间的不一致，再从有效的已加载入口重新执行 bare 调用。
