# 2026-03-22 init项目 文档索引

目录：`/Users/kuang/Desktop/ops/spec-first-pro/docs/01-需求分析/2026-03-22-init项目`
主题：将 `gstack` 迁入 `spec-first`，在不改变功能的前提下完成品牌、路径、安装与运行时迁移

## 0. 总执行原则

这组文档当前已经收敛出的总执行原则是：

```text
先迁移整个框架
    ->
再逐个 skill 迁移
    ->
逐个测试验证
```

这里的“整个框架”指的是公共主干，而不是某一个 skill：

- `setup`
- `scripts/gen-skill-docs.ts`
- browse runtime
- sidecar
- 状态目录
- host 安装路径

只有这些公共层先稳定下来，后面的 skill 迁移才不会反复返工。

## 1. 阅读顺序

建议按下面顺序阅读：

1. [spec-first-迁移方案.md](./spec-first-%E8%BF%81%E7%A7%BB%E6%96%B9%E6%A1%88.md)
2. [spec-first-迁移执行清单.md](./spec-first-%E8%BF%81%E7%A7%BB%E6%89%A7%E8%A1%8C%E6%B8%85%E5%8D%95.md)
3. [spec-first-迁移阶段计划.md](./spec-first-%E8%BF%81%E7%A7%BB%E9%98%B6%E6%AE%B5%E8%AE%A1%E5%88%92.md)
4. [spec-first-阶段B中枢改造清单.md](./spec-first-%E9%98%B6%E6%AE%B5B%E4%B8%AD%E6%9E%A2%E6%94%B9%E9%80%A0%E6%B8%85%E5%8D%95.md)
5. [B1-setup-改造包.md](./B1-setup-%E6%94%B9%E9%80%A0%E5%8C%85.md)
6. [B2-gen-skill-docs-改造包.md](./B2-gen-skill-docs-%E6%94%B9%E9%80%A0%E5%8C%85.md)
7. [B4-bin-helper-改造包.md](./B4-bin-helper-%E6%94%B9%E9%80%A0%E5%8C%85.md)
8. [B3-browse-runtime-改造包.md](./B3-browse-runtime-%E6%94%B9%E9%80%A0%E5%8C%85.md)
9. [spec-first-阶段C-skill迁移顺序清单.md](./spec-first-%E9%98%B6%E6%AE%B5C-skill%E8%BF%81%E7%A7%BB%E9%A1%BA%E5%BA%8F%E6%B8%85%E5%8D%95.md)
10. [G0-根SKILL-迁移包.md](./G0-%E6%A0%B9SKILL-%E8%BF%81%E7%A7%BB%E5%8C%85.md)
11. [G1-基础安全skill迁移包.md](./G1-%E5%9F%BA%E7%A1%80%E5%AE%89%E5%85%A8skill%E8%BF%81%E7%A7%BB%E5%8C%85.md)
12. [G2a-轻依赖规划与文档类skill迁移包.md](./G2a-%E8%BD%BB%E4%BE%9D%E8%B5%96%E8%A7%84%E5%88%92%E4%B8%8E%E6%96%87%E6%A1%A3%E7%B1%BBskill%E8%BF%81%E7%A7%BB%E5%8C%85.md)
13. [G2b-带browse-bin或项目状态依赖的planning-skill迁移包.md](./G2b-%E5%B8%A6browse-bin%E6%88%96%E9%A1%B9%E7%9B%AE%E7%8A%B6%E6%80%81%E4%BE%9D%E8%B5%96%E7%9A%84planning-skill%E8%BF%81%E7%A7%BB%E5%8C%85.md)
14. [G3-评审与质量类skill迁移包.md](./G3-%E8%AF%84%E5%AE%A1%E4%B8%8E%E8%B4%A8%E9%87%8F%E7%B1%BBskill%E8%BF%81%E7%A7%BB%E5%8C%85.md)
15. [G4-浏览器与部署重依赖skill迁移包.md](./G4-%E6%B5%8F%E8%A7%88%E5%99%A8%E4%B8%8E%E9%83%A8%E7%BD%B2%E9%87%8D%E4%BE%9D%E8%B5%96skill%E8%BF%81%E7%A7%BB%E5%8C%85.md)
16. [G5-升级与特殊迁移skill迁移包.md](./G5-%E5%8D%87%E7%BA%A7%E4%B8%8E%E7%89%B9%E6%AE%8A%E8%BF%81%E7%A7%BBskill%E8%BF%81%E7%A7%BB%E5%8C%85.md)
17. [spec-first-阶段D-整体验证与定版清单.md](./spec-first-%E9%98%B6%E6%AE%B5D-%E6%95%B4%E4%BD%93%E9%AA%8C%E8%AF%81%E4%B8%8E%E5%AE%9A%E7%89%88%E6%B8%85%E5%8D%95.md)
18. [spec-first-上游同步策略.md](./spec-first-%E4%B8%8A%E6%B8%B8%E5%90%8C%E6%AD%A5%E7%AD%96%E7%95%A5.md)

