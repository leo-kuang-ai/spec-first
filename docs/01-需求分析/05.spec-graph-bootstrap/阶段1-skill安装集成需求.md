# `spec-graph-bootstrap` 阶段 1：skill 安装集成需求

> 本文是 `spec-graph-bootstrap` 的阶段 1 需求文档。
>
> 本文只定义“如何把新 skill 装进当前系统并与旧入口并行存在”，不定义事实抽取、文档生成或消费细节。
>
> 如与 [修订终版.md](./修订终版.md) 冲突，以总版为准。
>
> 本文中的“阶段 1”指实施推进阶段，不等同于 skill 执行过程中的 `Phase 0` 到 `Phase 4`。

## 1. 目标

阶段 1 的目标是让 `spec-graph-bootstrap` 成为一个可被 `spec-first init` 安装、可被宿主发现、可被用户显式调用的新 Stage-0 skill，同时不破坏当前 `spec-graph-bootstrap` 的使用路径。

阶段 1 完成后，系统应具备以下状态：

* `spec-graph-bootstrap` 继续可用，行为不变
* `spec-graph-bootstrap` 作为新 skill 并行存在
* Claude Code 与 Codex 都能安装到对应 runtime 目录
* 用户可以显式调用新入口进行测试与验证
* 文档体系能说明双入口并行期的定位和使用边界

## 2. 范围

本阶段包含：

* 新增 `skills/spec-graph-bootstrap/` 及其基础引用资产
* 新增 `graph-bootstrap` 命令入口与对应模板
* 更新插件清单与 runtime 安装路径，使 `spec-first init` 能同步该 skill
* 更新 README / 用户手册 / 使用说明，明确双入口并行期
* 新增 smoke / install 级别测试，证明安装与发现链路有效

本阶段不包含：

* 事实层抽取逻辑
* 新文档产物的正式生成逻辑
* `plan / work / review` 的消费接入
* rerun / refresh / 指纹失效逻辑

## 3. 关键决策

### 3.1 双入口并行

第一版先固定产品层语义，再分别映射到不同宿主。

产品层统一保留两条 workflow 语义：

* 旧 workflow：`spec-graph-bootstrap`
* 新 workflow：`spec-graph-bootstrap`

Claude 宿主上的显式入口：

* Claude：`spec-graph-bootstrap`
* Claude：`spec-graph-bootstrap`

Codex 宿主上的实现边界：

* Canonical 身份以安装到 `.agents/skills/` 的 skill 名称为准
* `.codex/commands/spec/` 中的命令文件属于 `spec-first` 提供的兼容层
* 结合当前 adapter 实现，阶段 1 中 Codex command 兼容入口会随 `spec-first init --codex` 自动安装，无需为此新增特殊 flag 或分支
* 需求文档不得把该兼容层误写为 Codex 平台天然特性
* v1 对 Codex 的正式可用性承诺，以 `.agents/skills/spec-graph-bootstrap/` 已被宿主发现为准；`.codex/commands/spec/graph-bootstrap.md` 仅用于 `spec-first` 兼容层验证，不作为 Codex 平台原生能力承诺

原则：

* 旧入口继续指向 `spec-graph-bootstrap`
* 新入口指向 `spec-graph-bootstrap`
* 第一阶段不做入口替换，不让新入口覆盖旧入口

### 3.1.1 平台差异约束

阶段 1 必须显式区分以下两类内容：

* 产品统一契约：
  * workflow 名称
  * 产物目录
  * 控制面目录
* 平台实现契约：
  * Claude 使用 `CLAUDE.md`、`.claude/commands/spec/`、`.claude/skills/`
  * Codex 使用 `AGENTS.md`、`.agents/skills/`，并由当前 adapter 同步生成 `.codex/commands/spec/` 兼容层

任何平台特有实现都不得倒灌回产品统一契约。

### 3.2 路径兼容优先

虽然新增了新 skill，但它的目标仍然是复用现有 Stage-0 的产物根目录和控制面根目录。

