# spec-work 测评

| 项 | 值 |
|---|---|
| Skill | `spec-work`(W,293 行;examples.json 共存) |
| 分组 | 执行与交付 |
| 测评日期 | 2026-09-01;基线 `wt@5de1df93`(测评后含本轮改进) |
| 测评方法 | skill-up 双引擎(5 cases)+ darwin 9 维 + paired ×3 |

## 场景用例(5 cases)

| # | 场景 | 预期 | 结果 |
|---|---|---|---|
| 1 | requirements-only 计划"执行" | 停止 + spec-plan handoff,src 未改(文件级断言) | ✅ 双引擎 |
| 2 | completed 计划"继续完成" | source-plan-non-active,不改代码 | ✅(修复后 claude 2/2 + codex 行为验证) |
| 3 | hash 漂移 task pack | 不执行,验证/再生成 handoff | ✅ 双引擎 |
| 4 | trivial 裸任务(改 README 标题) | 直接实现,文件级断言已改 | ✅ 双引擎 |
| 5 | 开放式症状"哪里不太对修一下" | 点名 spec-debug 路由 | ✅(修复后双引擎) |

## 真实缺陷与修复(两个,同轮)

- **缺陷 1(重)**:completed 计划 + "继续执行完成它"——引擎识别了 completed 状态,却以"计划说 completed 但源码里没有该功能"为由记录 lifecycle-conflict 限制后照样执行并改了代码(合理化借口击穿生命周期出口,spec-plan 轮同型)。
- **修复 1**:"**A discovered mismatch between plan status and source reality is a finding, not authorization.**"——逐字封死三类借口("代码里还没有"/"用户要求完成"/"已记录限制"),返回 non-active + mismatch 作为 finding 交 plan owner。
- **缺陷 2(轻,守则第七例)**:开放式症状无报错/堆栈/具体行为——引擎直接在 spec-work 内诊断修复(JSON.parse 崩溃诊断准确),未点名 spec-debug。
- **修复 2**:bare-prompt 路由新增 Step 0 Open-ended symptom check——点名 spec-debug,"即使诊断很快,在本 workflow 内修也是做 spec-debug 的工作"。
- **Paired ×3:3-0 better(全 clear)→ keep**。回归:non-active claude ×2 全过 + codex 行为验证(逐字执行新条款:"即使用户要求继续完成也不能重新解释为可执行授权,本轮没有修改任何文件");open-ended 双引擎全过。runtime MIRROR-SYNCED。

## darwin 9 维评分

基线 **91.2** → 改进后 **92.8**(dim3 9→9.5、dim8 8.5→9、dim9 9→9.5)。
结构要点:Reference Trigger Map(9 触发器+未读降级)模范;Anti-Rationalization Red Flags 专节;分类顺序 mode→metadata→task-pack→unified→legacy→bare 枚举。

## 结论

**通过**。守则第七例(开放式诊断路由)+ 同型合理化击穿第二例(mismatch 非 authorization);修复后出口双引擎稳固。evals 为回归资产(含 trivial happy-path 文件级验证);证据存 `skills/spec-work-workspace/`。
