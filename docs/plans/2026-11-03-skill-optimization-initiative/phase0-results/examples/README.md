# Phase 0 示例文件

**目的**：提供高质量的示例，让执行者知道"好的输出"长什么样

---

## 📁 文件清单

### 1. task-trace-example-good.yaml
- 一个**完整**的、**高质量**的任务追踪示例
- 包含所有必需字段
- Contract/Protocol 检查完整
- 阻力点识别清晰
- 根因归因明确

**用途**：作为追踪任务时的参考模板

---

### 2. task-trace-example-with-issues.yaml
- 一个包含**多个问题**的任务追踪示例
- 展示如何标注阻力点
- 展示如何记录 Contract/Protocol 违规
- 展示如何进行根因归因

**用途**：理解如何识别和记录问题

---

### 3. contract-check-pass-example.yaml
- Contract 检查**通过**的示例
- spec-prd 输出符合 Contract
- spec-plan 输出符合 Contract
- spec-work 输出符合 Contract

**用途**：理解 Contract 检查的标准

---

### 4. contract-check-fail-example.yaml
- Contract 检查**失败**的示例
- 展示各种违规情况：
  - 缺少必需字段
  - 字段类型错误
  - 验证门不通过
- 展示如何记录缺失项

**用途**：理解常见的 Contract 违规

---

### 5. protocol-check-example.yaml
- Protocol 检查示例
- PRD → Plan Protocol 检查
- Plan → Work Protocol 检查
- Work → Review Protocol 检查
- 包含通过和失败的情况

**用途**：理解 Protocol 检查逻辑

---

### 6. phase0-report-example.md
- 一个**完整**的 Phase 0 报告示例
- 包含：
  - 任务选择说明
  - 模式分析
  - Contract/Protocol 分析
  - 根因归因
  - 多路径评估
  - 优先级建议

**用途**：理解 Phase 0 的最终输出

---

## 🎯 如何使用这些示例

### Phase -1（试点）时
1. 先阅读 `task-trace-example-good.yaml`
2. 参考该格式追踪试点任务
3. 对比自己的输出和示例

### Phase 0（正式）时
1. 每次追踪任务前，快速浏览示例
2. 遇到问题时，查看 `task-trace-example-with-issues.yaml`
3. Contract/Protocol 检查时，参考对应示例

### Phase 0 分析时
1. 参考 `phase0-report-example.md` 的结构
2. 使用示例中的分析方法

---

## ⚠️ 注意事项

1. **示例是参考，非模板**
   - 不要机械复制
   - 根据实际任务调整

2. **示例是理想情况**
   - 真实任务可能更复杂
   - 可能缺少某些信息

3. **示例会更新**
   - 根据实践经验持续改进
   - 查看文件的版本号和更新日期

---

## 📝 贡献示例

如果你在 Phase 0 执行中产生了高质量的追踪，可以：
1. 脱敏处理（移除敏感信息）
2. 提交 PR 到 examples/ 目录
3. 帮助后续执行者

---

**文件状态**：待创建（需要实际 Phase 0 执行后补充真实示例）  
**临时方案**：使用 02-execution-checklist.md 中的 YAML 模板作为参考
