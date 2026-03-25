# Skill 文档改造详细方案

> 适用工程：`/Users/kuang/Desktop/ops/spec-first`
>
> 本文档服务于 [spec-first 完整重构方案](./2026-03-25-spec-first-完整重构方案.md)
>
> 专门处理各平台 Skill 文档内容的改造

## 1. 问题定义

### 1.1 Skill 文档是什么

Skill 文档是各 AI 平台的命令定义文件，通常为 Markdown 格式，包含：

- 命令说明
- 使用示例
- 脚本路径引用
- 工作流说明
- 品牌名称

### 1.2 为什么需要单独处理

虽然 Skill 文件路径已在重构范围内（模块 D/E/G），但**文档内容**的改造规则需要明确化：

- 文件数量多（11 个平台 × 平均 10+ 个 skill）
- 内容格式不统一
- 容易遗漏细节
- 需要批量处理

---

## 2. 影响范围

### 2.1 模板源中的 Skill 文档

```text
packages/cli/src/templates/
├── claude/commands/spec/*.md
├── cursor/spec-*.md
├── iflow/commands/spec/*.md
├── opencode/commands/spec/*.md
├── codex/commands/spec/*.md
├── kilo/workflows/spec-*.yaml
├── kiro/commands/spec/*.md
├── gemini/commands/spec/*.md
├── antigravity/workflows/spec-*.yaml
├── qoder/commands/spec/*.md
└── codebuddy/commands/spec/*.md
```

**估算**: 约 100-150 个文件

### 2.2 项目根 Dogfooding 副本

```text
.claude/commands/spec/*.md
.cursor/spec-*.md
.opencode/commands/spec/*.md
.codex/commands/spec/*.md
```

**估算**: 约 40-60 个文件

### 2.3 Marketplace Skills

```text
marketplace/skills/*/SKILL.md
marketplace/skills/*/commands/*.md
```

**估算**: 约 20-30 个文件

**总计**: 约 160-240 个 Skill 文档需要更新

---

## 3. 改造规则

### 3.1 路径引用替换

| 旧值 | 新值 |
| ---- | ---- |
| `.spec-first/` | `.spec-first/` |
| `@/.spec-first/` | `@/.spec-first/` |
| `python3 ./.spec-first/scripts/` | `python3 ./.spec-first/scripts/` |
| `.spec-first/spec/` | `.spec-first/spec/` |
| `.spec-first/tasks/` | `.spec-first/tasks/` |
| `.spec-first/workspace/` | `.spec-first/workspace/` |

### 3.2 命令示例替换

| 旧值 | 新值 |
| ---- | ---- |
| `spec init` | `spec-first init` |
| `spec update` | `spec-first update` |
| `npm install -g @leokuang/spec-first` | `npm install -g @leokuang/spec-first` |
| `pnpm add @leokuang/spec-first` | `pnpm add @leokuang/spec-first` |

### 3.3 Slash 命令替换

| 旧值 | 新值 |
| ---- | ---- |
| `/spec:start` | `/spec:start` |
| `/spec:brainstorm` | `/spec:brainstorm` |
| `/spec:check` | `/spec:check` |
| `/spec:finish-work` | `/spec:finish-work` |
| `/spec:record-session` | `/spec:record-session` |
| `/spec:*` | `/spec:*` |

### 3.4 品牌名称替换

| 旧值 | 新值 | 上下文 |
| ---- | ---- | ------ |
| `spec-first workflow` | `spec-first workflow` | 通用 |
| `spec-first Instructions` | `spec-first Instructions` | 文档标题 |
| `spec-first project` | `spec-first project` | 通用 |
| `spec-first CLI` | `spec-first CLI` | 通用 |
| `spec-first framework` | `spec-first framework` | 通用 |

**注意**: 不替换以下情况:

- 历史记录中的 `spec-first`（如 "migrated from spec-first"）
- 代码注释中的考古说明
- 明确标记为 `legacy-spec` 的内容

### 3.5 文档链接替换

| 旧值 | 新值 |
| ---- | ---- |
| `docs.trytrellis.app` | 新文档地址（待定） |
| `github.com/sunrain520/spec-first` | `github.com/sunrain520/spec-first` |
| `@leokuang/spec-first` | `@leokuang/spec-first` |

---

## 4. 批量处理脚本

### 4.1 主处理脚本

