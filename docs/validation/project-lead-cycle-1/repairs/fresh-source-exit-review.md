# Cycle 1 修复退出复核：前 5 项

- 复核方式：fresh-source 只读复核，直接读取当前磁盘源码与本轮新增测试。
- 记录时间：2026-09-21 09:23:04 UTC。
- 复核者：`/root/cycle1_a_exit`；调用方：`/root`。
- 范围：C1-PRFEEDBACK-001、C1-PRFEEDBACK-002、C1-COMMITPR-001、C1-CR-01、C1-CR-02 的源码修复及对应新增 unit tests。
- 当前源码 HEAD：`36d19d95c3a79df2d1278083c959bb34eadbde8c`；被审文件包含未提交修改，因此下方逐文件 SHA256 才是本次结论的精确适用版本。
- 写权限仅用于本报告；未修改被审源码、测试、Git index、工作分支或宿主 runtime。

## 结论

原始问题的主要失败路径已在源码层得到修正：失败不能再按文件集合归为既有故障；blocked 返回保留真实残留；checkout collision 默认停止；PR head 与 metadata SHA 绑定；显式任务 untracked 路径纳入 snapshot。

仍确认 2 项退出边界缺口：PR feedback 提交示例可能提交原有无关暂存内容，snapshot v2 对非法字段的校验不完整。本轮不能给出整体退出通过结论。其余通过仅指所列源码合同和确定性实现边界，不代表真实宿主执行通过。

## Confirmed findings

### FSR-EXIT-001 / P1：裸 git commit 会夹带原有无关暂存内容

- 状态：confirmed；未在本报告中修复。
- 精确位置：`skills/spec-resolve-pr-feedback/references/full-mode.md:161-167`，核心命令位于 164-165 行；基线要求位于 88 行。
- 触发场景：用户在修复前已经暂存 `unrelated.txt`；resolver 只修改并验证 `owned.js`。调用方保留原 index，按示例暂存 `owned.js` 后执行不带路径或隔离 index 的 `git commit -m ...`。
- Direct evidence：161 行要求保留无关 staged content 和部分文件 ownership；164-165 行却执行普通 `git add` 加裸 `git commit`。Git 的该提交路径提交整个当前 index，因此原有 `unrelated.txt` 也会进入修复 commit。只限制新 `git add` 的范围不能限制已有 index 的内容。
- 影响：扩大本次提交范围，可能将用户或其他任务尚未授权发布的改动带入随后 push；“保留暂存状态”文案与示例行为不一致。
- 最小建议：在 staging/commit 前核对 index 与本轮验证过的 owned delta。若存在其他暂存路径或混合 hunk，默认返回 blocked 并保留 index；若实现隔离提交，则必须用经过验证的独立 index/等价机制，仅提交本轮内容并恢复原有暂存选择。不要用 stash/reset 简化 attribution。
- 建议验证：初始 index 包含无关 staged 文件与同文件部分 staged hunk，完成一项本轮修复后，断言提交内容仅含获授权修复，同时原 staged/unstaged 选择保持。当前新增 PR feedback 测试主要断言 prose，并未覆盖这一提交行为。

### FSR-EXIT-002 / P2：snapshot v2 非法字段可崩溃或被当作完整结果

- 状态：confirmed；未在本报告中修复。
- 精确位置：`skills/spec-code-review/scripts/review-scope.py:220-267`；顶层校验在 232-241 行，未验证的 `changed_files` 在 251 行排序，`files_changed` 在 266 行直接透传，读取异常处理在 222-224 行。
- 触发场景与证据：
  - 合法 v2 envelope 中 `changed_files: 1`：251 行抛未捕获 `TypeError`。
  - `changed_files: ["owned.js", 3]`：251 行排序抛未捕获 `TypeError`。
  - 其余字段与观察事实相同，但 `files_changed: -1` 或缺失：返回 `status: complete`、`mutation_detected: false`，同时 expected count 为 -1/null、observed count 为 1。
  - snapshot 文件不是合法 UTF-8：读取抛 `UnicodeDecodeError`，224 行未捕获。
