# 00-first 剩余未完成改造详细方案

> 目标：把 `00-first` 的 reference 收口到最终稳定形态，补齐剩余未完成改造，并清理旧引用。
> 现状判断：执行主链、主线程契约、数据库主文档、主题主文档的大部分内容已经收口；剩余未完成项集中在 QA / 测试、项目识别 / 平台映射、入口路由、模板补齐和引用清理。

## 1. 当前结论

当前不建议再做大范围重命名。更稳妥的做法是保留已经稳定下来的 canonical 文件名，在现有结构上完成剩余收口。

当前仍需要完成的工作只有四类：

- QA 与测试收口
- 项目识别与平台映射收口
- 路由指南补齐
- 主题模板补齐

`database-analysis.md` 不在剩余改造范围内，当前应保持不动。

## 2. 方案原则

- 保留现有稳定入口名，不为了对齐提案而引入无收益重命名。
- 先合并内容，再删旧文件，再改引用。
- 先更新 `SKILL.md` 和活跃引用，再删除被合并文件。
- 新增低频补件只做入口决策和模板复用，不侵入主链。
- 验收以引用闭环为准，不以“文档看起来完整”为准。

## 3. 剩余改造清单

| 优先级 | 任务 | 当前状态 | 目标结果 |
|---|---|---|---|
| P0 | 合并 `quality-assurance-rules.md` 与 `testing-strategy.md` | 双文件并存 | 只保留一个质量与验证主文档 |
| P0 | 合并 `detection-rules.md` 与 `platform-document-mapping.md` | 双文件并存 | 只保留一个项目识别与映射主文档 |
| P1 | 新增 `first-routing-guide.md` | 缺失 | 补齐 `first` / `catchup` / onboarding 选择规则 |
| P1 | 新增 `topic-agent-template.md` | 缺失 | 统一主题文档骨架，减少复制粘贴 |
| P0 | 更新 `SKILL.md` 引用表 | 仍加载旧项 | 只引用保留的 canonical 文档 |
| P0 | 清理旧文件名残留引用 | 部分残留 | 全库搜索后清零 |

## 4. 方案一：QA 与测试合并

### 4.1 合并目标

把测试策略并入统一 QA 规则，形成一份能同时覆盖“证据规则 + 抽样验证 + 测试层次 + 回归触发 + 验收标准”的主文档。

### 4.2 迁移内容

- 从 `testing-strategy.md` 迁入：
  - runtime 资产测试目标
  - docs 输出测试目标
  - 辅助 docs 索引测试
  - CLI 校验测试
  - 条件产出测试
  - 治理与更新测试
  - 增强路径测试
  - 核心用例表
  - 回归触发条件
  - 最低断言
  - 端类型与降级测试
  - 推荐测试文件
  - 验收标准

- 在 `quality-assurance-rules.md` 保留并强化：
  - 输出语言约束
  - 证据标注规则
  - 抽样验证流程
  - 主线程消费边界
  - 图示格式约束

### 4.3 结构建议

建议把 `quality-assurance-rules.md` 重组为以下顺序：

1. 输出语言
2. 证据标注
3. 抽样验证
4. 分析主题与 runtime 资产最低要求
5. 数据库特例
6. 主线程消费边界
7. 图示格式
8. 测试目标
9. 分层
10. 核心用例
11. 回归触发条件
12. 最低断言
13. 端类型与降级测试
14. 推荐测试文件
15. 验收标准

### 4.4 删除与引用更新

- 删除 `testing-strategy.md`
- 更新 `SKILL.md` 中的 `Reference 读取规则`
- 检查所有引用 `testing-strategy.md` 的地方并改成 `quality-assurance-rules.md`

### 4.5 完成判定

- `testing-strategy.md` 不再存在
- `SKILL.md` 不再提到 `testing-strategy.md`
- 质量规则与测试策略都能在一份文档内找到
- `rg` 不再命中活跃引用中的 `testing-strategy.md`

## 5. 方案二：检测与平台映射合并

### 5.1 合并目标

把项目类型识别、子类型识别、端类型影响、文档全集、条件型能力判定、降级策略统一到一份文档里。

### 5.2 迁移内容

- 从 `platform-document-mapping.md` 迁入：
  - 正式文档全集
  - 基础文档列表
  - 正式专题文档列表
  - 条件型文档列表
  - 端类型影响规则
  - 内容侧重点
  - `database-er.md` 条件判定
  - 降级策略