```bash
#!/bin/bash
# scripts/refactor-skill-docs.sh

set -e

echo "🔄 开始批量更新 Skill 文档..."

# 定义需要处理的目录
TEMPLATE_DIRS=(
  "packages/cli/src/templates/claude/commands/spec"
  "packages/cli/src/templates/cursor"
  "packages/cli/src/templates/iflow/commands/spec"
  "packages/cli/src/templates/opencode/commands/spec"
  "packages/cli/src/templates/codex/commands/spec"
  "packages/cli/src/templates/kilo/workflows"
  "packages/cli/src/templates/kiro/commands/spec"
  "packages/cli/src/templates/gemini/commands/spec"
  "packages/cli/src/templates/antigravity/workflows"
  "packages/cli/src/templates/qoder/commands/spec"
  "packages/cli/src/templates/codebuddy/commands/spec"
)

DOGFOODING_DIRS=(
  ".claude/commands/spec"
  ".cursor"
  ".opencode/commands/spec"
  ".codex/commands/spec"
)

MARKETPLACE_DIRS=(
  "marketplace/skills"
)

# 合并所有目录
ALL_DIRS=("${TEMPLATE_DIRS[@]}" "${DOGFOODING_DIRS[@]}" "${MARKETPLACE_DIRS[@]}")

# 统计信息
TOTAL_FILES=0
UPDATED_FILES=0

# 处理每个目录
for dir in "${ALL_DIRS[@]}"; do
  if [ ! -d "$dir" ]; then
    echo "⚠️  跳过不存在的目录: $dir"
    continue
  fi

  echo "📁 处理目录: $dir"

  # 查找所有 .md 和 .yaml 文件
  while IFS= read -r -d '' file; do
    TOTAL_FILES=$((TOTAL_FILES + 1))

    # 备份原文件
    cp "$file" "$file.bak"

    # 执行替换
    sed -i '' \
      -e 's/\.spec\//\.spec-first\//g' \
      -e 's/@\/\.spec\//@\/\.spec-first\//g' \
      -e 's/python3 \.\/\.spec\/scripts\//python3 \.\/\.spec-first\/scripts\//g' \
      -e 's/spec init/spec-first init/g' \
      -e 's/spec update/spec-first update/g' \
      -e 's/@mindfoldhq\/spec/@leokuang\/spec-first/g' \
      -e 's/\/spec:/\/spec:/g' \
      -e 's/spec-first workflow/spec-first workflow/g' \
      -e 's/spec-first Instructions/spec-first Instructions/g' \
      -e 's/spec-first project/spec-first project/g' \
      -e 's/spec-first CLI/spec-first CLI/g' \
      -e 's/spec-first framework/spec-first framework/g' \
      "$file"

    # 检查是否有变化
    if ! diff -q "$file" "$file.bak" > /dev/null 2>&1; then
      UPDATED_FILES=$((UPDATED_FILES + 1))
      echo "  ✅ 已更新: $(basename "$file")"
      rm "$file.bak"
    else
      echo "  ⏭️  无需更新: $(basename "$file")"
      mv "$file.bak" "$file"
    fi

  done < <(find "$dir" -type f \( -name "*.md" -o -name "*.yaml" \) -print0)
done

echo ""
echo "📊 统计信息:"
echo "  总文件数: $TOTAL_FILES"
echo "  已更新: $UPDATED_FILES"
echo "  未变化: $((TOTAL_FILES - UPDATED_FILES))"
echo ""
echo "✅ Skill 文档批量更新完成"
```

### 4.2 验证脚本

```bash
#!/bin/bash
# scripts/validate-skill-docs.sh

set -e

echo "🔍 验证 Skill 文档..."

# 定义需要检查的目录
CHECK_DIRS=(
  "packages/cli/src/templates"
  ".claude"
  ".cursor"
  ".opencode"
  ".codex"
  "marketplace/skills"
)

# 定义不应该出现的旧模式
LEGACY_PATTERNS=(
  "\.spec-first/"
  "@/\.spec-first/"
  "spec init"
  "spec update"
  "@leokuang/spec-first"
  "/spec:"
  "spec-first workflow"
  "spec-first Instructions"
  "spec-first project"
  "spec-first CLI"
)

# 允许的例外模式（用于历史说明）
ALLOWED_PATTERNS=(
  "legacy-spec"
  "migrated from spec-first"
  "formerly spec-first"
)

FOUND_ISSUES=0

for dir in "${CHECK_DIRS[@]}"; do
  if [ ! -d "$dir" ]; then
    continue
  fi

  echo "📁 检查目录: $dir"

  for pattern in "${LEGACY_PATTERNS[@]}"; do
    # 搜索旧模式
    matches=$(grep -r "$pattern" "$dir" \
      --include="*.md" \
      --include="*.yaml" \
      2>/dev/null || true)

    if [ -n "$matches" ]; then
      # 检查是否是允许的例外
      is_allowed=false
      for allowed in "${ALLOWED_PATTERNS[@]}"; do
        if echo "$matches" | grep -q "$allowed"; then
          is_allowed=true
          break
        fi
      done

      if [ "$is_allowed" = false ]; then
        echo "  ❌ 发现旧模式: $pattern"
        echo "$matches" | head -3
        FOUND_ISSUES=$((FOUND_ISSUES + 1))
      fi
    fi
  done
done

echo ""
if [ $FOUND_ISSUES -eq 0 ]; then
  echo "✅ Skill 文档验证通过"
  exit 0
else
  echo "❌ 发现 $FOUND_ISSUES 个问题"
  exit 1
fi
```

