# 规范与本地环境执行提示

> 这是增强路径提示，不是主题规范正文。只在 CLI 输出证据不足时补规范或本地环境证据缺口。

## 适用场景

- `development-guidelines.md` 缺少规则来源或验证方式
- `development-guidelines.md` 缺少运行时版本、安装/启动命令、环境变量来源或最小验证路径

## 对应 runtime 资产

- `conventions.json`
- `entry-guide.json`

## 最小执行责任

### C2-规范

- 补项目实际采用的代码规范、测试规范、配置规则和禁忌模式
- 先写 `conventions.json`
- 再投影为 `docs/first/development-guidelines.md`

### C2-环境

- 补运行时版本、安装命令、启动命令、环境变量来源、最小验证路径
- 先写 `entry-guide.json`
- 再投影到 `docs/first/development-guidelines.md` 的本地环境章节

## 工具与降级

- 可按需读取配置文件、脚本、环境模板和运行命令
- 缺少配置文件时，允许只输出代码中可见的最低规则
- 缺少环境示例文件时，允许只输出启动与验证路径
- 无法确认的步骤必须标注 `[待确认]`

## 质量保障

- 通用证据格式、抽样流程、违规判定：见 `references/quality-assurance-rules.md`
