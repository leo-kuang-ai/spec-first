# 2026-03-12 first 上下文注入链路审查

## 分析概览

- 分析日期: 2026-03-12
- 分析对象: `spec-first:first` 产物在后续 skill 节点中的自动上下文注入链路
- 分析范围: `first` 真源生成、阶段状态写入、skill 运行时 notice 注入、宿主注册与真实调用路径
- 结论级别: 代码级审查

## 输出文档

```text
2026-03-12-分析/
├── README.md
└── 审查结论.md
```

## 核心结论

1. `first` 已经能生成 runtime 真源层与 docs 投影视图，基础数据层是存在的。
2. 代码中已经实现了按 skill 注入 `spec-view` / `design-view` / `code-view` / `verify-view` 摘要的能力。
3. 但当前宿主真实执行链路里，Codex/Claude 安装的是静态 `SKILL.md` 副本，正常 skill 调用并不会经过动态注入入口。
4. 因此，“first 生成后在后续 skill 节点中自动注入上下文”在当前实现里是部分成立、整体未打通。

## 阅读顺序

1. 先看 `审查结论.md` 中的“当前节点流转图”
2. 再看“当前实际上下文注入图”
3. 最后看“MUST FIX / SHOULD FIX / 推荐方案”

