---
title: Spec-First Codex 平台支持实现计划
date: 2026-03-30
status: completed
origin: docs/brainstorms/2026-03-30-codex-support-requirements.md
---

# Spec-First Codex 平台支持实现计划

## 1. 问题与目标

**问题**: 当前 Spec-First 对 Claude 平台有硬编码依赖，无法支持 Codex 等其他平台。

**目标**: 在不破坏现有 Claude 用户体验的前提下，引入平台适配器架构，支持 Codex 平台。

**成功标准** (见 origin):
- `spec-first init --claude` 行为不变
- `spec-first init --codex` 成功生成 `.codex/` 运行态
- `doctor` 和 `clean` 支持双平台
- Canonical 资产保持平台无关

## 2. 架构决策

### 2.1 采用平台适配器模式

**决策**: 引入 adapter 层，将平台差异从命令层剥离。

**理由**:
- 保持 canonical 资产（templates/、skills/、agents/）平台无关
- 平台逻辑集中管理，易于扩展
- 命令层代码简化，只需调用 adapter 接口

**替代方案**: 在各命令中硬编码 `--codex` 分支（已拒绝，会导致逻辑扩散）

### 2.2 目录结构

**Codex 运行态目录**:
```
.codex/
  ├── commands/spec/
  ├── skills/
  ├── agents/
  └── spec-first/
      ├── state.json
      └── .developer
```

**理由**: 与 Claude 的 `.claude/` 结构平行，便于理解和维护。

## 3. 实现单元

### 3.1 平台适配器接口定义

**文件**: `src/cli/adapters/base.js` (新建)

**职责**: 定义平台适配器基础接口

**接口**:
```javascript
class PlatformAdapter {
  get id() { throw new Error('Not implemented'); }
  get runtimeRoot() { throw new Error('Not implemented'); }
  get managedRoot() { throw new Error('Not implemented'); }
  get commandRoot() { throw new Error('Not implemented'); }
  get skillsRoot() { throw new Error('Not implemented'); }
  get agentsRoot() { throw new Error('Not implemented'); }
  get stateFile() { throw new Error('Not implemented'); }
  get developerFile() { throw new Error('Not implemented'); }

  transformSkillContent(content) { return content; }
  transformAgentContent(content) { return content; }
  inspect(projectRoot) { throw new Error('Not implemented'); }
}
```

**测试场景**:
- [ ] 基类方法抛出 Not implemented 错误
- [ ] 子类可以正确继承和覆盖方法

**测试文件**: `tests/unit/adapters/base.test.js`

---

### 3.2 Claude 适配器实现

**文件**: `src/cli/adapters/claude.js` (新建)

**职责**: 封装 Claude 平台的路径和转换逻辑

**实现要点**:
- 继承 `PlatformAdapter`
- 返回 `.claude/` 相关路径
- 实现现有的 skill/agent 内容转换逻辑（从 plugin.js 迁移）
- 实现 `inspect()` 方法（从 doctor.js 迁移检查逻辑）

**依赖**:
- 现有 `src/cli/plugin.js` 中的转换函数
- 现有 `src/cli/commands/doctor.js` 中的检查逻辑

**测试场景**:
- [ ] `id` 返回 'claude'
- [ ] `runtimeRoot` 返回 '.claude'
- [ ] `commandRoot` 返回 '.claude/commands/spec'
- [ ] `skillsRoot` 返回 '.claude/skills'
- [ ] `agentsRoot` 返回 '.claude/agents'
- [ ] `stateFile` 返回 '.claude/spec-first/state.json'
- [ ] `developerFile` 返回 '.claude/spec-first/.developer'
- [ ] `transformSkillContent()` 正确转换 skill 引用
- [ ] `transformAgentContent()` 正确转换 agent 引用
- [ ] `inspect()` 正确检查 Claude 运行态资产

**测试文件**: `tests/unit/adapters/claude.test.js`

---

### 3.3 Codex 适配器实现

**文件**: `src/cli/adapters/codex.js` (新建)

**职责**: 封装 Codex 平台的路径和转换逻辑

**实现要点**:
- 继承 `PlatformAdapter`
- 返回 `.codex/` 相关路径
- 实现 Codex 专用的内容转换逻辑（**待确认**: MVP 阶段可先复用 Claude 转换逻辑，待 Codex 官方约定明确后再调整）
- 实现 `inspect()` 方法检查 Codex 运行态

