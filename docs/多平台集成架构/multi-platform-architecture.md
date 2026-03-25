# spec-first/spec-first 多平台架构分析

> 分析当前项目的多平台集成架构设计

---

## 1. 架构概览

### 1.1 核心设计理念

**插件式架构** - 每个 AI 平台作为独立插件，通过统一接口集成。

```
核心系统 (Core)
    ↓ 提供统一接口
平台注册表 (Registry)
    ↓ 管理平台元数据
平台插件 (Plugins)
    ↓ 实现平台特定逻辑
```

### 1.2 三层架构

```
┌─────────────────────────────────────────┐
│  数据层 (Data Layer)                     │
│  types/ai-tools.ts                      │
│  - 平台元数据定义                        │
│  - 平台配置接口                          │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  行为层 (Behavior Layer)                 │
│  configurators/                         │
│  - 平台函数注册                          │
│  - 统一配置接口                          │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  资源层 (Resource Layer)                 │
│  templates/                             │
│  - 平台模板文件                          │
│  - 命令/技能/配置                        │
└─────────────────────────────────────────┘
```

---

## 2. 数据层设计

### 2.1 平台类型定义

```typescript
// types/ai-tools.ts

// 支持的平台枚举
export type AITool =
  | "claude-code"
  | "cursor"
  | "opencode"
  | "iflow"
  | "codex"
  | "kilo"
  | "kiro"
  | "gemini"
  | "antigravity"
  | "qoder"
  | "codebuddy";
```

### 2.2 平台配置接口

```typescript
export interface AIToolConfig {
  name: string;              // 显示名称
  templateDirs: TemplateDir[]; // 模板目录
  configDir: string;         // 配置目录 (如 .claude)
  supportsAgentSkills?: boolean; // 是否支持共享技能
  cliFlag: CliFlag;          // CLI 标志 (如 --claude)
  defaultChecked: boolean;   // 默认是否选中
  hasPythonHooks: boolean;   // 是否使用 Python hooks
}
```

### 2.3 平台注册表

```typescript
export const AI_TOOLS: Record<AITool, AIToolConfig> = {
  "claude-code": {
    name: "Claude Code",
    templateDirs: ["claude"],
    configDir: ".claude",
    cliFlag: "claude",
    defaultChecked: true,
    hasPythonHooks: true,
  },
  "codex": {
    name: "Codex",
    templateDirs: ["codex"],
    configDir: ".codex",
    supportsAgentSkills: true,
    cliFlag: "codex",
    defaultChecked: false,
    hasPythonHooks: true,
  },
  // ... 其他 9 个平台
};
```

---

## 3. 行为层设计

### 3.1 平台函数接口

```typescript
// configurators/index.ts

interface PlatformFunctions {
  // 初始化时配置平台（复制模板到项目）
  configure: (cwd: string) => Promise<void>;

  // 收集模板文件用于更新追踪
  collectTemplates?: () => Map<string, string>;
}
```

### 3.2 平台函数注册表

```typescript
const PLATFORM_FUNCTIONS: Record<AITool, PlatformFunctions> = {
  "claude-code": {
    configure: configureClaude,
    collectTemplates: () => {
      const files = new Map<string, string>();
      // 收集命令
      for (const cmd of getClaudeCommands()) {
        files.set(`.claude/commands/spec/${cmd.name}.md`, cmd.content);
      }
      // 收集代理
      for (const agent of getClaudeAgents()) {
        files.set(`.claude/agents/${agent.name}.md`, agent.content);
      }
      // 收集 hooks
      for (const hook of getClaudeHooks()) {
        files.set(`.claude/${hook.targetPath}`, hook.content);
      }
      return files;
    },
  },
  "codex": {
    configure: configureCodex,
    collectTemplates: () => {
      // Codex 特定的模板收集逻辑
    },
  },
  // ... 其他平台
};
```

### 3.3 统一配置流程

```typescript
// 初始化时的平台配置流程
export async function configurePlatforms(
  cwd: string,
  selectedPlatforms: AITool[]
): Promise<void> {
  for (const platform of selectedPlatforms) {
    const functions = PLATFORM_FUNCTIONS[platform];
    await functions.configure(cwd);
  }
}
```

---

## 4. 资源层设计

### 4.1 模板目录结构

```text
templates/
├── spec-first/          # 核心工作流模板（所有平台共享）
│   ├── config.yaml
│   ├── workflow.md
│   └── scripts/
├── claude/              # Claude 平台特定
│   ├── commands/
│   ├── agents/
│   └── hooks/
├── codex/               # Codex 平台特定
│   ├── skills/
│   ├── agents/
│   └── hooks/
└── cursor/              # Cursor 平台特定
    └── commands/
```

### 4.2 平台模板接口

每个平台模板目录都导出统一接口：

```typescript
// templates/claude/index.ts
export function getAllCommands(): Array<{
  name: string;
  content: string;
}>;

export function getAllAgents(): Array<{
  name: string;
  content: string;
}>;

export function getAllHooks(): Array<{
  targetPath: string;
  content: string;
}>;
```

---

## 5. 平台差异处理

### 5.1 命令组织方式

