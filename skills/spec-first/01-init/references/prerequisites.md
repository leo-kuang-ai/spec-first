# 前置条件检查

> Init Skill 执行前必须满足的条件

---

## 00-first runtime 真源要求

**优先背景输入**：
- `first` 项目认知资产是 init 的优先背景输入，不是唯一阻断前置
- 当资产缺失或不完整时，允许以 `degraded` / `blind` 背景继续初始化
- 降级模式继续，但必须显式提示用户补跑 `/spec-first:first`

**必须存在的目录**:
- `.spec-first/runtime/first/`

**必须存在的索引**:
- `.spec-first/runtime/first/index.json`

**必须存在的 runtime 真源文件**:
- `.spec-first/runtime/first/summary.json`
- `.spec-first/runtime/first/entry-guide.json`
- `.spec-first/runtime/first/steering.json`

**说明**:
- `docs/first/` 是阅读输出层，可缺失或滞后
- readiness 只看 runtime 真源，不依赖任何 legacy YAML 索引
- 不阻断初始化需求工作区，缺失时改走降级背景模式

### 检查逻辑

```
1. 检查 .spec-first/runtime/first/ 目录是否存在
   ├─ 否 → 提示执行 /spec-first:first
   └─ 是 → 继续

2. 检查 index.json / summary.json / entry-guide.json / steering.json 是否存在
   ├─ 缺失任一文件 → 标记 `background_input_status=degraded`，提示执行 /spec-first:first
   └─ 全部存在 → 通过 readiness
```

### 错误提示模板

```
⚠️ 优先背景输入不完整: 缺失 00-first runtime 真源

缺失以下文件:
- .spec-first/runtime/first/index.json
- .spec-first/runtime/first/entry-guide.json

💡 解决方案:
运行 /spec-first:first 重新生成 runtime 真源，或以降级模式继续初始化
```

---

## 项目初始化文件检查

### 检查项（用于提示）

**目录检查**:
- `.spec-first/` - 项目配置目录
- `.spec-first/layer2/` - 平台模板目录
- `.spec-first/meta/` - 元数据目录

**文件检查**:
- `.spec-first/meta/config.yaml` - 项目配置
- `.spec-first/layer2/*.yaml` - 平台模板文件

### 检查逻辑

```
1. 检查 .spec-first/ 目录
   ├─ 不存在 → 提示"首次初始化"
   └─ 存在 → 继续

2. 检查 .spec-first/layer2/ 目录
   ├─ 不存在或为空 → 引导创建平台 YAML（见下方）
   └─ 存在且有文件 → 继续

3. 检查 .spec-first/meta/config.yaml
   ├─ 不存在 → 提示"将自动创建"
   └─ 存在 → 提示"已存在"
```

### 平台 YAML 创建流程

当 `.spec-first/layer2/` 不存在或为空时：

1. **中止当前 init 交互**（平台模板属于 Skill / 工作流决策，不属于脚本启发式）
2. 询问用户"需要哪些平台？[h5, java-backend, ios, android, admin-frontend]"
3. 创建目录：`mkdir -p .spec-first/layer2`
4. 按用户选择创建平台 YAML（模板示例见下方）

---

## 平台 YAML 模板示例

**关键约束**：第一个字段必须是 `platform`（不是 `name`），这是 CLI 校验的硬性要求。

### Java 后端服务

```yaml
platform: java-backend
label: Java 后端服务
description: Spring Boot + XXL-Job 定时任务服务
tech_stack:
  language: Java
  framework: Spring Boot
  scheduler: XXL-Job
  rpc: Dubbo 3.0
  config: Nacos
  messaging: Kafka
build:
  tool: Maven
  jdk: 17
test:
  unit: JUnit 5
  integration: Spring Boot Test
deploy:
  container: Docker
  orchestration: Kubernetes
```

### 前端应用

```yaml
platform: admin-frontend
label: 管理后台前端
description: React + TypeScript + Ant Design
tech_stack:
  language: TypeScript
  framework: React 18
  ui: Ant Design 5
  state: Redux Toolkit
  router: React Router 6
build:
  tool: Vite
  node: 20
test:
  unit: Vitest
  e2e: Playwright
deploy:
  cdn: OSS
  server: Nginx
```

### H5 移动端

```yaml
platform: h5
label: H5 移动端
description: Vue 3 + Vant 移动端应用
tech_stack:
  language: TypeScript
  framework: Vue 3
  ui: Vant 4
  state: Pinia
build:
  tool: Vite
  node: 20
test:
  unit: Vitest
deploy:
  cdn: OSS
```

---

## Windows 注意事项

- 使用 UTF-8 编码保存文件
- 使用 LF 换行符（不是 CRLF）
- 路径分隔符使用 `/` 或 `\\`（Node.js 会自动处理）