**Codex 约定待确认项**:
- Codex skill/agent 引用格式
- Codex 命令命名空间约定
- Codex 运行态目录结构是否与 `.codex/` 一致

**测试场景**:
- [ ] `id` 返回 'codex'
- [ ] `runtimeRoot` 返回 '.codex'
- [ ] `commandRoot` 返回 '.codex/commands/spec'
- [ ] `skillsRoot` 返回 '.codex/skills'
- [ ] `agentsRoot` 返回 '.codex/agents'
- [ ] `stateFile` 返回 '.codex/spec-first/state.json'
- [ ] `developerFile` 返回 '.codex/spec-first/.developer'
- [ ] `transformSkillContent()` 正确转换 Codex skill 引用
- [ ] `transformAgentContent()` 正确转换 Codex agent 引用
- [ ] `inspect()` 正确检查 Codex 运行态资产

**测试文件**: `tests/unit/adapters/codex.test.js`

---

### 3.4 适配器工厂

**文件**: `src/cli/adapters/index.js` (新建)

**职责**: 根据平台 ID 返回对应的适配器实例

**实现**:
```javascript
const ClaudeAdapter = require('./claude');
const CodexAdapter = require('./codex');

const adapters = {
  claude: new ClaudeAdapter(),
  codex: new CodexAdapter(),
};

function getAdapter(platformId) {
  const adapter = adapters[platformId];
  if (!adapter) {
    throw new Error(`Unknown platform: ${platformId}`);
  }
  return adapter;
}

function getSupportedPlatforms() {
  return Object.keys(adapters);
}

module.exports = { getAdapter, getSupportedPlatforms };
```

**测试场景**:
- [ ] `getAdapter('claude')` 返回 Claude 适配器
- [ ] `getAdapter('codex')` 返回 Codex 适配器
- [ ] `getAdapter('unknown')` 抛出错误
- [ ] `getSupportedPlatforms()` 返回 ['claude', 'codex']

**测试文件**: `tests/unit/adapters/index.test.js`

---

### 3.5 重构 init 命令

**文件**: `src/cli/commands/init.js`

**改造内容**:
1. 解析 `--claude` 或 `--codex` 参数
2. 通过 `getAdapter(platform)` 获取适配器
3. 使用 adapter 提供的路径进行初始化
4. 调用 adapter 的转换方法处理内容

**关键改动**:
```javascript
// 旧代码（硬编码）
const targetDir = path.join(projectRoot, '.claude');

// 新代码（通过 adapter）
const adapter = getAdapter(platform);
const targetDir = path.join(projectRoot, adapter.runtimeRoot);
```

**依赖**: `src/cli/adapters/index.js`

**测试场景**:
- [ ] `init --claude` 生成 `.claude/` 运行态
- [ ] `init --codex` 生成 `.codex/` 运行态
- [ ] 无参数时提示需要指定平台
- [ ] 未知平台参数时报错
- [ ] 生成的 state.json 包含正确的平台信息
- [ ] 生成的 .developer 文件路径正确

**测试文件**: `tests/integration/init.test.js`

---

### 3.6 重构 doctor 命令

**文件**: `src/cli/commands/doctor.js`

**改造内容**:
1. 支持 `--claude` 或 `--codex` 参数
2. 无参数时自动检测项目中存在的平台并检查所有平台
3. 调用对应 adapter 的 `inspect()` 方法

**平台自动检测逻辑**:
```javascript
// 无参数时
const platforms = ['.claude', '.codex']
  .filter(dir => fs.existsSync(path.join(projectRoot, dir)))
  .map(dir => dir.replace('.', ''));

if (platforms.length === 0) {
  console.log('No spec-first platform detected');
} else {
  platforms.forEach(platform => {
    console.log(`\n=== ${platform.toUpperCase()} Platform ===`);
    const adapter = getAdapter(platform);
    const result = adapter.inspect(projectRoot);
    // 输出检查结果
  });
}
```

**关键改动**:
```javascript
// 旧代码（硬编码检查）
const claudeDir = path.join(projectRoot, '.claude');
if (!fs.existsSync(claudeDir)) { ... }

// 新代码（通过 adapter）
const adapter = getAdapter(platform);
const result = adapter.inspect(projectRoot);
```