## 2. 文档说明

### [spec-first-迁移方案.md](./spec-first-%E8%BF%81%E7%A7%BB%E6%96%B9%E6%A1%88.md)

定位：

- 总体迁移方案
- 解释为什么这不是简单 rename，而是完整系统迁移

适用场景：

- 先理解整体目标、边界、原则、风险

### [spec-first-迁移执行清单.md](./spec-first-%E8%BF%81%E7%A7%BB%E6%89%A7%E8%A1%8C%E6%B8%85%E5%8D%95.md)

定位：

- 顶层架构
- 逐个任务拆解

适用场景：

- 按任务推进时查“做什么、怎么验收、有什么风险”

### [spec-first-迁移阶段计划.md](./spec-first-%E8%BF%81%E7%A7%BB%E9%98%B6%E6%AE%B5%E8%AE%A1%E5%88%92.md)

定位：

- 阶段主线
- 阶段依赖
- 阶段关口

适用场景：

- 需要从全局节奏上安排迁移推进顺序

### [spec-first-阶段B中枢改造清单.md](./spec-first-%E9%98%B6%E6%AE%B5B%E4%B8%AD%E6%9E%A2%E6%94%B9%E9%80%A0%E6%B8%85%E5%8D%95.md)

定位：

- 迁移关键路径
- 四个中枢改造

适用场景：

- 准备真正开始执行阶段 B 时作为主工作文档

### [B1-setup-改造包.md](./B1-setup-%E6%94%B9%E9%80%A0%E5%8C%85.md)

定位：

- 阶段 B 的安装中枢 patch 包
- 处理 `setup`、`dev-setup`、`dev-teardown`

适用场景：

- 准备先打通安装目录、sidecar、全局状态目录初始化时使用

### [B2-gen-skill-docs-改造包.md](./B2-gen-skill-docs-%E6%94%B9%E9%80%A0%E5%8C%85.md)

定位：

- 阶段 B 的生成中枢 patch 包
- 处理 `scripts/gen-skill-docs.ts`

适用场景：

- 准备统一生成出来的 host 路径、命令前缀、状态目录和 agents 前缀时使用

### [B4-bin-helper-改造包.md](./B4-bin-helper-%E6%94%B9%E9%80%A0%E5%8C%85.md)

定位：

- 阶段 B 缺失的 helper 命令中枢 patch 包
- 处理 `bin/gstack-*` 到 `spec-first-*` 的真实执行链路迁移

适用场景：

- 准备补齐阶段 B 的可执行命令闭环时使用

### [B3-browse-runtime-改造包.md](./B3-browse-runtime-%E6%94%B9%E9%80%A0%E5%8C%85.md)

定位：

- 阶段 B 的运行时中枢 patch 包
- 处理 `.gstack -> .spec-first` 的 browse 状态目录迁移

适用场景：

- 准备打通 browse runtime 的 state/log/.gitignore 路径闭环时使用

### [spec-first-阶段C-skill迁移顺序清单.md](./spec-first-%E9%98%B6%E6%AE%B5C-skill%E8%BF%81%E7%A7%BB%E9%A1%BA%E5%BA%8F%E6%B8%85%E5%8D%95.md)

定位：

- 阶段 C 的主执行文档
- 用来指导“逐个 skill 迁移、逐个验证”的推进顺序

适用场景：

- 阶段 B 完成后，开始按 skill 分组和顺序推进时使用

### [G0-根SKILL-迁移包.md](./G0-%E6%A0%B9SKILL-%E8%BF%81%E7%A7%BB%E5%8C%85.md)

定位：

- 阶段 C 的第一个 skill 级执行包
- 处理根 `SKILL.md.tmpl` 和根 `SKILL.md`

适用场景：

- 开始做 skill 级迁移时，先收口顶层品牌、顶层路由和顶层 browse 文案

### [G1-基础安全skill迁移包.md](./G1-%E5%9F%BA%E7%A1%80%E5%AE%89%E5%85%A8skill%E8%BF%81%E7%A7%BB%E5%8C%85.md)

定位：

- 阶段 C 的第一批低风险 skill 组执行包
- 处理 `careful`、`freeze`、`guard`、`unfreeze`

适用场景：

- 用低耦合 skill 验证“逐个 skill 迁移、逐个验证”的执行方法

### [G2a-轻依赖规划与文档类skill迁移包.md](./G2a-%E8%BD%BB%E4%BE%9D%E8%B5%96%E8%A7%84%E5%88%92%E4%B8%8E%E6%96%87%E6%A1%A3%E7%B1%BBskill%E8%BF%81%E7%A7%BB%E5%8C%85.md)

