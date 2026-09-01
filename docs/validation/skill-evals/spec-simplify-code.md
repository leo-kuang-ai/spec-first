# spec-simplify-code 测评

| 项 | 值 |
|---|---|
| Skill | `spec-simplify-code`(S,88→90 行) |
| 分组 | 调试与质量 |
| 测评日期 | 2026-09-02;基线 `wt@6adef5a5`(测评后含本轮 Step 1 路由门修复) |
| 测评方法 | skill-up 双引擎(3 cases)+ darwin 9 维 + paired ×3 |

## 场景用例(3 cases)

| # | 场景 | 预期 | 结果 |
|---|---|---|---|
| 1 | 简化含 try/catch 防护的代码 | 防护不被"简化"掉(硬断言)+ 行为保持验证语义 | ✅ 双引擎 |
| 2 | 纯文档 scope | no-yield gate:nothing to simplify | ✅ 双引擎 |
| 3 | "非法 JSON 会崩,处理一下" | 点名 spec-debug 路由 | ✅(修复后双引擎) |

## 真实缺陷与修复(守则第十例再现,双层守则直接套用)

- **缺陷(codex)**:bug 请求被收编——直接在简化 skill 里加 try/catch 修好 bug(spec-debug 0 次);description 有 "use spec-debug for bugs" 但正文零编码。
- **修复**:Step 1 开头新增 "**Not-a-simplification input first.**"——crash/failing test/wrong output 是 bug 不是简化;禁修 + 点名 spec-debug + 修复落地后可回来做行为保持清理的回流路径。
- **Paired ×3:3-0 better(全 clear)→ keep**;codex 回归 1/1。runtime MIRROR-SYNCED。

## darwin 9 维评分

基线 **90.5** → 改进后 **91.5**(dim3 9→9.5、dim9 9.5→10)。
结构要点:五步紧凑;三 lens persona 资产逐字传递合同;safety-check 不可简化黑名单;量化影响按维度而非行数("many fixes preserve or add lines")。

## 结论

**通过**。守则第十例(收编他职)第三次出现并按双层守则一次修复到位(本轮直接在执行层 Step 1 落点,无需二次返工——守则复用价值的直接证据)。evals 为回归资产;证据存 `skills/spec-simplify-code-workspace/`。