**测试场景**:
- [ ] `doctor --claude` 检查 Claude 运行态
- [ ] `doctor --codex` 检查 Codex 运行态
- [ ] 无参数时自动检测并检查所有存在的平台
- [ ] 输出中显示平台名称
- [ ] 检查结果包含 commands、skills、agents、state、developer

**测试文件**: `tests/integration/doctor.test.js`

---

### 3.7 重构 clean 命令

**文件**: `src/cli/commands/clean.js`

**改造内容**:
1. 支持 `--claude` 或 `--codex` 参数
2. 使用 adapter 提供的路径进行清理

**关键改动**:
```javascript
// 旧代码（硬编码路径）
const claudeDir = path.join(projectRoot, '.claude');
fs.rmSync(claudeDir, { recursive: true });

// 新代码（通过 adapter）
const adapter = getAdapter(platform);
const targetDir = path.join(projectRoot, adapter.runtimeRoot);
fs.rmSync(targetDir, { recursive: true });
```

**测试场景**:
- [ ] `clean --claude` 清理 `.claude/` 目录
- [ ] `clean --codex` 清理 `.codex/` 目录
- [ ] 清理后目录不存在
- [ ] 清理不存在的平台时给出友好提示

**测试文件**: `tests/integration/clean.test.js`

---

### 3.8 重构 plugin.js

**文件**: `src/cli/plugin.js`

**改造内容**:
1. 拆分为 asset layer（读取 canonical 资产）和 adapter layer（平台转换）
2. 将内容转换逻辑移到各 adapter 中
3. `syncAssets()` 接收 adapter 参数

**关键改动**:
```javascript
// 旧代码（直接转换）
function syncAssets(manifest, targetDir) {
  // 硬编码的 Claude 转换逻辑
}

// 新代码（通过 adapter）
function syncAssets(manifest, adapter, projectRoot) {
  const targetDir = path.join(projectRoot, adapter.runtimeRoot);
  // 调用 adapter.transformSkillContent() 等
}
```

**测试场景**:
- [ ] `syncAssets()` 使用 Claude adapter 生成正确的 Claude 运行态
- [ ] `syncAssets()` 使用 Codex adapter 生成正确的 Codex 运行态
- [ ] 转换后的内容包含正确的平台引用

**测试文件**: `tests/unit/plugin.test.js`

---

### 3.9 重构 state.js

**文件**: `src/cli/state.js`

**改造内容**:
1. 路径参数化，接收 adapter 提供的路径
2. state.json 中记录平台信息

**关键改动**:
```javascript
// 旧代码（硬编码路径）
const stateFile = path.join(projectRoot, '.claude/spec-first/state.json');

// 新代码（通过 adapter）
function getState(projectRoot, adapter) {
  const stateFile = path.join(projectRoot, adapter.stateFile);
  // ...
}
```

**state.json 结构增强**:
```json
{
  "platform": "claude" | "codex",
  "version": "1.3.15",
  "initialized_at": "2026-03-30T...",
  "managed_assets": { ... }
}
```

**测试场景**:
- [ ] `getState()` 读取正确平台的 state.json
- [ ] `writeState()` 写入包含平台信息的 state.json
- [ ] state.json 路径由 adapter 决定

**测试文件**: `tests/unit/state.test.js`


## 4. 实现顺序

### 阶段 1: 适配器基础设施（1-2天）
1. 创建 `src/cli/adapters/base.js`
2. 创建 `src/cli/adapters/claude.js`（迁移现有逻辑）
3. 创建 `src/cli/adapters/codex.js`
4. 创建 `src/cli/adapters/index.js`
5. 补充单元测试

### 阶段 2: 命令层重构（2-3天）
1. 重构 `src/cli/commands/init.js`
2. 重构 `src/cli/commands/doctor.js`
3. 重构 `src/cli/commands/clean.js`
4. 重构 `src/cli/plugin.js`
5. 重构 `src/cli/state.js`
6. 补充集成测试

### 阶段 3: 验证与文档（1天）
1. 运行现有测试确保 Claude 不退化
2. 运行新增测试验证 Codex 支持
3. 更新 README.md
4. 更新用户手册

## 5. 依赖关系

```
base.js
  ├── claude.js
  └── codex.js
      └── index.js (adapter factory)
          ├── init.js
          ├── doctor.js
          ├── clean.js
          ├── plugin.js
          └── state.js
```

**关键路径**: 必须先完成 adapter 基础设施，才能重构命令层。

