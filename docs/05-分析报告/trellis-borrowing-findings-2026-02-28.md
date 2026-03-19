# Findings — Trellis Borrowing Study (2026-02-28)

## Checkpoint 1

- 当前结论：
  - Trellis 的核心可借鉴价值不在“流程语义”，而在“更新/迁移工程化”（hash 分类、manifest 迁移、备份回滚、冲突分级）。
- 证据路径：
  - `/Users/kuang/xiaobu/Trellis/src/utils/template-hash.ts`
  - `/Users/kuang/xiaobu/Trellis/src/commands/update.ts`
  - `/Users/kuang/xiaobu/Trellis/src/migrations/index.ts`
  - `/Users/kuang/xiaobu/Trellis/src/migrations/manifests/0.3.0.json`
- 下一步：
  - 对照 spec-first `update`/`host-bootstrap` 识别可直接接入的模块边界。

## Checkpoint 2

- 当前结论：
  - spec-first 现状是“流程治理强、升级迁移弱”；最优先应先补 P0 的更新安全链路，再做 P1 的平台注册表收敛。
- 证据路径：
  - `/Users/kuang/xiaobu/spec-first/src/cli/commands/update.ts`
  - `/Users/kuang/xiaobu/spec-first/src/shared/skill-commands.ts`
  - `/Users/kuang/xiaobu/spec-first/src/shared/host-bootstrap.ts`
  - `/Users/kuang/xiaobu/spec-first/src/core/skill-runtime/hard-gate.ts`
- 下一步：
  - 输出分阶段实施方案（Phase A-D）并落盘为正式分析报告。

## Checkpoint 3

- 当前结论：
  - 技术落地优先序：P0（update migration engine）> P1（host registry + worktree command）> P2（context overhead 报告化）。
- 证据路径：
  - `/Users/kuang/xiaobu/spec-first/docs/05-分析报告/trellis-borrowing-deep-analysis-2026-02-28.md`
- 下一步：
  - 进入执行阶段时，先立 `update-engine` 骨架并补集成测试。
