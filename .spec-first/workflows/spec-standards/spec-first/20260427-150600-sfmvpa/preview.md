# 规范草案预览

## 本轮信息
- Run ID: `20260427-150600-sfmvpa`
- 目标仓库: `spec-first` (`/Users/kuang/xiaobu/spec-first`)
- 证据模式: `crg-first`
- Graph 质量: usable（1037 节点，98.2% parser 成功率）

## 已有确认规范（本轮跳过）
- `architecture` — 脚本/LLM 边界
- `governance` — 源码与运行时资产归属、CHANGELOG 要求
- `workflow-boundaries` — 草案与正式规范分离

## 本轮新增草案
| 草案文件 | Spec ID | 置信度 | 优先级 | 严重性 |
|---|---|---|---:|---|
| `drafts/testing-layers.md` | `testing-layers` | high | 85 | medium |
| `drafts/changelog-iron-law.md` | `changelog-iron-law` | high | 90 | high |

## 被拒候选项
- `language-policy`：不确定——语言设置是 per-project 配置选项，非普适强制规则
- `prose-eval-boundary`：冲突——已被 governance RULE-GOVERNANCE-001 覆盖

## 局限性
- 4 个文件 parse error，已用 direct reads 补充
- locate FTS 查询无结果，架构证据来自 direct reads
- 3 个文件被跳过
