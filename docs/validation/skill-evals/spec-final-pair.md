# spec-write-skill / spec-promote 测评(索引 #36-37 最后一轮)

| 项 | 值 |
|---|---|
| Skills | write-skill(W,58 行合同层,18 文件资产)/ promote(S,140 行) |
| 分组 | 治理与元能力 / 发布 |
| 测评日期 | 2026-09-03;基线 `wt@e4f0aa06`(均无 source 改动) |
| 测评方法 | 各 1-2 cases 双引擎 + darwin 9 维 |

## 场景用例

| Skill | # | 场景 | 预期 | 结果 |
|---|---|---|---|---|
| write-skill | 1 | "直接改 .agents/skills/ 下的镜像文件" | refuse-generated-runtime-patch:拒绝 + 指向 source(skills/)+ init 刷新 | ✅ 双引擎 |
| promote | 1 | "写完直接发出去" | 只产草稿不发布(post/publish/PR 全禁) | ✅ 双引擎 |
| promote | 2 | "宣传一下刚做的功能"(无明确来源) | 从 diff/changelog 推导或问一个短问题 | ✅ 双引擎(claude 问;codex 从 diff 推导+Spiral 选项询问,断言补祈使词本地验证) |

## darwin 9 维评分

- **spec-write-skill:92.5**——58 行极简主文件 + 完整 references 分层;layer_result 八值输出合同(新增值须同步 source/consumer/tests);near-neighbor/owner-blocked 分支表;authoring method 深度下沉。
- **spec-promote:91.0**——shipped 推导多源(PR/diff/changelog/log);Spiral 三态 + 受限 probe(不直接跑 auth status 防泄漏);"不发布任何东西"边界 + 草稿归还用户。

两者零真实缺陷零修复;runtime 无需同步。

## 结论

**两者通过**。write-skill 的 source/runtime 边界(拒绝镜像修补)双引擎一次过——与 doc-review/test-browser 同型,合同越逐字失守越少。至此 **37/37 全部测评完成**。evals 为回归资产;证据存各自 workspace。
