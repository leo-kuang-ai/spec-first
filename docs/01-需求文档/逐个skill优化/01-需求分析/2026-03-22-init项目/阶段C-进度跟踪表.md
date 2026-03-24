# 阶段 C 进度跟踪表

更新时间：2026-03-22
总目标：迁移约 25 个 skill，逐个验证

---

## 进度总览

```
C0: 根层 + 基础安全（6 个） - 🔄 进行中
C1: 轻依赖规划与文档（4 个） - ⏳ 待开始
C2: 带 browse/bin 依赖的 planning（3 个） - ⏳ 待开始
C3: 评审与质量（4 个） - ⏳ 待开始
C4: 浏览器与部署重依赖（9 个） - ⏳ 待开始
C5: 升级与特殊迁移（1 个） - ⏳ 待开始
```

---

## C0：根层 + 基础安全（6 个）

### 1. 根 SKILL.md

**状态：** ✅ 已完成

**6 步验证：**
- [x] Step 1：改模板（SKILL.md.tmpl 已改为 spec-first）
- [x] Step 2：重新生成（SKILL.md 已生成）
- [x] Step 3：静态搜索（无 gstack 残留）
- [x] Step 4：最小运行验证（路径和命令正确）
- [x] Step 5：专项验证（品牌名、路径、命令一致）
- [x] Step 6：记录完成状态

**遗留问题：** 无

---

### 2. careful

**状态：** ✅ 已完成

**6 步验证：**
- [x] Step 1：改模板（已改为 spec-first）
- [x] Step 2：重新生成（SKILL.md 已生成）
- [x] Step 3：静态搜索（无 gstack 残留）
- [x] Step 4：最小运行验证（路径和命令正确）
- [x] Step 5：专项验证（状态目录使用 ~/.spec-first/analytics）
- [x] Step 6：记录完成状态

**遗留问题：** 无

---

### 3. freeze

**状态：** ✅ 已完成

**6 步验证：**
- [x] Step 1：改模板（已改为 spec-first）
- [x] Step 2：重新生成（SKILL.md 已生成）
- [x] Step 3：静态搜索（无 gstack 残留）
- [x] Step 4：最小运行验证（路径和命令正确）
- [x] Step 5：专项验证（状态目录使用 ~/.spec-first）
- [x] Step 6：记录完成状态

**遗留问题：** 无

---

### 4. guard

**状态：** ✅ 已完成

**6 步验证：**
- [x] Step 1：改模板（已改为 spec-first）
- [x] Step 2：重新生成（SKILL.md 已生成）
- [x] Step 3：静态搜索（无 gstack 残留）
- [x] Step 4：最小运行验证（路径和命令正确）
- [x] Step 5：专项验证（状态目录使用 ~/.spec-first，引用 careful 和 freeze）
- [x] Step 6：记录完成状态

**遗留问题：** 无

---

### 5. unfreeze

**状态：** ✅ 已完成

**6 步验证：**
- [x] Step 1：改模板（已改为 spec-first）
- [x] Step 2：重新生成（SKILL.md 已生成）
- [x] Step 3：静态搜索（无 gstack 残留）
- [x] Step 4：最小运行验证（路径和命令正确）
- [x] Step 5：专项验证（状态目录使用 ~/.spec-first）
- [x] Step 6：记录完成状态

**遗留问题：** 无

---

### 6. .agents/skills/ 目录清理

**状态：** ✅ 已完成

**任务：**
- [x] 删除所有旧的 gstack-* 目录
- [x] 验证新的 spec-first-* 目录功能正常

**当前状态：**
- 新目录：24 个 spec-first-* 目录已创建
- 旧目录：所有 gstack-* 目录已清理

---

## C1：轻依赖规划与文档（4 个）

### 1. brainstorm

**状态：** ⚠️ 有严重残留问题（P0）

**6 步验证：**
- [ ] Step 1：改模板（⚠️ 仍有 gstack-slug 和 ~/.gstack/projects 残留）
- [ ] Step 2：重新生成（⚠️ SKILL.md 中有残留）
- [ ] Step 3：静态搜索（⚠️ 发现 20+ 处 gstack 残留）
- [ ] Step 4：最小运行验证（❌ 会引用不存在的命令）
- [ ] Step 5：专项验证（❌ 未通过）
- [ ] Step 6：记录完成状态

