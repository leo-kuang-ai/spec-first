# 19个 Skill 审查结论汇总（已核实）

> 核实日期：2026-02-25  
> 核实范围：`skills/spec-first/*/SKILL.md`、`skills/spec-first/AGENTS.md`、`docs/01需求文档/spec-first-v7.md`  
> 对照文档：`19个Skill全面审查报告.md`

---

## 1. 结论汇总

| 分类 | 数量 |
|---|---:|
| 真 | 19 |
| 假 | 18 |
| 已修复 | 1 |
| 合计（原清单） | 38 |

> 说明：原报告摘要写“37项、Critical=4”，与其明细（38项、Critical=5）不一致。

---

## 2. 按严重级别汇总

| 严重级别 | 真 | 假 | 已修复 | 小计 |
|---|---:|---:|---:|---:|
| Critical | 5 | 0 | 0 | 5 |
| High | 5 | 3 | 0 | 8 |
| Medium | 6 | 7 | 1 | 14 |
| Low | 3 | 8 | 0 | 11 |
| 合计 | 19 | 18 | 1 | 38 |

---

## 3. 真问题（保留项）

### Critical（5）

- C1: `07-code` 缺失“反合理化守卫”段落
- C2: `07-code` 缺失“上下文持久化规则”段落
- C3: `07-code` 缺失系统化调试流程
- C4: `12-verify` 缺失“证据铁律 + Common Failures 表”
- C5: `03-spec` 缺失“反合理化守卫 + NEEDS CLARIFICATION 机制”

### High（5）

- H1: `07-code` 的 P3 diff 预览格式要求不明确
- H3: `12-verify` 成功标准“若所有条件满足”过于宽泛
- H6: `11-plan` 与 `13-orchestrate` 编排边界存在重叠
- H7: `08-code-review` 未定义 4 维度审查顺序
- H8: `13-orchestrate` 缺少批量检查点机制

### Medium（6）

- M6: `06-task` 示例包含 `Owner`，但正文未定义其语义
- M7: `09-test` 的 `UT|IT|E2E|ST` 缩写说明不完整
- M8: `10-archive` 仅以“>500行归档”判定，标准偏粗
- M9: `13-orchestrate` 缺少反合理化守卫
- M13: `spec-first-v7.md` 仍使用旧 Skill 命名（如 `01-spec-write`）
- M14: `08-code-review` 缺少两阶段审查协议

### Low（3）

- L3: AC ID 规范未统一（示例仍为 `AC-1`）
- L6: `06-task` 的 `Status` 枚举值未定义
- L7: `08-code-review` 缺少反合理化守卫

---

## 4. 已修复项（1）

- M12: AGENTS 辅助 Skill 列表缺少 17-19  
  - 当前已包含：`17-feature-list, 18-feature-switch, 19-feature-current`

---

## 5. 假问题（18）

### High（3）

- H2: `references/` 来源未说明（实际目录存在且可定位）
- H4: Skill 编号与阶段编号不一致（属于两套不同标识，不构成缺陷）
- H5: `03-spec` 确认策略无决策树（已有条件化策略，不构成“缺失”）

### Medium（7）

- M1: `01-init` 正则与示例冲突（未发现冲突）
- M2: `01-init` P5 分号歧义（文案风格问题，非执行缺陷）
- M3: `02-catchup` 6步恢复内容未说明（正文已给出6项）
- M4: `04-design` P5顺序/失败处理不明确（全局错误处理已覆盖）
- M5: `05-research` 成功标准与确认策略冲突（未发现冲突）
- M10: `16-sync` P5与成功标准不一致（属互补关系）
- M11: `15-doctor` 包含 `playwright-mcp` 但未在其他 Skill 引用（非缺陷）

### Low（8）

- L1: 幂等场景描述过长（主观）
- L2: 触发条件“任意阶段”与“需当前Feature”冲突（不冲突）
- L4: `abbr` 参数说明缺失（命令签名已有）
- L5: `research` 是否回写 constitution 不明确（并未声明要回写）
- L8: archive 成功标准未检查推进至 07_release（实际上已检查）
- L9: status 的 CLI 依赖与 P0 重复（非缺陷）
- L10: `17-feature-list` 输出格式未验证（成功标准已定义输出字段）
- L11: `19-feature-current` 两步定位顺序未明确（P0→P1 已明确）

---

## 6. 原报告自身问题（建议修订）

- 摘要统计与明细不一致：摘要写“37项、Critical=4”，明细实际为“38项、Critical=5”
- M12 时效性过期：当前工作区中该问题已修复，报告应标注为“已修复”