### 4.3 差异预览脚本

```bash
#!/bin/bash
# scripts/preview-skill-changes.sh

SAMPLE_FILE=$1

if [ -z "$SAMPLE_FILE" ]; then
  echo "用法: ./preview-skill-changes.sh <skill-file.md>"
  exit 1
fi

if [ ! -f "$SAMPLE_FILE" ]; then
  echo "❌ 文件不存在: $SAMPLE_FILE"
  exit 1
fi

# 创建临时副本
TEMP_FILE=$(mktemp)
cp "$SAMPLE_FILE" "$TEMP_FILE"

# 应用替换
sed -i '' \
  -e 's/\.spec\//\.spec-first\//g' \
  -e 's/spec init/spec-first init/g' \
  -e 's/\/spec:/\/spec:/g' \
  "$TEMP_FILE"

# 显示差异
echo "📝 预览变更: $SAMPLE_FILE"
echo ""
diff -u "$SAMPLE_FILE" "$TEMP_FILE" || true

rm "$TEMP_FILE"
```

---

## 5. 执行流程

### 5.1 执行前检查

```bash
# 1. 确认当前在正确的目录
pwd  # 应该是 /Users/kuang/Desktop/ops/spec-first

# 2. 确认脚本可执行
chmod +x scripts/refactor-skill-docs.sh
chmod +x scripts/validate-skill-docs.sh
chmod +x scripts/preview-skill-changes.sh

# 3. 预览单个文件的变更
./scripts/preview-skill-changes.sh .claude/commands/spec/start.md

# 4. 创建快照
cp -R /Users/kuang/Desktop/ops/spec-first \
  /Users/kuang/Desktop/ops/spec-first.backup.pre-skill-refactor.$(date +%Y%m%d-%H%M%S)
```

### 5.2 执行改造

```bash
# 执行批量更新
./scripts/refactor-skill-docs.sh
```

### 5.3 验证结果

```bash
# 1. 运行验证脚本
./scripts/validate-skill-docs.sh

# 2. 手工抽查
git diff .claude/commands/spec/start.md
git diff packages/cli/src/templates/claude/commands/spec/check.md

# 3. 搜索残留
grep -r "\.spec-first/" .claude/ .cursor/ --include="*.md"
grep -r "/spec:" packages/cli/src/templates/ --include="*.md"
```

---

## 6. 特殊情况处理

### 6.1 YAML 文件中的路径

**Kilo / Antigravity 平台使用 YAML 格式**:

```yaml
# 旧
workflow:
  scripts:
    - python3 ./.spec-first/scripts/task.py

# 新
workflow:
  scripts:
    - python3 ./.spec-first/scripts/task.py
```

**处理**: 已包含在主脚本中（`-name "*.yaml"`）

### 6.2 代码块中的示例

**Markdown 代码块中的命令示例**:

````markdown
<!-- 旧 -->
```bash
spec init
python3 ./.spec-first/scripts/task.py list
```

<!-- 新 -->
```bash
spec-first init
python3 ./.spec-first/scripts/task.py list
```
````

**处理**: sed 会处理所有行，包括代码块

### 6.3 表格中的命令

**Markdown 表格中的命令**:

```markdown
<!-- 旧 -->
| 命令 | 说明 |
|------|------|
| spec init | 初始化 |

<!-- 新 -->
| 命令 | 说明 |
|------|------|
| spec-first init | 初始化 |
```

**处理**: sed 会处理所有行，包括表格

### 6.4 历史说明保留

**需要保留的历史说明**:

```markdown
<!-- 正确 - 保留 -->
This project was migrated from spec-first to spec-first.

<!-- 正确 - 保留 -->
See legacy-spec documentation for historical context.
```

**处理**: 验证脚本中已添加例外规则

---

## 7. 平台特定注意事项

### 7.1 Claude 平台

**目录结构**:
```
.claude/commands/spec/
├── start.md
├── brainstorm.md
├── check.md
└── finish-work.md
```

**特点**: 支持子目录，命令前缀为 `/spec:`

### 7.2 Cursor 平台

**目录结构**:
```
.cursor/
├── spec-start.md
├── spec-brainstorm.md
├── spec-check.md
└── spec-finish-work.md
```

**特点**: 不支持子目录，使用 `spec-` 前缀

### 7.3 Kilo / Antigravity 平台

**文件格式**: YAML

**特点**: workflow 定义，需要同时更新 YAML 中的脚本路径

### 7.4 Marketplace Skills

**位置**: `marketplace/skills/*/SKILL.md`