## 6. 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| Claude 用户体验退化 | 高 | 保留现有测试，确保 `--claude` 行为不变 |
| Codex 约定与实现不符 | 中 | 将 Codex 特定逻辑集中在 adapter，易调整 |
| 测试覆盖不足 | 中 | 分层测试：单元测试 adapter，集成测试命令 |
| 迁移过程中引入 bug | 中 | 小步迭代，每个阶段都运行测试 |

## 7. 测试策略

### 7.1 单元测试
- `tests/unit/adapters/*.test.js` - 测试各 adapter 的路径和转换逻辑
- `tests/unit/plugin.test.js` - 测试资产同步逻辑
- `tests/unit/state.test.js` - 测试状态管理

### 7.2 集成测试
- `tests/integration/init.test.js` - 测试 `init --claude` 和 `init --codex`
- `tests/integration/doctor.test.js` - 测试 `doctor` 双平台支持
- `tests/integration/clean.test.js` - 测试 `clean` 双平台支持

### 7.3 Smoke 测试
- `tests/smoke/claude.sh` - 验证 Claude 链路不退化
- `tests/smoke/codex.sh` - 验证 Codex 链路正常工作

## 8. 验收标准

### 8.1 功能验收
- [ ] `spec-first init --claude` 生成 `.claude/` 运行态，行为与之前一致
- [ ] `spec-first init --codex` 生成 `.codex/` 运行态
- [ ] `spec-first doctor --claude` 检查 Claude 资产
- [ ] `spec-first doctor --codex` 检查 Codex 资产
- [ ] `spec-first clean --claude` 清理 Claude 资产
- [ ] `spec-first clean --codex` 清理 Codex 资产
- [ ] state.json 包含平台信息

### 8.2 质量验收
- [ ] 所有现有测试通过
- [ ] 新增测试覆盖率 > 80%
- [ ] 无 ESLint 错误
- [ ] 代码审查通过

### 8.3 文档验收
- [ ] README 更新平台支持说明
- [ ] 用户手册补充 Codex 初始化流程
- [ ] 代码注释清晰

## 9. 未来扩展

### 9.1 支持更多平台
当需要支持新平台时：
1. 创建新的 adapter（如 `gemini.js`）
2. 在 `adapters/index.js` 中注册
3. 补充测试

### 9.2 统一平台参数
如果平台数量继续增加，可以统一为：
```bash
spec-first init --platform codex
spec-first doctor --platform codex
```

但当前阶段保持 `--claude` 和 `--codex` 以降低迁移成本。

## 10. 参考资料

- 需求文档: `docs/brainstorms/2026-03-30-codex-support-requirements.md`
- 技术方案: `docs/plans/2026-03-30-codex-support-design.md`
- 现有代码: `src/cli/`

---

**计划状态**: Ready for Implementation
**预计工期**: 4-6 天
**下一步**: 执行 `/spec:work` 开始实现

## 11. 回滚策略

### 11.1 阶段 1 回滚
如果适配器层实现失败：
- 删除 `src/cli/adapters/` 目录
- 恢复 git commit
- 影响范围：仅新增代码，无破坏性

### 11.2 阶段 2 回滚
如果命令层重构导致 Claude 退化：
- 通过 git revert 回退相关 commit
- 运行 smoke 测试验证回退成功
- 影响范围：可能需要回退多个 commit

### 11.3 Feature Flag（可选）
如果需要更细粒度控制：
```javascript
// src/cli/adapters/index.js
const CODEX_ENABLED = process.env.SPEC_FIRST_CODEX_ENABLED === 'true';

function getSupportedPlatforms() {
  const platforms = ['claude'];
  if (CODEX_ENABLED) {
    platforms.push('codex');
  }
  return platforms;
}
```

## 12. Codex 验证方式

### 12.1 验证清单
- [ ] 在 Codex 环境中运行 `spec-first init --codex`
- [ ] 检查生成的 `.codex/` 目录结构
- [ ] 验证 Codex 能否识别生成的 commands/skills/agents
- [ ] 运行 `spec-first doctor --codex` 确认资产完整性

### 12.2 参考资料
- Codex 官方文档（待补充链接）
- Codex 示例项目（待补充链接）
- 如果 Codex 约定与预期不符，优先调整 Codex adapter，保持 canonical 资产不变

---

**审查意见已整合**
**计划版本**: v1.1
**更新日期**: 2026-03-30
