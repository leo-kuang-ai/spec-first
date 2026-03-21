# 规范与本地环境分析主题

> 正式真源以 `conventions.json`、`entry-guide.json` 为准；`development-guidelines.md` 承载规范与本地环境专题阅读输出。
> 执行提示见 `references/agent-guidelines-setup.md`。

## 1. 主题划分

- **C2-规范**：项目开发规范与代码约束
- **C2-环境**：本地运行、安装、启动、验证路径

## 2. 正式输出

### runtime truth

- `conventions.json`
- `entry-guide.json`

### docs outputs

- `docs/first/development-guidelines.md`

## 3. 规范分析要求

必须覆盖：
- 代码风格与 lint / format 约束
- 测试规范与验证方式
- 配置管理方式
- 项目规则与禁忌模式

约束：
- 规范必须基于实际配置、脚本、目录和代码证据
- 不得把“业界最佳实践”直接写成“当前项目规则”

## 4. 本地环境分析要求

必须覆盖：
- 运行时版本要求
- 安装命令
- 启动命令
- 关键环境变量来源
- 最小验证路径

约束：
- 不得输出密码、令牌、完整连接串
- 环境变量只展示名称，不展示敏感值

## 5. 输出约束

- `development-guidelines.md` 负责专题展开，不引入新事实
- `development-guidelines.md` 负责规范与上手路径，不替代 runtime truth
- Markdown 默认中文输出，命令与路径保留英文原文

## 6. 降级策略

- 缺少配置文件时，允许只输出代码中可见的最低规则
- 缺少环境示例文件时，允许只输出启动与验证路径
- 无法确认的步骤必须标注 `[待确认]`

## 7. 质量门禁引用

- 通用证据格式、抽样验证与违规判定统一遵循 `references/quality-assurance-rules.md`