| 平台 | 组织方式 | 示例 |
| ---- | -------- | ---- |
| Claude | 子目录 | `.claude/commands/spec/start.md` |
| Codex | 子目录 | `.codex/commands/spec/start.md` |
| Cursor | 扁平 + 前缀 | `.cursor/spec-start.md` |
| Kilo | YAML workflow | `.kilo/workflows/spec-start.yaml` |

### 5.2 Hook 支持

| 平台 | Hook 支持 | 实现方式 |
| ---- | --------- | -------- |
| Claude | ✅ 完整 | Python hooks |
| iFlow | ✅ 完整 | Python hooks |
| Codex | ⚠️ 可选 | Python hooks |
| Cursor | ❌ 无 | - |
| 其他 | ❌ 无 | - |

### 5.3 共享技能层

| 平台 | 支持共享技能 | 路径 |
| ---- | ------------ | ---- |
| Codex | ✅ 是 | `.agents/skills/` |
| 其他 | ❌ 否 | - |

---

## 6. 工作流程

### 6.1 初始化流程

```
用户执行: spec-first init --claude --codex
    ↓
1. 解析 CLI 参数
    ↓
2. 从 AI_TOOLS 获取平台配置
    ↓
3. 创建核心工作流 (.spec-first/)
    ↓
4. 为每个选中平台:
   - 调用 configure() 函数
   - 复制平台模板到项目
   - 创建平台配置目录
    ↓
5. 完成初始化
```

### 6.2 更新流程

```
用户执行: spec-first update
    ↓
1. 检测项目中已配置的平台
    ↓
2. 为每个平台:
   - 调用 collectTemplates()
   - 比对本地文件与模板
   - 应用更新（保留用户修改）
    ↓
3. 完成更新
```

---

## 7. 扩展性设计

### 7.1 添加新平台

**步骤 1**: 定义平台元数据

```typescript
// types/ai-tools.ts
export type AITool =
  | "existing-platforms"
  | "new-platform";  // 添加

export const AI_TOOLS: Record<AITool, AIToolConfig> = {
  "new-platform": {
    name: "New Platform",
    templateDirs: ["new-platform"],
    configDir: ".new-platform",
    cliFlag: "new-platform",
    defaultChecked: false,
    hasPythonHooks: false,
  }
};
```

**步骤 2**: 实现配置器

```typescript
// configurators/new-platform.ts
export async function configureNewPlatform(cwd: string): Promise<void> {
  // 创建配置目录
  // 复制模板文件
  // 应用平台特定逻辑
}
```

**步骤 3**: 注册平台函数

```typescript
// configurators/index.ts
import { configureNewPlatform } from "./new-platform.js";

const PLATFORM_FUNCTIONS: Record<AITool, PlatformFunctions> = {
  "new-platform": {
    configure: configureNewPlatform,
    collectTemplates: () => { /* ... */ }
  }
};
```

**步骤 4**: 创建模板

```text
templates/new-platform/
├── index.ts
└── commands/
    └── start.md
```

### 7.2 删除平台

反向操作即可，不影响其他平台：

1. 从 `AI_TOOLS` 删除平台定义
2. 从 `PLATFORM_FUNCTIONS` 删除注册
3. 删除配置器文件
4. 删除模板目录
5. 删除测试文件

---

## 8. 架构优势

### 8.1 解耦性

- ✅ 平台之间完全独立
- ✅ 添加/删除平台不影响其他平台
- ✅ 核心系统与平台插件分离

### 8.2 可扩展性

- ✅ 统一接口，易于添加新平台
- ✅ 模板化设计，复用性强
- ✅ 插件式架构，灵活性高

### 8.3 可维护性

- ✅ 每个平台独立维护
- ✅ 代码组织清晰
- ✅ 职责分离明确

### 8.4 可测试性

- ✅ 每个平台独立测试
- ✅ 模拟平台配置简单
- ✅ 集成测试隔离性好

---

## 9. 架构局限

### 9.1 当前局限

1. **平台数量多** - 11 个平台维护成本高
2. **模板冗余** - 部分平台模板内容重复
3. **更新复杂** - 需要同步更新所有平台

### 9.2 改进建议

1. **精简平台** - 只保留核心平台（如 Claude + Codex）
2. **模板抽象** - 提取共享模板逻辑
3. **自动化测试** - 增加平台兼容性测试

1. **精简平台** - 只保留核心平台（如 Claude + Codex）
2. **模板抽象** - 提取共享模板逻辑
3. **自动化测试** - 增加平台兼容性测试

---

## 10. 重构影响分析

### 10.1 对 spec-first 重构的影响

**好消息**: 插件式架构使重构更简单

- ✅ 可以逐个平台重构
- ✅ 不会相互影响
- ✅ 测试隔离性好

**重构策略**:

```text
阶段 1: 重构核心系统
  - brand.ts (品牌常量)
  - paths.ts (路径常量)
  - templates/spec-first/ (核心模板)

阶段 2: 重构平台插件
  - 逐个平台更新配置器
  - 逐个平台更新模板
  - 逐个平台更新测试

阶段 3: 清理与优化
  - 删除不需要的平台
  - 优化共享逻辑
```

