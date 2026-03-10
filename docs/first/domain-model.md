---
mode: deep
generated_at: 2026-03-09T20:06:12.462Z
---

# 业务领域模型

## 核心实体

### 1. Feature
Feature 生命周期管理的核心实体，代表一个完整的需求开发流程。

### 2. Stage
阶段状态机的状态节点，定义 Feature 的生命周期阶段：
- 00_init - 初始化
- 01_specify - 需求规格
- 02_design - 技术设计
- 03_plan - 任务拆解
- 04_implement - 代码实现
- 05_verify - 验证测试
- 06_wrap_up - 归档复盘
- 07_release - 发布上线
- 08_done - 已完成
- 09_cancelled - 已取消

### 3. Task
任务拆解的基本单元，关联到具体的实现工作。

### 4. RFC
Request for Comments，变更请求管理实体。

### 5. Defect
缺陷跟踪实体，管理 Bug 生命周期。

### 6. Gate
质量门禁实体，定义阶段流转的质量标准。

### 7. TraceabilityMatrix
追溯矩阵实体，维护需求到实现的追溯关系 (C1-C9 覆盖率)。

## 核心能力

### Feature Lifecycle Management
管理 Feature 从创建到完成的完整生命周期。

### Stage State Machine
驱动 Feature 在不同阶段间流转，确保流程规范性。

### Traceability Matrix
维护需求、设计、代码、测试之间的追溯关系。

### Quality Gates
在关键阶段设置质量门禁，确保交付质量。

### RFC and Defect Tracking
管理变更请求和缺陷的完整生命周期。

## 追溯 ID 类型

- FR - Feature Request
- DS - Design Spec
- TASK - Task
- TC - Test Case
- RFC - Request for Comments
- REQ - Requirement
- SYS - System
- ARCH - Architecture
- MOD - Module
- ATP - Acceptance Test Plan
- STP - System Test Plan
- ITP - Integration Test Plan
- UTP - Unit Test Plan
