# ce-skill-audit-2026-10-28 验证材料

2026-10-28 Skill source 审计材料。

[返回上级目录](../README.md)

## 使用与维护

本 README 是 2026-10-31 补充的导航，不属于原试验输出，不改写原始 payload 文件或历史结论；新增导航会改变目录清单，不能把当前目录树 hash 当作原试验 hash。根据现存报告和 payload 判读结果；子目录名、receipt 或日志存在不等于通过。原始文件和冻结记录保持原样，不在 fixture 内批量添加文件。

## 内容导航

| 路径 | 内容 |
|---|---|
| [autoresearch-repros.json](autoresearch-repros.json) | autoresearch-repros.json |
| [baseline.json](baseline.json) | baseline.json |
| [brainstorm-tests.json](brainstorm-tests.json) | brainstorm-tests.json |
| [brainstorm-tests.log](brainstorm-tests.log) | brainstorm-tests.log |
| [browser-source-probes.json](browser-source-probes.json) | browser-source-probes.json |
| [code-review-source-probes.json](code-review-source-probes.json) | code-review-source-probes.json |
| [code-review-tests.json](code-review-tests.json) | code-review-tests.json |
| [code-review-tests.log](code-review-tests.log) | code-review-tests.log |
| [commit-judge-probes.json](commit-judge-probes.json) | commit-judge-probes.json |
| [compound-source-probes.json](compound-source-probes.json) | compound-source-probes.json |
| [compound-tests.json](compound-tests.json) | compound-tests.json |
| [compound-tests.log](compound-tests.log) | compound-tests.log |
| [consumer-tests.json](consumer-tests.json) | consumer-tests.json |
| [consumer-tests.log](consumer-tests.log) | consumer-tests.log |
| [coverage.json](coverage.json) | coverage.json |
| [debug-contract-tests.json](debug-contract-tests.json) | debug-contract-tests.json |
| [debug-contract-tests.log](debug-contract-tests.log) | debug-contract-tests.log |
| [debug-question-judge-probes.json](debug-question-judge-probes.json) | debug-question-judge-probes.json |
| [doc-review-source-probes.json](doc-review-source-probes.json) | doc-review-source-probes.json |
| [doc-review-tests.json](doc-review-tests.json) | doc-review-tests.json |
| [doc-review-tests.log](doc-review-tests.log) | doc-review-tests.log |
| [entry-contract-tests.json](entry-contract-tests.json) | entry-contract-tests.json |
| [entry-contract-tests.log](entry-contract-tests.log) | entry-contract-tests.log |
| [entry-judge-probe.json](entry-judge-probe.json) | entry-judge-probe.json |
| [entry-manifest.json](entry-manifest.json) | entry-manifest.json |
| [entry-source-runtime-comparison.json](entry-source-runtime-comparison.json) | entry-source-runtime-comparison.json |
| [explain-judge-probe.json](explain-judge-probe.json) | explain-judge-probe.json |
| [file-review-index.md](file-review-index.md) | 全量逐文件复核索引 |
| [file-tables/](file-tables) | 子目录；阅读其入口说明 |
| [final-verification-initial.json](final-verification-initial.json) | final-verification-initial.json |
| [final-verification.json](final-verification.json) | final-verification.json |
| [full-asset-ledger.json](full-asset-ledger.json) | full-asset-ledger.json |
| [ideate-tests.json](ideate-tests.json) | ideate-tests.json |
| [ideate-tests.log](ideate-tests.log) | ideate-tests.log |
| [landing-judge-probes.json](landing-judge-probes.json) | landing-judge-probes.json |
| [ledger-finalization.json](ledger-finalization.json) | ledger-finalization.json |
| [lfg-state-tests.json](lfg-state-tests.json) | lfg-state-tests.json |
| [lfg-state-tests.log](lfg-state-tests.log) | lfg-state-tests.log |
| [lfg-watch-gap-probe.json](lfg-watch-gap-probe.json) | lfg-watch-gap-probe.json |
| [link-candidates.json](link-candidates.json) | link-candidates.json |
| [optimize-path-repro.json](optimize-path-repro.json) | optimize-path-repro.json |
| [optimize-source-probes.json](optimize-source-probes.json) | optimize-source-probes.json |
| [optimize-tests.json](optimize-tests.json) | optimize-tests.json |
| [optimize-tests.log](optimize-tests.log) | optimize-tests.log |
| [plan-judge-probes.json](plan-judge-probes.json) | plan-judge-probes.json |
| [plan-judge-probes.py](plan-judge-probes.py) | plan-judge-probes.py |
| [plan-tests.json](plan-tests.json) | plan-tests.json |
| [plan-tests.log](plan-tests.log) | plan-tests.log |
| [polish-boundary-probe.json](polish-boundary-probe.json) | polish-boundary-probe.json |
| [polish-boundary-probe.py](polish-boundary-probe.py) | polish-boundary-probe.py |
| [polish-tests.json](polish-tests.json) | polish-tests.json |
| [polish-tests.log](polish-tests.log) | polish-tests.log |
| [pov-probes.json](pov-probes.json) | pov-probes.json |
| [pov-probes.py](pov-probes.py) | pov-probes.py |
| [pov-tests.json](pov-tests.json) | pov-tests.json |
| [pov-tests.log](pov-tests.log) | pov-tests.log |
| [pr-feedback-helper-tests.json](pr-feedback-helper-tests.json) | pr-feedback-helper-tests.json |
| [pr-feedback-helper-tests.log](pr-feedback-helper-tests.log) | pr-feedback-helper-tests.log |
| [prd-probes.cjs](prd-probes.cjs) | prd-probes.cjs |
| [prd-probes.json](prd-probes.json) | prd-probes.json |
| [prd-tests.json](prd-tests.json) | prd-tests.json |
| [prd-tests.log](prd-tests.log) | prd-tests.log |
| [prior-directed-review-coverage.json](prior-directed-review-coverage.json) | prior-directed-review-coverage.json |
| [promote-contract-tests.json](promote-contract-tests.json) | promote-contract-tests.json |
| [promote-contract-tests.log](promote-contract-tests.log) | promote-contract-tests.log |
| [prototype-tests.json](prototype-tests.json) | prototype-tests.json |
| [prototype-tests.log](prototype-tests.log) | prototype-tests.log |
| [refresh-contract-tests.json](refresh-contract-tests.json) | refresh-contract-tests.json |
| [refresh-contract-tests.log](refresh-contract-tests.log) | refresh-contract-tests.log |
| [report.md](report.md) | spec-first 与 CE：34 个 Skill 全量源码审查总报告 |
| [riffrec-boundary-probe.json](riffrec-boundary-probe.json) | riffrec-boundary-probe.json |
| [riffrec-boundary-probe.py](riffrec-boundary-probe.py) | riffrec-boundary-probe.py |
| [riffrec-tests.json](riffrec-tests.json) | riffrec-tests.json |
| [riffrec-tests.log](riffrec-tests.log) | riffrec-tests.log |
| [run-context.json](run-context.json) | run-context.json |
| [runtime-probes.cjs](runtime-probes.cjs) | runtime-probes.cjs |
| [runtime-probes.json](runtime-probes.json) | runtime-probes.json |
| [runtime-tests.json](runtime-tests.json) | runtime-tests.json |
| [runtime-tests.log](runtime-tests.log) | runtime-tests.log |
| [scope-adjustment-verification.json](scope-adjustment-verification.json) | scope-adjustment-verification.json |
| [scope-final.json](scope-final.json) | scope-final.json |
| [simplify-judge-probes.json](simplify-judge-probes.json) | simplify-judge-probes.json |
| [skills/](skills) | 子目录；阅读其入口说明 |
| [strategy-pulse-contract-tests.json](strategy-pulse-contract-tests.json) | strategy-pulse-contract-tests.json |
| [strategy-pulse-contract-tests.log](strategy-pulse-contract-tests.log) | strategy-pulse-contract-tests.log |
| [sweep-boundary-probe.json](sweep-boundary-probe.json) | sweep-boundary-probe.json |
| [sweep-boundary-probe.py](sweep-boundary-probe.py) | sweep-boundary-probe.py |
| [sweep-tests.json](sweep-tests.json) | sweep-tests.json |
| [sweep-tests.log](sweep-tests.log) | sweep-tests.log |
| [targeted-tests.json](targeted-tests.json) | targeted-tests.json |
| [targeted-tests.log](targeted-tests.log) | targeted-tests.log |
| [task-pack-boundary-probe.cjs](task-pack-boundary-probe.cjs) | task-pack-boundary-probe.cjs |
| [task-pack-boundary-probe.json](task-pack-boundary-probe.json) | task-pack-boundary-probe.json |
| [task-pack-tests.json](task-pack-tests.json) | task-pack-tests.json |
| [task-pack-tests.log](task-pack-tests.log) | task-pack-tests.log |
| [verify-audit.py](verify-audit.py) | verify-audit.py |
| [work-judge-probes.json](work-judge-probes.json) | work-judge-probes.json |
| [work-judge-probes.py](work-judge-probes.py) | work-judge-probes.py |
| [work-tests.json](work-tests.json) | work-tests.json |
| [work-tests.log](work-tests.log) | work-tests.log |
| [worktree-forward-edge-search.json](worktree-forward-edge-search.json) | worktree-forward-edge-search.json |
| [worktree-source-probes.json](worktree-source-probes.json) | worktree-source-probes.json |
| [xcode-contract-tests.json](xcode-contract-tests.json) | xcode-contract-tests.json |
| [xcode-contract-tests.log](xcode-contract-tests.log) | xcode-contract-tests.log |
