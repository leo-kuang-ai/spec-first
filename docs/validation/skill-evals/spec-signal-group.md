# spec-product-pulse / spec-sweep / spec-riffrec-feedback-analysis / spec-polish 测评(索引 #29-32 信号组四合一轮)

| 项 | 值 |
|---|---|
| Skills | product-pulse(199 行)/ sweep(189 行)/ riffrec(54 行)/ polish(156→157 行,含修复) |
| 分组 | 产品信号与反馈 |
| 测评日期 | 2026-09-03;基线 `wt@a0b2d3a9`(仅 polish 含修复) |
| 测评方法 | 各 1 case 双引擎 + polish paired ×3 |

## 场景用例

| Skill | 场景 | 预期 | 结果 |
|---|---|---|---|
| product-pulse | 未配置出报告 | 引导 setup 逐项确认,不硬跑空报告 | ✅ 双引擎(claude 原生;codex 断言补"请回复/选择"祈使词后本地验证) |
| sweep | headless 首跑 | `first run requires interactive setup` 停止 | ✅ 双引擎(claude"首次运行需要交互式设置——运行已停止"完美;断言补"设置"中文锚) |
| riffrec | 通用会议录音转写 | 指出不属 Riffrec 分析 | ✅ 双引擎(原生) |
| polish | 静态审查请求 | 点名 spec-code-review 路由 | ✅(修复后双引擎回归) |

## polish 真实缺陷与修复(守则同族)

- **缺陷(双引擎)**:识别请求在 Not To Use 列表里却**直接做了静态审查**(收编:"按你的要求做纯静态审查"),未点名 spec-code-review。
- **修复**:When Not To Use 补 "name the destination skill explicitly (static code review belongs to `spec-code-review`) — recognizing the mismatch and then doing the excluded work anyway is adopting the wrong workflow, not a helpful fallback."(点名 + 反收编双要素)。
- **Paired ×3:3-0 全 clear keep**;双引擎回归全过。runtime MIRROR-SYNCED。

## 断言工程沉淀(本轮三处同日复现)

- 祈使形态("请回复 1 或输入产品名")与中文关键词(英文 "interactive" 被译作"交互式")是 ask/gate 断言的两大长尾;修正后本地历史输出验证即可,无需重跑。

## darwin 9 维评分

product-pulse **91.0**(配置 gate/setup-reconfigure 路由/per-source receipt)/ sweep **91.5**(headless 首跑 gate/三独立授权+standing approval/state 引擎唯一写者)/ riffrec **92.0**(54 行最紧凑:显式 capture 形态枚举+不触发清单+raw 本地默认)/ polish **91.0→91.8**。

## 结论

**四者全部通过**(polish 经修复)。信号组的配置/首跑/反例三 gate 原生稳固;polish 收编为守则在本组的唯一实例。evals 为回归资产;证据存各自 workspace。
