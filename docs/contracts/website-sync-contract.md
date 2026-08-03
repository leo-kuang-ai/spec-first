# 官网同步契约

## 目的

`spec-first` 包发布不能假设官网已经消费了最新 package facts。官网是本仓库的外部 consumer，不是 package 仓库内部的 source-of-truth 目录。

本契约定义 package 仓库与官网仓库在发布时的边界。

## Source Of Truth

package 仓库拥有这些事实：

- `package.json` version、package name、bin path 和 Node.js engine。
- `src/cli/contracts/dual-host-governance/skills-governance.json`.
- `templates/claude/commands/spec/*.md`.
- `skills/*/SKILL.md`.
- `agents/*.agent.md`.
- `README.md`、`README.en.md`、`README.zh-CN.md` 和 `docs/05-用户手册/**`。

官网仓库通过自己的 generated data 和 content audit 消费这些事实。package 发布流程不能修改官网 source files。

## 外部 Consumer

默认官网仓库路径是：

```text
/Users/kuang/xiaobu/spec-first-official-website
```

维护者可以通过环境变量覆盖路径：

```bash
SPEC_FIRST_WEBSITE_REPO=/path/to/spec-first-official-website
```

官网侧 fact sync 契约是：

```bash
cd "$SPEC_FIRST_WEBSITE_REPO/website"
npm run facts:sync
npm run content:audit
```

`facts:sync` 是官网仓库拥有的确定性 writer。`content:audit` 是本仓库消费的 package-release gate。

## Release Gate

package 发布脚本必须运行：

```bash
npm run test:release:website
```

`test:release:website` 运行 `scripts/check-website-sync.cjs --required`，它会：

1. 从 `SPEC_FIRST_WEBSITE_REPO` 或默认 sibling path 定位官网仓库。
2. 校验 website package 暴露了 `facts:sync` 和 `content:audit`。
3. 在 website package 中运行 `npm run content:audit`，并把 `SPEC_FIRST_SOURCE_DIR` 指向当前 package 仓库。

如果官网仓库缺失、官网脚本缺失，或 `content:audit` 失败，package 发布必须停止。这让 scripts 只负责确定性事实检查，把 stale content 的解释与修复留给维护者。

## 非目标

- 不把官网 source vendor 到 package 仓库。
- 不让普通 `npm run test:unit` 或 `npm run test:release` 依赖 sibling checkout。
- 不让 package scripts 在 publish 期间重写官网 facts。如果 facts stale，应在官网仓库运行 `npm run facts:sync` 并审查官网 diff。
