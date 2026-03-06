# 00-first 测试策略（最小矩阵）

> 目标：为 quick/deep 双模式与 Agent 编排链路提供可复现的最小自动化验证基线。
> **v2.0.0**: 新增 quick 模式测试用例，区分 quick/deep 模式的验证标准。| **更新**: {{DATE}}

---

## 1. 覆盖范围

- **模式**：quick（4-5 个 Agent）、deep（8 个 Agent，三波派发）
- **逻辑 Agent**：A1、A2、A3、B、C1、C2、D、A4
- **主流程**：P0 → P1a → Agent 派发 → P3
- **关键风险**：降级路径、超时路径、交叉验证、凭证/密钥安全

---

## 2. quick 模式用例

| ID | 组件 | 用例 | 预期结果 |
|----|------|------|----------|
| T-QUICK-01 | quick 流程 | 完整 quick 模式执行 | 生成 4-5 个产物，frontmatter `mode: quick` |
| T-QUICK-02 | Agent B (codebase-overview) | 简化版分析 | 生成目录结构概览，无符号分析 |
| T-QUICK-03 | Agent C (domain-model) | 业务模型提取 | 至少 3 个领域概念 |
| T-QUICK-04 | Agent D (api-docs) | 轻量级 API 提取 | 至少 3 个端点清单 |
| T-QUICK-05 | Agent E (database-er) | 条件派发 | 有 DB 时生成 ER 图，无 DB 时不派发 |
| T-QUICK-06 | 产物 frontmatter | 检查产物头部 | 所有产物包含 `mode: quick` |
| T-QUICK-07 | 无 Serena | quick 模式降级 | 正常完成，不依赖符号分析 |
| T-QUICK-08 | 跳过 Context7 | quick 模式不查询 | 正常完成，无 Context7 调用 |
| T-QUICK-09 | 跳过交叉验证 | quick 模式无校验 | 正常完成，无交叉验证步骤 |

---

## 3. deep 模式用例（8 个 Agent）

| ID | Agent | 用例 | 预期结果 |
|----|-------|------|----------|
| T-A1-01 | A1 | 常规项目扫描 | 生成模块清单与概览 |
| T-A1-02 | A1 | Serena 不可用 | 回退静态扫描并标记降级 |
| T-A2-01 | A2 | 接收 A1 模块清单 | 正确生成模块依赖图 |
| T-A2-02 | A2 | A1 清单缺失 | 启用独立分析模式 |
| T-A3-01 | A3 | deep 模式 + Serena 可用 | 输出 LSP 调用链 |
| T-A3-02 | A3 | deep 模式 + Serena 失败 | 回退静态调用链 |
| T-B-01 | B | REST 路由提取 | 输出端点清单与证据 |
| T-C1-01 | C1 | 外部服务识别 | 输出依赖/服务来源证据 |
| T-C2-01 | C2 | P1b + C1 正常 | 输出规范与 local-setup |
| T-C2-02 | C2 | P1b 失败 | 输出本地配置模式并标记 |
| T-D-01 | D | 检测到关系型 DB | 生成 ER 与字段详情 |
| T-D-02 | D | DB 凭证不可用/连接失败 | 不泄露凭证，输出待确认 |
| T-A4-01 | A4 | A2+B+D 输入完整 | 生成领域模型全量章节 |
| T-A4-02 | A4 | B 或 D 缺失 | 执行降级并保留其他章节 |

---

## 4. 编排与一致性用例

| ID | 维度 | 用例 | 预期结果 |
|----|------|------|----------|
| T-ORCH-01 | 波次依赖 | A4 必须等待 A2+B+D | 不提前派发 A4 |
| T-ORCH-02 | 超时控制 | 单 Agent 超时 60s | 标记超时并继续汇总 |
| T-ORCH-03 | 阶段超时 | 单阶段 120s | 阶段降级，不阻塞全流程 |
| T-ORCH-04 | 全局超时 | 并行阶段上限 300s | 主流程可控结束 |
| T-ORCH-05 | 交叉验证 | V1-V4 不一致修正 | 产出修正记录 |

---

## 5. 安全测试基线

| ID | 风险 | 用例 | 预期结果 |
|----|------|------|----------|
| T-SEC-01 | DB 凭证泄露 | 日志/文档扫描 | 不出现 password/token 原文 |
| T-SEC-02 | Context7 密钥泄露 | 失败日志与调试输出 | 仅输出掩码值，不输出明文 |
| T-SEC-03 | 证据泄密 | 证据片段抽检 | 敏感字段必须脱敏或改 `[待确认]` |

