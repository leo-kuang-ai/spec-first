# Spec Review Checklist

## 需求完整性
- [ ] 每个 FR 有明确业务价值与范围边界
- [ ] NFR（安全/性能/可靠性/可观测性）已显式列出
- [ ] 风险、依赖、回滚约束已声明

## 歧义与一致性
- [ ] 歧义项均使用 `[NEEDS CLARIFICATION][TYPE]` 标记
- [ ] FR/AC/术语命名口径一致
- [ ] AC 粒度可测试、可判定通过或失败

## AC 规范
- [ ] AC ID 使用 `AC-<ABBR>-<FRSEQ>-<NN>`
- [ ] 每条 AC 对应单一断言
- [ ] AC 可映射到后续 TC

## 测试层级映射
- [ ] 每条 AC 指明建议测试层级（UT/IT/E2E/ST）
- [ ] 测试层级术语与词典一致（见 `test-level-glossary.md`）
