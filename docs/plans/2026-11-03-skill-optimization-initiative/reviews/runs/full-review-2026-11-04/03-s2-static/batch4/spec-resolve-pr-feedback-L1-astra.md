| 维度 | 最终裁决 | 关键证据（file:line + 一句事实） | 一句理由 |
|---|---|---|---|
| B02 | **fail** | `skills/spec-resolve-pr-feedback/references/full-mode.md:84,183` 允许独立授权、无代码依赖的回复继续，但 `:171` 要求缺 commit/push 授权时直接进入 Step 9，跳过回复步骤。 | 混合批次中“本地修复未获提交权限＋独立问答已获回复权限”存在相互冲突的执行指令；pipeline-return 的完整合同不能消除普通模式的内部不一致。 |
| B03 | **fail** | `skills/spec-resolve-pr-feedback/references/pipeline-mode.md:13` 明确允许把 PR body 既有 checklist 勾选为完成，却没有要求该写面的授权；`skills/spec-resolve-pr-feedback/SKILL.md:36-52` 仅列五项权限并禁止相互推导。 | 修改既有 PR 描述仍是独立外部写入；reply 授权或 committed fix 均不能替代 PR body 编辑授权，legacy 分支的例外造成授权边界缺口。 |
| B06 | **fail** | `skills/spec-resolve-pr-feedback/references/full-mode.md:141,164-167` 要求保留部分修改及失败验证并记录到总结，但 `:337` 要求没有已提交代码变更时省略 Validation。 | “已修改、验证失败、因此未提交”同时触发披露与省略要求，静态合同不一致；两个负例 judge 的判据强度问题仅记 **S3**，不作为本维度 fail 的依据。 |

**修复建议**
- **B02：** 将 Step 6 的缺授权及其他 Git 阻塞分支改为跳过受阻出口，继续 Step 7 中独立、已授权且证据充分的动作；依赖远端修复的动作保留 pending。
- **B03：** 优先删除 legacy pipeline 的 PR body 勾选操作，返回待办交 caller；若保留，明确独立的 PR body 编辑授权及精确范围。
- **B06：** 以实施尝试、本轮残余修改或已执行检查决定验证披露，不以是否 commit 决定；失败、not-run、blocked 均保留实际状态。
- **复验：** 补充上述混合授权、未授权 PR body 编辑及未提交修改的回归场景；两个负例 judge 的增强另记 S3。
- **核验边界：** 已直接读取隔离工作区源码，未修改文件、运行测试或行为评测；全局 `AGENTS.md` 读取及 Git 身份核验未获授权，未绕过或据此声称与评审提交完全一致。