---

## 6. 执行建议

- PR 门禁最小要求：quick 用例 + deep Agent 用例 + 编排用例 + 安全用例全部通过
- 每次调整派发规则、超时策略、证据格式时，必须补充对应回归用例

---

## 7. 端类型检测测试用例（Phase 2）

| ID | 端类型 | 用例 | 预期结果 |
|----|--------|------|----------|
| T-TYPE-01 | backend | Spring Boot 项目（pom.xml） | 检测为 backend，生成 5 个 quick 产物（含 database-er） |
| T-TYPE-02 | frontend | React + Ant Design 项目 | 检测为 frontend(Admin)，生成 4 个 quick 产物 |
| T-TYPE-03 | frontend | Vue + Vant 项目 | 检测为 frontend(H5)，生成 4 个 quick 产物 |
| T-TYPE-04 | mobile | Android 项目（build.gradle + com.android） | 检测为 mobile，生成 4 个 quick 产物 |
| T-TYPE-05 | mobile | iOS 项目（*.xcodeproj） | 检测为 mobile，生成 4 个 quick 产物 |
| T-TYPE-06 | cross-platform | Flutter 项目（pubspec.yaml） | 检测为 cross-platform，生成 4-5 个 quick 产物 |
| T-TYPE-07 | cross-platform | React Native 项目 | 检测为 cross-platform，生成 4 个 quick 产物 |
| T-TYPE-08 | monorepo | pnpm-workspace.yaml 项目 | 检测为 monorepo，按子包分别生成产物 |
| T-TYPE-09 | mixed | Spring Boot + Vue 同仓库 | 检测为 mixed，按 backend + frontend 分别生成 |
| T-TYPE-10 | unknown | 无包管理文件的项目 | 降级为通用模式，生成 3+2 条件产物 |

---

## 8. Greenfield 检测测试用例（Phase 2）

| ID | 场景 | 用例 | 预期结果 |
|----|------|------|----------|
| T-GF-01 | 空目录 | 项目目录只有 README.md | 提示"检测到空项目"并退出 |
| T-GF-02 | 新建项目 | 有 package.json 但无依赖 | 继续 Brownfield 流程 |
| T-GF-03 | 有历史项目 | .git 目录且有 >10 commits | 继续 Brownfield 流程 |

---

## 9. 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 2.2.0 | 2026-03-02 | 新增 Phase 3 测试用例：模板按端定制、智能模式推荐、渐进式升级、复合类型检测 |
| 2.1.0 | 2026-03-02 | 新增端类型检测测试用例（10 个）和 Greenfield 检测测试用例（3 个） |
| 2.0.0 | 2026-03-02 | 新增 quick 模式测试用例（9 个），区分 quick/deep 模式验证标准 |
| 1.0.0 | 2026-02-28 | 初始版本，8 个逻辑 Agent 的最小测试矩阵 |

---

## 10. Phase 3 测试用例

### 模板按端定制

| ID | 用例 | 预期结果 |
|----|------|----------|
| T-TMPL-01 | backend 项目 | architecture.md 包含分层架构（Controller/Service/Repository） |
| T-TMPL-02 | frontend 项目 | architecture.md 包含 FSD/MVVM 架构、组件树 |
| T-TMPL-03 | mobile 项目 | architecture.md 包含跨平台层、原生层、桥接层 |
| T-TMPL-04 | api-docs 视角差异 | backend 暴露方 vs frontend 调用方内容差异 |

### 智能模式推荐

| ID | 用例 | 预期结果 |
|----|------|----------|
| T-SMART-01 | 小项目（<1000 行） | 自动推荐 quick 模式 |
| T-SMART-02 | 大型项目（50+ API） | 推荐使用 deep 模式 |
| T-SMART-03 | 已有 quick 产物 | 询问是否升级 deep |

### 渐进式升级

| ID | 用例 | 预期结果 |
|----|------|----------|
| T-PROG-01 | quick 完成后提示 | 显示扩展建议和追加选项 |
| T-PROG-02 | 用户选择追加 | 继续生成 deep 产物 |

### 复合类型检测

| ID | 用例 | 预期结果 |
|----|------|----------|
| T-COMP-01 | Nx Monorepo | 检测为 monorepo + 子包类型 |
| T-COMP-02 | Flutter Web | 检测为 cross-platform + H5 |
| T-COMP-03 | 后端 + Admin 同仓库 | 检测为 mixed |
