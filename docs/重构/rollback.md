# spec-first 重构回滚方案

> 适用工程：`/Users/kuang/Desktop/ops/spec-first`
>
> 当前事实：
> - 本工程已删除 `.git`
> - 不能依赖 Git commit / reset / revert 做阶段回退
> - 回滚必须基于目录级快照

## 1. 回滚原则

- 每个阶段开始前做一次完整目录快照
- 每个阶段结束并验证通过后，再做一次新快照
- 不跨阶段混改；一旦失败，回退到最近已验证快照
- 历史 `.spec-first/` 资料与新 `.spec-first/` 运行资产分开处理

## 2. 快照策略

### 命名规则

建议快照目录：

```bash
/Users/kuang/Desktop/ops/spec-first.backup.<type>-<stage>.<timestamp>
```

示例：

```bash
/Users/kuang/Desktop/ops/spec-first.backup.pre-S1.20260325-121500
/Users/kuang/Desktop/ops/spec-first.backup.post-S1.20260325-143000
/Users/kuang/Desktop/ops/spec-first.backup.emergency-S2.20260325-151200
```

字段说明：

- `type`：`pre` / `post` / `emergency`
- `stage`：`S1` / `S2` / `S3` / `S4`
- `timestamp`：`YYYYMMDD-HHMMSS`

### 快照命令

执行前：

```bash
cp -R /Users/kuang/Desktop/ops/spec-first /Users/kuang/Desktop/ops/spec-first.backup.pre-S1.$(date +%Y%m%d-%H%M%S)
```

阶段完成后：

```bash
cp -R /Users/kuang/Desktop/ops/spec-first /Users/kuang/Desktop/ops/spec-first.backup.post-S1.$(date +%Y%m%d-%H%M%S)
```

建议在每个快照目录中写入元数据文件：

```json
{
  "snapshotName": "post-S1.20260325-143000",
  "stage": "S1",
  "type": "post",
  "createdAt": "2026-03-25T14:30:00+08:00",
  "creator": "kuang",
  "repoMode": "filesystem-only",
  "protocolBaseline": "spec-first",
  "nodeVersion": "vXX",
  "pnpmVersion": "vXX"
}
```

建议由 `scripts/create-snapshot.sh` 统一生成快照和 `.snapshot-meta.json`，不要手工维护元数据。

### 保留策略

- 至少保留：
  - 一个初始基线快照
  - 每阶段完成快照
  - 当前正在施工前的最近快照

### 已验证样例

2026-03-25 已完成一次真实基线演练：

- 快照：`/Users/kuang/Desktop/ops/spec-first.backup.pre-S1.20260325-131252`
- 元数据：`.snapshot-meta.json` 已生成并验证
- 对比结果：与当前工程 `diff-snapshots.sh` 对比无差异
- 恢复结果：`test-rollback.sh` 已通过依赖安装、构建、CLI smoke check、lint、typecheck

这份 `pre-S1` 快照可作为阶段 1 开工前的已验证回滚点。

## 3. 阶段级回滚点

### 模块字母与执行阶段映射

- 阶段 1：A + B
- 阶段 2：C + D
- 阶段 3：E + F
- 阶段 4：G + H

快照命名约定：

- `pre-S1` / `post-S1`
- `pre-S2` / `post-S2`
- `pre-S3` / `post-S3`
- `pre-S4` / `post-S4`

### 阶段 1：协议底座

范围：

- 品牌常量
- 包名
- CLI 名称
- 路径根常量

失败信号：

- `spec-first` CLI 无法启动
- 路径常量混乱，`init/update` 直接报错

回滚动作：

- 直接回退到 `pre-S1` 快照

原因：

- 阶段 1 是所有后续模块的根，一旦坏掉，没有增量修复意义

### 阶段 2：模板源与平台出口

范围：

- `templates/spec-first`
- 平台配置器
- 平台模板命名规则

失败信号：

- 模板源无法加载
- 生成物目录结构错误
- 某些平台仍输出旧协议

回滚动作：

- 回退到 `pre-S2` 快照
- 不建议只手工回滚单个平台，除非已明确定位为局部差错

原因：

- 这一阶段文件分布广，手工单点回滚容易遗漏

### 阶段 3：项目根与 migration 切换

范围：

- 项目根 `.spec-first/`
- dogfooding 副本
- migration 重建

失败信号：

- 项目根副本与模板源不一致
- `.spec-first/` 无法正常运行
- update / migration 逻辑损坏

回滚动作：

- 删除新生成的 `.spec-first/`
- 回退到 `pre-S3` 快照

