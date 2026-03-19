# 执行流程

## 总原则

- Skill 定义执行流
- Skill 负责多 Agent 编排
- CLI 只负责最小支撑层
- runtime 是机器真源
- docs 是人类阅读产物

## Skill 层执行流

### 启动命令

- 默认入口：`spec-first first`

### 1. collect evidence pack

- 收集项目结构、关键配置、依赖声明、入口、重要源码证据
- 所有 Agent 共享同一份证据基础

### 2. dispatch runtime agents

- runtime agents 负责产出结构化 runtime 结果
- 输出必须对齐当前 runtime contract
- 不允许把 docs 当输入真源
- runtime agents 分波派发，单波最多 3 个 Agent 并发

### 3. dispatch docs agents

- docs agents 负责产出 `docs/first/*.md`
- docs 可以更详细，但不得与 runtime 明确冲突
- docs 不参与后续上下文注入
- docs agents 分波派发，单波最多 3 个 Agent 并发

### 4. 写入最终文件

- runtime agents 与 docs agents 产出的结果直接写入最终路径
- runtime 输出写入 `.spec-first/runtime/first/*`
- docs 输出写入 `docs/first/*`
- Skill 层在最终文件落盘后结束，不再保留中转交接目录

## CLI 最小支撑层职责

### 1. runtime 校验

- 校验 runtime JSON 可解析
- 校验必填字段存在
- 校验字段类型与条件型状态合法

### 2. runtime 读取与校验

- 读取 `.spec-first/runtime/first/*.json`
- 校验 `index.json`
- 若 runtime 缺失，最小支撑层直接失败

### 3. docs 存在性检查

- 检查固定 docs 是否存在
- 检查条件型 docs 是否在条件满足时存在

## 删除的旧语义

- 本地旧式 builder 主导认知产出（历史语义，已删除）
- `docs/first` 作为文档真源
- docs 内容漂移作为系统错误
