---
name: "spec-first:init"
description: |
  定位项目根目录并通过交互式引导初始化 Feature 工作区（可选 --bootstrap 执行宿主检查/安装）。
  触发场景：(1) 首次在项目中使用 spec-first（project-onboarding 轨道）(2) 创建新 Feature 工作区（feature-init 轨道）(3) 存量项目补基线（brownfield-baseline 轨道）(4) 用户说"初始化"、"新建 feature"、"创建工作区"、"spec-first init" (5) 检测到 .spec-first 不存在或 00-first 未完成时的引导入口
---

# Skill: init

统一初始化入口，自动检测项目状态并路由到对应轨道。

- Command: `/spec-first:init`

适用场景：
- 新项目创建
- 刚 clone 下来的 git 远程项目
- 本地存量项目的需求迭代
- 仅补齐 `.spec-first` 项目壳或 `meta/config.yaml`

## 背景质量契约

- 本 skill 遵循 [shared/background-quality-contract.md](../shared/background-quality-contract.md)
- `backgroundInputStatus` / `background_input_status` 三个值：`full` | `degraded` | `blind`
- `first` 是优先背景输入，不是硬阻断前置；`degraded`/`blind` 时允许降级初始化，但必须给出补跑 `/spec-first:first` 的建议

## 三轨道自动路由

`spec-first init` 根据项目当前状态自动识别并路由到三条轨道之一：

| 轨道 | 触发条件 | 主要动作 |
|------|---------|---------|
| `project-onboarding` | `.spec-first` 不存在、`meta/config.yaml` 缺失、或 00-first 未完成 | 补齐项目壳并继续 feature-init |
| `brownfield-baseline` | 存量项目（≥50 源码文件）且尚无基线 Feature | 交互式引导创建 `FSREQ-19700101-LEGACY-BASELINE` |
| `feature-init` | 健康项目 + 基线已就绪（或 greenfield） | 收集参数并创建新 Feature |

可通过 `--track <project|baseline|feature>` 显式覆盖自动路由。

## 执行流程

### project-onboarding 轨道

1. 检测并补齐 `.spec-first/meta/config.yaml`
2. 若 first runtime 不完整，则标记降级背景状态并提示补跑 `/spec-first:first`
3. 继续进入 feature-init 流程，完成参数收集与 Feature 创建

### brownfield-baseline 轨道

1. 提示用户存量项目尚无基线
2. 显示将创建的 baseline Feature 参数（featureId: `FSREQ-19700101-LEGACY-BASELINE`，mode: I，size: M）
3. 先解释为什么建议建基线：把当前系统已有能力盘点成一份可分析起点，后续业务 Feature 基于这份起点继续，不把旧系统当空白项目
4. 提供三个选项：
   - **[y] 创建基线**：自动生成 baseline Feature，含 `prd.md`（已上线能力摘要）和 `task_plan.md`（基线补齐）
   - **[s] 跳过**：写入 `baselineSkipped: true` 到 `.spec-first/meta/config.yaml`，下次直接进入 feature-init；适合你已经明确要直接推进某个业务需求
   - **[n] 退出**：取消操作
5. 创建基线后，提示用户完成 `prd.md` 盘点，然后再运行 `/spec-first:init` 创建业务 Feature

### feature-init 轨道

**执行流程**：

1. **检查 runtime 真源**
   - 完整：显示摘要（如"技术栈: TypeScript, 代码量: 15k LOC, API: 23 端点"）
   - 不完整：标记 `background_input_status=degraded` 或 `blind`，提示补跑 `/spec-first:first`

2. **扫描平台列表**
   - 读取 `.spec-first/layer2/*.yaml`，提取 `platform` 字段
   - 若目录不存在或为空 → 询问用户"需要哪些平台？[h5, java-backend, ios, android]"，然后创建平台 YAML（见 [prerequisites.md](references/prerequisites.md)）

3. **交互式收集参数**
   - 顺序：feat → mode → size → platforms → title → feature-id → bootstrap
   - 详见 [interaction-guide.md](references/interaction-guide.md)
   - **feat 中文输入**：提取关键词首字母生成 3-4 个英文缩写候选（如"首页阶段流转图" → HOMEPAGE / FLOWCHART / STAGEFLOW）

4. **参数确认**
   - 回显所有选择，询问"确认以上参数？[Y/n]"

5. **执行 CLI**
   - 组装参数：`spec-first init --feat <FEAT> --mode <N|I> --size <S|M|L> --platforms <逗号分隔>`
   - 可选参数：`--title`, `--feature-id`, `--bootstrap`
   - CLI 成功后输出摘要（Feature ID、目录、已创建文件）
   - 输出格式示例见 [references/output-format.md](references/output-format.md)

## 参数约束

详见 [parameters.md](references/parameters.md)。关键：`feat` 必须 `^[A-Z][A-Z0-9]{0,15}$`，`platforms` 必须来自 `.spec-first/layer2/*.yaml`。

## 交互要求

逐步引导，顺序：feat → mode → size → platforms → title → feature-id → bootstrap。详见 [interaction-guide.md](references/interaction-guide.md)