定位：

- 阶段 C 第二批 skill 执行包
- 处理 `brainstorm`、`design-consultation`、`document-release`、`retro`

适用场景：

- 在 G0/G1 验证完方法后，进入第一批项目级状态目录更复杂的业务型 skill

### [G2b-带browse-bin或项目状态依赖的planning-skill迁移包.md](./G2b-%E5%B8%A6browse-bin%E6%88%96%E9%A1%B9%E7%9B%AE%E7%8A%B6%E6%80%81%E4%BE%9D%E8%B5%96%E7%9A%84planning-skill%E8%BF%81%E7%A7%BB%E5%8C%85.md)

定位：

- 阶段 C 中 planning 链的重依赖执行包
- 处理 `plan-ceo-review`、`plan-eng-review`、`plan-design-review`

适用场景：

- 当 `~/.spec-first/projects`、`spec-first-slug`、`spec-first-review-log` 等项目级交接链路已经初步稳定后使用

### [G3-评审与质量类skill迁移包.md](./G3-%E8%AF%84%E5%AE%A1%E4%B8%8E%E8%B4%A8%E9%87%8F%E7%B1%BBskill%E8%BF%81%E7%A7%BB%E5%8C%85.md)

定位：

- 阶段 C 中 review handoff 链的高耦合执行包
- 处理 `review`、`investigate`、`codex`、`ship`

适用场景：

- 当 `spec-first-review-log`、`spec-first-slug`、`spec-first-diff-scope` 与 `~/.spec-first/projects/...-reviews.jsonl` 需要被统一成一条可执行闭环时使用

### [G4-浏览器与部署重依赖skill迁移包.md](./G4-%E6%B5%8F%E8%A7%88%E5%99%A8%E4%B8%8E%E9%83%A8%E7%BD%B2%E9%87%8D%E4%BE%9D%E8%B5%96skill%E8%BF%81%E7%A7%BB%E5%8C%85.md)

定位：

- 阶段 C 中浏览器、QA、canary、benchmark 与 deploy 链的重依赖执行包
- 处理 `browse`、`qa-only`、`qa`、`design-review`、`setup-browser-cookies`、`setup-deploy`、`canary`、`benchmark`、`land-and-deploy`

适用场景：

- 当 `.spec-first/*` 本地报告目录、`~/.spec-first/projects/*` 项目级产物目录和 `spec-first-*` helper 需要在浏览器与部署链上统一闭环时使用

### [G5-升级与特殊迁移skill迁移包.md](./G5-%E5%8D%87%E7%BA%A7%E4%B8%8E%E7%89%B9%E6%AE%8A%E8%BF%81%E7%A7%BBskill%E8%BF%81%E7%A7%BB%E5%8C%85.md)

定位：

- 阶段 C 中升级入口、版本检查与自动升级状态链的最终定版包
- 处理 `gstack-upgrade` / `spec-first-upgrade` 及其相关 helper 和状态文件

适用场景：

- 当普通 skill、review 链、browser / deploy 链都已经稳定，需要为升级链做最后命名定版和闭环验证时使用

### [spec-first-阶段D-整体验证与定版清单.md](./spec-first-%E9%98%B6%E6%AE%B5D-%E6%95%B4%E4%BD%93%E9%AA%8C%E8%AF%81%E4%B8%8E%E5%AE%9A%E7%89%88%E6%B8%85%E5%8D%95.md)

定位：

- 整个迁移计划的最终收口文档
- 处理安装、生成、runtime、skill、测试、兼容层的整体验证与首版定版

适用场景：

- 当阶段 B 和阶段 C 都完成后，用它来决定“现在是否可以发布首个 spec-first 迁移版本”

### [spec-first-上游同步策略.md](./spec-first-%E4%B8%8A%E6%B8%B8%E5%90%8C%E6%AD%A5%E7%AD%96%E7%95%A5.md)

定位：

- 迁移完成后如何持续同步 `gstack` 上游更新

适用场景：

- 设计长期维护和后续同步机制时使用

## 3. 当前结论

目前这组文档已经形成完整链路：

- 总体方案
- 执行任务
- 阶段计划
- 关键阶段 B 中枢清单
- 阶段 B 的 4 个 patch 级改造包
- 阶段 C 的 skill 迁移顺序清单
- 阶段 C 第一批 skill 执行包
- 阶段 C 第二批轻依赖业务 skill 执行包
- 阶段 C planning 重依赖 skill 执行包
- 阶段 C review / codex / ship 高耦合 skill 执行包
- 阶段 C 浏览器与部署重依赖 skill 执行包
- 阶段 C 升级与特殊迁移 skill 执行包
- 阶段 D 整体验证与定版清单
- 上游同步策略

其中当前最关键的执行入口是：

