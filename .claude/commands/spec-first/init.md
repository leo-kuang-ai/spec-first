---
description: "定位项目根目录并通过交互式引导初始化 Feature 工作区（可选 --bootstrap 执行宿主检查/安装）"
---

先运行以下命令，获取带项目运行时上下文的最新 Skill 定义：

`spec-first skill render init${ARGUMENTS:+ --input "$ARGUMENTS"}`

将命令输出视为本次执行的完整 Skill 定义，并严格遵循其要求。

用户输入：$ARGUMENTS
