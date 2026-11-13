# spec-project-rules 收敛报告（批次2 wave B）

**K=3**：R1 zhipu/glm-5.3 / R2 hst-2/gpt-6.1-sol / R3 kiro/kimi-k3　**冻结**：5b59293b

## 一致率：全一致 12/18、多数 6/18（全部 → pass）、全分歧 0（免仲裁）

## 最终逐项裁决：18/18 pass

R2 对 D01/D05/D07/B02/B03/B05 六项 lone fail，经两文件全文对读**全部不成立**：

- **D05/B02（marker 合并「不一致」）**：knowledge-format.md:63 的「统一执行」是**放置算法**（无 marker → 追加到哪），SKILL.md:42 的首嵌交互确认是**授权门**（是否允许写）；两层概念不同且两文件各自同时携带两者（knowledge-format.md:119-126「写入确认规则」重复首嵌确认），SKILL.md 以「详见 Knowledge Format」指针下沉属既定所有权模式，非矛盾
- **B03（headless 知识库直写「授权缺口」）**：headless 直写是**有明示理由的设计决策**（SKILL.md:41「以提问中断等于把运行挂起，不是安全默认」+ closeout 记 `headless_default_write` 回执），且知识库为本 workflow 自有新文件 vs AGENTS/CLAUDE 共享文件更严（knowledge-format.md:118 明示理由）——差异化严格度有据，非未披露缺口
- **D07（OUTDATED vs refresh_noop 衔接）**：语义联动精度批评，LLM 判断域；R1/R3 确认可定位可执行
- **B05（中断恢复）**：marker 算法幂等 + 每批合入即断点 + `--scope module:<name>` 重入（R3 深挖确认「恢复设计干净，状态完全外化在知识库本身」）

## 合并 Findings 与处置

**已修（本轮）**
1. R1#1/R3-F1（P3）：evals/README.md:3 engine 口径漂移 `engine=codex` → `engine=claude_code`（与 eval.yaml:11 对齐；README:5 的 2026-08-30 历史记录保留原词）
2. R1#2（低）：`--verify` 在 exit-2 降级路径被静默忽略 → extract-deps.cjs sampling payload `note` 显式披露「--verify is not applicable in this degraded mode」（静默忽略变披露的不适用）；7/7 契约测试绿

**留观**
3. R1#3（信息）：「每模块 ≤8 且下限 2」措辞 vs 单文件模块采样 1——payload 已如实披露，无行为损害
4. R3-F2（P3）：subagent 并行派发与每批增量合入同一 `docs/architecture.md` 的写冲突纪律缺失——被「未声明支持并行」兜住，若启用需补
5. R3-F3/F4（P3·已披露局限）：judge `git diff --quiet` staged 盲区；untracked 文件不进 churn

**S3 backlog**
6. R1#5：消费者 input pack 为空（过程注记，供 S3 评审上下文）

## 结论

- **spec-project-rules 静态层：18/18 pass**
- R1 D01 佐证：该 skill 为「按失败证据演化」正样本（四轮硬化各有可定位失败记录）
- 行为层/成本/收益：未验证（S3 另测）

## 产物

spec-project-rules-R1-glm53.md / -R2-sol.md / -R3-kimi.md
