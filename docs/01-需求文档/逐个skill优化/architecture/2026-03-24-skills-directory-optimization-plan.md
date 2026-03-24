# `skills/` 目录专项优化方案

## 目标

只优化 `skills/` 目录的组织方式，不改变任何功能、命令、运行时协议或产物语义。

目标是把 `skills/` 从“内容堆叠目录”整理成“职责清晰的技能包”，让人和 agent 都能快速判断：

- 哪个文件是入口
- 哪个文件是 policy
- 哪个文件是共享约束
- 哪个文件是真正的 skill 定义

## 当前问题

`skills/` 目录目前承载了过多角色：

1. Skill 索引
2. 全局 agent 规则
3. 跨 skill 共享约束
4. 具体 skill 定义
5. 参考文档
6. 生成副本与治理规则

这会导致三个问题：

- 读者不知道该先看哪个文件
- 规则重复，修改容易漏同步
- `README.md`、`AGENTS.md`、`SHARED.md` 的边界不清

## 组织原则

### 1. `README.md` 只做目录索引

职责：
- skill 分类
- skill 导航
- 快速入口
- 目录说明

不负责：
- 具体流程说明
- agent 行为规则
- 具体执行语义

### 2. `AGENTS.md` 只做全局 agent policy

职责：
- 通用行为约束
- 证据铁律
- 文件系统记忆规则
- host / hook 兼容规则

不负责：
- skill catalog
- 目录导航
- 具体 skill 的执行步骤

### 3. `SHARED.md` 只做跨 skill 通用约束

职责：
- 通用术语
- 输出格式
- 命名规范
- 共同的产物边界

不负责：
- 某一个 skill 的专属规则
- 全局 agent 行为
- CLI 命令参考

### 4. 每个 `SKILL.md` 只保留 skill 契约

职责：
- 触发条件
- 输入上下文
- 输出产物
- 成功标准
- 失败/降级规则

不负责：
- 大段策略背景
- 其他 skill 的说明
- 全局 policy

## 目标结构

```text
skills/
└── spec-first/
    ├── README.md              # 技能目录索引
    ├── AGENTS.md              # 全局 agent policy
    ├── SHARED.md              # 跨 skill 通用约束
    ├── 00-first/
    │   ├── SKILL.md
    │   └── references/
    ├── 01-init/
    ├── 02-catchup/
    ├── 03-spec/
    ├── 04-design/
    ├── 05-research/
    ├── 06-task/
    ├── 07-code/
    ├── 08-review/
    ├── 10-archive/
    ├── 11-plan/
    ├── 12-verify/
    ├── 13-orchestrate/
    ├── 14-status/
    ├── 15-doctor/
    ├── 16-sync/
    ├── 17-feature/
    ├── focus-requirements/
    ├── 20-spec-review/
    ├── 21-analyze/
    └── references/
```

## 优化后的 skills 目录结构

下面这版是组织优化后的推荐结构，重点是把索引、policy、共享约束、skill 定义和参考资料分开。

```text
skills/
└── spec-first/
    ├── README.md                  # 技能目录索引 / 导航
    ├── AGENTS.md                  # 全局 agent policy
    ├── SHARED.md                  # 跨 skill 共享约束
    ├── references/                # 全局参考资料
    │   ├── skill-catalog.md
    │   ├── stage-map.md
    │   ├── output-contracts.md
    │   └── terminology.md
    ├── 00-first/
    │   ├── SKILL.md
    │   └── references/
    ├── 01-init/
    │   ├── SKILL.md
    │   └── references/
    ├── 02-catchup/
    │   ├── SKILL.md
    │   └── references/
    ├── 03-spec/
    │   ├── SKILL.md
    │   └── references/
    ├── 04-design/
    │   ├── SKILL.md
    │   └── references/
    ├── 05-research/
    │   ├── SKILL.md
    │   └── references/
    ├── 06-task/
    │   ├── SKILL.md
    │   └── references/
    ├── 07-code/
    │   ├── SKILL.md
    │   └── references/
    ├── 08-review/
    │   ├── SKILL.md
    │   └── references/
    ├── 10-archive/
    │   ├── SKILL.md
    │   └── references/
    ├── 11-plan/
    │   ├── SKILL.md
    │   └── references/
    ├── 12-verify/
    │   ├── SKILL.md
    │   └── references/
    ├── 13-orchestrate/
    │   ├── SKILL.md
    │   └── references/
    ├── 14-status/
    │   ├── SKILL.md
    │   └── references/
    ├── 15-doctor/
    │   ├── SKILL.md
    │   └── references/
    ├── 16-sync/
    │   ├── SKILL.md
    │   └── references/
    ├── 17-feature/
    │   ├── SKILL.md
    │   └── references/
    ├── focus-requirements/
    │   ├── SKILL.md
    │   ├── SKILL.zh.md
    │   └── references/
    ├── 20-spec-review/
    │   ├── SKILL.md
    │   └── references/
    └── 21-analyze/
        ├── SKILL.md
        └── references/
```

