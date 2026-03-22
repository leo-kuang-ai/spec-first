# Spec-First 用户手册

欢迎来到 Spec-First 用户手册!这是一份完整的指南,帮助你从零开始使用 Spec-First。

## 📚 手册目录

### 新手入门
- [**快速开始**](./01-快速开始.md) - 10 分钟快速上手指南
- [**安装指南**](./02-安装指南.md) - 详细的安装步骤
- [**卸载指南**](./03-卸载指南.md) - 如何完全卸载 Spec-First

### 核心功能
- [**技能列表**](./04-技能列表.md) - 所有可用技能的完整列表
- [**工作流程**](./05-工作流程.md) - 推荐的开发工作流程
- [**配置指南**](./06-配置指南.md) - 自定义 Spec-First 配置

### 进阶使用
- [**最佳实践**](./07-最佳实践.md) - 使用 Spec-First 的最佳实践
- [**常见问题**](./08-常见问题.md) - FAQ 和常见问题解答
- [**故障排除**](./09-故障排除.md) - 问题诊断和解决方案

### 开发者资源
- [**自定义技能**](./10-自定义技能.md) - 如何创建自己的技能
- [**贡献指南**](./11-贡献指南.md) - 如何为 Spec-First 做贡献
- [**更新日志**](./12-更新日志.md) - 版本更新历史

## 🚀 5 分钟快速开始

如果你想立即开始使用,只需 3 步:

### 1. 安装 Spec-First (30 秒)

```bash
git clone https://github.com/sunrain520/spec-first.git ~/.claude/skills/spec-first
cd ~/.claude/skills/spec-first
./setup
```

### 2. 添加到你的项目 (可选)

```bash
cp -Rf ~/.claude/skills/spec-first .claude/skills/spec-first
rm -rf .claude/skills/spec-first/.git
cd .claude/skills/spec-first
./setup
```

### 3. 开始使用

打开 Claude Code,输入:

```
/brainstorm
```

然后描述你想要构建的产品或功能。

## 💡 核心概念

### 什么是 Spec-First?

Spec-First 是一个开源的 AI 辅助开发工具集,它将 Claude Code 转变为一个虚拟工程团队:

- **CEO/产品角色** - `/brainstorm`, `/plan-ceo-review`
- **工程经理角色** - `/plan-eng-review`, `/review`
- **设计师角色** - `/design-review`, `/design-consultation`
- **QA 角色** - `/qa`, `/qa-only`, `/canary`
- **发布工程师角色** - `/ship`, `/land-and-deploy`

### 为什么使用 Spec-First?

1. **10-100x 效率提升** - 一个人的产出相当于 20 人的团队
2. **结构化流程** - 从规划到部署的完整工作流
3. **质量保证** - 自动化的代码审查、测试和部署验证
4. **开源免费** - MIT 许可证,完全免费

## 📖 推荐阅读顺序

### 第一次使用
1. [快速开始](./01-快速开始.md)
2. [安装指南](./02-安装指南.md)
3. [技能列表](./04-技能列表.md)
4. [工作流程](./05-工作流程.md)

### 日常使用
1. [技能列表](./04-技能列表.md) (查阅特定技能)
2. [最佳实践](./07-最佳实践.md)
3. [常见问题](./08-常见问题.md)

### 遇到问题时
1. [故障排除](./09-故障排除.md)
2. [常见问题](./08-常见问题.md)

## 🆘 获取帮助

- **GitHub Issues**: [提交问题](https://github.com/sunrain520/spec-first/issues)
- **文档**: 你正在阅读的文档
- **社区**: 加入我们的社区讨论

## 📝 版本信息

- **当前版本**: v1.3.1.1
- **最后更新**: 2026-03-22
- **维护状态**: 活跃维护中
- **GitHub**: https://github.com/sunrain520/spec-first

---

**开始你的 Spec-First 之旅**: [快速开始 →](./01-快速开始.md)
