# spec-mcp-setup：彻底简化方案

## 问题陈述

当前实现：**~17,000 行**代码分布在 44 个文件中（19 个 .sh + 19 个 .ps1 + 5 个 .cjs + 3 个 JSON 注册表），而它本质上只做这几件事：
1. 检测当前运行在哪个 IDE 中（检查环境变量）
2. 安装 npm 包（运行 `npx` 或 `npm install -g`）
3. 写一个 JSON/TOML 配置文件
4. 检查某些 CLI 工具是否存在于 PATH 中
5. 写一个状态 JSON 文件

Node.js 已经是硬性前置依赖。双轨 Bash/PowerShell 实现是复杂性、维护负担和跨平台不一致性的主要来源。

## 提出的架构：纯 Node.js

```
skills/spec-mcp-setup/
├── SKILL.md                         # 契约不变
├── setup-registry.json              # 统一注册表（替代 3 个 JSON 文件）
├── scripts/
│   ├── setup.cjs                    # 唯一入口：node scripts/setup.cjs [options]
│   ├── lib/
│   │   ├── host-detector.cjs        # ~80 行（替代 395+406=801 行）
│   │   ├── platform.cjs             # ~30 行（OS 检测）
│   │   ├── registry-loader.cjs      # ~60 行（加载+校验+模板展开）
│   │   ├── installer.cjs            # ~150 行（npm warmup/安装，镜像回退）
│   │   ├── config-writer.cjs        # ~120 行（JSON + TOML 写入带备份）
│   │   ├── verifier.cjs             # ~100 行（命令存在性检查，就绪性账本）
│   │   ├── project-target.cjs       # ~80 行（monorepo 解析）
│   │   └── renderer.cjs             # ~80 行（状态输出）
│   ├── providers/
│   │   ├── interface.cjs            # ~30 行（基础 provider 协议）
│   │   ├── codegraph.cjs            # ~120 行（install/init/verify/refresh）
│   │   └── graphify.cjs             # ~200 行（install/init/verify/refresh/hooks）
│   ├── check-health                 # 薄封装：node scripts/setup.cjs --check
│   └── setup-plan-renderer.cjs      # 保留向后兼容
├── evals/
│   └── examples.json
├── mcp-tools.json                   # 保留向后兼容（由 registry-loader 读取）
├── helper-tools.json                # 保留向后兼容
└── provider-tools.json              # 保留向后兼容
```

预估总量：**~1,500-2,000 行** JavaScript。缩减幅度：~88%。

## 核心设计决策

### 1. 单一入口点

```javascript
// scripts/setup.cjs — 唯一需要被调用的脚本
const { parseArgs } = require('node:util');
const { detectHost } = require('./lib/host-detector.cjs');
const { loadRegistry } = require('./lib/registry-loader.cjs');
const { install } = require('./lib/installer.cjs');
const { writeHostConfig } = require('./lib/config-writer.cjs');
const { verify, writeFacts } = require('./lib/verifier.cjs');
const { renderStatus } = require('./lib/renderer.cjs');

async function main() {
  const opts = parseArgs({ /* --check, --verify-only, --plan, --only, --status, --refresh */ });
  
  // 阶段 1：诊断
  const host = detectHost(process.env);
  const registry = loadRegistry(path.join(__dirname, '..'));
  const target = resolveProjectTarget(process.cwd(), opts);
  
  // 快速路径：--status 只读取已有 facts
  if (opts.values.status) return renderStatus(readExistingFacts(target.root));
  
  // 阶段 2：执行（除非 --check/--plan/--verify-only）
  if (!opts.values.check && !opts.values.plan) {
    for (const tool of registry.requiredTools(opts)) {
      await install(tool, host.platform);
      await writeHostConfig(tool, host);
    }
    for (const provider of registry.selectedProviders(opts)) {
      await provider.lifecycle(target, opts);
    }
  }
  
  // 阶段 3：汇总
  const facts = await verify(registry, host, target);
  await writeFacts(facts, target.root);
  renderStatus(facts);
}
```

### 2. 带默认值的统一注册表

与其在 715 行 JSON 中为每个工具重复 5 个宿主的配置，使用继承：

```json
{
  "schema_version": "8",
  "host_defaults": {
    "claude": { "scope": "managed", "config_format": "json", "config_path": {"macos": "...", "linux": "...", "windows": "..."} },
    "codex": { "scope": "user", "config_format": "toml", "config_path": "$HOME/.codex/config.toml" },
    "kiro": { "scope": "workspace", "config_format": "json", "config_path": ".kiro/settings/mcp.json" },
    "qoder": { "scope": "local", "config_format": "json", "config_path": ".qoder/settings.local.json" },
    "cursor": { "scope": "project", "config_format": "json", "config_path": ".cursor/mcp.json" }
  },
  "tools": [
    {
      "id": "sequential-thinking",
      "required": true,
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking@latest"],
      "detection": { "kind": "host_config_exact" }
    }
  ]
}
```

每个工具从 ~200 行缩减到 ~8 行。新增工具：添加 8 行。新增宿主：在 `host_defaults` 添加 1 个条目。

### 3. Provider 插件接口