因此阶段 1 的文档、模板和说明必须提前统一以下路径约定：

* 长期产物目录：`docs/contexts/<slug>/`
* 控制面目录：`.context/spec-first/bootstrap/<slug>/`

第一阶段不引入新的平行根目录，例如：

* `.context/spec-first/graph-bootstrap/`
* `docs/graph-contexts/`

## 4. 输入

本阶段实现依赖以下现有系统资产：

* `.claude-plugin/plugin.json`
* `templates/claude/commands/spec/*.md`
* 同一份 command 源模板经 Claude / Codex adapter 映射到不同 runtime 的生成规则
* `skills/spec-graph-bootstrap/`
* `src/cli/plugin.js`
* `src/cli/commands/init.js`
* Claude / Codex adapter 的 runtime 路径规则

## 5. 输出

阶段 1 的交付物包括：

* 新的 skill 目录：`skills/spec-graph-bootstrap/`
* 新的 command 源模板：`templates/claude/commands/spec/graph-bootstrap.md`
* 更新后的插件清单：新增 `graph-bootstrap` command 定义
* 安装后 runtime 产物：
  * Claude：`.claude/skills/spec-graph-bootstrap/`、`.claude/commands/spec/graph-bootstrap.md`
  * Codex：`.agents/skills/spec-graph-bootstrap/`
  * Codex 兼容层：`.codex/commands/spec/graph-bootstrap.md`，由同一 command 源模板经 adapter 生成，不新增独立 Codex 源模板
* 相关文档更新：README / 用户手册 / 版本说明

## 6. 关键设计约束

### 6.1 不破坏旧入口

阶段 1 的所有变更都不得改变以下事实：

* 旧 Stage-0 bootstrap workflow 仍是当前默认 Stage-0 能力入口
* 现有 smoke / integration 流程仍应能通过
* 旧 Stage-0 bootstrap skill 的安装与调用不受新 skill 影响

### 6.2 `init` 必须保持幂等

重复执行 `spec-first init --claude` 或 `spec-first init --codex` 时：

* 不得生成重复的 command 文件
* 不得生成重复的 skill 目录
* 不得因为新增 `graph-bootstrap` 而破坏已有 managed assets 清理逻辑

### 6.3 命名必须稳定

第一阶段应固定以下命名：

* skill 名称：`spec-graph-bootstrap`
* command 名称：`graph-bootstrap`
* workflow 语义名称：
  * 旧：`spec-graph-bootstrap`
  * 新：`spec-graph-bootstrap`
* Claude 对外显式入口：
  * `spec-graph-bootstrap`

Codex 侧约束：

* canonical 标识以 `.agents/skills/spec-graph-bootstrap/` 为准
* `.codex/commands/spec/graph-bootstrap.md` 在当前实现中会自动生成；该入口属于兼容层，不应写成平台天然入口
* `.codex/commands/spec/graph-bootstrap.md` 必须由同一份 command 源模板经 adapter 映射生成，不允许再维护一份独立 Codex command 源模板
* Codex 侧“功能已上线”的判定标准，不是“目录已写入”，而是“skill 已安装且存在宿主已发现的可观测证据”
* 可观测证据至少应满足以下二选一：
  * 宿主重启后，能在 Codex 的 skill 可用列表或等价 discovery 结果中看到 `spec-graph-bootstrap`
  * 宿主重启后，通过一次最小探测调用可证明 `spec-graph-bootstrap` 已被加载
* 上述 discovery 证据属于宿主级人工验收，实施时必须记录实际采用的验证步骤，不预设固定命令名
* 兼容命令入口可调用只属于兼容性验收，不属于平台正式契约本体

后续阶段不应再次改名，否则会增加迁移噪音。

## 7. 执行流程

### 7.1 入口接入

1. 在插件清单中新增 `graph-bootstrap` command 定义
2. 提供对应 command 源模板
3. 在模板中将 `spec-graph-bootstrap` skill 设为 source of truth
4. 通过 adapter 将同一份源模板分别映射为 Claude command runtime 产物与 Codex 兼容 command runtime 产物