- 影响：损坏或不符合 v2 合同的 artifact 可能产生非 JSON 崩溃输出，或获得 complete 状态；调用方无法稳定消费结构化 `unknown`/reason code。当前源码的 fail-closed 调用约定仍应阻断崩溃输出，因此本发现不声称它必然放行真实 mutation。
- 最小建议：在重算前做轻量字段校验：base/head 类型与身份形态、digest、唯一相对路径字符串数组、非负整数 count 与路径数一致、included facts 的 kind/hash/mode；拒绝布尔值冒充数字。读取时处理 `UnicodeError` 及路径解析失败，统一返回 `scope_snapshot_invalid` 或 `scope_snapshot_unreadable`。不需要引入通用 schema 框架。
- 建议验证：添加以上 5 类非法输入回归，并断言 JSON 输出、`status: unknown`、`mutation_detected: null`；继续保留有效 snapshot 的增改删与路径类型失败用例。
- 本次证据：用当前源码执行纯内存探针，替换 snapshot 文件读取与 `compute_scope` 观察事实，未写 fixture、未调用 Git、未联网。该探针只确认字段处理路径，不是完整 CLI 或真实宿主评测。

## 已核对边界

| 原问题 | 当前源码判断 | 直接依据 | 限制 |
| --- | --- | --- | --- |
| C1-PRFEEDBACK-001：跨文件回归误判为既有失败 | 原始缺口的 source 合同已修正。共享模块破坏未改 consumer 时仍调查因果；未知归因失败，required check 为红时不能 commit/push；确认既有故障也不豁免必需检查。 | `full-mode.md:141-153`；`tests/unit/spec-resolve-pr-feedback-contracts.test.js:25-35` | 新增测试主要检查合同文本；本轮未运行真实 resolver 或项目回归。 |
| C1-PRFEEDBACK-002：blocked 后残留消失 | 原始空 files_changed 指令已删除；返回真实 remaining diff，父级独立 baseline/delta reconciliation；targeted 和 pipeline-return 保留该边界。 | `full-mode.md:88,119-143`；`agents/pr-comment-resolver.md:44-53`；`targeted-mode.md:45`；`pipeline-return.md:46-54` | 仍有 FSR-EXIT-001 提交边界缺口；该问题与残留显式记录本身分开。 |
| C1-COMMITPR-001：checkout collision 破坏 index/混合改动 | 默认改为 blocked 并比较 baseline；明确禁止自动 stash/reset/clean/force checkout/retry，不再默认隐藏或移动用户改动。 | `branch-creation.md:49-67`；`tests/unit/spec-commit-push-pr-context-contracts.test.js:10-59` | 测试构造了混合 staged/unstaged、无关 staged 和 untracked；本轮只读测试，未执行。测试中的 recovery 代码块当前为空，因此它证明设计为停止的期望，不能代替 LLM 真实遵循证据。 |
| C1-CR-01：fork 同名 head 取错代码 | pr-remote 从 canonical PR URL 对应 base repo 取 refs/pull/<n>/head，严格匹配 headRefOid；传 immutable SHA；不回退同名 origin branch，metadata 漂移需重取。 | `scope.md:130-150`；`tests/unit/spec-code-review-pr-head.test.js:8-49` | 本地 fixture 中 fork 场景用同名错误 topic ref 模拟；未做真实 GitHub/GHE、认证、网络或 metadata/diff 竞态实测。 |
| C1-CR-02：任务 untracked 不在 mutation guard | v2 将显式 task-owned 路径的存在性、内容 hash、mode 纳入 digest；复验重用固定路径集合；新增、删除、改动、stage 均有相应代码路径；旧 v1 拒绝。 | `review-scope.py:121-189,220-267`；`scope.md:189-208`；`tests/unit/spec-code-review-mechanics.test.js:14-51` | 非法 snapshot 字段仍有 FSR-EXIT-002。当前新增用例没有覆盖所有非法相对路径或 chmod 情形。 |

