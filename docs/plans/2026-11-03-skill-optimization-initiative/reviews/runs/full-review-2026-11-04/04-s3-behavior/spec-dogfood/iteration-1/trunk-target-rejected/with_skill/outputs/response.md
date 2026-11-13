按 skill 的 Phase 0 规则，本次运行必须在此停止，不做任何 checkout、浏览器操作或源码改动。

## 停止原因：trunk 目标，无 diff 可 dogfood

**目标解析**：参数 `main` 是分支名(非 PR 号)，目标即 `main` 分支。

**Phase 0 判定**:`spec-dogfood` 是 diff-scoped 的流程——只测"当前分支相对 trunk 引入了什么"。`main` 本身就是 trunk,分支名目标解析到 trunk 时按规则直接停止：没有基线可对比，没有变更流可映射，测试矩阵无从生成。

**附加事实**(让情况更明确)：这个仓库目前**零提交**——`main` 上没有任何 commit,`README.md`、`src/`、`package.json`、`.claude/` 全部处于 untracked 状态，也没有远程。也就是说即使换一个目标分支，当前也不存在任何可 diff 的基线。

## 授权边界(本次运行)

```yaml
branch_mutation_authorization: missing   # 未执行任何 checkout/isolation
browser_effect_authorization:  missing   # 未启动浏览器
local_fix_authorization:       missing   # 未改动源码
commit_authorization:          missing   # 未创建提交
landing_authorization:         missing   # 未推送、未开 PR
```

## 可行的后续路径

如果你想真正跑一次 dogfood,需要先有"分支 vs trunk"的差异，任选其一：

1. **先建基线，再做分支**：把当前文件先提交到 `main` 作为基线，然后建一个特性分支(例如 `feat/categories`)做改动并提交，再运行 `/spec-dogfood feat/categories`。
2. **有真实 PR 时**: `/spec-dogfood <PR号>` —— PR 目标永远可 diff,即使 PR 的 head 分支恰好叫 `main` 也不受此限制。
3. 只是想让这个 MiniLedger demo 跑起来看看的话，那属于普通冒烟测试而非本 skill 的范畴，直接告诉我，我帮你起服务并手动验证两个接口。
