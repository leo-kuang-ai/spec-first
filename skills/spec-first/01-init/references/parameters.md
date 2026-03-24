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

---

## platforms 参数

### 格式规则

**来源**: 扫描 `.spec-first/layer2/*.yaml` 文件，读取每个文件的 `platform` 字段值

**关键**: 平台标识以 `platform` 字段值为准，文件名仅用于扫描发现

**格式**: 逗号分隔的平台列表

**约束**:
- 至少选择 1 个平台
- 可选择多个平台
- CLI 会自动去重和排序
- 禁止使用宿主/工具名（claude-code, codex, mcp）

### 有效示例

假设 `.spec-first/layer2/` 包含以下文件，且每个文件首字段为 `platform`:
- `h5.yaml` → `platform: h5`
- `java-backend.yaml` → `platform: java-backend`
- `ios.yaml` → `platform: ios`
- `android.yaml` → `platform: android`

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

| 字段 | 说明 | 示例 |
|------|------|------|
| PREFIX | ID 前缀，默认 `FSREQ` | `FSREQ` / `FEAT` |
| DATE | 创建日期 (YYYYMMDD) | `20260324` |
| FEAT | Feature 缩写 | `AUTH` / `REPORT` |
| SEQ | 当日序号，3位递增 | `001` / `002` |

**SEQ 递增规则**:
- 扫描 `specs/` 下同前缀、同日期、同 FEAT 的 Feature
- 取最大序号 +1，无则从 `001` 开始

### 默认前缀选择

| 场景 | 前缀 | 示例 |
|------|------|------|
| 常规 Feature | `FSREQ` | `FSREQ-20260324-AUTH-001` |
| 简化模式 | `FEAT` | `FEAT-20260324-REPORT-001` |

### 特殊 ID：Baseline

**格式**: `FSREQ-19700101-LEGACY-BASELINE`

| 字段 | 值 | 说明 |
|------|-----|------|
| PREFIX | `FSREQ` | 固定 |
| DATE | `19700101` | 固定（表示系统起点） |
| FEAT | `LEGACY` | 固定（表示存量） |
| SEQ | `BASELINE` | 固定（非数字，表示基线） |

### 手动指定

```
✅ FEAT-20260305-001           # 简化格式
✅ FSREQ-20260305-AUTH-002     # 完整格式
✅ CUSTOM-ID-001               # 自定义格式
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
