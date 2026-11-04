Entering `spec-first doctor --claude`（readiness on-ramp）：这个目录里没有任何可执行的项目内容或已安装的公共 workflow 入口，先按路由图确认宿主就绪状态，再决定主流程入口。

## 检查结果（已完成，全部只读）

**当前状态：`spec-*` 公共 workflow 入口在本工作区未安装，任何主流程工作现在都无法开始。** 证据来自两次 `spec-first doctor` 运行：

- `.claude/commands` 缺失 —— 公共入口（`spec-ideate`、`spec-brainstorm`、`spec-work` 等）由宿主在 `spec-first init` 之后提供，目前一个都不存在；
- 技能仅安装 1/38（只有 `using-spec-first`），且该技能自身相对内置版本已漂移（`content_mismatch`）；
- `.claude/spec-first/state.json`、SessionStart/spec-plan/prd 三个 guard hooks、`settings.json` 匹配器、`CLAUDE.md` 治理块全部缺失。

同时这个目录没有源码、没有 git、没有既有 spec —— 也就是说“下一步做什么”在主流程上属于**尚无方向**，入口应是 `spec-ideate`，但它被上面的就绪缺口挡住了。

## 边界说明（未做的部分）

我没有自动执行 `spec-first init`：路由命中不授权 mutation，且 doctor 对每一项都标注了“需要人工处理——producer 未声明该建议可安全自动执行，请先确认所有权、覆盖和删除影响”。这是写入性变更（会安装 hooks、`settings.json`、38 个技能），需要你明确点头。

## 推荐入口

```text
Recommended entrypoint: spec-first init（终端命令，安装时选择 Claude Code）
Reason: doctor 证实宿主运行时缺失/漂移，公共 spec-* 入口未安装，主流程（spec-ideate 起）无法进入
Next action: 在本目录运行 `spec-first init` 并选择 Claude Code；或直接回复“你来 init”，我即执行
```

init 完成后，你的“不知道下一步”在主流程上的答案就是 `spec-ideate`（尚无方向 → 比较候选方向）。我在此停下等你示意，不再继续串联。
