# Skill 同步脚本设计

这份文档描述第一步里的“同步层”应该怎么实现。

目标很简单：

- 从 ECC 源码目录同步 skill
- 自动更新本地 skill 镜像
- 自动更新 catalog 和 manifest
- 让后续的任务创建期解析始终基于最新 skill 资产

---

## 1. 同步脚本职责

同步脚本只负责四件事：

1. 扫描 ECC skill 源目录
2. 复制或更新本地 skill 镜像
3. 生成或更新 `skill-catalog.json`
4. 生成或更新 `skill-manifest.json`

它**不负责**：

- 任务选择
- 节点决策
- hook 注入
- agent 执行

---

## 2. 输入与输出

### 2.1 输入

建议输入：

- ECC skill 源目录
  - `/Users/kuang/xiaobu/everything-claude-code/skills`
- 本地目标目录
  - `.spec-first/skills/`
- manifest 输出目录
  - `.spec-first/config/`

### 2.2 输出

建议输出：

- `.spec-first/skills/<skill-name>/SKILL.md`
- `.spec-first/skills/<skill-name>/...` 其他辅助文件
- `.spec-first/config/skill-catalog.json`
- `.spec-first/config/skill-manifest.json`
- `.spec-first/config/skill-sync-report.json`

---

## 3. 扫描规则

### 3.1 识别 skill 目录

对于 ECC 源目录下的每个子目录：

- 如果存在 `SKILL.md`
- 认为它是一个 skill 资产

### 3.2 读取 frontmatter

优先读取：

- `name`
- `description`
- `origin`
- `tags`

如果缺失，可以从目录名和正文补一个最小默认值。

### 3.3 读取辅助文件

如果 skill 目录下有：

- `reference/`
- `examples/`
- `assets/`
- `agents/openai.yaml`

也一并同步。

---

## 4. 更新判断

同步脚本需要判断 skill 是否变化。

### 4.1 变化来源

以下情况都算变化：

- `SKILL.md` 内容变化
- frontmatter 变化
- 新增辅助文件
- 删除辅助文件
- 目录重命名

### 4.2 推荐判断方式

建议为每个 skill 记录：

- `content_hash`
- `frontmatter_hash`
- `file_count`

每次同步时重新计算，和上一次对比。

---

## 5. 生成 catalog

`skill-catalog.json` 只做目录级归类。

### 5.1 推荐分类维度

- `baseline`
- `capability`
- `language`
- `framework`
- `agent`
- `skill`

### 5.2 生成原则

catalog 不要做节点选择，只做：

- 资产分组
- 模块归属
- 可读描述

---

## 6. 生成 manifest

`skill-manifest.json` 负责单 skill 的初始分类。

### 6.1 推荐字段

- `id`
- `name`
- `path`
- `origin`
- `description`
- `activation_kind`
- `node_targets`
- `stack_targets`
- `explicit_only`
- `priority`
- `tags`
- `requires`
- `conflicts_with`
- `content_hash`
- `synced_at`

### 6.2 分类来源

分类可以来自三部分：

1. frontmatter
2. 文件正文关键词
3. 人工补正表

建议第一版先用“自动粗分 + 人工校正”。

---

## 7. 同步报告

建议输出一份同步报告：

```json
{
  "synced_at": "2026-03-27T10:00:00+08:00",
  "source_root": "/Users/kuang/xiaobu/everything-claude-code/skills",
  "added": ["tdd-workflow"],
  "updated": ["before-dev"],
  "removed": ["old-skill"],
  "unchanged": ["check-cross-layer"],
  "manifest_path": ".spec-first/config/skill-manifest.json",
  "catalog_path": ".spec-first/config/skill-catalog.json"
}
```

这个报告只做审计和观察，不参与执行。

---

## 8. 建议的同步命令

建议做成一个脚本，例如：

```bash
spec-first skills sync
```

可选参数：

- `--source <path>`
- `--target <path>`
- `--dry-run`
- `--json`

例子：

```bash
spec-first skills sync --source /Users/kuang/xiaobu/everything-claude-code/skills --dry-run
```

---

## 9. 设计原则

- 同步脚本只负责资产同步
- 不在同步阶段做任务决策
- 选择逻辑放在任务创建期
- 运行时只消费 `selected_skills`

---

## 10. 结论

同步脚本的最小正确职责是：

**把 ECC skill 资产同步到本地，顺便更新 catalog / manifest，让后续解析层始终基于最新资产。**

