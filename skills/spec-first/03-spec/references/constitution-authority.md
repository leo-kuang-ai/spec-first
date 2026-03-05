# Constitution 权威层级

## 权威层级定义

Level 0: Constitution（宪法，最高权威，不可违反）  
Level 1: Spec（需求规格）  
Level 2: Design（技术设计）  
Level 3: Code（代码实现）

## 冲突仲裁规则

| 冲突场景 | 仲裁规则 |
|---------|---------|
| Code 与 Design 冲突 | 修改 Code，使其满足 Design |
| Design 与 Spec 冲突 | 回到 Spec/Design 评审，先确定需求是否变更 |
| Spec 与 Constitution 冲突 | 修改 Spec，宪法优先 |
| 任意与 Constitution 冲突 | 阻断推进，先修复违规项 |

## 宪法检查点

| 检查时机 | 检查内容 |
|---------|---------|
| spec 生成后 | FR/AC 是否违反宪法原则 |
| design 生成后 | 设计约束是否违反宪法条款 |
| code-review 时 | 代码是否违反宪法规则 |
| verify 时 | 交付物是否满足宪法要求 |

## 主副本策略（强制）

1. `.spec-first/constitution.md` 是主权威。  
2. `specs/{featureId}/constitution.md` 仅允许记录 Feature 特例。  
3. 涉及全局原则变更时，必须先更新主模板，再更新 Feature 副本（如需要）。  
