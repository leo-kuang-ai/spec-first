# CE Skill 覆盖迁移审查报告

日期：2026-04-25  
范围：按用户指定的 27 个 CE 对应 skill，从 `/Users/kuang/xiaobu/compound-engineering-plugin/plugins/compound-engineering/skills` 覆盖迁移到当前项目 `/Users/kuang/xiaobu/spec-first/skills`。

## 执行原则

- 以 CE 当前本地 skill 内容为上游基线。
- 不再对比 git 历史或远程内容。
- 覆盖后仅做当前项目必需适配：`spec-first` 命名、扁平 `spec-*` agent identity、`.spec-first` 路径、`spec-*` 与 `spec-*` 入口、prompt mirror 同步。
- 旧本地增强 contract tests 不再作为迁移约束；本次已删除覆盖后失败的旧测试文件。

## 逐 Skill 验收结论

| # | 当前 skill | CE 来源 | 文件数 | 脚本数 | source name | prompt mirror | CE 残留 | 结论 |
|---:|---|---|---:|---:|---|---|---|---|
| 1 | `agent-native-architecture` | `ce-agent-native-architecture` | 15 | 0 | OK | OK | 无 | 通过 |
| 2 | `agent-native-audit` | `ce-agent-native-audit` | 1 | 0 | OK | OK | 无 | 通过 |
| 3 | `spec-brainstorm` | `ce-brainstorm` | 5 | 0 | OK | OK | 无 | 通过 |
| 4 | `git-clean-gone-branches` | `ce-clean-gone-branches` | 2 | 1 | OK | OK | 无 | 通过 |
| 5 | `spec-code-review` | `ce-code-review` | 11 | 0 | OK | OK | 无 | 通过 |
| 6 | `spec-compound` | `ce-compound` | 4 | 0 | OK | OK | 无 | 通过 |
| 7 | `spec-compound-refresh` | `ce-compound-refresh` | 4 | 0 | OK | OK | 无 | 通过 |
| 8 | `spec-debug` | `ce-debug` | 4 | 0 | OK | OK | 无 | 通过 |
| 9 | `feature-video` | `ce-demo-reel` | 7 | 1 | OK | OK | 无 | 通过 |
| 10 | `spec-doc-review` | `ce-doc-review` | 8 | 0 | OK | OK | 无 | 通过 |
| 11 | `frontend-design` | `ce-frontend-design` | 1 | 0 | OK | OK | 无 | 通过 |
| 12 | `gemini-imagegen` | `ce-gemini-imagegen` | 7 | 5 | OK | OK | 无 | 通过 |
| 13 | `spec-ideate` | `ce-ideate` | 4 | 0 | OK | OK | 无 | 通过 |
| 14 | `spec-optimize` | `ce-optimize` | 12 | 3 | OK | OK | 无 | 通过 |
| 15 | `spec-plan` | `ce-plan` | 5 | 0 | OK | OK | 无 | 通过 |
| 16 | `proof` | `ce-proof` | 2 | 0 | OK | OK | 无 | 通过 |
| 17 | `report-bug` | `ce-report-bug` | 1 | 0 | OK | OK | 无 | 通过 |
| 18 | `resolve-pr-feedback` | `ce-resolve-pr-feedback` | 5 | 4 | OK | OK | 无 | 通过 |
| 19 | `spec-sessions` | `ce-sessions` | 1 | 0 | OK | OK | 无 | 通过 |
| 20 | `spec-slack-research` | `ce-slack-research` | 1 | 0 | OK | OK | 无 | 通过 |
| 21 | `test-browser` | `ce-test-browser` | 1 | 0 | OK | OK | 无 | 通过 |
| 22 | `test-xcode` | `ce-test-xcode` | 1 | 0 | OK | OK | 无 | 通过 |
| 23 | `spec-update` | `ce-update` | 1 | 0 | OK | OK | 无 | 通过 |
| 24 | `spec-work` | `ce-work` | 3 | 0 | OK | OK | 无 | 通过 |
| 25 | `spec-work-beta` | `ce-work-beta` | 4 | 0 | OK | OK | 无 | 通过 |
| 26 | `git-worktree` | `ce-worktree` | 2 | 1 | OK | OK | 无 | 通过 |
| 27 | `lfg` | `lfg` | 2 | 0 | OK | OK | 无 | 通过 |

## 脚本同步审查

脚本文件数量与 CE 完全对齐。内容级审查后，除当前项目必要适配外均与 CE 同步：

- `git-clean-gone-branches/scripts/clean-gone`：同步 CE，`bash -n` 通过。
- `feature-video/scripts/capture-demo.py`：同步 CE，命名适配为 `feature-video`，`py_compile` 通过。
- `gemini-imagegen/scripts/*.py`：5 个脚本同步 CE，`py_compile` 全部通过。
- `spec-optimize/scripts/*.sh`：3 个脚本同步 CE，`bash -n` 全部通过。
- `resolve-pr-feedback/scripts/*`：4 个脚本同步 CE，`bash -n` 全部通过；`get-pr-comments` 的示例仓库从 CE 专用示例改为通用 `OWNER/REPO`。
- `git-worktree/scripts/worktree-manager.sh`：同步 CE，`bash -n` 通过。

## 适配与清理

- 已同步 `skills/` 到 `docs/10-prompt/skills/`，27 个迁移 skill 的 mirror 与 source 内容一致。
- 已清理中断前机械替换导致的嵌入词污染，例如 `referenspec-first`、`evidenspec-first`、`surfaspec-first` 等。
- 活跃迁移 skill 与 mirror 未发现 CE 命名残留。
- 剩余 `Compound Engineering` / `.compound-engineering` 字符串仅保留在 `spec-setup` / `spec-mcp-setup` 的 legacy residue 检测路径中，属于迁移清理能力，不是活跃入口或命名残留。

## 删除的旧测试

按用户指令，覆盖后失败且锁定旧本地增强/旧命名的 contract tests 已删除。删除后保留的 unit 测试链路通过。

## 验证结果

- `npm run typecheck`：通过。
- `npm run test:unit`：通过，64 个 test suites / 408 个 tests 全部通过。
- CE 残留扫描：27 个迁移 skill 与对应 prompt mirror 无活跃 CE 命名残留。
- 脚本语法验证：shell / Python 脚本全部通过。

## 最终结论

本批 27 个 CE 对应 skill 已按 CE 最新本地内容完成覆盖迁移，并完成 spec-first 必要适配。脚本资产已逐项回到 CE 源目录核对，文件数量、脚本数量与内容同步关系成立；当前差异均为 spec-first 项目命名、路径和通用示例适配。当前可进入下一阶段：如需继续，可审查 CE 独有 7 个 skill 与当前保留独有 skill 的最终发布面。
