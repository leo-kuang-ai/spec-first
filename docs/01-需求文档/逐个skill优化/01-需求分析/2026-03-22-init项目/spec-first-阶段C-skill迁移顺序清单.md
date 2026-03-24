# spec-first 阶段 C skill迁移顺序清单

文档日期：2026-03-22
所属阶段：阶段 C
阶段目标：在阶段 B 四个中枢打通后，按 skill 为单位逐个迁移、逐个生成、逐个验证

## 1. 阶段 C 的定位

阶段 C 不再处理“框架是否能跑”，而是处理：

```text
每个 skill 自己是否已经迁完
每个 skill 的模板、生成物、路径引用、文案、依赖是否已经闭环
```

这阶段必须遵守一条纪律：

```text
一次只迁一个 skill
一次只验证一个 skill
```

不能把所有 `SKILL.md.tmpl` 一次性改完再统一测。

## 2. 阶段 C 的前置条件

只有下面四个任务包都完成后，阶段 C 才应该开始：

1. [B1-setup-改造包.md](./B1-setup-%E6%94%B9%E9%80%A0%E5%8C%85.md)
2. [B2-gen-skill-docs-改造包.md](./B2-gen-skill-docs-%E6%94%B9%E9%80%A0%E5%8C%85.md)
3. [B4-bin-helper-改造包.md](./B4-bin-helper-%E6%94%B9%E9%80%A0%E5%8C%85.md)
4. [B3-browse-runtime-改造包.md](./B3-browse-runtime-%E6%94%B9%E9%80%A0%E5%8C%85.md)

否则 skill 迁移会反复返工。

## 3. 当前 skill 范围

当前已确认的 skill 集合如下：

- 根 `SKILL.md`
- `brainstorm`
- `plan-ceo-review`
- `plan-eng-review`
- `plan-design-review`
- `design-consultation`
- `review`
- `design-review`
- `qa`
- `qa-only`
- `ship`
- `document-release`
- `retro`
- `browse`
- `setup-browser-cookies`
- `setup-deploy`
- `canary`
- `benchmark`
- `codex`
- `careful`
- `freeze`
- `guard`
- `unfreeze`
- `investigate`
- `gstack-upgrade` 或未来的 `spec-first-upgrade`
- `land-and-deploy`

## 4. skill 分组原则

为了减少回滚成本，skill 不应该按字母顺序迁，而应按依赖结构迁。

推荐分成 5 组。

### G0：根层

- 根 `SKILL.md.tmpl`
- 根 `SKILL.md`

作用：

- 所有会话级公共前导、总说明、总路由、总品牌策略

迁移原因：

- 它是所有 skill 的共享上层语义

### G1：低耦合基础 skill

- `careful`
- `freeze`
- `guard`
- `unfreeze`

特点：

- 功能相对独立
- 路径依赖简单
- 易于先做一批低风险验证

### G2：规划与文档类 skill

- `brainstorm`
- `plan-ceo-review`
- `plan-eng-review`
- `plan-design-review`
- `design-consultation`
- `document-release`
- `retro`

特点：

- 主要依赖生成器注入的公共路径和命令
- 对 browse 页面交互依赖较弱
- 但其中一部分会依赖 `browse/bin` 资产或 `~/.spec-first/projects`
- 适合在基础主干稳定后分两批推进，而不是整体前置

### G3：评审与质量类 skill

- `review`
- `investigate`
- `codex`
- `ship`

特点：

- 常常依赖 `bin/*`
- 常常依赖 sidecar 资产
- 路径引用复杂度高于规划类

### G4：浏览器与部署重依赖 skill

- `browse`
- `qa`
- `qa-only`
- `design-review`
- `setup-browser-cookies`
- `setup-deploy`
- `canary`
- `benchmark`
- `land-and-deploy`

特点：

- 强依赖 browse runtime
- 强依赖 sidecar 目录
- 验证成本最高

### G5：升级与特殊迁移 skill

- `gstack-upgrade` / `spec-first-upgrade`

特点：

- 本身就涉及项目命名
- 与安装路径和版本检查强耦合
- 必须放在后面统一处理

## 5. 推荐迁移顺序

推荐的 skill 迁移顺序如下。

### 顺序 1：根层

1. 根 `SKILL.md.tmpl`
2. 根 `SKILL.md`

原因：

- 这是所有 skill 的共享父层
- 先收口这里，后面的 skill 更稳定

### 顺序 2：G1 基础安全 skill

1. `careful`
2. `freeze`
3. `guard`
4. `unfreeze`

原因：

- 风险低
- 验证快
- 可以先验证生成器、命名前缀和路径替换是否健康

### 顺序 3：G2a 轻依赖规划与文档类 skill

1. `brainstorm`
2. `design-consultation`
3. `document-release`
4. `retro`

原因：

- 这些 skill 主要验证“生成物 + 命令前缀 + 状态目录”的一致性
- 相比其他 planning skill，对 `browse/bin` 的直接依赖更少

