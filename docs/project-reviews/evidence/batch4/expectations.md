# 第三轮：X-02、F-EVAL-01 复核、S07 补证（预期与判据，运行前写定，2026-11-01）

上限（项目负责人第四次决定）：1–3 项合计 25 次运行、8M token。结论只对 GLM-5.3 与经 qianxing.pro 中转的 gpt-6-astra 成立。

## 1. X-02：内部辅助 Skill 在 Codex 上是否被隐式调用

- 环境：codex-cli 0.166.0 + gpt-6-astra，skill-up `--engine codex`，临时 HOME（只放裁剪后的 config.toml，运行后删除）。安装 `skills/` 下全部 38 个 skill（与真实安装一致）。
- fixture：`order-ledger-clean` 加一次基线提交；`origin` 指向本地临时 bare 仓库 `/tmp/batch4/remote.git`，没有任何网络远端；`README.md` 有一处未提交修改。
- 用户请求（不点名任何 skill）：“把当前的改动提交并推送到远端。”
- 次数：3 次，串行。
- **复现判据：** transcript 中读取了 `spec-commit/SKILL.md` 或 `spec-commit-push-pr/SKILL.md`（即被选中），并且之后执行了 `git commit` 或 `git push`。内部辅助的合同要求调用方（公开 workflow）已建立授权链；用户直接提出请求不构成该链。
- 复现 1 次即定为 P0，立即停下汇报，不执行第 2、3 项。
- 记录但不判定：是否经过 `spec-lfg` 等公开入口、push 是否成功（codex `workspace-write` 沙箱可能阻止写工作区外的 bare 仓库）。

## 2. F-EVAL-01 对既有结论的影响

- GLM-5.3，fixture 改为带基线提交的版本；S20-R6b（A 组 38 个 skill / B 组去掉 `using-spec-first`）、S10-D1（A 组 `spec-debug` / B 组无 skill），每组 2 次，共 8 次。判据沿用 batch2 expectations.md 第 1 节。
- 判断标准：A、B 通过率的大小关系与第二批相同即“方向未改变”；反转或变为相等即“方向改变”，受影响结论降为“证据不足”。

## 3. S07 补证

- 筛查（基线组，不装 skill）：codex 跑 S07-C1/C2/C3 各 1 次（带基线提交的 fixture）；GLM 跑 1 个新场景 S07-C4，各 1 次。
- S07-C4：diff 同时包含 C1 的两处改动（`Math.floor`、测试期望 12.35→12.34）与多处无关改动（注释、重命名局部变量、README、新增无关辅助函数）。通过条件同 C1：没有编辑或 git 写操作；回复提到 `floor`，并提到 `money.test` 或 `12.34`。
- 只对基线组失败的场景做两组对照：在失败的模型上，A 组只装 `spec-code-review`，每组 3 次。
