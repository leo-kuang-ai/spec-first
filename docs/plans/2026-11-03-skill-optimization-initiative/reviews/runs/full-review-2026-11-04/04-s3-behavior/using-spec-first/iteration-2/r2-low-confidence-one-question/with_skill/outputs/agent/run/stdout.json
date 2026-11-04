修复完成，doctor 复查通过。汇报如下：

## 已完成：修复 spec-first 安装漂移

**入口**：`spec-first doctor --claude` → 确认 runtime drift → `spec-first init --claude -y` → 复查 PASS

**问题**：你说的“spec-first 仓库”实际处于半安装状态——只有 `using-spec-first` 路由 skill（且内容已漂移），13 项宿主资产全部缺失（state.json、CLAUDE.md 指引、5 个 hooks、commands、settings.json matchers），任何 `spec-*` workflow 都无法运行。

**修复证据**（`spec-first doctor --claude` 复查）：
- 诊断结果：可用；宿主状态 CLAUDE：正常；需要处理：无
- 已安装：17 个 `spec-*` commands（ideate/brainstorm/prd/plan/work/debug/code-review 等）+ 21 个 skills + hooks + settings.json + `state.json`

**顺带产生的变更**（需要你知晓）：
- 全局 developer profile `~/.spec-first/.developer` 被覆写（语言 zh）——这是 init 的默认行为，如你之前有自定义内容请检查
- 本目录新增 `CHANGELOG.md`、`.gitignore` managed block（目录非 git 仓库，Git index 未动）

## 未完成 / 限制

- **本会话无法使用新装的 workflow**：skill 列表在会话启动时已固定，`spec-*` 入口需**重启 Claude Code 或在此目录新开会话**后才生效
- 按边界规则如实声明：doctor PASS 只证明配置就绪，不等于宿主已加载、任务能力已验证或首个 workflow 成功

## 下一步

```text
Recommended entrypoint: spec-ideate（重启宿主后）
Reason: 仓库尚无任何方向、需求和源码，处于"比较候选方向"阶段
Next action: 在此目录新开 Claude Code 会话，输入：/spec-ideate
```

若重启后你已有具体任务（报错→`spec-debug`、写需求→`spec-prd`、直接实现→`spec-work`），按任务直接选对应入口即可。
