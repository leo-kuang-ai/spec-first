# Tech Stack 证据注入模板

## 注入规则

为 tech-stack.md 的关键技术结论添加证据标注。

## 证据位置映射

| 技术结论 | 证据来源 | 搜索策略 |
|---------|---------|---------|
| Node.js 版本要求 | package.json engines.node | Grep: `"node":` in package.json |
| TypeScript 版本 | package.json devDependencies.typescript | Grep: `"typescript":` in package.json |
| 模块系统 ESM | package.json type | Grep: `"type":` in package.json |
| 构建工具 tsup | package.json devDependencies.tsup | Grep: `"tsup":` in package.json |
| 测试框架 Vitest | package.json devDependencies.vitest | Grep: `"vitest":` in package.json |
| 核心依赖 | package.json dependencies | Read: package.json dependencies section |

## 注入模板

```markdown
### 运行时与语言

- **Runtime**: Node.js ≥{{node_version}} (`package.json:{{line}}` — `"node": "≥{{node_version}}"` — `[显式]`)
- **语言**: TypeScript ≥{{ts_version}} (`package.json:{{line}}` — `"typescript": "^{{ts_version}}"` — `[显式]`)
- **模块系统**: ESM (`package.json:{{line}}` — `"type": "module"` — `[显式]`)

### 构建与工具链

- **构建工具**: tsup (`package.json:{{line}}` — `"tsup": "^{{tsup_version}}"` — `[显式]`)
- **测试框架**: Vitest (`package.json:{{line}}` — `"vitest": "^{{vitest_version}}"` — `[显式]`)
```

## 实现伪代码

```typescript
function injectEvidenceForTechStack(docPath: string, projectRoot: string) {
  // 1. 读取 package.json
  const pkg = readJson(join(projectRoot, 'package.json'));

  // 2. 提取版本信息
  const nodeVersion = pkg.engines?.node;
  const tsVersion = pkg.devDependencies?.typescript;
  const tsupVersion = pkg.devDependencies?.tsup;

  // 3. 查找行号
  const pkgContent = readFile(join(projectRoot, 'package.json'));
  const nodeLine = findLineNumber(pkgContent, '"node":');
  const tsLine = findLineNumber(pkgContent, '"typescript":');

  // 4. 读取原文档
  const doc = readFile(docPath);

  // 5. 注入证据（正则替换）
  const enhanced = doc
    .replace(/Node\.js ≥[\d.]+/,
      `Node.js ≥${nodeVersion} (\`package.json:${nodeLine}\` — \`"node": "≥${nodeVersion}"\` — \`[显式]\`)`)
    .replace(/TypeScript ≥[\d.]+/,
      `TypeScript ≥${tsVersion} (\`package.json:${tsLine}\` — \`"typescript": "^${tsVersion}"\` — \`[显式]\`)`);

  // 6. 写回文档
  writeFile(docPath, enhanced);
}
```
