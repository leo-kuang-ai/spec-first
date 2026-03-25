# Smoke Test Report — FSREQ-19700101-LEGACY-BASELINE

> **版本**: 1.0.0
> **执行时间**: 2026-03-24T23:37:24Z
> **执行人**: Codex

## 测试结果: PASS_WITH_WAIVER

## 测试项

| # | 测试项 | 结果 | 耗时 | 备注 |
|---|--------|------|------|------|
| 1 | `spec-first validate format FSREQ-19700101-LEGACY-BASELINE` | PASS | <1s | 基线文档格式校验通过 |
| 2 | `document-links.yaml` 本地结构与引用解析 | PASS | <1s | 解析成功，引用均可解析到已声明文档 |
| 3 | `spec-first doctor` | PASS | <1s | 0 个错误，2 个警告；Gemini/Cursor 为实验性或部分接入 |

## 统计

- **总计**: 3
- **通过**: 3
- **失败**: 0
- **通过率**: 100%
