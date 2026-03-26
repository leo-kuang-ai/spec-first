# Integrate-Skill 目录结构示例

## 集成前

```
.spec-first/spec/
├── frontend/
│   ├── index.md
│   ├── component-guidelines.md
│   └── hook-guidelines.md
├── backend/
│   ├── index.md
│   ├── error-handling.md
│   └── quality-guidelines.md
└── guides/
    └── index.md
```

## 集成 mcp-builder 后

```
.spec-first/spec/
├── frontend/
│   ├── index.md
│   ├── component-guidelines.md
│   └── hook-guidelines.md
├── backend/
│   ├── index.md                    ← 添加 mcp-builder 条目
│   ├── error-handling.md
│   ├── quality-guidelines.md
│   ├── mcp-guidelines.md           ← 新增: MCP 开发指南
│   └── examples/                   ← 新增: 示例目录
│       └── skills/
│           └── mcp-builder/
│               ├── README.md
│               ├── server.ts.template
│               ├── tools.ts.template
│               └── types.ts.template
└── guides/
    └── index.md
```

## 集成 frontend-design 后

```
.spec-first/spec/
├── frontend/
│   ├── index.md                    ← 添加 frontend-design 条目
│   ├── component-guidelines.md
│   ├── hook-guidelines.md
│   ├── design-guidelines.md        ← 新增: 设计指南
│   └── examples/                   ← 新增: 示例目录
│       └── skills/
│           └── frontend-design/
│               ├── README.md
│               ├── button.tsx.template
│               ├── card.tsx.template
│               └── layout.tsx.template
├── backend/
│   └── ...
└── guides/
    └── index.md
```

## 关键目录说明

| 路径 | 用途 |
|------|------|
| `{target}/index.md` | 快速导航索引，添加 Skill 相关条目 |
| `{target}/doc.md` 或专题文件 | Guidelines 文档，添加 Skill 使用指南 |
| `{target}/examples/skills/<name>/` | 代码示例目录，存放模板文件 |

## 文件后缀说明

```
examples/skills/mcp-builder/
├── README.md                 # 正常文档，可被阅读
├── server.ts.template        # 模板文件，不被编译
└── tools.ts.template         # 模板文件，不被 IDE 检查
```

**为什么用 `.template` 后缀？**
- 避免 TypeScript 编译器处理示例代码
- 避免 IDE 报告类型错误
- 明确标识这是参考模板，非实际代码
