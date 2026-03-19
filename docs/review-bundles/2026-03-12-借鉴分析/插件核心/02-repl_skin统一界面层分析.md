# repl_skin.py 统一界面层深度分析

## 文件概览

- **文件**: `/cli-anything-plugin/repl_skin.py`
- **行数**: 498 行
- **性质**: 统一的 REPL 用户界面层，所有 CLI 共享

## 核心价值

repl_skin.py 提供了一个可复用的终端界面组件库，确保所有 CLI-Anything 生成的工具拥有一致的品牌体验和交互模式。

## 架构设计亮点

### 1. 品牌系统设计

**颜色体系**:
```python
# 品牌色
_CYAN = "\033[38;5;80m"       # cli-anything 品牌青色
_ICON = f"{_CYAN}{_BOLD}◆{_RESET}"  # 品牌图标

# 软件特定强调色
_ACCENT_COLORS = {
    "gimp":        "\033[38;5;214m",   # 暖橙色
    "blender":     "\033[38;5;208m",   # 深橙色
    "inkscape":    "\033[38;5;39m",    # 亮蓝色
    # ... 每个软件有独特颜色
}
```

**设计理念**:
- 统一的品牌标识（青色 + 菱形图标）
- 每个软件有独特的强调色（保持个性）
- 状态色语义化（绿色=成功、红色=错误、黄色=警告）

**spec-first 借鉴**:
- 引入统一的品牌色系统
- 不同 skill 可以有独特的强调色
- 状态输出标准化（成功/失败/警告/信息）

### 2. 终端能力检测

```python
def _detect_color_support(self) -> bool:
    """智能检测终端是否支持颜色"""
    if os.environ.get("NO_COLOR"):
        return False
    if os.environ.get("CLI_ANYTHING_NO_COLOR"):
        return False
    if not hasattr(sys.stdout, "isatty"):
        return False
    return sys.stdout.isatty()
```

**优势**:
- 尊重用户环境变量（NO_COLOR 标准）
- 自动降级到纯文本（CI/管道环境）
- 提供项目特定的开关（CLI_ANYTHING_NO_COLOR）

**spec-first 借鉴**:
- 当前输出可能在非 TTY 环境下有问题
- 需要智能检测并降级

### 3. 组件化设计

**核心组件清单**:
```python
class ReplSkin:
    # 启动/退出
    print_banner()          # 品牌横幅
    print_goodbye()         # 退出消息

    # 提示符
    prompt()                # 构建提示符字符串
    prompt_tokens()         # prompt_toolkit 格式
    get_prompt_style()      # 样式定义

    # 消息输出
    success(msg)            # ✓ 成功消息
    error(msg)              # ✗ 错误消息
    warning(msg)            # ⚠ 警告消息
    info(msg)               # ● 信息消息
    hint(msg)               # 提示消息
    section(title)          # 章节标题

    # 状态显示
    status(label, value)    # 键值对
    status_block(items)     # 状态块
    progress(cur, total)    # 进度条

    # 结构化输出
    table(headers, rows)    # 表格
    help(commands)          # 帮助列表
```

**设计模式**: Facade 模式 - 统一接口封装复杂的终端操作

### 4. 动态提示符设计

```python
def prompt(self, project_name="", modified=False, context=""):
    """构建动态提示符

    示例输出:
    ◆ gimp ❯                    # 无项目
    ◆ gimp [poster.xcf] ❯       # 有项目
    ◆ gimp [poster.xcf*] ❯      # 有未保存修改
    """
    parts = []
    parts.append(f"{_CYAN}◆{_RESET} ")
    parts.append(self._c(self.accent + _BOLD, self.software))

    if project_name or context:
        ctx = context or project_name
        mod = "*" if modified else ""
        parts.append(f" [{ctx}{mod}]")

    parts.append(" ❯ ")
    return "".join(parts)
```

**设计亮点**:
- 状态可见（项目名、修改状态）
- 上下文感知（可显示额外上下文）
- 视觉层次清晰（图标→软件名→上下文→箭头）

**spec-first 借鉴**:
- 当前 CLI 提示符较简单
- 可以显示当前 Feature、Stage、修改状态

### 5. 表格渲染引擎

```python
def table(self, headers, rows, max_col_width=40):
    """智能表格渲染

    特性:
    - 自动计算列宽
    - 支持最大宽度限制
    - 使用 Unicode 盒绘字符
    - 颜色分层（标题/分隔符/内容）
    """
    # 计算列宽
    col_widths = [min(len(h), max_col_width) for h in headers]
    for row in rows:
        for i, cell in enumerate(row):
            col_widths[i] = min(max(col_widths[i], len(str(cell))), max_col_width)

    # 渲染标题
    header_cells = [self._c(_CYAN + _BOLD, pad(h, col_widths[i]))
                    for i, h in enumerate(headers)]
    print(f"  {' │ '.join(header_cells)}")

    # 分隔线
    print(f"  {'───'.join([_H_LINE * w for w in col_widths])}")

    # 数据行
    for row in rows:
        cells = [self._c(_LIGHT_GRAY, pad(str(cell), col_widths[i]))
                 for i, cell in enumerate(row)]
        print(f"  {' │ '.join(cells)}")
```

