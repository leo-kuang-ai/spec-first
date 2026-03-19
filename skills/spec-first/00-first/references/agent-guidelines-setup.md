# 规范与本地环境执行提示

> 这是按需补证据提示，不是主题规范正文。
> 由 Skill 按执行流决定是否派发，不由 CLI 判断是否触发。

## 适用场景

- `development-guidelines.md` 缺少规则来源或验证方式
- `development-guidelines.md` 缺少运行时版本、安装/启动命令、环境变量来源或最小验证路径

## 对应 runtime 资产

- `conventions.json`
- `entry-guide.json`

## 最小执行责任

### C2-规范

- 补项目实际采用的代码规范、测试规范、配置规则和禁忌模式
- 产出 `conventions.json` 所需的结构化事实
- 同时补齐 `docs/first/development-guidelines.md` 中的规范部分

### C2-环境

- 补运行时版本、安装命令、启动命令、环境变量来源、最小验证路径
- 产出 `entry-guide.json` 所需的结构化事实
- 同时补齐 `docs/first/development-guidelines.md` 的本地环境章节

## 工具与降级

- 可按需读取配置文件、脚本、环境模板和运行命令
- 缺少配置文件时，允许只输出代码中可见的最低规则
- 缺少环境示例文件时，允许只输出启动与验证路径
- 无法确认的步骤必须标注 `[待确认]`

## 质量保障

- 通用证据格式、抽样流程、违规判定：见 `references/quality-assurance-rules.md`