### 7.2 runtime 安装接入

1. 创建 `skills/spec-graph-bootstrap/` 后，由 `listBundledSkills()` 自动枚举，使新 skill 进入安装清单
2. 在 `.claude-plugin/plugin.json` 的 `commands[]` 中新增 `graph-bootstrap` 条目后，由 `listBundledCommands()` 读取，使新 command 进入安装清单
3. 通过现有 adapter 规则把资产同步到 Claude / Codex runtime 目录

### 7.3 文档接入

1. README 中补充双入口并行期说明
2. 用户手册中说明何时使用旧入口、何时测试新入口
3. 明确对外预期：新入口是验证用入口，不是默认入口
4. 本阶段只更新并行期说明，不提前做最终切换后的文档收敛

README / 用户手册的最小文案 contract：

* 必须明确：旧入口 `spec-graph-bootstrap` 仍是默认稳定入口
* 必须明确：新入口 `spec-graph-bootstrap` 仅用于并行验证
* 必须明确：阶段 1 不发生默认入口切换
* 不得写成“已完成迁移到 `spec-graph-bootstrap`”

## 8. 验收标准

### 8.1 安装验收

执行 `spec-first init --claude` 后：

* `.claude/skills/spec-graph-bootstrap/SKILL.md` 存在
* `.claude/commands/spec/graph-bootstrap.md` 存在
* 旧的 `.claude/skills/spec-graph-bootstrap/SKILL.md` 和 `.claude/commands/spec/graph-bootstrap.md` 仍存在

执行 `spec-first init --codex` 后：

* `.agents/skills/spec-graph-bootstrap/SKILL.md` 存在
* `.codex/commands/spec/graph-bootstrap.md` 存在
* 旧的 `.agents/skills/spec-graph-bootstrap/SKILL.md` 仍存在
* `.codex/commands/spec/graph-bootstrap.md` 仍存在

### 8.2 行为验收

* 新旧 workflow 入口同时存在且不互相覆盖
* `init` 重复执行不产生脏状态
* CLI 的 managed asset 清理逻辑不会误删新入口
* `spec-first doctor` 或等价检查能证明新 command / skill 已进入 managed assets 集合
* Claude 宿主重启后，新入口至少能完成一次最小调用，证明宿主已识别该入口
* Codex 宿主重启后，除目录存在外，还必须满足以下任一条件，才可判定“已被发现”：
  * 在 Codex 的 skill 可用列表或等价 discovery 结果中出现 `spec-graph-bootstrap`
  * 通过一次最小探测调用可证明 `spec-graph-bootstrap` 已被宿主加载
* Codex discovery 验收属于宿主级人工确认；实施记录中必须写明实际采用的是 skill 列表、等价 discovery 结果，还是最小探测调用
* 再额外验证兼容入口可调用；该项只属于兼容层验收，不作为 Codex 平台原生入口承诺

### 8.3 文档验收

* README 中明确说明双入口并行期
* 阶段边界说明清晰，不把新入口误写成默认正式入口
* README / 用户手册同时满足以下最小文案 contract：
  * 旧入口 `spec-graph-bootstrap` 仍是默认稳定入口
  * 新入口 `spec-graph-bootstrap` 仅用于并行验证
  * 阶段 1 不发生默认入口切换

### 8.4 失败判定

出现以下任一情况，阶段 1 不得判定为通过：

* 仅目录存在，但 Codex 不存在 discovery 结果或最小探测调用证据
* 新入口安装成功，但旧入口 runtime 资产缺失
* 新旧入口互相覆盖，或 managed asset 清理逻辑误删任一入口
* README / 用户手册把新入口写成默认正式入口，或误写为“已完成迁移”

## 9. 与其他阶段的关系

* 阶段 1 是阶段 2、3、4 的前置条件
* 阶段 1 完成后，才能在真实 runtime 中测试新 skill 的执行结果
* 阶段 1 不要求证明新 skill 的内容质量，只要求证明它能被安装、发现和调用
