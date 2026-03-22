# Spec-First

**AI-Powered Development Workflow - Spec-First Approach**

Spec-First 是一个强大的 AI 辅助开发工具集,将 Claude Code 转变为一个虚拟工程团队。通过结构化的工作流程和自动化工具,帮助开发者实现 10-100 倍的效率提升。

## 🎯 核心理念

**先规划,后编码** - 通过深度思考和系统化规划,确保每一行代码都符合产品目标。

**一个完整的工作流**:
```
产品想法 → 深度规划 → 工程设计 → 实现 → 测试 → 发布
```

**效率提升**:
- 🚀 **10-100x 效率提升** - 一个人的产出相当于 20 人的团队
- 🎯 **结构化流程** - 从规划到部署的完整工作流
- ✅ **质量保证** - 自动化的代码审查、测试和部署验证
- 💰 **开源免费** - MIT 许可证,完全免费

**适用人群**:
- **创始人/CEO** - 尤其是技术型创始人,想要快速构建产品
- **首次使用 Claude Code 的用户** - 结构化的角色而不是空白提示
- **技术主管和架构师** - 为每个 PR 带来严格的审查、QA 和发布自动化

---

## ⚡ 10 分钟快速开始

### 1. 安装 Spec-First (30 秒)

```bash
git clone https://github.com/your-org/spec-first.git ~/.claude/skills/spec-first
cd ~/.claude/skills/spec-first
./setup
```

### 2. 运行你的第一个技能

打开 Claude Code,输入:

```
/office-hours
```

描述你想要构建的产品或功能。

### 3. 体验完整工作流

```bash
/plan-ceo-review       # CEO 视角审查
/plan-eng-review       # 工程实现规划
# ... 实现代码 ...
/review                # 代码审查
/qa                    # QA 测试
/ship                  # 创建 PR
/land-and-deploy       # 合并部署
```

**预期结果**: 第一次运行在 5 分钟内完成,得到完整的设计文档和实现计划。

---

## 📦 安装指南

### 系统要求

