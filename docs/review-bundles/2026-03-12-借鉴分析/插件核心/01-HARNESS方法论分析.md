### 5. PEP 420 命名空间包架构

**核心设计**:
```
agent-harness/
├── setup.py
└── cli_anything/           # ❌ 无 __init__.py（命名空间包）
    └── gimp/               # ✅ 有 __init__.py（子包）
        ├── __init__.py
        ├── gimp_cli.py
        ├── core/
        ├── utils/
        └── tests/
```

**setup.py 关键配置**:
```python
from setuptools import setup, find_namespace_packages

setup(
    name="cli-anything-gimp",
    packages=find_namespace_packages(include=["cli_anything.*"]),
    entry_points={
        "console_scripts": [
            "cli-anything-gimp=cli_anything.gimp.gimp_cli:main",
        ],
    },
)
```

**优势**:
- 多个 CLI 可共存（cli-anything-gimp + cli-anything-blender）
- 统一命名空间（cli_anything.*）
- 独立安装/卸载
- Agent 可发现所有已安装 CLI

**spec-first 借鉴**:
- 当前是单体架构，扩展需修改核心代码
- 建议引入命名空间包：`spec_first_plugins.*`
- 支持第三方插件生态

### 6. 关键经验教训（Critical Lessons）

#### 6.1 渲染鸿沟（The Rendering Gap）

**问题**: GUI 应用在渲染时才应用特效，直接操作项目文件会丢失特效。

**案例**:
```python
# 问题：MLT 项目文件有滤镜，但用 ffmpeg concat 会忽略
mlt_xml = """
<filter id="brightness">
  <property name="level">1.5</property>
</filter>
"""
# ffmpeg concat demuxer 只读原始媒体 → 特效丢失 ❌

# 解决方案：滤镜转译层
ffmpeg_filter = translate_mlt_to_ffmpeg(mlt_filters)
# -filter_complex "eq=brightness=0.2" ✅
```

**spec-first 借鉴**:
- 警惕"中间产物"与"最终产物"的差异
- 验证时必须检查最终产物，不能只检查中间产物

#### 6.2 滤镜转译陷阱

**常见问题**:
1. **重复滤镜合并**: ffmpeg 不允许同一滤镜出现两次
2. **流排序约束**: concat 要求交错排序 `[v0][a0][v1][a1]`
3. **参数空间差异**: MLT brightness 1.15 ≠ ffmpeg eq=brightness=0.06
4. **无法映射的特效**: 需要优雅降级

**spec-first 借鉴**:
- 跨系统集成时注意"语义映射"问题
- 建立明确的转换规则和边界情况处理

#### 6.3 时间码精度

**问题**: 非整数帧率（29.97fps）导致累积误差

**解决方案**:
```python
# ❌ 错误：使用 int() 截断
frames = int(seconds * 29.97)

# ✅ 正确：使用 round()
frames = round(seconds * 29.97)

# ✅ 时间码显示用整数运算
ms = round(frames * fps_den * 1000 / fps_num)
hours = ms // 3600000
minutes = (ms % 3600000) // 60000
seconds = (ms % 60000) // 1000

# ✅ 测试允许 ±1 帧容差
assert abs(actual_frames - expected_frames) <= 1
```

**spec-first 借鉴**:
- 浮点运算的精度问题需要显式处理
- 测试时允许合理的容差范围

### 7. 核心原则总结

```yaml
原则1_真实软件:
  规则: CLI 必须调用真实应用，不能重新实现
  验证: 测试必须产生真实产物（PDF、视频、图像）

原则2_硬依赖:
  规则: 软件是必需的，不是可选的
  验证: 缺失时报错并给出安装指令

原则3_原生格式:
  规则: 直接操作应用的原生项目文件
  实现: 解析和修改 ODF、MLT XML、SVG 等

原则4_验证输出:
  规则: 不信任退出码，必须验证输出
  方法: 魔术字节、结构检查、内容分析

原则5_失败明确:
  规则: Agent 需要明确的错误信息
  实现: 清晰的错误消息 + 修复建议

原则6_幂等性:
  规则: 同一命令执行两次应该安全
  实现: 检查状态、避免重复操作

原则7_内省能力:
  规则: 提供 info/list/status 命令
  目的: Agent 先理解状态再行动

原则8_JSON输出:
  规则: 所有命令支持 --json
  目的: Agent 可机器解析
```

## spec-first 可借鉴的核心模式

### 模式 1: 测试先行文档（TEST.md）

**当前问题**: spec-first 的测试往往是实现后才考虑

**借鉴方案**:
```
03_plan 阶段:
  - 生成 TEST.md（测试计划）
  - 列出测试文件、测试数量、覆盖场景

04_implement 阶段:
  - 根据 TEST.md 实现测试

05_verify 阶段:
  - 运行测试
  - 将结果追加到 TEST.md
```

### 模式 2: 分层测试策略

**当前问题**: 缺少真实环境验证和用户视角测试

**借鉴方案**:
```
Layer 1: 单元测试（已有）
Layer 2: 集成测试（已有）
Layer 3: 真实环境 E2E（新增）
  - 真实编译/运行
  - 真实数据库/服务
  - 验证最终产物
Layer 4: 用户视角测试（新增）
  - 测试已安装的 CLI
  - 从用户角度验证
```

### 模式 3: 输出验证方法论

**当前问题**: 可能只检查"是否完成"，不验证"输出正确性"

**借鉴方案**:
```python
# gate-engine 增强
def verify_implementation(task):
    # 1. 检查完成状态
    assert task.status == "completed"

    # 2. 验证输出存在
    assert os.path.exists(task.output_path)

    # 3. 验证输出格式
    assert validate_format(task.output_path)

    # 4. 验证输出内容
    assert validate_content(task.output_path)

    # 5. 打印供人工检查
    print(f"Output: {task.output_path}")
```

### 模式 4: 命名空间插件架构

**当前问题**: 单体架构，扩展困难

**借鉴方案**:
```
spec_first/              # 核心包
spec_first_plugins/      # 命名空间包（无 __init__.py）
  ├── frontend/          # 前端开发插件
  ├── backend/           # 后端开发插件
  ├── data_pipeline/     # 数据处理插件
  └── ml_training/       # ML 训练插件
```

## 总结

HARNESS.md 的核心价值在于：
1. **可复用方法论**: 从 9 个项目提炼的通用模式
2. **真实性验证**: 零容忍的真实环境验证
3. **分层测试**: 4 层测试覆盖不同维度
4. **经验驱动**: 记录了关键陷阱和解决方案
5. **可扩展架构**: 命名空间包支持生态

这些模式可以直接应用到 spec-first，提升其工程成熟度。