**特点**:
- 包含安装说明
- 包含使用示例
- 可能引用外部文档链接

---

## 8. 验收标准

### 8.1 自动化验收

```bash
# 1. 验证脚本通过
./scripts/validate-skill-docs.sh
# 预期: ✅ Skill 文档验证通过

# 2. 无旧品牌残留
grep -r "\.spec-first/" packages/cli/src/templates/ --include="*.md" | wc -l
# 预期: 0

grep -r "/spec:" .claude/ .cursor/ --include="*.md" | wc -l
# 预期: 0

# 3. 新品牌已生效
grep -r "\.spec-first/" packages/cli/src/templates/ --include="*.md" | wc -l
# 预期: > 0

grep -r "/spec:" .claude/ .cursor/ --include="*.md" | wc -l
# 预期: > 0
```

### 8.2 手工验收

**抽查清单**:

- [ ] Claude: `.claude/commands/spec/start.md`
- [ ] Cursor: `.cursor/spec-start.md`
- [ ] OpenCode: `.opencode/commands/spec/start.md`
- [ ] Codex: `.codex/commands/spec/start.md`
- [ ] Marketplace: `marketplace/skills/spec-meta/SKILL.md`

**检查项**:
- [ ] 路径引用已更新
- [ ] 命令示例已更新
- [ ] Slash 命令已更新
- [ ] 品牌名称已更新
- [ ] 代码块中的示例已更新

---

## 9. 回滚方案

### 9.1 快速回滚

```bash
# 如果批量更新失败，立即回滚
mv /Users/kuang/Desktop/ops/spec-first \
   /Users/kuang/Desktop/ops/spec-first.failed.$(date +%Y%m%d-%H%M%S)

cp -R /Users/kuang/Desktop/ops/spec-first.backup.pre-skill-refactor.* \
   /Users/kuang/Desktop/ops/spec-first
```

### 9.2 局部回滚

```bash
# 如果只有某个平台出错，可以局部回滚
git checkout -- .claude/commands/spec/
# 或
git checkout -- packages/cli/src/templates/claude/
```

---

## 10. 集成到主重构流程

### 10.1 在模块 D 中的位置

Skill 文档改造应该在**模块 D 的最后一步**执行：

```
模块 D 执行顺序:
1. 更新 types/ai-tools.ts
2. 更新 configurators/*.ts
3. 重命名平台模板目录
4. 更新 Skill 文档内容 ← 这一步
```

### 10.2 依赖关系

**前置依赖**:
- 模块 A (品牌常量) 已完成
- 模块 C (模板源重命名) 已完成

**后续依赖**:
- 模块 E (Dogfooding) 会同步这些更新
- 模块 H (测试) 会验证这些更新

---

## 11. 常见问题

### Q1: 如果某个 skill 文件很特殊，不适合批量替换怎么办？

**A**: 在批量替换前，先手工处理特殊文件，然后在批量脚本中排除它：

```bash
# 在脚本中添加排除规则
find "$dir" -type f -name "*.md" \
  ! -name "special-skill.md" \
  -print0
```

### Q2: 如果替换后发现某些地方不应该替换怎么办？

**A**:
1. 立即回滚到快照
2. 在脚本中添加更精确的匹配规则
3. 或者先批量替换，再手工修正少数例外

### Q3: Marketplace 中的 skill 是否需要更新？

**A**: 是的，但要注意：
- 如果 skill 是第三方贡献的，可能需要通知作者
- 如果 skill 是官方的，必须更新
- 建议在 marketplace/README.md 中说明迁移情况

### Q4: 如何确保没有遗漏？

**A**: 使用三重验证：
1. 自动化验证脚本
2. 手工抽查关键文件
3. CI 中的残留扫描

---

## 12. 时间估算

| 任务 | 时间 |
|------|------|
| 准备脚本 | 0.5 小时 |
| 执行批量更新 | 0.5 小时 |
| 验证结果 | 1 小时 |
| 修正问题 | 0.5 小时 |
| **总计** | **2.5 小时** |

---

## 13. 检查清单

### 执行前

- [ ] 已创建快照
- [ ] 脚本已准备并测试
- [ ] 已预览单个文件的变更
- [ ] 已确认磁盘空间充足

### 执行中

- [ ] 批量更新脚本执行成功
- [ ] 统计信息合理（更新文件数 > 0）
- [ ] 无错误信息

### 执行后

- [ ] 验证脚本通过
- [ ] 手工抽查通过
- [ ] 残留搜索结果为 0
- [ ] 新品牌已生效

---

## 14. 总结

Skill 文档改造是重构中的重要环节，虽然文件数量多，但通过：

1. **明确的改造规则**
2. **自动化批量处理**
3. **严格的验证机制**
4. **完善的回滚方案**

可以确保改造的完整性和正确性。

**关键原则**: 批量处理 + 自动验证 + 手工抽查
