# 阶段 C — 扩展与优化（P2）

> **目标**: 多端扩展 + 性能 SLA + E2E + CI/CD 适配 + IDE 插件
> **准出**: benchmark 通过 + CI 绿灯 + 至少 1 个 CI 平台可用
> **对齐技术方案**: v2-09, v2-12, v2-03, v2-06

---

## 一、Layer 2 多端扩展（T-CL2-xxx）

> **对齐技术方案**: v2-09 多端规范合并
> **对齐需求**: aux-03-multi-platform

### T-CL2-001 端规范 YAML 模板编写

**描述**: 编写 5 个平台的 Layer 2 YAML 模板文件

**输入**: v2-09 §2 Layer 2 端规范格式

**产出物**:
```text
.spec-first/layer2/
├── h5.yaml
├── java-backend.yaml
├── app-ios.yaml
├── app-android.yaml
└── pc.yaml
```

**功能**:
- 每个 YAML 包含: platform, name, description, gate_conditions, extra_deliverables, quality_thresholds
- gate_conditions 按阶段组织（04_implement, 05_verify 等）
- quality_thresholds 包含显式 direction 字段（higher_is_better / lower_is_better）
- 各平台特有检查项:
  - h5: ESLint/Stylelint、Bundle Size、Lighthouse Performance/Accessibility、浏览器兼容性
  - java-backend: Checkstyle、JaCoCo 覆盖率、API 响应时间
  - app-ios: SwiftLint、App Size、启动时间
  - app-android: Ktlint、APK Size、ANR 率
  - pc: ESLint、Electron 包体积、内存占用

**验收标准**:
1. 5 个 YAML 文件格式合法（js-yaml 可解析）
2. 每个文件包含完整的三类字段
3. direction 字段无缺失

**依赖**: T-AM1-002

---

### T-CL2-002 多端合并集成验证

**描述**: 验证多端合并逻辑在真实 YAML 下的正确性

**输入**: v2-09 §3 合并规则 + §5 冲突处理

**产出物**: `tests/integration/layer2-merge.test.ts`

**功能**:
- 验证 AND 叠加: 多端 gate_conditions 合并后全部保留
- 验证追加去重: extra_deliverables 无重复项
- 验证取更严格值: quality_thresholds 按 direction 正确取值
- 验证冲突处理: 同阶段同 gate id 冲突时阻断
- 验证缺失处理: direction 缺失时命名推断正确，无法推断时阻断

**验收标准**:
1. 双端合并（h5 + java-backend）结果正确
2. 三端合并（h5 + app-ios + app-android）结果正确
3. 冲突场景正确阻断并输出提示
4. direction 推断覆盖 lower_is_better / higher_is_better / 无法推断三种情况

**依赖**: T-CL2-001, T-AM1-002

---

## 二、性能 SLA（T-CSLA-xxx）

> **对齐技术方案**: v2-12 §2.3 性能 SLA
> **对齐需求**: aux-05-metrics

### T-CSLA-001 性能基准测试套件

**描述**: 编写关键路径的 benchmark 测试，确保性能 SLA 达标

**输入**: v2-12 §2.3 性能 SLA 指标

**产出物**: `tests/benchmark/performance.bench.ts`

**功能**:
- `validateId` 基准测试: 单次调用 < 10ms
- `getCoverage` 基准测试: 单次调用 < 50ms（100 条矩阵记录）
- `evaluateGate` 基准测试: 单次调用 < 200ms
- `buildContext` 基准测试: 单次调用 < 500ms
- 使用 Vitest bench 模式运行
- 输出 p50 / p95 / p99 延迟

**验收标准**:
1. 4 项 SLA 指标全部达标
2. benchmark 可通过 `pnpm run bench` 执行
3. CI 中可作为 Gate 条件运行

**依赖**: T-AM2-002, T-AM2-005, T-BM3-001, T-BM5-001

---

## 三、E2E 集成测试（T-CE2E-xxx）

> **对齐技术方案**: v2-12 §2.3 E2E 集成测试
> **对齐需求**: aux-06-roadmap

### T-CE2E-001 核心流程 E2E 测试

**描述**: 覆盖核心链路的端到端自动化测试

**输入**: v2-12 §3 GL-04 验收标准

**产出物**: `tests/e2e/core-flow.test.ts`

**功能**:
- 完整流程: init → spec → design → task → code → code-review → test → archive → verify → golive
- 每步验证: CLI ExitCode + 产出物文件存在 + stage-state.json 状态正确
- Gate 校验: 每次 stage advance 前 gate check 通过
- 矩阵校验: 流程结束后 matrix check 无断链
- 覆盖率校验: 流程结束后 C1-C9 均 ≥ 80%

**验收标准**:
1. 完整流程端到端走通（使用 fixture 数据）
2. 每个阶段推进后 stage-state.json 状态正确
3. 最终 Gate 评估为 PASS
4. CI 中可自动运行

**依赖**: 所有阶段 A + B 任务

---

### T-CE2E-002 异常路径 E2E 测试

**描述**: 覆盖异常和边界场景的端到端测试

