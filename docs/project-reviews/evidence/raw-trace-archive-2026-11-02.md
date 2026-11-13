# 原始 trace 归档说明（2026-11-02）

## 归档体

- **路径（机器本地）**：`~/spec-first-evidence-archives/spec-first-review-raw-traces-20261102.tar.zst`
- **SHA-256**：`5836f012a0a163e93f0699ea1068762baa9811e963a2f70510f6eb6f3b128b21`
- **大小**：14 MB（原始约 625 MB，zstd -10）
- **内容**：`/tmp/batch1`、`/tmp/batch2`、`/tmp/batch4`、`/tmp/spec-first-batch5-runs`、`/tmp/spec-first-batch5-r2` 的全部评测原始件——8,429 个文件（各批 rollout/session transcript、stdout.json、last-message、运行 workspace 副本、结果 JSON 与日志；含 F-S04-04 盲评裁决所引用的全部 trace 与第五批 r2–r4 全部产物）。

## 范围与排除（边界）

- **排除**：全部 `iso-*/home` 隔离家目录（各 iso 目录仅含 home；可能残留裁剪后的 provider 配置，按既有边界不整体复制）、`.DS_Store`、`__pycache__`、`*.pyc`。
- **未包含**：散布在 `/private/var/folders/.../T/skill-up-*` 的运行时临时 workspace（其 git 状态与文件内容已在 outputs/workspace 副本与证据文档中记录）；`.claude`/`.codex` 等宿主真实配置从未进入任何源目录。
- `/tmp` 原件保持原位未删除；本归档为增备，防系统清理 `/tmp` 后唯一全量原件丢失。

## 完整性核验

- **全量清单**：[raw-trace-archive-manifest-2026-11-02.txt](raw-trace-archive-manifest-2026-11-02.txt)（8,429 项路径+SHA-256，与归档内路径一一对应；同一份清单也存于归档旁 `~/spec-first-evidence-archives/MANIFEST-2026-11-02.txt`，sha256 前缀 `f7884b168425e7c7`）。
- **整档校验**：`shasum -a 256` 对 tar.zst 比对上述哈希。
- **抽取校验**：解压后 `shasum -a 256 -c raw-trace-archive-manifest-2026-11-02.txt`（在解压根目录执行；清单路径以 `batch1/`、`spec-first-batch5-r2/` 等为前缀）。
- 构建时已抽验：条目数 11,439（含目录项）= 8,429 文件 + 目录；关键 trace（batch2/repro、r4 review 双臂）在位；任取一文件解压首行与源一致。
- 清单只绑定版本不等于内容备份；内容备份即本归档体本身。哈希与备份都不证明 provider 侧行为，重放仍需原 fixture、工具版本、可达服务与新的费用授权。
