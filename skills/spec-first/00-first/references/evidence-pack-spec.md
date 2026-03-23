# Evidence Pack 规范

> 规范主线程与 subagents 之间如何传递证据。
> 目标是把“证据包”标准化为结构化输入，避免主线程把长证据直接塞给每个 agent。

## 1. Evidence Pack 目录结构

最小逻辑结构如下，属于强制规范，不是建议：

```text
evidence-pack/
  manifest.json
  shared/
  runtime/
  docs/
```

- `manifest.json`：本轮包的摘要、范围、版本、生成时间
- `shared/`：runtime 与 docs 共享的最小事实
- `runtime/`：runtime agents 可读的证据集合
- `docs/`：docs agents 可读的证据集合
- 任一 wave 的 evidence pack 至少要覆盖当前 wave 需要的事实切片，不能只给目录壳

## 2. shared/ 共享摘要

- `shared/` 仅属于 Skill 层执行产物，不是 CLI 自动验收的最终交付物
- `shared/summary.json` 由主线程动态生成，提供跨 wave 的最小共享事实
- `shared/context.json` 记录 Serena 可用性、降级原因与本轮关键配置
- `shared/summary.json` 至少应包含 `serena_available`、`project_type`、`entry_points` 与 `gaps`
- 不得手动维护 `shared/summary.json` 或以静态快照替代

## 3. runtime wave 可读范围

- 允许读取 `manifest.json`
- 允许读取 `shared/`
- 允许读取 `runtime/`
- 不允许重新扩展为长篇背景分析

## 4. docs wave 可读范围

- 允许读取 `manifest.json`
- 允许读取 `shared/`
- 允许读取本轮已确认的 runtime 结果
- 不允许重新取证或反向修正 runtime 真源

## 5. 传递原则

- 主线程只发包，不发长证据
- subagent 只消费与自己波次相关的 evidence slice
- 缺证据时必须标记 `[待确认]`
- 不得把猜测写成确定事实

## 6. 最小必读层

在开始扩展 wave 证据前，至少先读取以下角色对应的文件：

| 角色 | 目的 | 常见文件示例 |
|------|------|-------------|
| Manifest | 快速识别项目基本形态、脚本与依赖入口 | `package.json`、`pyproject.toml`、`pom.xml`、`go.mod` |
| README | 快速识别项目意图、使用方式与推荐入口 | `README.md`、`readme.md` |
| Entry | 定位主启动入口或命令入口 | `src/index.ts`、`src/main.*`、`app/main.*`、`main.py` |
| Config | 定位构建、类型、运行与 workspace 配置 | `tsconfig.json`、`vite.config.*`、`next.config.*`、`nx.json` |
| Lockfile | 确认依赖冻结状态，辅助判断技术栈稳定性 | `pnpm-lock.yaml`、`package-lock.json`、`yarn.lock`、`poetry.lock` |

说明：
- 角色优先，不要求所有项目都存在每一种文件。
- 若某一角色文件缺失，可用同角色的其他证据替代，但不得跳过整个角色。
- 对 monorepo / 多语言项目，先读根层 Manifest 与 README，再补各子包的 Entry / Config。

## 7. 最小充分性判断

evidence pack 只有在满足以下条件时才视为“足够”：

- 能识别当前项目主类型与必要子类型
- 能定位当前 wave 需要的入口、关键配置和核心依赖
- 无需再向主线程追问“项目是什么、入口在哪里、基础依赖是什么”这类前置问题
