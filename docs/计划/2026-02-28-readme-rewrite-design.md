# README 大重写设计文档

> 日期: 2026-02-28 | 状态: 已批准

## 背景

当前 README 1385 行，存在四大问题：
1. "核心价值"+"设计原则"+"核心思想"+"核心优势" 四章节高度重叠
2. "核心架构"与"技术栈与目录"重复描述模块结构
3. "研发流程"与"阶段状态机"重复描述阶段流转
4. 核心模块列表缺少 skill-runtime 和 template

## 决策

- 方案 C：大重写，全新结构
- 生态对比章节保留原样
- 以 src/ 代码和 skills/ 目录为准对齐数据
- 消除重复，预计精简至 ~900-1000 行

## 新结构

1. 标题 + 徽章 + 一句话介绍
2. 目录
3. 为什么选择 Spec-First（合并四章节）
4. 生态对比（原样保留）
5. 快速开始
6. 核心架构（合并架构+技术栈+目录+核心类型）
7. 研发流程（合并流程+阶段状态机）
8. 追踪体系（合并追踪+覆盖率）
9. Gate 门禁
10. 变更与缺陷管理
11. Skill 体系
12. CLI 命令
13. 名词说明（附录）
14. 相关文档
15. 许可证

## 数据校验

- CLI 命令: 19 个（已验证 src/cli/index.ts）
- Skills: 21 个（已验证 skills/spec-first/*/SKILL.md）
- 核心模块: 9 个（process-engine, trace-engine, gate-engine, change-mgr, ai-orchestrator, metrics-engine, tool-integration, skill-runtime, template）
- 版本: v0.5.45