### 顺序 4：G2b 带 `browse/bin` 或项目状态依赖的 planning skill

1. `plan-ceo-review`
2. `plan-eng-review`
3. `plan-design-review`

原因：

- 这些 skill 已直接依赖 `~/.claude/skills/gstack/browse/bin/...` 或 `~/.gstack/projects/...`
- 必须在 `browse/bin` 相关路径和 helper 更稳定后再处理

### 顺序 5：G3 评审与质量类 skill

1. `review`
2. `investigate`
3. `codex`
4. `ship`

原因：

- 这些 skill 更依赖 helper 命令和 sidecar
- 适合在前两组稳定后再处理

### 顺序 6：G4 浏览器与部署重依赖 skill

1. `browse`
2. `qa-only`
3. `qa`
4. `design-review`
5. `setup-browser-cookies`
6. `setup-deploy`
7. `canary`
8. `benchmark`
9. `land-and-deploy`

原因：

- 这是最复杂的一组
- 强依赖 browse runtime、assets、截图、日志和交互链路
- 应放到后面集中处理

### 顺序 7：G5 升级 skill

1. `gstack-upgrade` 或 `spec-first-upgrade`

原因：

- 这个 skill 的命名本身就是迁移对象
- 必须等安装路径、版本检查、helper 命令都稳定后再做最终决策

## 6. 每个 skill 的标准迁移步骤

阶段 C 每个 skill 都应走完全相同的 6 步。

### Step 1：改模板

改：

- `SKILL.md.tmpl`

检查：

- 品牌名
- helper 命令
- sidecar 路径
- 状态目录
- 特殊文件名

### Step 2：重新生成

重新生成：

- 本 skill 的 `SKILL.md`
- `.agents/skills/spec-first-*` 对应产物

### Step 3：做静态搜索

搜索本 skill 是否仍残留：

- `gstack`
- `.gstack`
- `~/.gstack`
- `.agents/skills/gstack`
- `gstack-`

说明：

- 兼容层残留单独标记，不算问题

### Step 4：做最小运行验证

至少验证：

- skill 文档可生成
- skill 引用的命令能找到
- skill 引用的 sidecar 路径能找到

### Step 5：做专项验证

根据 skill 类型做定向验证：

- 规划类：生成与文案路径
- 评审类：bin 命令与日志
- 浏览器类：browse runtime 与交互链路

### Step 6：记录完成状态

记录：

- 已完成 skill 名
- 遗留问题
- 是否存在兼容层依赖

## 7. 每组的验证策略

### G0/G1 验证策略

目标：

- 快速证明模板替换链路正常

验证重点：

- 生成物正确
- 命名前缀正确
- 基础路径正确

### G2 验证策略

目标：

- 证明非 browse 类 skill 已经能稳定迁移

验证重点：

- `spec-first-*` helper 命令
- `~/.spec-first` / `.spec-first` 路径
- 用户可见文案

### G3 验证策略

目标：

- 证明 sidecar、review 资产、日志和 helper 链路正确

验证重点：

- `bin/*`
- `review/*`
- `qa/*`
- `.agents/skills/spec-first`

### G4 验证策略

目标：

- 证明 browse runtime 真正闭环

验证重点：

- `.spec-first/browse.json`
- `.spec-first/browse-*.log`
- 截图
- cookie
- handoff / resume
- QA 类命令路径

### G5 验证策略

目标：

- 证明升级路径和版本检测路径已经切换到 `spec-first`

验证重点：

- update-check
- 版本缓存
- upgrade skill 路径

## 8. 当前最合理的阶段 C 推进方式

建议推进节奏如下：

### 第一轮

- 根层
- G1 基础安全 skill

目标：

- 先用低风险 skill 验证迁移主干健康

### 第二轮

- G2 规划与文档类

目标：

- 批量拿下“轻依赖 skill”

### 第三轮

- G3 评审与质量类

目标：

- 打通 helper / sidecar / 日志引用

### 第四轮

- G4 浏览器与部署重依赖 skill

目标：

- 打通最复杂的实际运行链路

### 第五轮

- G5 升级 skill

目标：

- 完成品牌闭环的最后一环

## 9. 何时可以认为阶段 C 完成

阶段 C 只有在下面全部成立时，才算真正完成：

1. 所有 skill 模板已迁移
2. 所有 skill 生成物已重新生成
3. 所有 skill 已逐个验证
4. skill 级别未受控的 `gstack` 残留已清理
5. 只剩明确标注的兼容层旧名

## 10. 下一步建议

如果继续往下走，最有价值的文档不是再扩总表，而是开始为阶段 C 第一批 skill 写具体执行包。

推荐顺序：

1. `G0-根SKILL-迁移包`
2. `G1-基础安全skill迁移包`

因为这两组最适合先拿来验证“逐个 skill 迁移、逐个验证”的方法论本身是否成立。
