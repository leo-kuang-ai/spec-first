---
description: "定位 Feature 并校验阶段为归档复盘（06_wrap_up）"
---

先运行以下命令，获取带项目运行时上下文的最新 Skill 定义：

`spec-first skill render archive${ARGUMENTS:+ --input "$ARGUMENTS"}`

将命令输出视为本次执行的完整 Skill 定义，并严格遵循其要求。

用户输入：$ARGUMENTS
