# spec-promote 能力融合审查

状态：`source_review_complete`。双方14包内文件/773行全文读；CE noslop三个直接文件复用已读同hash全文记录；本地auth helper测试和localization合同全文核对。此项为研发交付后的价值表达，不扩大成营销自动发布系统。

| 研发能力 / 场景 | 双方事实与本地增强 | 融合裁定和最小建议 | 验证与边界 |
| --- | --- | --- | --- |
| 从工程变更到用户价值 | 双方Phase1读取PR/diff/changelog/recent commits，输出1–3句用户能做什么；用户描述优先，无证据一问 | **已有等价实现，保留。** 但active PR、Unreleased和diff不证明已上线；建议承接caller已验证的delivery状态，草稿用已实现/待发布等准确措辞 | 不新增release判定脚本，不由LLM把commit推断为上线；现有fixture没有deployment证据，不能据此声称“已上线”核验 |
| channel适配与变体 | CE/local Phase2–4按请求选channels，默认X+release blurb，所有返回draft按channel呈现，不假设一channel一条 | **已有等价能力。** 不增加固定campaign模板、渠道连接器或自动发布 | 研发收益是输出可复用价值说明，不是帮忙外发；当前source明确不post/schedule/commit/PR |
| 去模板化写作 | CE PathB委托ce-noslop，保留一个共同owner；本地inline editorial/social fundamentals已有主要原则 | **轻量吸收“写作原则由单一owner维护”的意图，暂不新增noslop Skill。** 可在已有PR写作/本项之间明确共享最小原则的canonical owner，但只有真实重复演化成本出现才抽取 | CE noslop含保留准确术语、避免模板节奏等，不能把全部词表导入每次prompt；没有对照写作效果实测 |
| Spiral可选与local fallback | 双方可直接写；本地bounded auth helper仅allowlisted facts、3s timeout，CE直接auth stdout且非JSON靠secret前缀判断 | **保留本地更强边界。** 不导入CE legacy secret substring兼容 | 本地helper真实源码/测试核对，probe只读取auth。未运行真实CLI/auth/network |
| 外部内容传输 | CE ready即write、失败静默fallback；本地run-local egress intent、持久化披露、未知delivery/persistence receipt | **保留本地增强。** 认证不授权传内容，失败也不称local-only；无需CE config cascade | 当前write动作仍prose约定，无强制wrapper；如未来实现gateway可做call-trace验证，不能现在声称零外传已硬执行 |
| provider响应边界 | 本地入口禁止internal commentary/raw bytes；继承的spiral reference Output shape却允许drafts空时fallback `text` | **本地需收敛，不照搬CE旧矛盾。** 空draft仅本地重写和安全receipt，不能让引用例外冲破入口约束 | 触发为provider空draft+text有内部说明/secret-like内容；明确来源`references/spiral-cli.md`的Output shape和“Only fall back”句，需模拟响应eval |
| once-only opt-out | 双方忽略注释key、decline后持久偏好、worktree正确info/exclude；本地入口另明确披露和授权local exception | **已有等价及本地增强。** 建议已有config也检查ignore状态；当前exclude逻辑只在file absent分支，而已有未忽略file同样可能泄漏local设置 | 不为此变更tracked .gitignore，不把普通草稿请求扩大成本地偏好写权限；write失败继续fallback，不虚报saved |
| 安装/等待的成本 | CE和本地都说optional不阻塞，却interactive Path0必须询问并等待；local-ready也需按授权决定egress | **保留能力可选，建议默认完成本地草稿后再给一次可选提示。** 用户已明确本地直写时直接PathB，不新增访谈审批 | 使用会话已有授权/偏好，不将沉默当同意；不是导入CE强制setup建议 |
| 当前项目与portable shell | 双方diff固定main、auth ref的optout read使用POSIX command substitution；其他核心本地已要求runtime repo root | **建议复用现有landing/commit的target/base/argv事实机制**，不建立另一套default branch猜测；root失败不可读`/.spec-first/...`作为目标配置 | 当前没有root解析helper，这只是确切recipe风险；评测在非main/子目录/无git环境验证，不需真实provider |
| eval覆盖 | 两cases指定`.claude/skills/...`镜像；no-publish judge靠词表、全仓库commit总数必须0、CHANGELOG仅substring且缺文件也放行 | **建议fresh-source与动作trace。** 用baseline差分检查commit/内容，无publish/provider call trace不能证明never publish；需egress授权缺失/unknown response/optout既有file等场景 | 现有auth unit test只证明allowlist和nonJSON/nonzero，未覆盖timeout/ENOENT；不把问号或“草稿”表述当零副作用证据 |

## 验证与结论

全文读`tests/unit/spec-promote-auth-probe.test.js`、`ce-localization-round-1-remediation-contracts.test.js`，CE noslop全文读取记录复用hash一致。运行现有auth unit和localization合同并保存日志；测试不用真实Spiral，只验证fake executable/文本。最小顺序是修引用中的commentary例外、以caller交付事实约束claims、补零调用与local preference结果eval；再考虑抽取共同写作原则。不新增provider、发布渠道或config层。无独立validator，`validation_status: unresolved`。
