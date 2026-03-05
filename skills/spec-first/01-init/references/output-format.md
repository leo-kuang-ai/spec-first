# 输出格式

> Init Skill 的输出消息与格式模板

---

## 成功消息

### 标准成功输出

```
✅ Feature 初始化成功

Feature ID: FSREQ-20260305-AUTH-001
标题: 用户认证功能
目录: specs/FSREQ-20260305-AUTH-001/
阶段: 🔧 初始化 (00_init)
平台: h5, java-backend

已创建:
- stage-state.json
- constitution.md
- traceability-matrix.md
- findings.md
- task_plan.md

已更新:
- .spec-first/current
- specs/.feat-registry.md

💡 下一步:
运行 /spec-first:spec 开始编写需求规格
```

---

### 带 bootstrap 的成功输出

```
✅ Feature 初始化成功

Feature ID: FSREQ-20260305-AUTH-001
标题: 用户认证功能
目录: specs/FSREQ-20260305-AUTH-001/
阶段: 🔧 初始化 (00_init)
平台: h5, java-backend

已创建:
- stage-state.json
- constitution.md
- traceability-matrix.md
- findings.md
- task_plan.md

已更新:
- .spec-first/current
- specs/.feat-registry.md

宿主环境检查:
✅ MCP 配置完整
✅ Skills 已安装
✅ Git Hooks 已安装

💡 下一步:
运行 /spec-first:spec 开始编写需求规格
```

---

## 错误消息

### 前置检查失败

```
❌ 初始化失败: 缺失项目认知文档

未找到 docs/first/ 目录或核心产物不完整。

缺失:
- docs/first/tech-stack.md
- docs/first/domain-model.md

💡 解决方案:
运行 /spec-first:first 生成项目认知文档
```

---

### 参数验证失败

```
❌ 初始化失败: 参数格式错误

feat 格式错误: "user-report"

要求: 大写字母开头，只能包含大写字母和数字

示例:
✅ AUTH
✅ REPORT
❌ user-report
```

---

### CLI 执行失败

```
❌ 初始化失败: CLI 命令执行错误

命令: spec-first init --feat AUTH --mode N --size M --platforms h5
退出码: 1

错误详情:
{CLI 错误输出}

💡 建议:
1. 检查参数是否正确
2. 运行 spec-first --version 确认 CLI 可用
3. 查看详细日志
```

---

## 警告消息

### 重复初始化

```
⚠️  Feature 已存在

Feature ID: FSREQ-20260305-AUTH-001
当前阶段: 📝 需求规格 (01_specify)

操作:
- 已更新 .spec-first/current 指向此 Feature
- 未重置阶段状态

💡 提示:
使用 /spec-first:feature-switch 切换到其他 Feature
```

---

### platforms 重复值

```
⚠️  检测到重复的平台选择

输入: h5,java-backend,h5
处理后: h5,java-backend

已自动去重并排序。
```

---

## 进度提示

### 执行中

```
🔄 正在初始化...

[1/5] 创建 Feature 目录
[2/5] 生成配置文件
[3/5] 更新注册表
[4/5] 安装 Hooks
[5/5] 验证初始化结果

完成！
```

---

## 输出路径说明

### 创建的文件

```
specs/FSREQ-20260305-AUTH-001/
├── stage-state.json          # 阶段状态
├── constitution.md           # 项目原则
├── traceability-matrix.md    # 追踪矩阵
├── findings.md               # 过程发现
└── task_plan.md              # 任务计划

specs/
└── .feat-registry.md         # Feature 注册表

.spec-first/
├── current                   # 当前 Feature 指针
└── meta/
    └── config.yaml           # 项目配置

.claude/
└── settings.json             # Claude 配置
```