补充路径检查：`capture_owned_files` 的 125-142 行静态拒绝绝对路径、反斜杠、`..`、`.git`、非规范路径、重复路径、symlink 和非普通文件；143-153 行用打开前后 stat 签名检查读取稳定性。该实现检查了所读文件本身；本轮没有进行并发文件系统竞态或平台差异实测。

## 验证与未执行项

- 已执行：当前磁盘源码阅读、限定 Git diff 阅读、新增 unit test 阅读、11 个被审文件 SHA256/行数采集及审查前后复核。
- 已执行：上文 snapshot 非法字段的纯内存确定性探针；结果保留于下节。
- 未执行：unit/Jest、完整 CLI 集成测试、fresh-source 行为 eval、真实宿主 workflow、GitHub/GHE API、远端写入、模型调用、付费调用、runtime projection。
- 本报告属于独立 fresh-source 只读审查记录，不能标记为真实宿主行为评测通过。
- 审查前后上述 11 个目标文件的 SHA256 一致。其他并行任务的工作区状态没有被本 Agent 清理或重置。
- 失效条件：任一目标源码或测试 hash 改变后，相关结论需按新内容重新核对；不能把本报告的行号或 verdict 自动移植到新版本。
- 写入后观察到并行修复已新增“提交前阻断不属于本轮的暂存内容”测试；该后续版本不属于下方冻结 hashes，本报告暂不判定其修复是否完成。

## 纯内存探针原始结果

```json
{
  "probe": "memory-only; filesystem/network mutation=0; not runtime eval",
  "results": [
    {
      "case": "changed_files_integer",
      "uncaught_exception": "TypeError",
      "message": "'int' object is not iterable"
    },
    {
      "case": "mixed_path_types",
      "uncaught_exception": "TypeError",
      "message": "'<' not supported between instances of 'int' and 'str'"
    },
    {
      "case": "negative_file_count",
      "result": {
        "status": "complete",
        "reason_code": null,
        "mutation_detected": false,
        "mutated_paths": [],
        "expected_diff_sha256": "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        "observed_diff_sha256": "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        "expected_files_changed": -1,
        "observed_files_changed": 1
      }
    },
    {
      "case": "missing_file_count",
      "result": {
        "status": "complete",
        "reason_code": null,
        "mutation_detected": false,
        "mutated_paths": [],
        "expected_diff_sha256": "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        "observed_diff_sha256": "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        "expected_files_changed": null,
        "observed_files_changed": 1
      }
    },
    {
      "case": "invalid_utf8",
      "uncaught_exception": "UnicodeDecodeError"
    }
  ]
}
```

## 被审 source hashes

| 文件 | 行数 | SHA256 |
| --- | ---: | --- |
| `skills/spec-resolve-pr-feedback/references/full-mode.md` | 321 | `c68a2e0ae0c46b3a21d93a94c3ecf6a69c8330466aae6bdfcaca9bcdb61f8936` |
| `skills/spec-resolve-pr-feedback/references/targeted-mode.md` | 45 | `d46bf86ec40b234b2e922d1d2f2d67105569a43d5726e4d866733ac7546ffc8d` |
| `skills/spec-resolve-pr-feedback/references/pipeline-return.md` | 54 | `9a297df7d0ab487e07127b19789365727a04c1036f18634722540fee48f7f5fe` |
| `skills/spec-resolve-pr-feedback/references/agents/pr-comment-resolver.md` | 59 | `c86844a7544f776ff7622ec818a341be7031133435e122ac3d3a69f7c5a667b1` |
| `skills/spec-commit-push-pr/references/branch-creation.md` | 86 | `58f164e92dd749076e5902787391c448dc4a2f0627d94ec504815a166285333c` |
| `skills/spec-code-review/references/scope.md` | 249 | `245cc4fc3a26ab71730ad5db22dbfb00bd83dab8b9689063a624e11596b10d9e` |
| `skills/spec-code-review/scripts/review-scope.py` | 343 | `041350d942ed0f8b65aca9b0c77211655c2bbf5e40dbe68b04b2f49763c9122d` |
| `tests/unit/spec-resolve-pr-feedback-contracts.test.js` | 197 | `f92482f2433925ad5f97db40dc59142727cc708b02e28cad965ed4cf4a683b41` |
| `tests/unit/spec-commit-push-pr-context-contracts.test.js` | 97 | `e9f8af0ae6ad6fdf8ef6d9f970271fd0c734afd2a5d25ad7d296422c80cdd452` |
| `tests/unit/spec-code-review-mechanics.test.js` | 215 | `729f73828437a486984abf62088de3bae1312af9724d168deb9313e817512fdb` |
| `tests/unit/spec-code-review-pr-head.test.js` | 54 | `30835f71cafe2f5c793c9dad0d1a9275a2d0fc5e46e04b53d97d38f790b45c33` |

