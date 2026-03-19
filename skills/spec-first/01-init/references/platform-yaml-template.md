# 平台 YAML 模板

> 当 `.spec-first/layer2/` 目录不存在或为空时，需要创建平台配置文件

---

## 必填字段

**关键约束**：第一个字段必须是 `platform`（不是 `name`），这是 CLI 校验的硬性要求。

```yaml
platform: <平台标识>  # 必填，CLI 会校验此字段
label: <显示名称>
description: <平台描述>
```

---

## 模板示例

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

## 创建流程

当检测到 `.spec-first/layer2/` 不存在或为空时：

1. **停止 CLI 内的模板自动创建**
2. **运行 `spec-first skill render init`**
3. **按 Skill 输出的工作流补齐模板**
4. **创建目录**：`mkdir -p .spec-first/layer2`
5. **写入文件**：`.spec-first/layer2/<platform>.yaml`
6. **验证格式**：确保 `platform` 字段存在

---

## Windows 注意事项

- 使用 UTF-8 编码保存文件
- 使用 LF 换行符（不是 CRLF）
- 路径分隔符使用 `/` 或 `\\`（Node.js 会自动处理）
