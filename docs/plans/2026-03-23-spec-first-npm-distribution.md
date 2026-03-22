# spec-first npm 分发实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 发布一个单一的 npm 包，暴露 `spec-first`，支持 `install/setup/update/doctor/analytics`，并且在只有 Node 的机器上也能启动，不要求先装 Bun。

**Architecture:** 保持仓库里 skill 和浏览器代码作为唯一真源。新增一个很薄的 Node 侧 npm CLI，`setup` 继续作为底层初始化入口，同时把初始化拆成 release / dev 两条路径，这样 npm 用户不用本地编译也能安装。浏览器平台产物要打进 tarball，并且用严格白名单控制发布内容，保证每次发包都可预测。

**Tech Stack:** Bash、Node.js、Bun（仅用于开发/构建）、npm 打包、GitHub Actions、Bun test。

---

### Task 1: 固化 npm 包契约

**Files:**
- Modify: `package.json`
- Modify: `README.md`
- Modify: `README-CN.md`
- Modify: `docs/用户手册/02-安装指南.md`
- Create: `test/package-manifest.test.ts`

**Step 1: Write the failing test**

写一个测试，断言 `package.json` 暴露了 `spec-first` 的 bin、版本号是合法 semver、声明了 Node engine、包含严格的 `files` 白名单，并且不会把 docs 里的分析文档打进 tarball。

```ts
test('package.json exposes the npm runtime contract', () => {
  // assert bin.spec-first exists
  // assert version is valid semver
  // assert files allowlist excludes docs/01-需求分析/**
  // assert prepack/publish scripts exist
});
```

Run: `bun test test/package-manifest.test.ts -v`

Expected: FAIL，因为 `spec-first` bin、合法 semver、`files` 和发布脚本还没全部到位。

**Step 2: Run test to verify it fails**

Run: `bun test test/package-manifest.test.ts -v`

Expected: 会因为缺少 npm 契约字段而失败。

**Step 3: Write minimal implementation**

更新 `package.json`，把 npm 契约写明确：
- 增加 `bin.spec-first`
- 保留 `bin.browse`
- 增加 `engines.node`
- 增加 `files`
- 增加 `scripts.prepack`
- 增加 `scripts.publish:npm`
- 把版本号改成合法 semver

同步更新安装文档，写清楚 `npm install -g spec-first` 和 `spec-first install`。

**Step 4: Run test to verify it passes**

Run: `bun test test/package-manifest.test.ts -v`

Expected: PASS。

**Step 5: Commit**

```bash
git add package.json README.md README-CN.md docs/用户手册/02-安装指南.md test/package-manifest.test.ts
git commit -m "feat: define npm distribution contract"
```

---

### Task 2: 增加 npm CLI 分发入口

**Files:**
- Create: `bin/spec-first`
- Create: `bin/spec-first-install`
- Create: `bin/spec-first-update`
- Create: `bin/spec-first-doctor`
- Modify: `package.json`
- Create: `test/spec-first-cli.test.ts`

**Step 1: Write the failing test**

写测试覆盖这些行为：
- 未知子命令必须直接失败
- `spec-first install --host codex --lang en` 要能透传两个参数
- `spec-first update` 复用已有的 update-check 流程
- `spec-first doctor` 退出码为 0，并输出预期的健康信息
- `spec-first analytics` 继续委托给现有 analytics 脚本

Run: `bun test test/spec-first-cli.test.ts -v`

Expected: FAIL，因为分发入口和 helper 入口还不存在。

**Step 2: Run test to verify it fails**

Run: `bun test test/spec-first-cli.test.ts -v`

Expected: 路由和入口缺失导致失败。

**Step 3: Write minimal implementation**

实现一个很薄的 Node dispatcher：`bin/spec-first`，它要：
- 校验第一个参数必须是 `install`、`setup`、`update`、`doctor`、`analytics` 之一
- 遇到未知命令时返回非 0，并输出简短错误
- 把 `install` 转发到 `bin/spec-first-install`
- 把 `update` 转发到 `bin/spec-first-update`
- 把 `doctor` 转发到 `bin/spec-first-doctor`
- 把 `analytics` 转发到 `bin/spec-first-analytics`
- `setup` 直接转发到 `setup`

helper 要尽量薄，优先复用现有脚本和现有 helper。

