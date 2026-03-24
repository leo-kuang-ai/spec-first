# Test Level Glossary

- `UT`（Unit Test）: 单模块/函数级测试，隔离外部依赖
- `IT`（Integration Test）: 多模块或模块+基础设施的集成验证
- `E2E`（End-to-End Test）: 端到端用户路径验证
- `ST`（System Test）: 系统级非功能或全局行为验证（如性能、稳定性、恢复）

## 使用规则
- 一个 AC 至少映射一个主测试层级
- 优先选择最小成本且足以证明 AC 的层级
- 涉及跨系统链路时，必须补 IT 或 E2E