**遗留问题：**
- 使用 `gstack-slug` 命令（应该改为 `spec-first-slug`）
- 访问 `~/.gstack/projects/` 目录（应该改为 `~/.spec-first/projects/`）
- 引用 `gstack` 品牌（应该改为 `spec-first`）

**修复优先级：** P0 - 必须立即修复

---

### 2. design-consultation

**状态：** ⏳ 待开始

**6 步验证：**
- [ ] Step 1：改模板
- [ ] Step 2：重新生成
- [ ] Step 3：静态搜索
- [ ] Step 4：最小运行验证
- [ ] Step 5：专项验证
- [ ] Step 6：记录完成状态

---

### 3. document-release

**状态：** ⏳ 待开始

**6 步验证：**
- [ ] Step 1：改模板
- [ ] Step 2：重新生成
- [ ] Step 3：静态搜索
- [ ] Step 4：最小运行验证
- [ ] Step 5：专项验证
- [ ] Step 6：记录完成状态

---

### 4. retro

**状态：** ⏳ 待开始

**6 步验证：**
- [ ] Step 1：改模板
- [ ] Step 2：重新生成
- [ ] Step 3：静态搜索
- [ ] Step 4：最小运行验证
- [ ] Step 5：专项验证
- [ ] Step 6：记录完成状态

---

## C2：带 browse/bin 依赖的 planning（3 个）

### 1. plan-ceo-review

**状态：** ⏳ 待开始

**6 步验证：**
- [ ] Step 1：改模板
- [ ] Step 2：重新生成
- [ ] Step 3：静态搜索
- [ ] Step 4：最小运行验证
- [ ] Step 5：专项验证
- [ ] Step 6：记录完成状态

---

### 2. plan-eng-review

**状态：** ⏳ 待开始

**6 步验证：**
- [ ] Step 1：改模板
- [ ] Step 2：重新生成
- [ ] Step 3：静态搜索
- [ ] Step 4：最小运行验证
- [ ] Step 5：专项验证
- [ ] Step 6：记录完成状态

---

### 3. plan-design-review

**状态：** ⏳ 待开始

**6 步验证：**
- [ ] Step 1：改模板
- [ ] Step 2：重新生成
- [ ] Step 3：静态搜索
- [ ] Step 4：最小运行验证
- [ ] Step 5：专项验证
- [ ] Step 6：记录完成状态

---

## C3：评审与质量（4 个）

### 1. review

**状态：** ⏳ 待开始

**6 步验证：**
- [ ] Step 1：改模板
- [ ] Step 2：重新生成
- [ ] Step 3：静态搜索
- [ ] Step 4：最小运行验证
- [ ] Step 5：专项验证
- [ ] Step 6：记录完成状态

---

### 2. investigate

**状态：** ⏳ 待开始

**6 步验证：**
- [ ] Step 1：改模板
- [ ] Step 2：重新生成
- [ ] Step 3：静态搜索
- [ ] Step 4：最小运行验证
- [ ] Step 5：专项验证
- [ ] Step 6：记录完成状态

---

### 3. codex

**状态：** ⏳ 待开始

**6 步验证：**
- [ ] Step 1：改模板
- [ ] Step 2：重新生成
- [ ] Step 3：静态搜索
- [ ] Step 4：最小运行验证
- [ ] Step 5：专项验证
- [ ] Step 6：记录完成状态

---

### 4. ship

**状态：** ⏳ 待开始

**6 步验证：**
- [ ] Step 1：改模板
- [ ] Step 2：重新生成
- [ ] Step 3：静态搜索
- [ ] Step 4：最小运行验证
- [ ] Step 5：专项验证
- [ ] Step 6：记录完成状态

---

## C4：浏览器与部署重依赖（9 个）

### 1. browse

**状态：** ⏳ 待开始

**6 步验证：**
- [ ] Step 1：改模板
- [ ] Step 2：重新生成
- [ ] Step 3：静态搜索
- [ ] Step 4：最小运行验证
- [ ] Step 5：专项验证
- [ ] Step 6：记录完成状态

