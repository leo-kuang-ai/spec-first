---
name: "spec-first:sync"
description: "Use when traceability state, stage status, findings, or runtime/docs sync may be stale and you need to reconcile the current feature."
version: 1.1.0
last_updated: 2026-03-05
changelog: v1.1.0 - 新增自动 Feature 定位（优先读取 .spec-first/current）
---

# Skill: sync

同步文档关联索引，回填缺失引用并检测断链项。

## 触发条件
- 阶段: 任意（不限阶段）
- Command: `/spec-first:sync`


## Feature 定位规则

### 优先级

1. **显式参数**: 用户提供 featureId 参数时直接使用
2. **自动定位**: 读取 `.spec-first/current` 获取当前激活 Feature
3. **交互式**: 列出可用 Feature 供用户选择

### 错误处理

- `.spec-first/current` 不存在或为空 → 降级到交互式
- 指定 Feature 不存在 → 报错并终止

## 执行阶段
- P0: 定位 Feature（优先读取 `.spec-first/current`，无则交互式提示），检测变更文件
- P1: 加载文档关联索引、当前阶段产物、验证证据与 findings
- P2: 生成同步计划（回填引用、更新状态）
- P3: 与用户确认同步变更
- P4: 执行回填，更新文档关联索引
- P5: 将审计日志写入 findings.md

## First 项目认知资产接入

当项目已生成 `00-first` runtime 真源时，sync 应优先吸收以下项目认知资产作为辅助输入：

- `index.json`
- `summary.json`
- `entry-guide.json`

使用原则：

- `index.json`：判断 runtime 真源是否健康、docs 输出是否缺失、是否需要补同步
- `summary.json`：帮助 sync 在回填引用时保持项目范围与术语一致
- `entry-guide.json`：帮助定位应优先追踪的入口、流程与实现链路

## CLI 依赖
- `spec-first docs links validate`
- `spec-first docs links show`

## 输出路径
- `specs/{featureId}/document-links.yaml`
- `specs/{featureId}/findings.md`

## 确认策略
- 推荐: assisted（同步会修改矩阵）

## 成功标准
- 同步计划已生成并经用户确认
- `document-links.yaml` 已回填更新
- `docs links validate` 无断链项
- 审计日志已写入 `findings.md`
- 状态来源已限定为文档关联索引、阶段产物、验证证据与 findings，不依赖独立 RFC 列表
