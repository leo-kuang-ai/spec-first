# 远程模板独立 Git 维护说明

本文档单独说明一个问题：

`.spec-first/spec/` 的远程模板，是否可以脱离 `spec-first` CLI 主仓库，放到单独的 Git 仓库里维护？

结论是：**可以，而且当前实现本来就支持。**

分析基于当前实现：

- `packages/cli/src/commands/init.ts`
- `packages/cli/src/utils/template-fetcher.ts`
- `marketplace/index.json`

---

## 1. 先给结论

当前 `spec-first init` 支持两类远程模板来源：

1. 默认模板市场
2. 用户通过 `--registry` 指定的自定义 Git 仓库

所以模板并不要求和 CLI 代码放在同一个仓库里。对公司或团队来说，更合理的做法通常就是：

```text
CLI 主仓库
  -> 负责命令、脚本、hooks、初始化框架

模板仓库
  -> 负责 index.json + specs/* + skills/*
```

这样模板可以独立演进，不必跟随 CLI 一起发布。

---

## 2. 当前实现是怎么支持的

入口在 `spec-first init`。

相关参数：

- `--registry <source>`
- `--template <id>`

其中：

- `--registry` 用来指定远程 Git 仓库或仓库子目录
- `--template` 用来指定模板 ID

核心流程在 `init.ts` 里大致是：

```text
spec-first init --registry <source>
   │
   ├─ parseRegistrySource(...)
   ├─ 探测 <rawBaseUrl>/index.json
   │
   ├─ 如果 index.json 存在
   │   └─ 按 marketplace 模式处理
   │       ├─ 拉模板列表
   │       ├─ 选择 template id
   │       └─ 下载 template.path
   │
   └─ 如果 index.json 不存在
       └─ 按 direct download 模式处理
           └─ 直接把 registry 指向的目录下载到目标位置
```

当前下载实现依赖 `giget`，相关逻辑在 `template-fetcher.ts`。

---

## 3. 支持两种独立维护模式

### 3.1 marketplace 模式

这是更推荐的方式。

单独的模板仓库中维护：

- `index.json`
- `specs/<template-id>/...`
- 可选 `skills/<skill-id>/...`

目录示意：

```text
company-spec-registry/
├─ index.json
├─ specs/
│  ├─ admin-next/
│  ├─ mobile-kmp/
│  ├─ backend-go-api/
│  └─ desktop-electron/
└─ skills/
   └─ spec-meta/
```

`index.json` 负责“模板发现”，每个模板项至少包含：

- `id`
- `type`
- `name`
- `description`
- `path`
- `tags`

示意：

```json
{
  "version": 1,
  "templates": [
    {
      "id": "admin-next",
      "type": "spec",
      "name": "Admin Web + Next.js",
      "description": "Admin web spec template",
      "path": "specs/admin-next",
      "tags": ["admin", "next", "typescript"]
    }
  ]
}
```

使用方式：

```bash
spec-first init --registry gh:your-org/company-spec-registry
```

如果要直接指定模板：

```bash
spec-first init --registry gh:your-org/company-spec-registry --template admin-next
```

处理链如下：

```text
--registry 指向仓库根
   │
   ├─ 读取 raw/index.json
   ├─ 解析 templates[]
   ├─ 找到 template.path
   └─ 下载 specs/<template-id>/...
```

### 3.2 direct download 模式

如果你不想维护 `index.json`，当前实现也支持把一个仓库目录本身当作模板。

例如：

```bash
spec-first init --registry gh:your-org/admin-spec-template
```

或者：

```bash
spec-first init --registry gh:your-org/company-spec-registry/specs/admin-next
```

这时如果 CLI 探测不到 `index.json`，就会进入 direct download 模式，直接下载该目录。

示意：

```text
registry 指向某个目录
   │
   ├─ 读取 <rawBaseUrl>/index.json
   ├─ 发现 404
   └─ 不再要求 template id
       直接把这个目录下载到 .spec-first/spec/
```

这种方式更轻，但缺点也明显：

- 没有模板清单
- 没有统一发现入口
- 不方便维护多个模板

所以更适合：

- 单模板团队
- 内部试验模板
- 临时验证

---

## 4. `--registry` 可以指向什么

当前 `parseRegistrySource()` 支持这些输入形态：

- `gh:org/repo`
- `gh:org/repo/path`
- `gh:org/repo/path#branch`
- `gitlab:org/repo/path`
- `bitbucket:org/repo/path`
- `https://github.com/org/repo`
- `https://github.com/org/repo/tree/main/path`

也就是说，模板仓库不要求和 CLI 仓库同源，只要：

1. provider 受支持
2. 仓库可访问
3. 路径能被 `giget` 下载

就可以单独维护。

---

## 5. 模板是怎么被“发布”的

这里没有单独的模板服务。

所谓“远程模板发布”，本质上就是：

```text
修改 Git 仓库内容
  -> push 到默认分支
  -> raw 文件可访问
  -> CLI 下次 init 时拉到新内容
```

marketplace 模式的维护流程：