---

### 2. qa-only

**状态：** ⏳ 待开始

**6 步验证：**
- [ ] Step 1：改模板
- [ ] Step 2：重新生成
- [ ] Step 3：静态搜索
- [ ] Step 4：最小运行验证
- [ ] Step 5：专项验证
- [ ] Step 6：记录完成状态

---

### 3. qa

**状态：** ⏳ 待开始

**6 步验证：**
- [ ] Step 1：改模板
- [ ] Step 2：重新生成
- [ ] Step 3：静态搜索
- [ ] Step 4：最小运行验证
- [ ] Step 5：专项验证
- [ ] Step 6：记录完成状态

---

### 4. design-review

**状态：** ⏳ 待开始

**6 步验证：**
- [ ] Step 1：改模板
- [ ] Step 2：重新生成
- [ ] Step 3：静态搜索
- [ ] Step 4：最小运行验证
- [ ] Step 5：专项验证
- [ ] Step 6：记录完成状态

---

### 5. setup-browser-cookies

**状态：** ⏳ 待开始

**6 步验证：**
- [ ] Step 1：改模板
- [ ] Step 2：重新生成
- [ ] Step 3：静态搜索
- [ ] Step 4：最小运行验证
- [ ] Step 5：专项验证
- [ ] Step 6：记录完成状态

---

### 6. setup-deploy

**状态：** ⏳ 待开始

**6 步验证：**
- [ ] Step 1：改模板
- [ ] Step 2：重新生成
- [ ] Step 3：静态搜索
- [ ] Step 4：最小运行验证
- [ ] Step 5：专项验证
- [ ] Step 6：记录完成状态

---

### 7. canary

**状态：** ⏳ 待开始

**6 步验证：**
- [ ] Step 1：改模板
- [ ] Step 2：重新生成
- [ ] Step 3：静态搜索
- [ ] Step 4：最小运行验证
- [ ] Step 5：专项验证
- [ ] Step 6：记录完成状态

---

### 8. benchmark

**状态：** ⏳ 待开始

**6 步验证：**
- [ ] Step 1：改模板
- [ ] Step 2：重新生成
- [ ] Step 3：静态搜索
- [ ] Step 4：最小运行验证
- [ ] Step 5：专项验证
- [ ] Step 6：记录完成状态

---

### 9. land-and-deploy

**状态：** ⏳ 待开始

**6 步验证：**
- [ ] Step 1：改模板
- [ ] Step 2：重新生成
- [ ] Step 3：静态搜索
- [ ] Step 4：最小运行验证
- [ ] Step 5：专项验证
- [ ] Step 6：记录完成状态

---

## C5：升级与特殊迁移（1 个）

### 1. spec-first-upgrade（原 gstack-upgrade）

**状态：** ⏳ 待开始

**6 步验证：**
- [ ] Step 1：改模板
- [ ] Step 2：重新生成
- [ ] Step 3：静态搜索
- [ ] Step 4：最小运行验证
- [ ] Step 5：专项验证
- [ ] Step 6：记录完成状态

**注意事项：**
- 这个 skill 的命名本身就是迁移对象
- 需要同时更新目录名：gstack-upgrade → spec-first-upgrade

---

## 统计信息

**总计：** 27 个 skill

**已完成：** 1 个（3.7%）
- ✅ 根 SKILL.md

**进行中：** 5 个（18.5%）
- 🔄 careful（待验证）
- 🔄 freeze（待验证）
- 🔄 guard（待验证）
- 🔄 unfreeze（待验证）
- 🔄 .agents/skills/ 目录清理

**待开始：** 21 个（77.8%）

---

## 下一步行动

1. **完成 C0 的剩余验证**
   - 验证 careful、freeze、guard、unfreeze
   - 清理 .agents/skills/ 中的旧目录

2. **C0 审查通过后**
   - 开始 C1：轻依赖规划与文档类

3. **持续更新此跟踪表**
   - 每完成一个 skill 的验证，立即更新状态
   - 记录遗留问题

---

**更新频率：** 每完成一个 skill 后立即更新
**最后更新：** 2026-03-22
