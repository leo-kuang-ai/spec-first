# spec-first 重构依赖图（DAG）

> 适用工程：`/Users/kuang/Desktop/ops/spec-first`
>
> 本文档服务于 [spec-first 完整重构方案](/Users/kuang/Desktop/ops/spec-first/docs/重构/2026-03-25-spec-first-完整重构方案.md)，用于明确模块间依赖，避免执行顺序错误。

## 1. 模块定义

### A：品牌与协议常量

范围：

- `packages/cli/src/config/brand.ts`
- `packages/cli/src/constants/paths.ts`
- `packages/cli/src/constants/version.ts`
- `package.json`
- `packages/cli/package.json`
- `packages/cli/src/index.ts`
- `packages/cli/src/cli/index.ts`

产出：

- 单一真源品牌常量
- `.spec-first/` 根目录常量
- `spec-first` CLI 名与包名生效

### B：CLI 与路径根切换

范围：

- `packages/cli/src/commands/init.ts`
- `packages/cli/src/commands/update.ts`
- `packages/cli/src/utils/project-detector.ts`
- `packages/cli/src/utils/template-hash.ts`
- `packages/cli/src/utils/template-fetcher.ts`
- `packages/cli/src/configurators/workflow.ts`
- `packages/cli/src/configurators/index.ts`

产出：

- 运行时协议根切到 `.spec-first/`
- `spec-first init/update` 基础行为成立
- 遇到 `.spec-first/` 明确拒绝而非兼容运行

### C：模板源物理重命名与核心模板改造

范围：

- `packages/cli/src/templates/spec` -> `packages/cli/src/templates/spec-first`
- 核心 workflow / config / scripts / hooks / multi_agent / scripts-shell-archive

产出：

- 模板源脱离 spec-first 语义
- 生成新协议工作流目录和脚本

### D：平台配置器与平台模板切换

范围：

- `packages/cli/src/types/ai-tools.ts`
- `packages/cli/src/configurators/*.ts`
- `packages/cli/src/templates/{claude,cursor,iflow,opencode,codex,kilo,kiro,gemini,antigravity,qoder,codebuddy}/**/*`

产出：

- 各平台命令前缀统一到 `spec`
- 各平台路径协议统一到 `.spec-first/`
- 平台命名映射规则生效

### E：项目内 dogfooding 副本重建

范围：

- `.claude/**/*`
- `.cursor/**/*`
- `.opencode/**/*`
- `.codex/**/*`
- `AGENTS.md`
- 根目录新 `.spec-first/**/*`

产出：

- 项目根自用副本与模板源一致
- 不再依赖旧 `.spec-first/` 运行

### F：迁移系统重建

范围：

- `packages/cli/src/migrations/index.ts`
- `packages/cli/src/types/migration.ts`
- `packages/cli/src/migrations/manifests/*`
- `packages/cli/src/migrations/legacy/*`
- `.spec-first/protocol.json`

产出：

- `spec-first` 自身迁移体系
- spec-first 历史迁移资料归档但不参与运行

### G：文档、品牌资产、Marketplace

范围：

- `README.md`
- `README_CN.md`
- `CONTRIBUTING.md`
- `CONTRIBUTING_CN.md`
- `COPYRIGHT`
- `marketplace/**/*`
- `assets/*`
- 说明性 `docs/**/*`

产出：

- 对外品牌完全切到 `spec-first`
- 对外安装与使用说明全部基于新协议

### H：测试、扫描、CI 校验

范围：

- `packages/cli/test/**/*`
- `packages/cli/scripts/validate-platforms.js`
- `packages/cli/scripts/scan-legacy-branding.sh`
- `packages/cli/scripts/sync-dogfooding.js`
- `.github/workflows/*.yml`

产出：

- 自动化验证完整
- 测试、残留扫描、平台一致性、dogfooding 同步全部可检查

## 2. 依赖关系

依赖边：

- A -> B
- A -> C
- A -> G
- B -> D
- B -> F
- C -> D
- C -> E
- D -> E
- D -> H
- E -> H
- F -> H
- G -> H

## 3. 可视化图

```text
          A 品牌与协议常量
         /|\ 
        / | \
       v  v  v
      B   C   G
     / \ / \   \
    v  v v  v   v
    D  F D  E   H
     \ |  \ |  /
      \|   \| /
         H
```

更精确地说：

- `A` 是整个重构的根节点，没有它，后续模块没有统一协议真源
- `B` 和 `C` 构成执行骨架
- `D` 依赖 `B + C`
- `E` 依赖 `C + D`
- `F` 依赖 `B`
- `H` 是最终收口模块，依赖 `D/E/F/G`

## 4. 执行顺序建议

### 第一阶段：建立协议底座

顺序：

- A
- B

原因：

- 先收口常量，再改运行时入口
- 如果先改模板或文档，会因为常量未定造成返工

### 第二阶段：切模板源和平台出口

顺序：

- C
- D

原因：

- 模板源是平台模板的上游语义来源
- 平台规则必须建立在新模板源和新路径协议之上

### 第三阶段：切项目根与升级系统

顺序：

- E
- F

原因：

- 项目根 dogfooding 副本应以新模板源和已稳定的平台模板规则为真源
- 迁移系统应建立在新 CLI / 新协议根之上

### 第四阶段：品牌收口与质量封板

顺序：

- G
- H

原因：

- 文档与品牌资产要在协议和平台路径稳定后统一
- 测试、扫描、CI 必须最后封口

## 5. 并行执行边界

可以并行：

- A 完成后，G 可以与 B/C 局部并行，但最终仍要等待 D/E/F 稳定后再收口
- C 与 F 不应并行改同一批路径常量
- G 的品牌文案清理可与 D 平台适配并行，但不能先于命名规则拍板

不建议并行：

- B 和 C 同时大改路径协议
- D 和 E 同时改同一平台副本
- H 与其他模块并行推进后立即锁死测试基线

## 6. 阶段完成门槛

### 阶段 1 完成门槛

- `brand.ts` 已落地
- `.spec-first` 已成为常量真源
- `spec-first` CLI 可正常启动

### 阶段 2 完成门槛

- `templates/spec-first` 已替代旧模板源
- 各平台模板命名规则已统一

### 阶段 3 完成门槛

- 项目根已存在新的 `.spec-first/`
- migration 体系只服务 `spec-first`

### 阶段 4 完成门槛

- 对外文档和资产不再暴露 spec-first 主叙事
- 测试与扫描全部通过

## 7. 关键提醒

- 不要把 `G 文档品牌清理` 提前成第一阶段，它依赖真实协议已经稳定
- 不要在 `C 模板源改造` 之前开始大规模 `E dogfooding 副本重建`
- `H` 不是“边做边跑一下测试”，而是最终封板模块