**输入**: v2-04 §4 推进规则 + v2-06 §2 Gate 模型

**产出物**: `tests/e2e/error-paths.test.ts`

**功能**:
- Gate FAIL 阻断: 缺失必须产出物时 advance 被阻断
- Force 推进: `--force` 跳过 Gate + findings.md 审计记录
- Cancel 流程: 任意阶段 cancel + 终态不可逆
- RFC 变更流程: 创建 RFC → 审批 → 影响分析 → 同步
- 缺陷流程: 注册 → 修复 → 验证闭环

**验收标准**:
1. Gate FAIL 时 ExitCode = 1
2. Force 推进写入审计记录
3. Cancel 后所有操作返回 CONFIG_ERROR
4. RFC + 缺陷状态流转正确

**依赖**: T-CE2E-001

---

## 四、CI/CD 平台适配（T-CCI-xxx）

> **对齐技术方案**: v2-06 §7 Hook 双层执行 · v2-12 §2.3
> **对齐需求**: aux-06-roadmap

### T-CCI-001 CI Pipeline 模板生成

**描述**: 生成主流 CI 平台的 Pipeline 配置模板

**输入**: v2-06 §7.4 CI Pipeline Hook

**产出物**:
```text
templates/ci/
├── azure-pipelines.yml.hbs
├── gitlab-ci.yml.hbs
└── github-actions.yml.hbs
```

**功能**:
- 每个模板包含: lint → typecheck → test → matrix check → gate check 流水线
- PR 创建/更新时触发全量校验
- Gate FAIL 时阻断合并
- 支持通过 `spec-first doctor` 检测 CI 配置状态

**验收标准**:
1. 至少 1 个平台模板可直接使用
2. Pipeline 中 gate check 失败时阻断 PR 合并
3. 模板变量可通过 init 时自动填充

**依赖**: T-BM7-001, T-BM3-004

---

## 五、IDE 插件（T-CIDE-xxx）

> **对齐技术方案**: v2-05 §2.5 模糊搜索
> **对齐需求**: aux-06-roadmap

### T-CIDE-001 VS Code ID 自动补全插件

**描述**: 实现 VS Code 插件，支持 ID 模糊搜索与自动补全

**输入**: v2-05 §2.5 模糊搜索 + v2-12 §2.3 IDE 插件

**产出物**: `packages/vscode-spec-first/`

**功能**:
- 在 Markdown/TypeScript 文件中输入 `FR-`、`DS-`、`TASK-`、`TC-` 前缀时触发补全
- 补全列表来源: 调用 `spec-first id search` CLI 命令
- 补全项显示: ID + 关联描述（从矩阵读取）
- 支持跳转到定义: 点击 ID 跳转到矩阵对应行

**验收标准**:
1. 前缀触发补全响应 < 500ms
2. 补全列表包含当前 Feature 的所有匹配 ID
3. 跳转到定义功能可用
4. 插件可通过 VS Code 扩展市场安装

**依赖**: T-AM2-003

---

## 五-B、npm 分发体系（T-CNPM-xxx）

> **对齐需求**: aux-04-deliverables §3 · aux-06-roadmap P0
> **对齐技术方案**: v2-01 §7 技术栈

### T-CNPM-001 npm 包发布与分发配置

**描述**: 配置 npm 包发布流程，支持内网/外网私有仓库分发

**输入**: aux-04 §3 分发模式 + aux-06 路线图

**产出物**:
- `package.json` 发布配置（files, bin, exports）
- `.npmrc` 模板（内网/外网仓库切换）
- `scripts/publish.sh` 发布脚本

**功能**:
- npm pack 产出合法 tarball（含 skills/、templates/）
- 支持 `npm install -g spec-first` 全局安装
- 安装后 `spec-first --version` 可用
- `.npmrc` 模板支持内网私有仓库配置

**验收标准**:
1. `npm pack` 产出 tarball 可正常安装
2. 全局安装后 CLI 入口可用
3. skills/ 和 templates/ 目录包含在发布包中
4. 内网/外网仓库切换文档完整

**依赖**: T-AS-001, T-AS-005

---

## 六、阶段 C 任务总览

### 任务统计

| 模块 | 任务数 | 编号范围 |
|------|--------|----------|
| Layer 2 多端扩展 | 2 | T-CL2-001 ~ T-CL2-002 |
| 性能 SLA | 1 | T-CSLA-001 |
| E2E 集成测试 | 2 | T-CE2E-001 ~ T-CE2E-002 |
| CI/CD 适配 | 1 | T-CCI-001 |
| IDE 插件 | 1 | T-CIDE-001 |
| npm 分发体系 | 1 | T-CNPM-001 |
| **合计** | **8** | — |

### 关键路径

```text
所有阶段 A + B 任务 → T-CE2E-001 → T-CE2E-002

T-AM1-002 → T-CL2-001 → T-CL2-002

T-AM2-002 + T-AM2-005 + T-BM3-001 + T-BM5-001 → T-CSLA-001

T-BM7-001 + T-BM3-004 → T-CCI-001

T-AM2-003 → T-CIDE-001

T-AS-001 + T-AS-005 → T-CNPM-001
```
