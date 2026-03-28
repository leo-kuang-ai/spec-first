# 开发前准备

在开始任务之前，阅读相关的开发规范。

执行以下步骤：

1. **发现包及其规范层**：
   ```bash
   python3 ./.spec-first/scripts/get_context.py --mode packages
   ```

2. **确定哪些规范适用于你的任务**，基于：
   - 你正在修改哪个包（例如 `cli/`、`docs-site/`）
   - 什么类型的工作（后端、前端、单元测试、文档等）

3. **阅读每个相关模块的规范索引**：
   ```bash
   cat .spec-first/spec/<package>/<layer>/index.md
   ```
   遵循索引中的 **"开发前检查清单"** 部分。

4. **阅读开发前检查清单中列出的具体规范文件**，这些文件与你的任务相关。索引不是目标——它指向实际的规范文件（例如 `error-handling.md`、`conventions.md`、`mock-strategies.md`）。阅读这些文件以了解编码标准和模式。

5. **始终阅读共享指南**：
   ```bash
   cat .spec-first/spec/guides/index.md
   ```

6. 理解你需要遵循的编码标准和模式，然后继续你的开发计划。

此步骤在编写任何代码之前是**强制性的**。