- 在 `detection-rules.md` 保留并强化：
  - 识别目标
  - 证据优先级
  - 主类型识别
  - 子类型识别
  - 混合与多端边界
  - 识别失败降级

### 5.3 结构建议

建议把 `detection-rules.md` 重组为以下顺序：

1. 正式 contract 声明
2. 识别目标
3. 证据优先级
4. 主类型识别
5. 子类型识别
6. 混合与多端边界
7. 正式文档全集
8. 端类型影响规则
9. 内容侧重点
10. 条件型能力判定
11. 识别失败降级
12. 输出约束

### 5.4 删除与引用更新

- 删除 `platform-document-mapping.md`
- 更新 `SKILL.md` 中的 `Reference 读取规则`
- 更新 `api-and-dependencies-analysis.md` 中对平台映射的引用
- 检查所有引用 `platform-document-mapping.md` 的地方并改成 `detection-rules.md`

### 5.5 完成判定

- `platform-document-mapping.md` 不再存在
- `SKILL.md` 不再提到 `platform-document-mapping.md`
- 项目识别和平台映射都能在一份文档内找到
- `rg` 不再命中活跃引用中的 `platform-document-mapping.md`

## 6. 方案三：补齐路由指南

### 6.1 文档目标

新增 `first-routing-guide.md`，只负责入口决策，不承担 runtime 真源、不承担分析输出。

### 6.2 必须回答的问题

- 什么时候必须执行 `first`
- 什么时候不应该执行 `first`
- 什么时候应优先执行 `catchup`
- 什么时候属于首次接入
- 什么时候属于上下文重建
- 什么时候属于新 Feature 切换

### 6.3 建议结构

1. 目标
2. 适用场景
3. 不适用场景
4. 判断原则
5. 决策树
6. 输出提示语义

### 6.4 需要覆盖的决策点

- 新仓库首次接入
- `.spec-first` 缺失或损坏
- runtime 资产过期
- docs 产物缺失
- 大范围重构后上下文失真
- Feature 切换
- 长时间中断恢复

### 6.5 完成判定

- `SKILL.md` 的主线程说明里可以引用这份文档
- 路由决策不再散落在其他文档中
- 后续 skill 可以只看这份文档判断是否该重跑 `first`

## 7. 方案四：补齐主题模板

### 7.1 文档目标

新增 `topic-agent-template.md`，抽象所有主题文档的公共骨架，避免复制 `agents-*` 式写法。

### 7.2 必须覆盖的模板段

- 主题目标
- 任务范围
- 输入证据
- 正式输出
- 输出约束
- 缺口标记
- 降级策略
- 质量门禁引用

### 7.3 使用原则

- 新增主题时先复制模板，再填充主题差异
- 不再单独创造新的结构骨架
- 不在主题文档里重复主线程契约和 QA 规则正文

### 7.4 完成判定

- 后续新增主题文档能够直接套模板
- 现有主题文档的结构漂移减少
- `references/` 不再继续增长同构重复文档

## 8. 实施顺序

### Phase 1

- 合并 `quality-assurance-rules.md` 与 `testing-strategy.md`
- 更新 `SKILL.md`
- 删除 `testing-strategy.md`

### Phase 2

- 合并 `detection-rules.md` 与 `platform-document-mapping.md`
- 更新 `SKILL.md`
- 更新相关交叉引用
- 删除 `platform-document-mapping.md`

### Phase 3

- 新增 `first-routing-guide.md`
- 新增 `topic-agent-template.md`

### Phase 4

- 全局搜索旧文件名
- 清理残留引用
- 复核 `SKILL.md` 的引用表

## 9. 验收标准

- `references/` 中不再存在 QA / 测试双文件
- `references/` 中不再存在检测 / 平台映射双文件
- `SKILL.md` 只引用现存 canonical 文件
- 新增路由指南已可用于判断 `first` 与 `catchup`
- 新增模板已可用于未来主题文档扩展
- 全库搜索不再命中活跃引用中的旧文件名

## 10. 不做的事

- 不再改名已经稳定下来的 canonical 文件
- 不再把 `database-analysis.md` 拆回三份
- 不再新增一套平行的主链契约
- 不再让 `docs/first` 回灌成真源