原因：

- 这是从“模板层”落地到“项目层”的关键切换点

### 阶段 4：文档与质量封板

范围：

- README / marketplace / assets
- tests / scan scripts / CI

失败信号：

- 文档与实现不一致
- 测试/扫描大面积失败
- CI 规则错误阻断正常流程

回滚动作：

- 优先局部回滚文档和测试工件
- 如出现系统性错误，回退到 `pre-S4` 快照

原因：

- 这一阶段以收口为主，适合优先局部修复，最后再考虑整阶段回退

## 4. 回滚操作手册

### 全量回滚

1. 确认目标快照目录
2. 将当前坏状态工程改名保留
3. 把目标快照复制回原路径

示例：

```bash
mv /Users/kuang/Desktop/ops/spec-first /Users/kuang/Desktop/ops/spec-first.failed.$(date +%Y%m%d-%H%M%S)
cp -R /Users/kuang/Desktop/ops/spec-first.backup.post-S1.20260325-143000 /Users/kuang/Desktop/ops/spec-first
```

### 局部回滚

适用场景：

- 只坏了文档
- 只坏了某个平台模板
- 只坏了某个验证脚本

原则：

- 只在问题边界非常清楚时使用
- 如果涉及路径协议、模板源、dogfooding、副本同步，优先整阶段回滚

### 快照对比工具

建议提供：

- `scripts/diff-snapshots.sh`

默认行为：

- 使用 `diff -qr` 做摘要对比
- 排除 `node_modules`
- 排除 `.snapshot-meta.json`
- 支持将完整差异输出到文件供人工审查

用途：

- 阶段完成后对比 `pre-Sx` 与 `post-Sx`
- 回滚前确认当前坏状态与最近稳定快照的差异范围

### 恢复测试

建议提供：

- `scripts/test-rollback.sh`

恢复测试分两层执行：

第一层：快照可恢复性

- 快照目录可复制到临时目录
- 依赖可安装
- CLI 基础入口可启动，例如 `pnpm -s build` 或 `node dist/... --help`

第二层：项目有效性

- `pnpm lint`
- `pnpm typecheck`
- 必要的测试命令

原则：

- 先验证“快照可恢复”
- 再验证“项目仍有效”
- 不把业务测试失败和快照损坏混为一谈

## 5. 历史资料保护

本次重构前，旧 `.spec-first/` 下存在历史任务、workspace journal、spec 资料。

要求：

- 在任何阶段回滚前，不删除旧历史资料快照
- 历史资料迁档应单独备份

建议归档：

```bash
cp -R /Users/kuang/Desktop/ops/spec-first/.spec-first /Users/kuang/Desktop/ops/spec-first.legacy-spec.$(date +%Y%m%d-%H%M%S)
```

## 6. 回滚决策规则

### 阶段回滚决策树

```text
失败发生
  |
  v
是否影响 CLI 启动?
  |
  +-- 是 --> 立即整阶段回滚
  |
  +-- 否 --> 是否影响协议根?
              |
              +-- 是 --> 立即整阶段回滚
              |
              +-- 否 --> 是否影响多个平台?
                          |
                          +-- 是 --> 整阶段回滚
                          |
                          +-- 否 --> 尝试局部修复
                                      |
                                      +-- 修复失败 --> 整阶段回滚
                                      |
                                      +-- 修复成功 --> 继续
```

### 应立即整阶段回滚的情况

- CLI 无法启动
- `.spec-first/` 根协议损坏
- 模板源目录重命名后无法被加载
- 多个平台同时生成错误结构
- migration 逻辑导致 update 完全不可用

### 可以局部修复的情况

- 单篇 README 文案错误
- 单个平台模板文案漏改
- 单个测试断言失效
- 某个扫描脚本误报

## 7. 阶段检查清单

每阶段结束前必须确认：

- 是否已生成阶段快照
- 是否已写入 `.snapshot-meta.json`
- 是否完成 `diff-snapshots.sh` 摘要对比
- 是否已完成该阶段最小验证
- 是否记录了本阶段改动范围
- 是否明确知道下一阶段依赖什么

## 8. 最低执行要求

如果不满足以下条件，不应进入下一阶段：

- 没有当前阶段前快照
- 当前阶段验证未完成
- 上一阶段已知问题未收敛

## 9. 一句话规则

没有 Git 历史时，回滚不是“改回来”，而是“恢复到上一份已验证快照”。本次重构必须严格按阶段推进，不能一次性铺开再试图人工收拾残局。
