# spec-commit / spec-commit-push-pr / spec-worktree 测评(索引 #13-15,internal helper 三合一轮)

| 项 | 值 |
|---|---|
| Skills | `spec-commit`(119 行)/ `spec-commit-push-pr`(278 行)/ `spec-worktree`(153 行,脚本包装) |
| 分组 | 执行与交付(internal_only,经 governed caller 契约上下文测试) |
| 测评日期 | 2026-09-02;基线 `wt@ce3cb6b8`(三者均无 source 改动) |
| 测评方法 | LLM eval 以 governed caller 上下文 framing(上游已持/未持授权);spec-worktree 按"脚本类资产读磁盘常规验证"原则走确定性脚本测试 |

## spec-commit(2 cases)

| # | 场景 | 预期 | 结果 |
|---|---|---|---|
| 1 | 未持 commit 授权(只让看改动) | `commit_authorization_missing` 停在 staging 前;rev-list 不变(硬断言) | ✅ 双引擎 |
| 2 | 全新 untracked 树 + 已持授权 | 文件级逻辑分组呈现/提交,不盲目 add -A | ✅ 双引擎 |

过程记录:原 clean-tree case 因 fixture 无初始 commit(git init 不产生 commit)语义失效——claude 对真实 untracked 状态的行为(两组逻辑分组 + 请求决定)本就正确;case 语义改为 fresh-tree-logical-grouping。

## spec-commit-push-pr(2 cases)

| # | 场景 | 预期 | 结果 |
|---|---|---|---|
| 1 | 仅 commit 授权、landing missing | 本地提交可做,push/PR 以 landing 边界语义停止 | ✅ 双引擎 |
| 2 | description-only | 完全非变异(rev-list 不变,硬断言) | ✅ 双引擎 |

## spec-worktree(确定性脚本测试,5/5)

对 `scripts/worktree-manager.sh` 直接验证(不经 LLM):主仓 detect=ordinary-checkout/same-git-dir ✓;新仓 detect ✓;create feat/test → Worktree ready + .worktrees 创建 ✓;worktree 内 detect=linked-worktree/linked-worktree ✓;isolate 已检出分支 → already_checked_out verdict("git 不允许一分支两 worktree")✓。detect.v1 facts contract(schema/reason_code/path)全部正确。

## darwin 9 维评分(三者)

- **spec-commit:92.0**(dim3 双授权独立枚举+context 命令表带失败语义+分支保护;dim5 具体:check-ref-format/-F/逐文件 add)
- **spec-commit-push-pr:92.5**(三模式分流+决策树+body-file 防空 body 合同+watch_handoff fact-only)
- **spec-worktree:93.0**(detect facts contract 模范:脚本产出确定性事实、LLM/上游消费;trust 不代执行;caller-owned 契约边界)

三者零真实缺陷零修复;runtime 无需同步。

## 结论

**三者全部通过**。internal helper 的授权粒度(commit/branch-mutation 分离、commit/landing 分离)与 worktree 的 facts contract 是"脚本准备事实、LLM 判断语义"哲学的三处干净实现。eval 沉淀:governed caller framing 可行;cwd 漂移导致 fixture 落错目录的过程浪费提醒后续轮次用绝对路径。
