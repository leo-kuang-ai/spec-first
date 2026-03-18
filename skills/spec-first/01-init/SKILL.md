---
name: "spec-first:init"
description: "Use when starting spec-first in a repo, creating a new feature workspace, or routing initialization for a new or existing project."
---

# Skill: init

统一初始化入口，自动检测项目状态并路由到对应轨道。

- Command: `/spec-first:init`

## 背景质量契约

本 skill 遵循 [shared/background-quality-contract.md](../shared/background-quality-contract.md)。
- 关键字段：`backgroundInputStatus` / `background_input_status`
- 使用原则：`first` 是优先背景输入，不是硬阻断前置；当 `backgroundInputStatus=degraded|blind` 时允许降级初始化，但必须给出补跑 `/spec-first:first` 的建议。

## 五轨道自动路由

`spec-first init` 根据项目当前状态自动识别并路由到五条轨道之一：

| 轨道 | 触发条件 | 主要动作 |
|------|---------|---------|
| `no-git` | `.git` 不存在 | 输出 git init 指引，退出 |
| `project-onboarding` | `.spec-first` 不存在、`meta/config.yaml` 缺失、或 00-first 未完成 | 引导运行 `first` skill |
| `feature-init-blocked` | 00-first 未完成且携带 `--feat` 参数 | 明确报错，阻止创建 Feature |
| `brownfield-baseline` | 存量项目（≥50 源码文件）且尚无基线 Feature | 交互式引导创建 `FSREQ-19700101-LEGACY-BASELINE` |
| `feature-init` | 健康项目 + 基线已就绪（或 greenfield） | 收集参数并创建新 Feature |

可通过 `--track <project|baseline|feature>` 显式覆盖自动路由。

## 执行流程

### no-git 轨道

1. 输出 git init 操作指引
2. 退出，等待用户完成后重新运行 `/spec-first:init`

### project-onboarding 轨道

1. 检测缺失项（git / .spec-first / first runtime）
2. 输出具体的补救命令（`/spec-first:first`）
3. 退出，等待用户完成前置步骤后重新运行 `/spec-first:init`

### feature-init-blocked 轨道

1. 检测到 `--feat` 参数但 first runtime 不健康
2. 输出明确错误，引导用户先运行 `/spec-first:first`
3. 退出，等待用户完成后重新运行 `/spec-first:init`

### brownfield-baseline 轨道

1. 提示用户存量项目尚无基线
2. 显示将创建的 baseline Feature 参数（featureId: `FSREQ-19700101-LEGACY-BASELINE`，mode: I，size: M）
3. 提供三个选项：
   - **[y] 创建基线**：自动生成 baseline Feature，含 `prd.md`（已上线能力摘要）和 `task_plan.md`（基线补齐）
   - **[s] 跳过**：写入 `baselineSkipped: true` 到 `.spec-first/meta/config.yaml`，下次直接进入 feature-init
   - **[n] 退出**：取消操作
4. 创建基线后，提示用户完成 `prd.md` 盘点，然后再运行 `/spec-first:init` 创建业务 Feature

### feature-init 轨道

- **P0**: 显示 00-first 摘要（技术栈/代码量/API 端点）
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

**Mode I 特性**：Mode I Feature 初始化时额外生成 `impact-analysis.md`（变更影响分析模板）。

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
- **基线去重**：`FSREQ-19700101-LEGACY-BASELINE` 已存在时不重复创建

## 成功标准

- CLI 成功退出（exit code = 0）
- 生成 `specs/{featureId}/` 目录及必需文件
- `.spec-first/current` 指向新 Feature