**Step 4: Run test to verify it passes**

Run: `bun test test/spec-first-cli.test.ts -v`

Expected: PASS。

**Step 5: Commit**

```bash
git add bin/spec-first bin/spec-first-install bin/spec-first-update bin/spec-first-doctor package.json test/spec-first-cli.test.ts
git commit -m "feat: add spec-first npm cli"
```

---

### Task 3: 把 `setup` 拆成 release / dev 模式，并收紧参数校验

**Files:**
- Modify: `setup`
- Modify: `bin/spec-first-install`
- Create: `test/setup-args.test.ts`

**Step 1: Write the failing test**

写测试覆盖这些行为：
- `setup` 必须拒绝未知参数，而不是静默忽略
- `setup --host claude --lang zh` 仍然可用
- `SPEC_FIRST_MODE=release` 要跳过 Bun rebuild，直接使用发布产物
- `install` 必须原样透传 `setup` 的参数
- release 模式下如果 packaged browser binary 缺失，要明确报错

Run: `bun test test/setup-args.test.ts -v`

Expected: FAIL，因为现在未知参数会被吞掉，而且还没有 release mode。

**Step 2: Run test to verify it fails**

Run: `bun test test/setup-args.test.ts -v`

Expected: 在未知参数和 release mode 上失败。

**Step 3: Write minimal implementation**

重构 `setup`：
- 只接受 `--host` 和 `--lang`
- 遇到未知 flag 直接退出 1
- 读取 `SPEC_FIRST_MODE=release|dev`
- release 模式下跳过 `bun install` 和 `bun run build`
- release 模式下检查 packaged browser artifact 是否存在并可执行
- dev 模式下保留当前重建行为

更新 `bin/spec-first-install`，让它设置 `SPEC_FIRST_MODE=release`，然后把用户传入的参数原样传给 `setup`。

**Step 4: Run test to verify it passes**

Run: `bun test test/setup-args.test.ts -v`

Expected: PASS。

**Step 5: Commit**

```bash
git add setup bin/spec-first-install test/setup-args.test.ts
git commit -m "feat: split setup into release and dev modes"
```

---

### Task 4: 打包平台相关的浏览器产物

**Files:**
- Modify: `package.json`
- Modify: `setup`
- Create: `scripts/build-release-binary.sh`
- Create: `scripts/assemble-release-package.sh`
- Create: `test/release-binary-layout.test.ts`

**Step 1: Write the failing test**

写测试，断言：
- release layout 要包含每个支持平台/架构对应的 browser artifact
- `setup` 能把当前 target 解析到正确的 packaged binary
- 如果 target binary 缺失，`setup` 要明确失败
- 选中的 `browse/dist/browse` 路径最终仍然存在

Run: `bun test test/release-binary-layout.test.ts -v`

Expected: FAIL，因为 release layout 和选择器还不存在。

**Step 2: Run test to verify it fails**

Run: `bun test test/release-binary-layout.test.ts -v`

Expected: 失败，原因是 release layout 和 selector 行为还没实现。

**Step 3: Write minimal implementation**

在 `browse/dist/releases/<platform>-<arch>/` 下增加 release artifact layout，并让 `setup`：
- 检测当前 `platform/arch`
- 选择匹配的 packaged binary
- 把它链接或复制到 `browse/dist/browse`
- 如果缺少目标 artifact，则用清晰错误退出

增加 `scripts/build-release-binary.sh` 用于构建当前 target 的 binary，再增加 `scripts/assemble-release-package.sh` 用于把 release artifacts 收集到 npm tarball 结构里。

**Step 4: Run test to verify it passes**

Run: `bun test test/release-binary-layout.test.ts -v`

Expected: PASS。

**Step 5: Commit**

```bash
git add package.json setup scripts/build-release-binary.sh scripts/assemble-release-package.sh test/release-binary-layout.test.ts
git commit -m "feat: package platform-specific browser artifacts"
```

---

### Task 5: 加上 npm 发布 workflow 和 tarball 守门

**Files:**
- Create: `.github/workflows/npm-release.yml`
- Create: `test/npm-pack.test.ts`
- Modify: `package.json`

**Step 1: Write the failing test**

写一个测试，运行 `npm pack --dry-run --json`，并断言 tarball 包含：
- `bin/spec-first`
- `setup`
- 生成后的 skill 资产
- 打包后的 browser artifacts

