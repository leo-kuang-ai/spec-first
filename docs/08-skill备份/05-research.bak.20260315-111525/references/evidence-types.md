# Evidence Types

调研证据类型分类与标记规范。

## 标记格式

```markdown
[NEEDS VERIFICATION][TYPE] 具体假设内容
```

## 证据类型

### PERF - 性能假设

**定义**：对性能指标的假设，需要实际测试验证。

**示例**：
```markdown
- [NEEDS VERIFICATION][PERF] 阿里云 SMS 延迟 < 200ms
- [NEEDS VERIFICATION][PERF] 单实例支持 1000 QPS
- [NEEDS VERIFICATION][PERF] 冷启动时间 < 1s
```

**验证方式**：
- Benchmark 测试
- 压测报告
- 生产环境监控

---

### COMPAT - 兼容性假设

**定义**：对系统兼容性的假设，需要实际环境验证。

**示例**：
```markdown
- [NEEDS VERIFICATION][COMPAT] 与现有 auth 服务兼容
- [NEEDS VERIFICATION][COMPAT] 支持 Node.js >= 20
- [NEEDS VERIFICATION][COMPAT] 可在 Kubernetes 环境运行
```

**验证方式**：
- 集成测试
- 兼容性矩阵
- 官方文档确认

---

### COST - 成本假设

**定义**：对成本估算的假设，需要实际报价验证。

**示例**：
```markdown
- [NEEDS VERIFICATION][COST] 月成本 < ¥5000
- [NEEDS VERIFICATION][COST] 迁移成本约 5 人天
- [NEEDS VERIFICATION][COST] 存储成本 ¥0.1/GB/月
```

**验证方式**：
- 官方报价单
- TCO 计算表
- 历史账单分析

---

### SEC - 安全假设

**定义**：对安全特性的假设，需要安全评估验证。

**示例**：
```markdown
- [NEEDS VERIFICATION][SEC] 支持 SOC2 合规
- [NEEDS VERIFICATION][SEC] 无已知高危漏洞
- [NEEDS VERIFICATION][SEC] 数据加密符合要求
```

**验证方式**：
- 安全白皮书
- 漏洞扫描报告
- 合规认证文件

---

### SCALE - 可扩展性假设

**定义**：对系统扩展能力的假设，需要负载测试验证。

**示例**：
```markdown
- [NEEDS VERIFICATION][SCALE] 支持 10x 水平扩展
- [NEEDS VERIFICATION][SCALE] 数据量至 1TB 时性能不降级
- [NEEDS VERIFICATION][SCALE] 支持多地域部署
```

**验证方式**：
- 扩展性测试
- 架构评估
- 参考案例

---

## 证据强度等级

| 等级 | 图标 | 说明 | 示例 |
|------|------|------|------|
| 强 | 🔴 | 客观数据、官方文档 | 官方报价、Benchmark 结果 |
| 中 | 🟡 | 行业共识、经验数据 | 社区调研、案例研究 |
| 弱 | 🟢 | 主观判断、类比推理 | "根据经验"、"类似项目" |

## 证据来源可信度

| 来源 | 可信度 | 说明 |
|------|--------|------|
| 官方文档 | ⭐⭐⭐⭐⭐ | 厂商官方发布，权威最高 |
| 官方博客 | ⭐⭐⭐⭐ | 厂商技术团队，可信度高 |
| 技术白皮书 | ⭐⭐⭐⭐ | 厂商/第三方深度分析 |
| 开源社区 | ⭐⭐⭐ | GitHub issues、StackOverflow |
| 案例研究 | ⭐⭐⭐ | 实际用户经验，参考价值高 |
| 媒体报道 | ⭐⭐ | 可能含营销话术，需交叉验证 |
| 个人博客 | ⭐ | 个人经验，仅供参考 |

## 反证据原则

当发现与当前结论相反的证据时：

1. **必须记录**：在 research.md 中记录反证据
2. **分析原因**：解释为什么反证据不影响当前结论
3. **更新结论**：如反证据更强，必须更新推荐方案
