# B4-bin-helper-改造包

文档日期：2026-03-22
所属阶段：阶段 B
任务包目标：完成 `bin/gstack-*` helper 脚本层迁移，使公共命令入口、内部自调用和全局状态目录真正切到 `spec-first`

## 1. 任务包定位

`B4` 是阶段 B 缺失的一块主干。

如果没有这个任务包，阶段 B 就只能完成：

- 安装目录改名
- 生成器公共注入改名
- browse runtime 默认目录改名

但不能完成：

- 真正执行时用到的 helper 命令迁移

所以 `B4` 不是补充项，而是阶段 B 闭环成立的必要条件。

## 2. 本任务包覆盖文件

- `bin/gstack-config`
- `bin/gstack-update-check`
- `bin/gstack-slug`
- `bin/gstack-review-log`
- `bin/gstack-review-read`
- `bin/gstack-diff-scope`
- `bin/gstack-telemetry-log`
- `bin/gstack-telemetry-sync`
- `bin/gstack-analytics`
- `bin/gstack-community-dashboard`

视最终命名策略，也包含：

- 旧命令包装层

## 3. 当前已确认的关键问题

这些脚本当前普遍存在三类旧耦合：

1. 命令名前缀仍为 `gstack-*`
2. 默认全局状态目录仍为 `~/.gstack`
3. 脚本之间互相调用仍是 `gstack-*`

典型例子：

- [gstack-config](/Users/kuang/xiaobu/gstack/bin/gstack-config#L1)
- [gstack-update-check](/Users/kuang/xiaobu/gstack/bin/gstack-update-check#L1)

## 4. 目标状态

完成后应满足：

1. 正式 helper 命令统一为 `spec-first-*`
2. 默认状态目录统一为 `~/.spec-first`
3. helper 之间互相调用统一为 `spec-first-*`
4. 与 `setup`、`gen-skill-docs.ts` 的新路径语义保持一致

## 5. 任务拆解

### B4-1 改文件名与 usage

- `gstack-config` -> `spec-first-config`
- `gstack-update-check` -> `spec-first-update-check`
- 其余同理

### B4-2 改默认状态目录

- `~/.gstack` -> `~/.spec-first`

### B4-3 改脚本内部互相调用

- `gstack-config`、`gstack-update-check`、`gstack-telemetry-log` 等互调链路统一替换

### B4-4 评估旧命令兼容层

可选策略：

1. 保留旧命令包装脚本，内部转调新命令
2. 不保留旧命令，只保留旧状态目录兼容

建议：

- 先保留旧状态目录兼容
- 旧命令包装层可作为单独决策项

## 6. 验收标准

1. 新 helper 命令可直接执行
2. 默认落盘到 `~/.spec-first`
3. helper 之间不再依赖 `gstack-*`
4. `setup` 和生成器引用的新命令都能找到真实入口

## 7. 后续关系

`B4` 完成后，阶段 B 的四个任务包才完整：

1. [B1-setup-改造包.md](./B1-setup-%E6%94%B9%E9%80%A0%E5%8C%85.md)
2. [B2-gen-skill-docs-改造包.md](./B2-gen-skill-docs-%E6%94%B9%E9%80%A0%E5%8C%85.md)
3. [B4-bin-helper-改造包.md](./B4-bin-helper-%E6%94%B9%E9%80%A0%E5%8C%85.md)
4. [B3-browse-runtime-改造包.md](./B3-browse-runtime-%E6%94%B9%E9%80%A0%E5%8C%85.md)

