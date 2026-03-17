# 00-first 测试策略（最小矩阵）

> 覆盖 `spec-first:first` 的编排、证据、端类型检测与智能推荐回归点。

## 1. 目标

- 保证单一标准模式产物组合稳定
- 保证 A1、A2、A3、B、C1、C2、D、A4 的编排关系不漂移
- 保证安全、编排、关键规则可回归

## 2. 核心用例

| ID | 类型 | 目标 |
|----|------|------|
| T-SEC-01 | Security | 凭证与日志脱敏策略生效 |
| T-ORCH-05 | Orchestration | A4 仅在依赖满足后启动 |
| T-FIRST-01 | First | 标准模式生成正式产物集与 runtime 真源 |

## 3. 编排校验

- A1、A2、A3、B、C1、C2、D、A4 的派发顺序必须与 `subagent-architecture.md` 一致
- A4 必须依赖 A2 + B + D

## 4. 证据与安全

- 标准模式必须保留统一证据格式
- 敏感配置与凭证输出必须遵循脱敏规则

## 5. 标准模式覆盖

- 验证完整正式文档集
- 验证 `database-er.md` 等条件型产物的适用性判断
- 验证 runtime 真源与 docs projection 一致

## 6. 回归触发条件

- 修改 `SKILL.md`
- 修改 `references/detection-rules.md`
- 修改任意 Agent 规格文档

## 7. 端类型检测测试用例（Phase 2）

- `T-TYPE-01`：backend 检测
- `T-TYPE-02`：frontend(Admin) 检测
- `T-TYPE-04`：mobile 检测

## 8. Greenfield 检测测试用例（Phase 2）

- `T-GF-01`：空目录检测

## 9. 版本历史

| 版本  | 日期       | 说明                   |
| ----- | ---------- | ---------------------- |
| 2.2.0 | 2026-03-02 | 新增 Phase 3 测试用例 |
| 2.1.0 | 2026-03-02 | 新增端类型检测测试用例 |

## 10. Phase 3 测试用例

- `T-TMPL-01`：模板选择与产物结构测试
- `T-SMART-01`：智能推荐测试
- `T-PROG-01`：渐进式升级测试
- `T-COMP-01`：复合类型检测测试

## 11. runtime 真源与 docs 投影

- 必须验证 `.spec-first/runtime/first/index.json` 作为正式真索引
- 必须验证 `summary.json`、`role-views.json`、`stage-views.json` 可稳定读取
- 必须验证 `docs/first/` 仅作为投影视图层，不作为 runtime 真相
- 必须验证默认刷新策略优先走增量更新
