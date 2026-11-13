验证器通过（frontmatter 提升门 OK，claims 0 flags）。语义批准（inline）：两段内容均被 `src/auth.js` 的 `keepOfflineBackup: true` / `verifyAfterUpdate: true` 与注释直接支持；old 的失效条件（"不再保留离线凭据"）未触发；锚点 `#离线恢复` 在候选 new.md 中存在。

按发布顺序执行：重检快照 → 同目录临时文件 → 原子 rename → 验证实际目标：