同时断言 tarball 不包含：
- `docs/01-需求分析/**`
- 历史分析 / bak 产物
- 不需要随包发布的 review-only 文档

Run: `bun test test/npm-pack.test.ts -v`

Expected: FAIL，因为还没有真正收紧 pack 内容。

**Step 2: Run test to verify it fails**

Run: `bun test test/npm-pack.test.ts -v`

Expected: pack 内容断言失败。

**Step 3: Write minimal implementation**

新增一个 GitHub Actions workflow，要求：
- 在手动触发和 release/tag 事件上运行
- 用 Bun 安装依赖
- 跑快速测试
- 跑 `bun run build`
- 跑 `npm pack --dry-run`
- 所有检查通过后才执行 `npm publish --access public --provenance`

保持 workflow 简单、线性，不要在没有明确收益的前提下加额外编排。

**Step 4: Run test to verify it passes**

Run: `bun test test/npm-pack.test.ts -v`

Expected: PASS。

**Step 5: Commit**

```bash
git add .github/workflows/npm-release.yml package.json test/npm-pack.test.ts
git commit -m "chore: add npm release workflow"
```

---

### Task 6: 更新用户文档并做最终验证

**Files:**
- Modify: `README.md`
- Modify: `README-CN.md`
- Modify: `docs/用户手册/01-快速开始.md`
- Modify: `docs/用户手册/02-安装指南.md`
- Modify: `docs/用户手册/03-卸载指南.md`
- Modify: `CHANGELOG.md`

**Step 1: Write the failing test**

如果需要，就补一个 docs freshness test，确保安装文档和快速开始里写的是：
- `npm install -g spec-first`
- `spec-first install`
- 支持的 `--host` 和 `--lang` 参数

Run: `bun test test/package-manifest.test.ts test/spec-first-cli.test.ts test/setup-args.test.ts test/release-binary-layout.test.ts test/npm-pack.test.ts -v`

Expected: 只有在文档和实现都对齐之后才会通过。

**Step 2: Run test to verify it fails**

如果已经加了 doc check，在改文档前先运行上面的命令。

Expected: 如果旧文档还没改，至少会有一个失败。

**Step 3: Write minimal implementation**

把用户文档更新成新的主流程：
- 用 npm 安装
- 运行 `spec-first install`
- `spec-first setup` 只保留给修复、重连、开发态流程

同时更新 changelog，用面向用户的语言写清楚变化。

**Step 4: Run test to verify it passes**

Run:
```bash
bun test
bun run build
npm pack --dry-run
```

Expected:
- `bun test` 通过
- `bun run build` 可以顺利重新生成 skills 和浏览器产物
- `npm pack --dry-run` 只包含允许发布的 runtime 资产

**Step 5: Commit**

```bash
git add README.md README-CN.md docs/用户手册/01-快速开始.md docs/用户手册/02-安装指南.md docs/用户手册/03-卸载指南.md CHANGELOG.md
git commit -m "docs: update npm installation flow"
```

---

## 最终验证清单

在干净工作区里，正式开 PR 前跑这几个命令：

```bash
bun test
bun run build
npm pack --dry-run
```

Expected:
- `bun test` 通过，并且新加的 npm CLI / setup / release-layout / pack 测试都通过
- `bun run build` 可以干净地重新生成 `SKILL.md` 和浏览器产物
- `npm pack --dry-run` 只包含计划发布的 runtime 资产，不包含分析文档和历史包

## 可复用的现有代码

- `setup` 已经知道如何链接 Claude 和 Codex skills。
- `bin/spec-first-config`、`bin/spec-first-analytics`、`bin/spec-first-update-check` 已经提供了配置、遥测和 update-check 的基础能力。
- `scripts/gen-skill-docs.ts` 已经可以生成 Claude 和 Codex 两套 skill 树。
- `.github/workflows/skill-docs.yml` 已经展示了这个仓库的 workflow 风格。

## 备注

- npm 入口必须保持很薄，不要把浏览器逻辑塞进 dispatcher。
- release / dev 的分裂要明确，不要让 `setup` 在 npm release 模式里偷偷 rebuild。
- 优先用朴素、可测试的 shell / Node 包装层，不要引入不必要的新抽象。