| 软件 | 版本 | 说明 |
|------|------|------|
| [Claude Code](https://docs.anthropic.com/en/docs/claude-code) | 最新版 | 运行环境 |
| [Git](https://git-scm.com/) | 2.0+ | 版本控制 |
| [Bun](https://bun.sh/) | 1.0+ | JavaScript 运行时 |
| [Node.js](https://nodejs.org/) | 18+ | 仅 Windows 需要 |

### 方法 1: 全局安装 (推荐)

在 Claude Code 中直接说:

```
安装 spec-first
```

或手动执行:

```bash
git clone https://github.com/your-org/spec-first.git ~/.claude/skills/spec-first
cd ~/.claude/skills/spec-first
./setup
```

### 方法 2: 项目本地安装

将 Spec-First 添加到项目,让团队成员自动获得:

```bash
cp -Rf ~/.claude/skills/spec-first .claude/skills/spec-first
rm -rf .claude/skills/spec-first/.git
cd .claude/skills/spec-first
./setup
```

提交到版本控制:

```bash
git add .claude/skills/spec-first
git commit -m "Add spec-first to project"
git push
```

### 方法 3: 多平台支持 (Codex, Gemini CLI, Cursor)

```bash
git clone https://github.com/your-org/spec-first.git ~/.codex/skills/spec-first
cd ~/.codex/skills/spec-first
./setup --host codex
```

或自动检测:

```bash
git clone https://github.com/your-org/spec-first.git ~/spec-first-temp
cd ~/spec-first-temp
./setup --host auto
```

---

## 🎬 看它如何工作

```
用户:    我想构建一个每日简报应用,帮助管理多个日历。
用户:    /office-hours
Claude:  [询问真实痛点 - 具体例子,而不是假设]

用户:    多个 Google 日历,事件信息过期,地点错误...
         准备工作耗时很长,结果还不够好...

Claude:  我要挑战你的框架。你说"每日简报应用",但你实际描述的是
         一个私人参谋长 AI。
         [提取出你没想到的 5 个能力]
         [挑战 4 个前提 - 你同意、不同意或调整]
         [生成 3 个实现方案及工作量估算]
         推荐: 明天发布最窄的切入点,从真实使用中学习。
         [编写设计文档 → 自动传递给下游技能]

用户:    /plan-ceo-review
         [读取设计文档,挑战范围,运行 10 个章节的审查]

用户:    /plan-eng-review
         [数据流的 ASCII 图表,状态机,错误路径]
         [测试矩阵,失败模式,安全问题]

用户:    批准计划。退出计划模式。
         [编写 2,400 行代码,11 个文件,约 8 分钟]

用户:    /review
         [自动修复] 2 个问题。[询问] 竞态条件 → 你批准修复。

用户:    /qa https://staging.myapp.com
         [打开真实浏览器,点击流程,发现并修复 bug]

用户:    /ship
         测试: 42 → 51 (+9 新增)。PR: github.com/you/app/pull/42
```

你说"每日简报应用",代理说"你在构建参谋长 AI" - 因为它倾听你的痛点,而不是你的功能需求。然后它挑战你的前提,生成三个方案,推荐最窄的切入点,并编写设计文档传递给每个下游技能。8 个命令。这不是副驾驶,这是一个团队。

---

## 🛠️ 技能列表

### 📋 产品规划类

| 技能 | 角色 | 功能 |
|------|------|------|
| `/office-hours` | **YC 办公时间** | 从这里开始。6 个强制性问题,在编写代码前重新构建你的产品。 |
| `/plan-ceo-review` | **CEO/创始人** | 重新思考问题。找到隐藏在请求中的 10 倍产品。 |
| `/plan-eng-review` | **工程经理** | 锁定架构、数据流、图表、边缘情况和测试。 |
| `/plan-design-review` | **高级设计师** | 对每个设计维度评分 0-10,解释 10 分的样子,然后编辑计划达到目标。 |
| `/design-consultation` | **设计合作伙伴** | 从头构建完整的设计系统。了解领域,提出创意风险。 |

### 💻 开发类

| 技能 | 角色 | 功能 |
|------|------|------|
| `/review` | **架构师** | 发现通过 CI 但在生产环境爆炸的 bug。自动修复明显问题。 |
| `/investigate` | **调试专家** | 系统化的根因调试。铁律:没有调查就没有修复。 |
| `/codex` | **第二意见** | 来自 OpenAI Codex CLI 的独立代码审查。 |

### 🧪 测试类

| 技能 | 角色 | 功能 |
|------|------|------|
| `/qa` | **QA 负责人** | 测试应用,发现 bug,用原子提交修复,重新验证。 |
| `/qa-only` | **QA 报告员** | 与 /qa 相同的方法论,但仅报告。 |
| `/canary` | **SRE** | 部署后监控循环。监视控制台错误、性能退化和页面故障。 |
| `/benchmark` | **性能工程师** | 基线页面加载时间、Core Web Vitals 和资源大小。 |

### 🚀 部署类

| 技能 | 角色 | 功能 |
|------|------|------|
| `/ship` | **发布工程师** | 同步 main,运行测试,审计覆盖率,推送,打开 PR。 |
| `/land-and-deploy` | **发布工程师** | 合并 PR,等待 CI 和部署,验证生产环境健康。 |
| `/setup-deploy` | **部署配置器** | /land-and-deploy 的一次性设置。 |

### 🎨 设计类

| 技能 | 角色 | 功能 |
|------|------|------|
| `/design-review` | **会写代码的设计师** | 与 /plan-design-review 相同的审计,然后修复发现的问题。 |

### 🔒 安全类

| 技能 | 功能 |
|------|------|
| `/careful` | 破坏性命令前的警告 (rm -rf, DROP TABLE, force-push)。 |
| `/freeze` | 将文件编辑限制在一个目录。 |
| `/guard` | `/careful` + `/freeze` 的组合。 |
| `/unfreeze` | 移除 `/freeze` 边界。 |

### 🔧 工具类

| 技能 | 功能 |
|------|------|
| `/browse` | 给代理眼睛。真实的 Chromium 浏览器,真实的点击,真实的截图。 |
| `/setup-browser-cookies` | 从真实浏览器导入 cookie 到无头会话。 |
| `/document-release` | 更新所有项目文档以匹配刚发布的内容。 |
| `/retro` | 团队感知的每周回顾。每人细分,发布连续性,测试健康趋势。 |
| `/spec-first-upgrade` | 升级 spec-first 到最新版本。 |

---

## 💡 核心特性

### 1. `/office-hours` 重新构建产品

你说"每日简报应用",它倾听你的实际痛点,挑战框架,告诉你真正构建的是私人参谋长 AI,挑战前提,生成三个实现方案及工作量估算。编写的设计文档直接传递给 `/plan-ceo-review` 和 `/plan-eng-review`。

### 2. 设计为核心

`/design-consultation` 不仅仅是选择字体。它研究你领域的内容,提出安全选择和创意风险,生成实际产品的真实模型,编写 `DESIGN.md` - 然后 `/design-review` 和 `/plan-eng-review` 读取你的选择。

### 3. `/qa` 是巨大的解锁

它让我从 6 个并行工作增加到 12 个。Claude Code 说"我看到问题了",然后实际修复它,生成回归测试,验证修复 - 这改变了我工作的方式。代理现在有眼睛了。

### 4. 智能审查路由

就像一个运行良好的初创公司:CEO 不必查看基础设施 bug 修复,后端更改不需要设计审查。spec-first 跟踪运行了哪些审查,找出什么是合适的,然后做聪明的事情。

### 5. 测试一切

`/ship` 如果项目没有测试框架,会从头开始引导。每次 `/ship` 运行都会生成覆盖率审计。每个 `/qa` bug 修复都会生成回归测试。100% 测试覆盖率是目标 - 测试让氛围编码变得安全,而不是 yolo 编码。

### 6. 一键发布到生产

`/land-and-deploy` 接替 `/ship` 离开的地方 - 合并 PR,等待 CI 和部署,然后对你的生产 URL 运行金丝雀验证。自动检测 Fly.io, Render, Vercel, Netlify, Heroku 或 GitHub Actions。

### 7. 浏览器移交

遇到 CAPTCHA、认证墙或 MFA 提示?`$B handoff` 打开一个可见的 Chrome,在完全相同的页面上,保留所有 cookie 和标签。解决问题,告诉 Claude 完成了,`$B resume` 从它离开的地方继续。

### 8. 多 AI 第二意见

`/codex` 从 OpenAI 的 Codex CLI 获得独立审查 - 完全不同的 AI 查看相同的差异。三种模式:带有通过/失败门的代码审查,主动尝试破坏代码的对抗性挑战,以及具有会话连续性的开放咨询。

### 9. 按需安全护栏

说"小心",`/careful` 在任何破坏性命令前警告 - rm -rf, DROP TABLE, force-push, git reset --hard。`/freeze` 在调试时将编辑锁定到一个目录,这样 Claude 就不会意外"修复"无关代码。`/guard` 激活两者。

---

## 📊 工作流程

### 标准开发流程

```
产品想法
   ↓
/office-hours (1-2 小时)
   ↓
/plan-ceo-review (30-60 分钟)
   ↓
/plan-eng-review (30-60 分钟)
   ↓
实现代码 (数小时到数天)
   ↓
/review (15-30 分钟)
   ↓
/qa (30-60 分钟)
   ↓
/ship (15-30 分钟)
   ↓
/land-and-deploy (15-30 分钟)
   ↓
/canary (30 分钟监控)
```

### Bug 修复流程

```
发现问题
   ↓
/freeze (限制范围)
   ↓
/investigate (根因分析)
   ↓
实现修复
   ↓
/review (代码审查)
   ↓
/qa (验证)
   ↓
/ship (发布)
```

---

## 📚 完整文档

### 用户手册

| 文档 | 内容 |
|------|------|
| [快速开始](docs/用户手册/01-快速开始.md) | 10 分钟上手指南 |
| [安装指南](docs/用户手册/02-安装指南.md) | 详细安装步骤 |
| [技能列表](docs/用户手册/04-技能列表.md) | 所有技能详解 |
| [工作流程](docs/用户手册/05-工作流程.md) | 推荐开发流程 |
| [配置指南](docs/用户手册/06-配置指南.md) | 自定义配置 |
| [最佳实践](docs/用户手册/07-最佳实践.md) | 高效使用技巧 |
| [常见问题](docs/用户手册/08-常见问题.md) | 28 个 FAQ |
| [故障排除](docs/用户手册/09-故障排除.md) | 问题诊断解决 |

### 开发者文档

| 文档 | 内容 |
|------|------|
| [自定义技能](docs/用户手册/10-自定义技能.md) | 创建自己的技能 |
| [贡献指南](docs/用户手册/11-贡献指南.md) | 如何贡献代码 |
| [更新日志](docs/用户手册/12-更新日志.md) | 版本更新历史 |
| [架构设计](ARCHITECTURE.md) | 设计决策和系统内部 |
| [构建哲学](ETHOS.md) | Builder 哲学:Boil the Lake, Search Before Building |

---

## 🔒 隐私和遥测

Spec-First 包含**可选的**使用遥测,帮助改进项目:

- **默认关闭**。除非你明确说是,否则不会发送任何内容。
- **首次运行时**,spec-first 会询问你是否要共享匿名使用数据。你可以说不。
- **发送内容(如果你选择加入)**: 技能名称、持续时间、成功/失败、spec-first 版本、操作系统。仅此而已。
- **从不发送**: 代码、文件路径、仓库名、分支名、提示或任何用户生成的内容。
- **随时更改**: `spec-first-config set telemetry off` 立即禁用所有内容。

---

## 🛠️ 故障排除

### 技能未显示?

```bash
cd ~/.claude/skills/spec-first
./setup
```

### `/browse` 失败?

```bash
cd ~/.claude/skills/spec-first
bun install
bun run build
```

### 安装过期?

运行 `/spec-first-upgrade` - 或在 `~/.spec-first/config.yaml` 中设置 `auto_upgrade: true`

### Windows 用户

Spec-First 在 Windows 11 上通过 Git Bash 或 WSL 工作。除了 Bun 之外还需要 Node.js - Bun 在 Windows 上有 Playwright 管道传输的已知 bug ([bun#4253](https://github.com/oven-sh/bun/issues/4253))。browse 服务器自动回退到 Node.js。确保 `bun` 和 `node` 都在 PATH 上。

### Claude 说找不到技能?

确保项目的 `CLAUDE.md` 有 spec-first 部分。添加这个:

```markdown
## Spec-First 技能

使用 spec-first 的 /browse 进行所有网页浏览。不要使用 mcp__claude-in-chrome__* 工具。

可用技能: /office-hours, /plan-ceo-review, /plan-eng-review, /plan-design-review,
/design-consultation, /review, /ship, /browse, /qa, /qa-only, /design-review,
/setup-browser-cookies, /setup-deploy, /retro, /investigate, /document-release,
/codex, /careful, /freeze, /guard, /unfreeze, /spec-first-upgrade。
```

---

## 📄 许可证

MIT License. 免费永久。去构建点什么吧。

---

## 🆘 获取帮助

- **GitHub Issues**: [提交问题](https://github.com/your-org/spec-first/issues)
- **用户手册**: [完整文档](docs/用户手册/README.md)
- **社区**: 加入讨论

---

## 🎉 致谢

Spec-First 的设计理念受到了 Y Combinator 办公时间、现代软件工程最佳实践和 AI 辅助开发前沿探索的启发。

特别感谢所有贡献者和早期用户的反馈,帮助塑造了这个工具。

---

**开始你的 Spec-First 之旅**: [快速开始 →](docs/用户手册/01-快速开始.md)

**当前版本**: v1.3.1.1 | **最后更新**: 2026-03-22