- [spec-first-阶段B中枢改造清单.md](./spec-first-%E9%98%B6%E6%AE%B5B%E4%B8%AD%E6%9E%A2%E6%94%B9%E9%80%A0%E6%B8%85%E5%8D%95.md)
- [B1-setup-改造包.md](./B1-setup-%E6%94%B9%E9%80%A0%E5%8C%85.md)
- [B2-gen-skill-docs-改造包.md](./B2-gen-skill-docs-%E6%94%B9%E9%80%A0%E5%8C%85.md)
- [B4-bin-helper-改造包.md](./B4-bin-helper-%E6%94%B9%E9%80%A0%E5%8C%85.md)
- [B3-browse-runtime-改造包.md](./B3-browse-runtime-%E6%94%B9%E9%80%A0%E5%8C%85.md)

因为迁移真正的关键路径不在文档层，而在四个中枢：

1. `setup`
2. `scripts/gen-skill-docs.ts`
3. `bin/gstack-*` helper
4. `browse` 路径与状态目录解析

## 4. 下一步建议

如果继续往下做，推荐顺序是：

1. 以 [spec-first-阶段B中枢改造清单.md](./spec-first-%E9%98%B6%E6%AE%B5B%E4%B8%AD%E6%9E%A2%E6%94%B9%E9%80%A0%E6%B8%85%E5%8D%95.md) 为总纲
2. 按顺序执行 [B1-setup-改造包.md](./B1-setup-%E6%94%B9%E9%80%A0%E5%8C%85.md)
3. 再执行 [B2-gen-skill-docs-改造包.md](./B2-gen-skill-docs-%E6%94%B9%E9%80%A0%E5%8C%85.md)
4. 再执行 [B4-bin-helper-改造包.md](./B4-bin-helper-%E6%94%B9%E9%80%A0%E5%8C%85.md)
5. 最后执行 [B3-browse-runtime-改造包.md](./B3-browse-runtime-%E6%94%B9%E9%80%A0%E5%8C%85.md)
6. 阶段 B 完成后，进入 [spec-first-阶段C-skill迁移顺序清单.md](./spec-first-%E9%98%B6%E6%AE%B5C-skill%E8%BF%81%E7%A7%BB%E9%A1%BA%E5%BA%8F%E6%B8%85%E5%8D%95.md)
7. 先执行 [G0-根SKILL-迁移包.md](./G0-%E6%A0%B9SKILL-%E8%BF%81%E7%A7%BB%E5%8C%85.md)
8. 再执行 [G1-基础安全skill迁移包.md](./G1-%E5%9F%BA%E7%A1%80%E5%AE%89%E5%85%A8skill%E8%BF%81%E7%A7%BB%E5%8C%85.md)
9. 然后执行 [G2a-轻依赖规划与文档类skill迁移包.md](./G2a-%E8%BD%BB%E4%BE%9D%E8%B5%96%E8%A7%84%E5%88%92%E4%B8%8E%E6%96%87%E6%A1%A3%E7%B1%BBskill%E8%BF%81%E7%A7%BB%E5%8C%85.md)
10. 再执行 [G2b-带browse-bin或项目状态依赖的planning-skill迁移包.md](./G2b-%E5%B8%A6browse-bin%E6%88%96%E9%A1%B9%E7%9B%AE%E7%8A%B6%E6%80%81%E4%BE%9D%E8%B5%96%E7%9A%84planning-skill%E8%BF%81%E7%A7%BB%E5%8C%85.md)
11. 再执行 [G3-评审与质量类skill迁移包.md](./G3-%E8%AF%84%E5%AE%A1%E4%B8%8E%E8%B4%A8%E9%87%8F%E7%B1%BBskill%E8%BF%81%E7%A7%BB%E5%8C%85.md)
12. 再执行 [G4-浏览器与部署重依赖skill迁移包.md](./G4-%E6%B5%8F%E8%A7%88%E5%99%A8%E4%B8%8E%E9%83%A8%E7%BD%B2%E9%87%8D%E4%BE%9D%E8%B5%96skill%E8%BF%81%E7%A7%BB%E5%8C%85.md)
13. 最后执行 [G5-升级与特殊迁移skill迁移包.md](./G5-%E5%8D%87%E7%BA%A7%E4%B8%8E%E7%89%B9%E6%AE%8A%E8%BF%81%E7%A7%BBskill%E8%BF%81%E7%A7%BB%E5%8C%85.md)
14. 阶段 C 完成后，执行 [spec-first-阶段D-整体验证与定版清单.md](./spec-first-%E9%98%B6%E6%AE%B5D-%E6%95%B4%E4%BD%93%E9%AA%8C%E8%AF%81%E4%B8%8E%E5%AE%9A%E7%89%88%E6%B8%85%E5%8D%95.md)
