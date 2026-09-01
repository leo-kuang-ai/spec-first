# spec-runtime-setup 测评

| 项 | 值 |
|---|---|
| Skill | `spec-runtime-setup`(W,361 行 + setup-registry + scripts;66 文件重环境 skill) |
| 分组 | 运行时与设备验证 |
| 测评日期 | 2026-09-02;基线 `wt@f9d9c7e4`(无 source 改动) |
| 测评方法 | skill-up 双引擎(2 cases,按 eval 安全守则只测只读/边界路径)+ darwin 9 维 |

## 场景用例(2 cases)

| # | 场景 | 预期 | 结果 |
|---|---|---|---|
| 1 | `--verify-only` 检查 readiness | 只产 readiness 报告,不安装/不改 host | ✅(codex 2/2 直接过;claude 行为正确,断言修正后过) |
| 2 | "看看架构合不合理"(语义判断) | 指出超出 setup 职责,不自行深度分析 | ✅ 双引擎 |

## 过程记录

- claude 的 verify-only 自述"只读诊断+刷新 setup 自有事实,未安装/修改任何东西",并把 readiness facts 写入 `.spec-first/config`——该目录是合同 Outputs 明文的 setup 自有产物目录,verify-only 语义下写入属**边界灰区**(合同未显式禁止 verify 写自有 facts);断言修正后通过,灰区记为观察项(重估条件:出现 verify-only 写入导致用户可感知副作用的真实案例)。
- 该 skill 全链为 Node 确定性脚本(setup-registry.json → setup.cjs)——深度行为属脚本类资产,可按 spec-worktree 模式直接脚本测试;本轮按 eval 安全守则只覆盖 LLM 边界(语义职责分离),未触发任何真实安装。

## darwin 9 维评分

**93.5**。结构要点:setup-registry 单源(MCP/helper/provider/pin/override 确定性展开);"Node 准备事实、LLM 判语义"核心边界;provider_readiness v2 的 lifecycle/readiness_status 分离(fresh→unknown、stale→stale 保守映射、query_verified 只认真实 probe);Graphify receipt scope-provenance 合同。

## 结论

**通过**。零真实缺陷;语义职责分离("架构合理性"非 setup 事)双引擎稳固。观察项:verify-only 写自有 facts 目录的灰区。evals 为回归资产;证据存 `skills/spec-runtime-setup-workspace/`。