## 下一步

由主 owner 裁决并修复 FSR-EXIT-001/002，运行相应聚焦验证，再对变化的源码进行只读增量复核。本 Agent 没有代替 owner 修改源码或关闭整体修复目标。

## 增量终审：FSR-EXIT-001/002 已修复

- 记录时间：2026-09-21 09:25:49 UTC。
- 复核范围：仅本报告发现的两个剩余缺口；读取当前 `full-mode.md`、`review-scope.py` 和对应两份 unit tests 的修复段，并核对主 owner 已生成的红绿回归日志。
- 当前结论：**FSR-EXIT-001 与 FSR-EXIT-002 均可在本报告限定的 source/contract 边界关闭**。前文“仍确认 2 项缺口”及两项 finding 记录保留为修复前历史，不再表示下方新 hash 版本的现状。本次增量范围内没有新的 confirmed finding。

### FSR-EXIT-001：已修复，source 合同复核通过

`skills/spec-resolve-pr-feedback/references/full-mode.md:161-163` 现在明确规定：

1. staging 前检查完整 index；无关 staged 内容或 hunk ownership 不明时阻断出口，保留 index/worktree 返回调用方。
2. 不用 unstage/stash/reset 或夹带用户变更来完成 commit；独立 worktree 转移属于调用方明确限定的恢复动作。
3. 仅在 index 为空或全为本轮验证过的内容时，暂存所属路径或 hunk；commit 前再次检查全部 staged diff。
4. 任何无关或未知 delta 阻断 commit/push；记录 commit SHA，并在 push 前核对实际 commit diff。
5. 原先会提交整个混合 index 的 `git add ...` 加裸 `git commit` 示例已移除。

对应 `tests/unit/spec-resolve-pr-feedback-contracts.test.js:26-32` 检查完整 index 核对、未知归属阻断、staged diff 复查及危险旧示例移除。该修复关闭原 source 指令矛盾；它仍是 LLM workflow 合同，未新增宿主强制 blocking primitive，本轮不声称真实宿主一定遵循或实际提交隔离已经评测。

### FSR-EXIT-002：已修复，确定性非法输入路径复核通过

`skills/spec-code-review/scripts/review-scope.py:220-250` 新增 `valid_snapshot`，验证 base/head 身份形态、digest、路径列表元素类型及唯一性、count 与列表长度一致、included facts 的 kind/hash/mode；计数与 mode 使用精确 `int` 类型判断，拒绝布尔值。`253-272` 将读取/解码/解析失败和结构失败分别归为 `scope_snapshot_unreadable` 与 `scope_snapshot_invalid`。

`tests/unit/spec-code-review-mechanics.test.js:54-79` 现覆盖整数/混合/重复路径列表、负数/缺失/布尔 count、非法 base/head/digest、缺 included facts、非法文件 hash，以及非 UTF-8 snapshot。所有非法输入预期返回结构化 `unknown` 和 `mutation_detected: null`，不再接受 complete 或非 JSON 崩溃。