```javascript
// scripts/providers/interface.cjs
class Provider {
  constructor(id, registry) { this.id = id; this.config = registry.providers[id]; }
  async install(target) { /* npm install -g */ }
  async init(target) { /* 首次生成 */ }
  async verify(target) { /* 检查就绪性 */ }
  async refresh(target) { /* 增量更新 */ }
  async uninstall(target) { /* 清理 */ }
}
```

新增 provider = 在 `providers/` 下新增一个文件，无需改动编排器。

### 4. 配置写入器（替代 lib-toml.sh + configure-host.sh + configure-host.ps1）

```javascript
// scripts/lib/config-writer.cjs (~120 行)
const fs = require('node:fs');
const path = require('node:path');

function writeJsonConfig(configPath, serverKey, serverConfig) {
  const existing = fs.existsSync(configPath)
    ? JSON.parse(fs.readFileSync(configPath, 'utf8')) : {};
  existing.mcpServers = existing.mcpServers || {};
  existing.mcpServers[serverKey] = serverConfig;
  
  // 原子写入 + 备份
  const backup = configPath + '.bak';
  if (fs.existsSync(configPath)) fs.copyFileSync(configPath, backup);
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(existing, null, 2) + '\n');
}

function writeTomlConfig(configPath, serverKey, serverConfig) {
  // Codex TOML: [mcp_servers.name]\ncommand = "..."\nargs = [...]
  // ~30 行替代 384 行自定义解析器
}
```

### 5. 镜像回退（替代 112 行 Bash 函数）

```javascript
// installer.cjs 内部
async function installWithMirrorFallback(cmd, args, mirrors) {
  try {
    await exec(cmd, args);
    return { source: 'official', mirror: false };
  } catch {
    for (const [envKey, envVal] of Object.entries(mirrors)) {
      process.env[envKey] = envVal;
    }
    try {
      await exec(cmd, args);
      return { source: 'mirror', mirror: true };
    } catch {
      return { source: 'both-failed', mirror: true };
    }
  }
}
```

## 迁移策略

### 向后兼容

- 初期保留现有 `mcp-tools.json`、`helper-tools.json`、`provider-tools.json` 不变
- `registry-loader.cjs` 读取这三个文件并合并为统一内部模型
- 保留 `check-health` 脚本名称（重定向到 `node scripts/setup.cjs --check`）
- 统一注册表的 schema 版本升至 `8`；加载器同时接受 `7`（旧版分离文件）
- 保留现有 `.spec-first/config/tool-facts.json` 输出格式不变
- SKILL.md 契约完全不变；只有内部实现改变

### 迁移验证后可删除的内容

- 全部 19 个 `.sh` 脚本（由 `setup.cjs` + `lib/` 替代）
- 全部 19 个 `.ps1` 脚本（Node.js 天然跨平台）
- `lib-toml.sh` / `lib-toml.ps1`（30 行 JS 替代 661 行）
- `lib-helper-registry.sh` / `lib-helper-registry.ps1`（由 registry-loader 替代）
- jq 作为硬依赖（彻底消除）

### 保留的内容

- `SKILL.md`（不变）
- `setup-plan-renderer.cjs`、`render-status-block.cjs`（合并入 `renderer.cjs`）
- `scan-configured-deps.cjs`（合并入 `verifier.cjs`）
- `evals/examples.json`（不变）

## 为什么更简单同时更具扩展性

| 维度 | 改造前 | 改造后 |
|------|--------|--------|
| 新增 MCP server | 编辑 715 行 JSON（每工具 200 行） | 注册表中添加 8 行 |
| 新增 provider | 编辑 1790 行 Bash + 1740 行 PS1 | 新增一个 .cjs 文件（~100-200 行） |
| 新增宿主 | 编辑每个工具的 JSON + detect-host.sh + detect-host.ps1 | host_defaults 加 1 条 + host-detector 加 3 行 |
| 跨平台 | 手动维护 2 套实现 | 一套实现，天然跨平台 |
| 依赖 | Node + jq + Bash/PowerShell | 仅 Node |
| 代码总量 | ~17,000 行 | ~2,000 行 |
| TOML 支持 | 384 行自定义解析器 | npm 包或 30 行序列化器 |

## 实施顺序

1. 创建 `scripts/lib/` 核心模块（host-detector、platform、registry-loader、installer、config-writer、verifier、project-target、renderer）
2. 创建 `scripts/providers/` 含 interface + codegraph + graphify
3. 创建 `scripts/setup.cjs` 编排器
4. 验证：对所有现有测试用例运行（`npm run test:mcp-setup`）
5. 创建统一 `setup-registry.json`（schema v8），registry-loader 仍兼容分离的 v7 文件
6. 更新 `check-health` 为薄封装
7. 所有测试通过后删除 Bash/PS1 脚本
8. 更新 SKILL.md 验证部分引用新入口

## 风险与缓解

| 风险 | 缓解措施 |
|------|----------|
| 边缘场景回归 | 过渡期保留旧脚本；两套同时运行并 diff 输出 |
| Codex TOML 写入正确性 | Codex TOML 格式极其简单（扁平 key/array section）；不需要完整解析器，只需序列化器 |
| Provider 生命周期复杂度（Graphify hooks、symlink 修复） | 封装在 `providers/graphify.cjs` 中；相同逻辑，更清晰的表达 |
| 失去 shell 原生 `set -euo pipefail` 安全性 | Node.js `child_process.execSync` 在非零退出码时抛异常；等价安全 |
