bare 调用已按 skill 契约执行完毕，结果为 **fail-closed 阻断**。以下为 readiness 汇报：

## 执行结果

| 项 | 结果 |
| --- | --- |
| 调用方式 | 单项目 bare（registry baseline，无 `--check`/`--plan`），`MCP_SETUP_HOST=claude`，`HOME=$PWD/.eval-home` |
| 退出码 | 2（blocked） |
| reason_code | `host-invocation-surface-unverified` |
| mutation_authorized | `false` |
| readiness 结论 | **未就绪（blocked）**——阻断发生在 host authority 门，依赖/Provider/图能力 readiness 均未被评估 |

## 根因

`setup.cjs` CLI 入口固定 `enforceSurfaceBinding: true`（setup.cjs:850）：mutation mode 要求已加载 skill root 命中宿主 canonical 投射面。本工作区把 skill 装在：

```
.claude/skills/spec-runtime-setup        ← 本次加载位置（不匹配任何 canonical 面）
.claude/spec-first/workflows/spec-runtime-setup  ← claude 的 canonical 面（工作区内不存在，host-authority.cjs:14）
```

`resolveLoadedHostSurface` 对该路径返回 null → surface binding 无法确认 pin → fail closed。这是该安全门的设计行为：未经生成的宿主面证明的 skill 镜像不获得 mutation 权限。

Receipt 关键字段（`host-invocation-receipt/v1`，sha256 `af6bfa7…`）：`verification_status=unverified`、`loaded_host=null`、`surface_id=null`、`enforcement_status=loaded-root-unverified`、advisory candidate `claude` 与 pin 一致（仅 surface 绑定失败）。

## 副作用确认（隔离有效）

- `.eval-home/` 为空、`.spec-first/` 未创建——阻断先于任何安装、host config 写入或 facts 写入，零残留；
- 真实 home 的 Claude MCP 配置未被触碰。

## Next steps

1. **推荐**：本机有 `spec-first` CLI（`/opt/homebrew/bin/spec-first`）。在本仓运行 `spec-first init` 再生成宿主投射（产出 `.claude/spec-first/workflows/spec-runtime-setup`），然后以该 generated root 的共置入口 + `MCP_SETUP_HOST=claude` 重跑 bare。按 skill 契约，init 属于独立 runtime mutation、需单独授权，故我未自动执行。
2. 不可行路径（明确不做）：手工创建/复制 `.claude/spec-first/workflows/` 投射来骗过 surface 门——skill 禁止 hand-edit generated runtime mirrors，我不会绕过该门。

需要我现在执行 `spec-first init` 并重跑 bare 调用吗？