本 Agent 复用前次纯内存探针，直接载入当前脚本，无文件修改、Git 命令、网络或宿主调用。有效 snapshot 保持 `complete + mutation_detected=false`；原先失败的结构/count/UTF-8 场景全部得到预期 unknown：

```json
[
  {
    "case": "valid",
    "status": "complete",
    "reason_code": null,
    "mutation_detected": false
  },
  {
    "case": "changed_files_integer",
    "status": "unknown",
    "reason_code": "scope_snapshot_invalid",
    "mutation_detected": null
  },
  {
    "case": "mixed_path_types",
    "status": "unknown",
    "reason_code": "scope_snapshot_invalid",
    "mutation_detected": null
  },
  {
    "case": "negative_file_count",
    "status": "unknown",
    "reason_code": "scope_snapshot_invalid",
    "mutation_detected": null
  },
  {
    "case": "boolean_file_count",
    "status": "unknown",
    "reason_code": "scope_snapshot_invalid",
    "mutation_detected": null
  },
  {
    "case": "missing_file_count",
    "status": "unknown",
    "reason_code": "scope_snapshot_invalid",
    "mutation_detected": null
  },
  {
    "case": "invalid_utf8",
    "status": "unknown",
    "reason_code": "scope_snapshot_unreadable",
    "mutation_detected": null
  }
]
```

### 回归证据与声明边界

主 owner 的 `checks.jsonl:19-20` 和两份原始日志记录同一聚焦命令：

```text
npx jest tests/unit/spec-code-review-mechanics.test.js tests/unit/spec-resolve-pr-feedback-contracts.test.js --runInBand
```

- `10-review-followup-red`：exit code 1；2 suites failed；2 failed、30 passed，共 32 tests。失败项分别是本报告提出的 index 合同与 malformed snapshot 回归。
- `10-review-followup-green`：exit code 0；2 suites passed；32 tests passed。
- 上述 Jest 由主 owner 执行，本 Agent 读取原始日志核验；没有重复运行，也没有将日志阅读表述为自己执行测试。
- 本次 4 个目标 source/test 文件在增量读取与报告写入前的 hashes 一致。
- 真实宿主 workflow、远端/GitHub/GHE、runtime projection、真实模型/fresh-source 行为 eval 仍未执行；关闭的是本报告具体发现，不代表整个项目或跨宿主效果完成。

### 增量终审 hashes

下列 hashes 取代前文对应 4 个文件的旧值；其余原始审查边界保留。

| 文件 | 行数 | SHA256 |
| --- | ---: | --- |
| `skills/spec-resolve-pr-feedback/references/full-mode.md` | 316 | `866cb4f06438e019c9a3c9257a3748e9382ae6c341d8716ee9fbcd145d1c77af` |
| `skills/spec-code-review/scripts/review-scope.py` | 374 | `cfb3034d57d27bce485f167dfc05207e710674e534c33ce0df8f8bd977bd49a6` |
| `tests/unit/spec-resolve-pr-feedback-contracts.test.js` | 205 | `1e6bbc09834cf77fc4a49fabf3ddd25752a4086965768556bb56fcf1bcc279a4` |
| `tests/unit/spec-code-review-mechanics.test.js` | 243 | `b58f289ccbe7482eb723229376c3e40280d7e24d55cf4e8426b7c8878483ea4a` |
| `docs/validation/project-lead-cycle-1/repairs/logs/10-review-followup-red.log` | 53 | `07003f1ced5ee92954b74208d8c682f93ed4cdd5ad0e325577c3fdbbd3609ddc` |
| `docs/validation/project-lead-cycle-1/repairs/logs/10-review-followup-green.log` | 8 | `3867d316050e0d90222260f78a5b90c6ff842e35e67c7fa701f346afabc37f2d` |

后续任一对应 source/test hash 改变，相关终审结论需要重新核对；本报告没有修改源码、测试或 Git 状态。
