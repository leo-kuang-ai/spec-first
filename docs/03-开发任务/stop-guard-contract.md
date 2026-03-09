# stop-guard Hook 行为契约

## 定位

Stop 阶段的**非阻断提醒型 Hook**，用于在会话结束前提醒 AI 仍有进行中的任务。

## 核心语义（4 条）

1. **仅在 `04_implement` 阶段生效** - 其他阶段直接 `exit 0`
2. **仅提醒 `in_progress` 任务** - 不检查 `todo` 或其他状态
3. **输出到 `stderr`** - 使用 `echo "..." >&2`
4. **始终 `exit 0`** - 不阻断会话结束，避免 AI 死循环

## 设计理由

### 为什么是提醒型而非阻断型？

阻断型 Stop Hook 存在架构级悖论：
- AI 收到 `exit 2` → 认为任务未完成
- AI 尝试继续工作 → 再次触发 Stop → 再次 `exit 2`
- 导致死循环，无法根本解决

### 真正的守门在哪里？

- **PreToolUse**: `gate check` 在阶段推进前阻断
- **PostToolUse**: `progress-sync` 在文件修改后提醒
- **Stop**: 仅做最后提醒，不阻断

## 测试契约

见 `tests/unit/ai-runtime-hook.test.ts` 中的 `should generate stop-guard with reminder-only semantics` 测试。

## 维护约束

- 生成真源：`src/core/tool-integration/ai-runtime-hook-scripts.ts` 中的 `STOP_GUARD_SCRIPT_CONTENT`
- 治理文档：`skills/spec-first/AGENTS.md` 第12-17行、第61-66行
- 任何修改必须同时更新真源、文档、测试
