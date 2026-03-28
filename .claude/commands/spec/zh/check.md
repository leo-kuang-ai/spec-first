# 代码检查

检查你刚写的代码是否遵循开发规范。

执行以下步骤：

1. **识别变更的文件**：
   ```bash
   git diff --name-only HEAD
   ```

2. **根据变更的文件路径确定适用的规范模块**：
   ```bash
   python3 ./.spec-first/scripts/get_context.py --mode packages
   ```

3. **阅读每个相关模块的规范索引**：
   ```bash
   cat .spec-first/spec/<package>/<layer>/index.md
   ```
   遵循索引中的 **"Quality Check"** 部分。

4. **阅读质量检查部分引用的具体规范文件**（例如 `quality-guidelines.md`、`conventions.md`）。索引不是目标——它指向实际的规范文件。阅读这些文件并根据它们审查你的代码。

5. **对受影响的包运行 lint 和 typecheck**。

6. **报告任何违规**并在发现时修复它们。
