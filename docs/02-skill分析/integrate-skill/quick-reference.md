# Integrate-Skill 快速参考

## 一句话总结

> 将 Claude 全局 Skill 集成到项目开发指南中，形成项目特定的最佳实践。

## 命令格式

```bash
/spec:integrate-skill <skill-name>
```

## 输出位置速查

| Skill 类型 | 目标目录 |
|-----------|---------|
| UI/Frontend | `.spec-first/spec/frontend/` |
| Backend/API | `.spec-first/spec/backend/` |
| Documentation | `.spec-first/` |
| Testing | `.spec-first/spec/frontend/` |

## 六步流程

```
1. 读取 Skill    → openskills read <skill-name>
2. 确定目标      → 根据类型选择目录
3. 分析内容      → 提取概念/实践/模式/注意事项
4. 执行集成      → doc.md + examples/ + index.md
5. 生成报告      → 兼容性 + 位置 + 依赖
6. 可选命令      → /spec:create-command
```

## 文件命名约定

| 文件类型 | 命名格式 | 示例 |
|---------|---------|------|
| 代码示例 | `<name>.<ext>.template` | `component.tsx.template` |
| 配置文件 | `<name>.config.template` | `tailwind.config.template` |
| 文档 | `README.md` | `README.md` |

## Section 标记

```markdown
@@@section:skill-<skill-name>
## # <Skill Name> Integration Guide
...
@@@/section:skill-<skill-name>
```

## 核心原则

> **集成目标是 Guidelines，不是代码**

- Guidelines → `.spec-first/spec/{target}/doc.md`
- Examples → `.spec-first/spec/{target}/examples/skills/<name>/`
- Index → `.spec-first/spec/{target}/index.md`
