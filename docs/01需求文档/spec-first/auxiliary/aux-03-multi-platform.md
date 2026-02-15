# Spec-First v7.1 — 多端扩展（Layer 2）

> **模块**: 辅助功能模块 #3 | **拆分自**: spec-first-v7.md L1356-1588
> **版本**: v7.1 | **更新**: 2026-02-09

---

> 本文档仅定义 **技术端平台规范**（H5/Java Backend 等端特有质量标准）。

## 概念澄清

```text
Layer 2 = 技术端规范（端特有质量标准）

技术端规范（TechStack）
├── H5 前端
├── Java Backend
├── APP (Android/iOS)
├── PC 桌面端
└── 自定义端...
```

| 维度 | 技术端规范 |
|------|----------|
| **解决什么** | 各端"做到什么标准" |
| **谁维护** | 各端技术负责人 |
| **何时生效** | Feature init 时合并到流程实例 |
| **影响范围** | Gate 条件叠加、额外产出物、质量阈值 |

---

## A. 技术端规范（Layer 2 核心） 📋 Planned

### 目录约定

端规范文件统一存放于项目根目录 `.spec-first/layer2/`，每端一个 YAML 文件：

```text
.spec-first/
├── config.yaml                    # 项目全局配置
└── layer2/                        # 端规范目录
    ├── h5.yaml                    # H5 前端端规范
    ├── java-backend.yaml          # Java 后端端规范
    ├── app-android.yaml           # Android 端规范
    ├── app-ios.yaml               # iOS 端规范
    └── pc.yaml                    # PC 桌面端规范
```

**命名规则**：文件名即端标识（kebab-case），与 `spec-first init --platforms h5,java-backend` 参数对应。

### 端规范文件标准格式

```yaml
# .spec-first/layer2/h5.yaml
# Layer 2 端规范 — H5 前端
name: H5 前端
description: H5/移动端 Web 特有的质量标准与检查清单

# ── Gate 叠加条件 ──
gate_conditions:
  04_implement:
    - id: L2-H5-IMPL-001
      description: "ESLint + Stylelint 零 error"
      type: auto
      command: "npm run lint"
    - id: L2-H5-IMPL-002
      description: "Bundle Size ≤ 500KB (gzipped)"
      type: auto
      command: "npm run build && bundlesize"
      threshold: 500
  05_verify:
    - id: L2-H5-VERIFY-001
      description: "Lighthouse Performance ≥ 80"
      type: auto
      command: "lighthouse --output json"
      threshold: 80
    - id: L2-H5-VERIFY-002
      description: "浏览器兼容性验证（Chrome/Safari/Firefox 最新 2 版本）"
      type: manual
    - id: L2-H5-VERIFY-003
      description: "Lighthouse Accessibility ≥ 90"
      type: auto
      threshold: 90

# ── 额外产出物 ──
extra_deliverables:
  02_design:
    - name: responsive-spec.md
      required: true
      description: "响应式设计规范（断点定义、布局策略）"
  05_verify:
    - name: browser-compat-report.md
      required: true
      description: "浏览器兼容性测试报告"

# ── 质量阈值 ──
quality_thresholds:
  code_coverage_min: 80
  lighthouse_performance: 80
  lighthouse_accessibility: 90
  bundle_size_kb: 500
```

```yaml
# .spec-first/layer2/java-backend.yaml
# Layer 2 端规范 — Java Backend
name: Java 后端
description: Java/Spring Boot 后端特有的质量标准与检查清单

gate_conditions:
  04_implement:
    - id: L2-JAVA-IMPL-001
      description: "SonarQube Quality Gate 通过"
      type: auto
      command: "mvn sonar:sonar && sonar-gate-check"
    - id: L2-JAVA-IMPL-002
      description: "无 Critical/Blocker 级 Checkstyle 违规"
      type: auto
      command: "mvn checkstyle:check"
  05_verify:
    - id: L2-JAVA-VERIFY-001
      description: "API P99 延迟 ≤ 200ms"
      type: manual
      threshold: 200
    - id: L2-JAVA-VERIFY-002
      description: "无 OWASP Top 10 高危漏洞"
      type: auto
      command: "mvn dependency-check:check"

extra_deliverables:
  02_design:
    - name: api-performance-budget.md
      required: false
      description: "API 性能预算（P50/P99 目标值）"

quality_thresholds:
  code_coverage_min: 80
  api_p99_ms: 200
  sonarqube_gate: pass
  critical_violations: 0
```

### 合并机制

```text
Feature Init 时的三层合并流程：

spec-first init --feat AUTH --mode N --size M --platforms h5,java-backend
     │
     ▼
┌─ Layer 0 ──────────────────────────────┐
│  8 主阶段基线 Gate + 基线产出物          │
└──────────────────┬─────────────────────┘
                   │
┌─ Layer 1 ────────▼─────────────────────┐
│  Mode N × Size M 裁剪                   │
│  产出物深度调整、Gate 条件调整            │
└──────────────────┬─────────────────────┘
                   │
┌─ Layer 2 ────────▼─────────────────────┐
│  读取 .spec-first/layer2/h5.yaml       │
│  读取 .spec-first/layer2/java-backend.yaml │
│  ┌──────────────────────────────────┐  │
│  │ 合并策略：                        │  │
│  │ 1. gate_conditions → 叠加到阶段   │  │
│  │ 2. extra_deliverables → 追加      │  │
│  │ 3. quality_thresholds → 取严格值  │  │
│  └──────────────────────────────────┘  │
└──────────────────┬─────────────────────┘
                   │
                   ▼
          specs/<featureId>/stage-state.json
          （含完整的合并后 Gate 条件和产出物清单）
```

**合并规则**：

| 字段 | 合并策略 | 示例 |
|------|---------|------|
| `gate_conditions` | 各端条件**叠加**到同一阶段（AND 关系） | H5 的 Lighthouse + Java 的 SonarQube 同时出现在 05_verify |
| `extra_deliverables` | **追加**到阶段产出物列表 | 02_design 多出 responsive-spec.md 和 api-performance-budget.md |
| `quality_thresholds` | 多端冲突时**取较严格值** | H5 要求覆盖率 80%，Java 要求 85% → 最终 85% |

**CLI 实现锚点**：`SpecMerger.applyPlatformRules()`（`src/core/process-engine/spec-merger.ts:86`，当前为 TODO）。

### 新增端规范流程

1. 在 `.spec-first/layer2/` 下创建 `<tech-stack>.yaml`
2. 按标准格式定义 `gate_conditions` / `extra_deliverables` / `quality_thresholds`
3. `spec-first init` 时通过 `--platforms` 引用端标识
4. SpecMerger 自动读取并合并

---

## B. 范围边界

本规范中 `spec-first init` 仅接收技术端平台参数：`--platforms <p1,p2,...>`。

---

*aux-03-multi-platform.md 完成 — 下一篇：[aux-04-deliverables.md](aux-04-deliverables.md)*