**spec-first 借鉴**:
- 当前输出主要是纯文本
- 可以用表格展示追溯矩阵、任务列表、测试结果

### 6. prompt_toolkit 集成

```python
def create_prompt_session(self):
    """创建 prompt_toolkit 会话（支持历史记录、自动补全）"""
    from prompt_toolkit import PromptSession
    from prompt_toolkit.history import FileHistory

    return PromptSession(
        history=FileHistory(self.history_file),
        style=self.get_prompt_style(),
        enable_history_search=True,
    )
```

**优势**:
- 持久化命令历史（~/.cli-anything-<software>/history）
- 支持历史搜索（Ctrl+R）
- 自动补全支持
- 多行编辑

**spec-first 借鉴**:
- 当前 CLI 可能缺少历史记录
- 可以引入 prompt_toolkit 提升交互体验

### 7. 消息分级系统

```python
# 4 级消息 + 图标
success(msg)   # ✓ 绿色 - 操作成功
error(msg)     # ✗ 红色 - 错误（输出到 stderr）
warning(msg)   # ⚠ 黄色 - 警告
info(msg)      # ● 蓝色 - 信息
hint(msg)      # 灰色 - 提示
```

**设计细节**:
- error 输出到 stderr（符合 Unix 惯例）
- 图标 + 颜色双重编码（无色环境仍可区分）
- 缩进对齐（视觉一致性）

## spec-first 可借鉴的核心模式

### 模式 1: 统一输出层

**当前问题**: 不同 skill 的输出格式不一致

**借鉴方案**:
```python
# src/core/ui/output_skin.py
class OutputSkin:
    def __init__(self, feature_id, stage):
        self.feature = feature_id
        self.stage = stage
        self.accent = STAGE_COLORS.get(stage)

    def print_banner(self):
        """显示 Feature 和 Stage 信息"""

    def success(self, msg):
        """✓ 成功消息"""

    def error(self, msg):
        """✗ 错误消息"""

    def table(self, headers, rows):
        """表格输出（追溯矩阵、任务列表）"""

    def progress(self, current, total, label):
        """进度条（阶段进度、任务进度）"""
```

### 模式 2: 状态感知提示符

**当前问题**: CLI 提示符不显示上下文

**借鉴方案**:
```bash
# 无 Feature
◆ spec-first ❯

# 有 Feature
◆ spec-first [FSREQ-001] ❯

# 有 Feature + Stage
◆ spec-first [FSREQ-001 · 03_plan] ❯

# 有未保存修改
◆ spec-first [FSREQ-001 · 03_plan*] ❯
```

### 模式 3: 组件化输出

**当前问题**: 输出逻辑分散在各个 skill 中

**借鉴方案**:
```python
# 所有 skill 使用统一的输出组件
from spec_first.core.ui import OutputSkin

skin = OutputSkin(feature_id, stage)
skin.section("追溯矩阵")
skin.table(["ID", "类型", "状态"], rows)
skin.success("矩阵已更新")
```

### 模式 4: 终端能力检测

**当前问题**: 可能在 CI 环境输出 ANSI 码

**借鉴方案**:
```python
def _detect_color_support():
    if os.environ.get("NO_COLOR"):
        return False
    if os.environ.get("SPEC_FIRST_NO_COLOR"):
        return False
    return sys.stdout.isatty()
```

## 实现建议

### 阶段 1: 创建输出层（1-2 天）

```
src/core/ui/
├── __init__.py
├── output_skin.py      # 核心输出组件
├── colors.py           # 颜色定义
└── components.py       # 表格、进度条等组件
```

### 阶段 2: 迁移现有输出（2-3 天）

- 识别所有 print() 调用
- 替换为 OutputSkin 方法
- 统一消息格式

### 阶段 3: 增强交互（1-2 天）

- 引入 prompt_toolkit
- 添加命令历史
- 实现动态提示符

## 总结

repl_skin.py 的核心价值：
1. **品牌一致性**: 所有 CLI 共享统一的视觉语言
2. **组件化**: 可复用的输出组件库
3. **智能降级**: 自动适应终端能力
4. **用户体验**: 清晰的视觉层次和状态反馈

这些模式可以显著提升 spec-first 的用户体验和专业度。
