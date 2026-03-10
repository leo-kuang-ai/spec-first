| ID | Type | Title | Status | Upstream | Downstream |
|----|------|-------|--------|----------|------------|
| FR-HOMEPERF-001 | FR | CSS 优化 | Accepted | REQ-PERF-CSS | AC-HOMEPERF-001-01~03 |
| FR-HOMEPERF-002 | FR | JavaScript 优化 | Accepted | REQ-PERF-JS | AC-HOMEPERF-002-01~04 |
| FR-HOMEPERF-003 | FR | API 响应缓存 | Accepted | REQ-PERF-CACHE | AC-HOMEPERF-003-01~04 |
| FR-HOMEPERF-004 | FR | Feature 列表渲染优化 | Accepted | REQ-PERF-LIST | AC-HOMEPERF-004-01~03 |
| FR-HOMEPERF-005 | FR | 首屏渲染优化 | Accepted | REQ-PERF-FCP | AC-HOMEPERF-005-01~04 |
| AC-HOMEPERF-001-01 | AC | CSS 体积减少 ≥ 30% | Accepted | FR-HOMEPERF-001 | TC-UT-HOMEPERF-001 |
| AC-HOMEPERF-001-02 | AC | 关键 CSS 内联 | Accepted | FR-HOMEPERF-001 | TC-UT-HOMEPERF-002 |
| AC-HOMEPERF-001-03 | AC | 非关键 CSS 延迟加载 | Accepted | FR-HOMEPERF-001 | TC-UT-HOMEPERF-003 |
| AC-HOMEPERF-002-01 | AC | JS 体积减少 ≥ 30% | Accepted | FR-HOMEPERF-002 | TC-UT-HOMEPERF-004 |
| AC-HOMEPERF-002-02 | AC | 轮询刷新策略可配置 | Accepted | FR-HOMEPERF-002 | TC-UT-HOMEPERF-005 |
| AC-HOMEPERF-002-03 | AC | DOM 增量更新 | Accepted | FR-HOMEPERF-002 | TC-UT-HOMEPERF-006 |
| AC-HOMEPERF-002-04 | AC | 搜索输入防抖 | Accepted | FR-HOMEPERF-002 | TC-UT-HOMEPERF-007 |
| AC-HOMEPERF-003-01 | AC | Feature 列表缓存 TTL ≥ 30s | Accepted | FR-HOMEPERF-003 | TC-UT-HOMEPERF-008 |
| AC-HOMEPERF-003-02 | AC | 缓存命中无网络请求 | Accepted | FR-HOMEPERF-003 | TC-UT-HOMEPERF-009 |
| AC-HOMEPERF-003-03 | AC | 强制刷新按钮 | Accepted | FR-HOMEPERF-003 | TC-UT-HOMEPERF-010 |
| AC-HOMEPERF-003-04 | AC | 缓存可配置开关 | Accepted | FR-HOMEPERF-003 | TC-UT-HOMEPERF-011 |
| AC-HOMEPERF-004-01 | AC | 100+ 列表渲染 < 300ms | Accepted | FR-HOMEPERF-004 | TC-UT-HOMEPERF-012 |
| AC-HOMEPERF-004-02 | AC | 滚动帧率 ≥ 50fps | Accepted | FR-HOMEPERF-004 | TC-UT-HOMEPERF-013 |
| AC-HOMEPERF-004-03 | AC | 搜索响应 < 100ms | Accepted | FR-HOMEPERF-004 | TC-UT-HOMEPERF-014 |
| AC-HOMEPERF-005-01 | AC | FCP ≤ 1s | Accepted | FR-HOMEPERF-005 | TC-UT-HOMEPERF-015 |
| AC-HOMEPERF-005-02 | AC | TTI ≤ 1.5s | Accepted | FR-HOMEPERF-005 | TC-UT-HOMEPERF-016 |
| AC-HOMEPERF-005-03 | AC | 骨架屏显示 | Accepted | FR-HOMEPERF-005 | TC-UT-HOMEPERF-017 |
| AC-HOMEPERF-005-04 | AC | API 请求并行化 | Accepted | FR-HOMEPERF-005 | TC-UT-HOMEPERF-018 |
| DS-HOMEPERF-001 | DS | CSS 优化 | Accepted | FR-HOMEPERF-001, FR-HOMEPERF-005 | TASK-HOMEPERF-001,TASK-HOMEPERF-002 |
| DS-HOMEPERF-002 | DS | JavaScript 优化 | Accepted | FR-HOMEPERF-002, FR-HOMEPERF-005 | TASK-HOMEPERF-004,TASK-HOMEPERF-005 |
| DS-HOMEPERF-003 | DS | API 响应缓存 | Accepted | FR-HOMEPERF-003 | TASK-HOMEPERF-003 |
| DS-HOMEPERF-004 | DS | Feature 列表虚拟滚动 | Accepted | FR-HOMEPERF-004 | TASK-HOMEPERF-006 |
| DS-HOMEPERF-005 | DS | 首屏渲染优化 | Accepted | FR-HOMEPERF-005 | TASK-HOMEPERF-007,TASK-HOMEPERF-008 |
| DS-HOMEPERF-006 | DS | 渲染性能优化 | Accepted | FR-HOMEPERF-004, FR-HOMEPERF-005 | TASK-HOMEPERF-004,TASK-HOMEPERF-006 |
| TASK-HOMEPERF-001 | TASK | 提取关键 CSS | Accepted | FR-HOMEPERF-001,DS-HOMEPERF-001 | - |
| TASK-HOMEPERF-002 | TASK | 压缩优化 CSS | Accepted | FR-HOMEPERF-001,DS-HOMEPERF-001 | - |
| TASK-HOMEPERF-003 | TASK | 添加缓存机制 | Accepted | FR-HOMEPERF-003,DS-HOMEPERF-003 | - |
| TASK-HOMEPERF-004 | TASK | DOM 增量更新 | Accepted | FR-HOMEPERF-002,DS-HOMEPERF-002,DS-HOMEPERF-006 | - |
| TASK-HOMEPERF-005 | TASK | 搜索防抖优化 | Accepted | FR-HOMEPERF-002,FR-HOMEPERF-004,DS-HOMEPERF-002 | - |
| TASK-HOMEPERF-006 | TASK | 虚拟滚动实现 | Accepted | FR-HOMEPERF-004,DS-HOMEPERF-004 | - |
| TASK-HOMEPERF-007 | TASK | 骨架屏实现 | Accepted | FR-HOMEPERF-005,DS-HOMEPERF-005 | - |
| TASK-HOMEPERF-008 | TASK | API 并行请求 | Accepted | FR-HOMEPERF-005,DS-HOMEPERF-005 | - |
| TASK-HOMEPERF-009 | TASK | 性能测试验证 | Accepted | FR-HOMEPERF-001,FR-HOMEPERF-005 | - |
| TC-UT-HOMEPERF-001 | TC | CSS 体积测试 | Accepted | FR-HOMEPERF-001,AC-HOMEPERF-001-01 | tests/unit/homeperf.test.ts |
| TC-UT-HOMEPERF-002 | TC | 关键 CSS 内联测试 | Accepted | FR-HOMEPERF-001,AC-HOMEPERF-001-02 | tests/unit/homeperf.test.ts |
| TC-UT-HOMEPERF-003 | TC | CSS 延迟加载测试 | Accepted | FR-HOMEPERF-001,AC-HOMEPERF-001-03 | tests/unit/homeperf.test.ts |
| TC-UT-HOMEPERF-004 | TC | JS 体积测试 | Accepted | FR-HOMEPERF-002,AC-HOMEPERF-002-01 | tests/unit/homeperf.test.ts |
| TC-UT-HOMEPERF-005 | TC | 轮询配置测试 | Accepted | FR-HOMEPERF-002,AC-HOMEPERF-002-02 | tests/unit/homeperf.test.ts |
| TC-UT-HOMEPERF-006 | TC | DOM 增量更新测试 | Accepted | FR-HOMEPERF-002,AC-HOMEPERF-002-03 | tests/unit/homeperf.test.ts |
| TC-UT-HOMEPERF-007 | TC | 搜索防抖测试 | Accepted | FR-HOMEPERF-002,AC-HOMEPERF-002-04 | tests/unit/homeperf.test.ts |
| TC-UT-HOMEPERF-008 | TC | 缓存 TTL 测试 | Accepted | FR-HOMEPERF-003,AC-HOMEPERF-003-01 | tests/unit/homeperf.test.ts |
| TC-UT-HOMEPERF-009 | TC | 缓存命中测试 | Accepted | FR-HOMEPERF-003,AC-HOMEPERF-003-02 | tests/unit/homeperf.test.ts |
| TC-UT-HOMEPERF-010 | TC | 强制刷新测试 | Accepted | FR-HOMEPERF-003,AC-HOMEPERF-003-03 | tests/unit/homeperf.test.ts |
| TC-UT-HOMEPERF-011 | TC | 缓存开关测试 | Accepted | FR-HOMEPERF-003,AC-HOMEPERF-003-04 | tests/unit/homeperf.test.ts |
| TC-UT-HOMEPERF-012 | TC | 列表渲染性能测试 | Accepted | FR-HOMEPERF-004,AC-HOMEPERF-004-01 | tests/unit/homeperf.test.ts |
| TC-UT-HOMEPERF-013 | TC | 滚动帧率测试 | Accepted | FR-HOMEPERF-004,AC-HOMEPERF-004-02 | tests/unit/homeperf.test.ts |
| TC-UT-HOMEPERF-014 | TC | 搜索响应测试 | Accepted | FR-HOMEPERF-004,AC-HOMEPERF-004-03 | tests/unit/homeperf.test.ts |
| TC-UT-HOMEPERF-015 | TC | FCP 测试 | Accepted | FR-HOMEPERF-005,AC-HOMEPERF-005-01 | tests/unit/homeperf.test.ts |
| TC-UT-HOMEPERF-016 | TC | TTI 测试 | Accepted | FR-HOMEPERF-005,AC-HOMEPERF-005-02 | tests/unit/homeperf.test.ts |
| TC-UT-HOMEPERF-017 | TC | 骨架屏测试 | Accepted | FR-HOMEPERF-005,AC-HOMEPERF-005-03 | tests/unit/homeperf.test.ts |
| TC-UT-HOMEPERF-018 | TC | 并行请求测试 | Accepted | FR-HOMEPERF-005,AC-HOMEPERF-005-04 | tests/unit/homeperf.test.ts |
