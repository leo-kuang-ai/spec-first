---
name: "spec-first:init"
description: "初始化 Feature 工作区，收集参数并生成阶段状态文件。触发场景：(1) 用户说 'init'、'初始化'、'创建 Feature'、'新建需求'，(2) 执行 /spec-first:init 命令，(3) 需要开始新的 Feature 开发时，(4) 项目已完成 first 认知后的首个 Feature 创建"
---

# Skill: init

初始化 Feature 工作区，收集参数并生成阶段状态文件。

- Command: `/spec-first:init`

## 背景质量契约

本 skill 遵循 [shared/background-quality-contract.md](../shared/background-quality-contract.md)。

初始化完成后输出：
- `backgroundInputStatus`: 背景输入完整度（full/degraded/blind）
- `background_input_status`: 文档输出字段名

## 执行流程

- **P0**: 前置检查 - 详见 [prerequisites.md](references/prerequisites.md)
- **P1**: 读取平台列表 - 扫描 `.spec-first/layer2/*.yaml`
  - ⚠️ 若目录不存在或为空，引导创建平台 YAML - 详见 [platform-yaml-template.md](references/platform-yaml-template.md)
  - **关键**：必须使用 `platform:` 字段（不是 `name:`），这是 CLI 校验的硬性要求
- **P2**: 交互式收集参数 - 详见 [interaction-guide.md](references/interaction-guide.md)
- **P3**: 参数确认 - 回显所有选择后执行
- **P4**: 执行 CLI - `spec-first init [参数]`
- **P5**: 验证并输出摘要

## 参数约束

详见 [parameters.md](references/parameters.md)，关键约束：
- `feat`: `^[A-Z][A-Z0-9]{0,15}$`
- `platforms`: 必须来自 `.spec-first/layer2/*.yaml`
- `mode`: N/I，默认 N
- `size`: S/M/L，默认 M

## 交互要求

**逐步引导**，顺序：feat → mode → size → platforms → title → feature-id → bootstrap

**交互体验**：
- 显示步骤进度（如 "步骤 1/7"）
- 提供清晰选项列表（带描述）
- 支持键盘导航（↑↓选择，Enter确认）

**feat 特殊处理**：中文输入时自动生成 3-4 个英文缩写候选项

详细交互流程见 [interaction-guide.md](references/interaction-guide.md)

## 保护规则

- **禁止删除 Feature 目录**
- **中断恢复**：继续完成初始化，不删除已有内容
- **空 PRD 处理**：引导用户填充，不判定为"无用 Feature"

## 成功标准

- CLI 成功退出（exit code = 0）
- 生成 `specs/{featureId}/` 目录及必需文件
- `.spec-first/current` 指向新 Feature
