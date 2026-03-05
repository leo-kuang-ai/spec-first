# 参数约束与示例

> Init Skill 的参数格式规则与使用示例

---

## feat 参数

### 格式规则

**正则表达式**: `^[A-Z][A-Z0-9]{0,15}$`

**规则说明**:
- 必须以大写字母开头
- 只能包含大写字母和数字
- 长度 1-16 个字符

### 有效示例

```
✅ AUTH          # 认证
✅ REPORT        # 报表
✅ URPT          # 用户报表
✅ API2          # API v2
✅ PAYMENT       # 支付
✅ ORDER         # 订单
```

### 无效示例

```
❌ user-report   # 包含小写字母和连字符
❌ report_v2     # 包含下划线
❌ 用户报表      # 包含中文
❌ auth          # 小写字母
❌ 2AUTH         # 以数字开头
```

---

## mode 参数

### 选项说明

| 值 | 说明 | 适用场景 |
|----|------|----------|
| N | 新功能 (New Feature) | 从零开发新功能 |
| I | 迭代优化 (Iteration) | 优化现有功能 |

### 默认值

**默认**: `N`

### 交互示例

```
请选择 Feature 模式:
1. N - 新功能 (默认)
2. I - 迭代优化

请输入 [1/2] (直接回车选择默认):
```

---

## size 参数

### 选项说明

| 值 | 说明 | 预计工作量 |
|----|------|-----------|
| S | 小型 (Small) | < 2 天 |
| M | 中型 (Medium) | 2-5 天 |
| L | 大型 (Large) | > 5 天 |

### 默认值

**默认**: `M`

### 交互示例

```
请选择 Feature 规模:
1. S - 小型 (< 2 天)
2. M - 中型 (2-5 天，默认)
3. L - 大型 (> 5 天)

请输入 [1/2/3] (直接回车选择默认):
```

---

## platforms 参数

### 格式规则

**来源**: 必须来自 `.spec-first/layer2/*.yaml` 文件名

**格式**: 逗号分隔的平台列表

**约束**:
- 至少选择 1 个平台
- 可选择多个平台
- CLI 会自动去重和排序
- 禁止使用宿主/工具名（claude-code, codex, mcp）

### 有效示例

假设 `.spec-first/layer2/` 包含:
- `h5.yaml`
- `java-backend.yaml`
- `ios.yaml`
- `android.yaml`

```
✅ h5
✅ java-backend
✅ h5,java-backend
✅ ios,android
✅ h5,java-backend,ios
```

### 无效示例

```
❌ web              # 不在 layer2/ 中
❌ claude-code      # 宿主名
❌ codex            # 宿主名
❌ mcp              # 工具名
❌ (空)             # 至少选 1 个
```

### 交互示例

```
请选择平台 (可多选):

可用平台:
[ ] 1. h5
[ ] 2. java-backend
[ ] 3. ios
[ ] 4. android

操作:
- 输入序号切换勾选 (如: 1)
- 输入 a 全选
- 输入 c 清空
- 输入 d 完成

当前已选: (无)

请输入操作:
```

---

## title 参数

### 格式规则

**可选参数**: 如不提供，使用默认值

**默认值**: `Feature {feat}`

### 示例

```
✅ 用户认证功能
✅ 报表系统优化
✅ API v2 升级
✅ (空，使用默认)
```

---

## feature-id 参数

### 格式规则

**可选参数**: 如不提供，自动生成

**自动生成格式**: `{PREFIX}-{DATE}-{FEAT}-{SEQ}`

**示例**:
- `FSREQ-20260305-AUTH-001`
- `FEAT-20260305-REPORT-001`

### 手动指定

```
✅ FEAT-20260305-001
✅ CUSTOM-ID-001
```

---

## bootstrap 参数

### 选项说明

| 值 | 说明 |
|----|------|
| 是 | 执行宿主 Preflight 检查（MCP + skills） |
| 否 | 仅项目内初始化（默认） |

### 默认值

**默认**: 否

### 交互示例

```
是否执行宿主环境检查？
- 是: 检查并自动修复 MCP/skills 配置
- 否: 仅初始化项目（推荐）

请输入 [y/N] (直接回车选择默认):
```

---

## 完整参数示例

### 示例 1: 最小参数

```bash
spec-first init \
  --feat AUTH \
  --mode N \
  --size M \
  --platforms h5
```

### 示例 2: 完整参数

```bash
spec-first init \
  --feat REPORT \
  --mode I \
  --size L \
  --platforms h5,java-backend \
  --title "报表系统优化" \
  --feature-id FEAT-20260305-001 \
  --bootstrap
```

### 示例 3: 多平台

```bash
spec-first init \
  --feat ORDER \
  --mode N \
  --size M \
  --platforms h5,ios,android,java-backend
```