```text
编辑 specs/<template-id>/*
   │
   ├─ 如果新增模板
   │   └─ 同步更新 index.json
   │
   ├─ git commit
   ├─ git push origin main
   └─ 远程 raw 地址开始提供新版本
```

direct download 模式的维护流程更简单：

```text
编辑模板目录
  -> git commit
  -> git push origin main
  -> CLI 重新下载该目录
```

---

## 6. 当前默认模板市场的边界

当前代码里，默认模板市场常量位于 `template-fetcher.ts`：

- `TEMPLATE_INDEX_URL`
- `TEMPLATE_REPO`

但这里有一个需要注意的边界：

```text
文件头注释指向:
  sunrain520/spec-first

默认常量当前写的是:
  leokuang/spec-first
```

这说明“默认公共模板市场”的 owner 配置当前并不完全一致。

所以如果团队要正式依赖远程模板，建议不要把稳定性建立在默认常量之上，而是：

1. 明确使用自己的 `--registry`
2. 维护自己的模板仓库
3. 只把默认公共市场当成示例或公共模板源

这也是“模板独立 Git 维护”真正有价值的地方。

---

## 7. 推荐的公司级维护方式

如果是一家研发公司，推荐直接单独维护一个模板仓库，采用 marketplace 模式。

建议结构：

```text
company-spec-registry/
├─ index.json
├─ specs/
│  ├─ admin-web-next/
│  ├─ mobile-kmp/
│  ├─ backend-go-api/
│  ├─ backend-java-spring/
│  └─ desktop-electron/
├─ skills/
│  ├─ mobile-review/
│  └─ backend-review/
└─ README.md
```

推荐原因：

- CLI 和模板可以独立演进
- 模板可以单独做 code review
- 不同团队可以共用一个模板市场
- 模板权限可以独立控制
- 回滚模板比回滚 CLI 更容易

---

## 8. 模板仓库与项目实例的关系

这里要区分两层：

1. 模板仓库
2. 项目里的 `.spec-first/spec/`

关系如下：

```text
模板仓库
   │
   └─ 在 init 时被下载
       │
       └─ 生成项目实例里的 .spec-first/spec/
           │
           ├─ 后续由项目团队继续维护
           └─ 不会因为模板仓库变更而自动回写
```

也就是说：

- 改模板仓库，影响的是“未来新初始化的项目”
- 改项目里的 `.spec-first/spec/`，影响的是“这个项目本地后续开发”

两者不是自动双向同步关系。

---

## 9. 远程模板与 `before-dev` 命令 / skill 的关系

这里也很容易误解。

远程模板仓库维护的是：

- `.spec-first/spec/` 的内容

但 `before-dev` 这类命令 / skill 的“注册安装”不属于远程 spec 模板链路，而属于平台配置链路。

可以拆成两条链来看：

```text
链路 A：远程模板
spec-first init --registry ...
  -> 下载 spec 模板
  -> 落盘到 .spec-first/spec/

链路 B：平台命令 / skill
spec-first init
  -> configurePlatform(...)
  -> 生成 .claude/.cursor/.agents/.codex/... 下的命令或 skill
```

这意味着：

- 你更新远程模板仓库，不会自动“重注册” `before-dev`
- 你只下载/更新 spec 内容，不等于自动新增平台命令
- `before-dev` 是否存在，取决于项目初始化时是否安装了对应平台配置

但另一面也要区分清楚：

```text
不会自动重注册 before-dev
!=
before-dev 读不到最新 spec
```

只要项目里已经存在 `before-dev`，它每次运行时仍会现读 `.spec-first/spec/`。

也就是说：

```text
注册 before-dev
  = init / update 阶段安装命令或 skill

消费最新 spec
  = 每次运行 before-dev 时重新读取 .spec-first/spec/
```

运行时行为大致是：

```text
执行 before-dev
   │
   ├─ python3 ./.spec-first/scripts/get_context.py --mode packages
   ├─ 找到相关 spec layer
   ├─ 读取 .spec-first/spec/<package>/<layer>/index.md
   └─ 再读取 index 里指向的具体 guideline 文件
```

因此，当你做的是“远程模板独立 Git 维护”时，真正会发生的是：

1. 未来 `init --registry ...` 拉到的新项目，会拿到新的 spec 初始内容
2. 已有项目如果手工更新了 `.spec-first/spec/`，现有 `before-dev` 下次运行会读到这些新内容
3. 但不会因为你改了模板仓库，就自动给项目新增一个以前没有的 `before-dev`

一个最实用的判断方式是：

```text
问题是“有没有这个命令 / skill”？
  -> 看平台是否已配置

问题是“这个命令 / skill 读不读最新 spec”？
  -> 读，只要 .spec-first/spec/ 已更新
```

---

## 10. 最终结论

“远程模板是否可以单独 Git 维护”的答案是：

```text
可以
而且当前实现已经支持
```

更准确地说，当前实现支持：

- 独立模板仓库 + marketplace 模式
- 独立模板仓库 + direct download 模式

如果是团队或公司场景，推荐采用：

```text
单独模板仓库
  + index.json
  + specs/*
  + skills/*
  + spec-first init --registry ...
```

这比把模板硬耦合在 CLI 主仓库里更清晰，也更适合长期治理。