### 这版结构的核心含义

- `README.md` 只负责让人找到 skill。
- `AGENTS.md` 只负责全局 agent 行为约束。
- `SHARED.md` 只负责跨 skill 共享规则。
- 每个 skill 目录只负责自己的入口和参考材料。
- `references/` 分成全局和局部两级，避免规则散落。

## Skill 分组建议

### 1. 认知类

- `00-first`
- `02-catchup`
- `14-status`

用途：
- 建立项目认知
- 恢复上下文
- 查看当前状态

### 2. 定义类

- `03-spec`
- `04-design`
- `06-task`
- `focus-requirements`

用途：
- 需求定义
- 技术设计
- 任务拆解
- 需求收敛

### 3. 执行类

- `07-code`
- `08-review`
- `12-verify`

用途：
- 代码实现
- 代码审查
- 阶段验收

### 4. 治理类

- `01-init`
- `11-plan`
- `13-orchestrate`
- `15-doctor`
- `16-sync`
- `17-feature`

用途：
- 初始化
- 编排
- 诊断
- 同步
- Feature 管理

### 5. 分析类

- `05-research`
- `20-spec-review`
- `21-analyze`

用途：
- 技术调研
- 需求审查
- 跨产物一致性分析

## 文件职责边界

### `README.md`

建议只保留：
- 技能分类表
- 推荐路径
- 阶段映射
- 快速开始

建议移除：
- 复杂 policy 说明
- 详细流程图
- skill 行为的长篇描述

### `AGENTS.md`

建议只保留：
- agent 全局行为规则
- hook 和证据规范
- 文件系统记忆规则
- 图示约定

建议移除：
- skill catalog
- 具体 skill 列表解释
- 目录结构教学内容

### `SHARED.md`

建议只保留：
- 术语表
- 通用命名规则
- 通用输出格式
- 通用降级语义

建议移除：
- 单 skill 专属例外
- 全局 agent policy
- CLI 命令参考

### `references/`

建议只放：
- skill 需要的细化规则
- 示例
- 输入输出模板
- 低频但必须存在的补充说明

不建议放：
- 顶层目录索引
- 通用 policy
- 其他 skill 的说明

## 优化顺序

### Phase 1：先收口文档职责

动作：
- `README.md` 收敛为索引
- `AGENTS.md` 收敛为 agent policy
- `SHARED.md` 收敛为跨 skill 约束

验收：
- 三个文件的职责不再互相重叠
- 读者不需要跨读多个文件才能知道“该看什么”

### Phase 2：再整理 skill 分类

动作：
- 把 skill 按认知 / 定义 / 执行 / 治理 / 分析分组
- 在 `README.md` 中显式展示分组

验收：
- 用户能根据任务类型快速定位 skill
- skill 不再按纯编号堆叠

### Phase 3：统一 `SKILL.md` 结构

动作：
- 统一每个 skill 的章节顺序
- 统一输入上下文和输出契约的写法
- 统一失败/降级说明方式

验收：
- 任意 skill 的前几屏结构一致
- 不同 skill 的写法不会让人误以为是不同体系

### Phase 4：规范 `references/`

动作：
- 每个 reference 文件只承载一个主题
- 低频细则下沉到 reference
- 顶层 skill 只保留入口级说明

验收：
- reference 不再混入目录职责说明
- 具体规则查找路径稳定

## 不变项

本次专项优化不改变：

- skill 名称
- 命令名
- runtime 协议
- 输入输出格式
- 阶段流转规则
- 测试语义

## 成功标准

- `skills/` 从“混合容器”变成“职责清晰的技能包”
- `README.md`、`AGENTS.md`、`SHARED.md` 三者边界明确
- skill 分组清楚，入口更好找
- 任何人只看目录就能理解每一层的责任
