# 本轮修复质量复核

范围：`final-source-manifest.json` 中本轮 22 个 source/test 文件及修复文档。其他任务的 Skill 入口、eval 迁移与已暂存内容未被本轮清理或重写。

主 owner 读取 spec-simplify-code 三份完整 rubric 后，在当前上下文按 reuse、quality、efficiency 串行审视本轮实现。共享 dirty tree 与入口文档存在重叠，不进行全文件自动改写；这是 inline 检查，不是三个独立 reviewer。已授权的两个 fresh-source worker 另行审查出口与 runtime，继承已有任务上下文，不称盲评或真实宿主评测。

- Reuse：planExecutionAdvice 放在既有 mode-policy owner，由单仓和 workspace summary 共用；未新增 schema、命令生成框架或第二套 mode policy。Python 快照 hash/path 检查无同目录等价工具可直接替代。
- Quality：projection gate 的顺序先 target/authority、后父目录只读分流、再 mutation preflight。snapshot v2 将显式 included 集合与字节固定；v1 要求重建。非法结构、计数与编码保持 unknown，不伪造无修改。无须追加抽象。
- Efficiency：只读取显式 task-owned untracked，不扫描全仓 untracked；plan 共用纯文本建议，无新 provider 调用或后台任务。文件摘要按本地文件全文读取，超大二进制/恶意并发文件系统不是本次性能与原子性保证。

本次简化新增改动为 0（reuse 0 / quality 0 / efficiency 0）；保留验证、路径安全和前后 stat，不以行数减少牺牲边界。重叠入口的全文件 simplify 明确跳过，仅核查本轮窄 patch。

fresh-source 出口复核发现 2 项相关缺口，主 owner 已修复并执行 2 红 → 32 绿；reviewer 增量回读源码及日志后关闭。Runtime reviewer 未发现新增 confirmed 缺陷。详见同目录两份 fresh-source 报告；完整回归结果见 checks.jsonl 与最终修复报告。

本轮未提交、推送、发布或刷新宿主 runtime。prose 约定不是宿主强制 primitive；真实模型是否遵循这些规则仍需单独行为评测。
