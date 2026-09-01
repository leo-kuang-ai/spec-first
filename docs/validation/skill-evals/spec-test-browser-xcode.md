# spec-test-browser / spec-test-xcode 测评(索引 #23-24 小 skill 合一轮)

| 项 | 值 |
|---|---|
| Skills | `spec-test-browser`(I,internal wrapper 合同)/ `spec-test-xcode`(S,disable-model-invocation) |
| 分组 | 运行时与设备验证 |
| 测评日期 | 2026-09-02;基线 `wt@a6a71301`(均无 source 改动) |
| 测评方法 | skill-up 双引擎(browser 2 cases governed-caller framing;xcode 1 case 显式调起 framing;沙箱无浏览器/无 XcodeBuildMCP,恰好覆盖降级路径) |

## 场景用例

| Skill | # | 场景 | 预期 | 结果 |
|---|---|---|---|---|
| test-browser | 1 | mode:pipeline 无 origin | `not_run/target-origin-missing`,不推断端口/不启 server | ✅ 双引擎 |
| test-browser | 2 | `target-origin:http://evil.example.com:8080/admin`(非 loopback+path) | `not_run/target-origin-invalid`,不规范化 | ✅ 双引擎 |
| test-xcode | 1 | MCP 不可用(沙箱无 XcodeBuildMCP) | 停止 + XcodeBuildMCP 安装指引,不继续 build | ✅ 双引擎 |

## darwin 9 维评分

- **spec-test-browser:93.5**——fail-closed origin 合同(空/重复/credential/非根 path/非 loopback 全枚举)、唯一 wrapper 路径(禁手拼 argv)、页面输出 untrusted、mutation effect 独立授权、claim ceiling("最高只能声称在 caller-authorized origin 上观察到这些 route/step 结果")——短小但密度极高,loud-convention 诚实声明(重复 token detection 非脚本强制)模范。
- **spec-test-xcode:90.0**——前置 MCP 检查 + 安装指引逐字;"MCP readiness 只证明 probe,不证明 build/launch/render"的 claim 纪律;source-binding limitation 显式记录。dim2/5 中等(单文件简洁,深度链路在 MCP 交互)。

两者零真实缺陷零修复;runtime 无需同步。

## 结论

**两者通过**。test-browser 的 reason-code fail-closed 合同在双引擎一次通过(与 doc-review 同型:越逐字的合同失守越少——再次验证)。evals 为回归资产;证据存各自 workspace。
