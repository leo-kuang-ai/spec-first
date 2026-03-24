# 常见问题排查

> Init Skill 执行过程中常见问题及解决方案

---

## 背景输入问题

### Q: 提示"缺失 00-first runtime 真源"

**现象**:
```
⚠️ 优先背景输入不完整: 缺失 00-first runtime 真源
```

**原因**: `.spec-first/runtime/first/` 目录不存在或缺少必要文件

**解决方案**:
1. 运行 `/spec-first:first` 重新生成 runtime 真源
2. 或选择以降级模式继续初始化（后续补跑 first）

---

### Q: 背景状态显示 `degraded` 或 `blind`

**现象**:
```
当前背景状态: background_input_status = degraded
```

**含义**:
- `degraded`: 部分 first 资产缺失
- `blind`: 完全没有 first 资产

**解决方案**:
- 允许继续初始化，但建议在完成后运行 `/spec-first:first`

---

## 平台配置问题

### Q: 平台列表为空

**现象**:
```
可用平台: (无)
需要哪些平台？[h5, java-backend, ios, android, admin-frontend]
```

**原因**: `.spec-first/layer2/` 目录不存在或为空

**解决方案**:
1. 按提示选择需要的平台
2. 或手动创建平台 YAML 文件（见 [prerequisites.md](prerequisites.md#平台-yaml-模板示例)）

---

### Q: 平台 YAML 校验失败

**现象**:
```
❌ 平台配置错误: h5.yaml 缺少 platform 字段
```

**原因**: YAML 文件第一个字段必须是 `platform`

**解决方案**:
```yaml
# 错误 ❌
name: h5
label: H5 移动端

# 正确 ✅
platform: h5
label: H5 移动端
```

---

## 参数校验问题

### Q: feat 参数校验失败

**现象**:
```
❌ feat 格式无效: user-report
```

**原因**: feat 必须符合正则 `^[A-Z][A-Z0-9]{0,15}$`

**解决方案**:
```
❌ user-report   # 包含小写字母和连字符
❌ report_v2     # 包含下划线
❌ 用户报表      # 包含中文
❌ auth          # 小写字母
❌ 2AUTH         # 以数字开头

✅ AUTH          # 正确
✅ REPORT        # 正确
✅ URPT          # 正确
✅ API2          # 正确
```

---

### Q: platforms 参数包含非法值

**现象**:
```
❌ 平台 'web' 不在 layer2 中
```

**原因**: platforms 值必须来自 `.spec-first/layer2/*.yaml` 文件中的 `platform` 字段值

**解决方案**:
1. 检查 `layer2/` 目录下存在的 YAML 文件
2. 读取每个文件的 `platform` 字段（首字段），使用该字段值作为平台标识
3. 禁止使用宿主名：`claude-code`、`codex`、`mcp`

**示例**:
```yaml
# h5.yaml
platform: h5    ← 使用这个值，不是文件名
label: H5 移动端
```

---

## 交互流程问题

### Q: 中文输入如何转换为 feat 缩写？

**现象**:
```
用户输入: 首页阶段流转图优化
```

**处理逻辑**:
1. 提取关键词：首页、阶段、流转图
2. 生成英文缩写候选：
   - `HOMEPAGE` - 首页相关功能
   - `FLOWCHART` - 流程图相关功能
   - `STAGEFLOW` - 阶段流转相关功能
3. 用户选择或自定义

---

### Q: 如何跳过 brownfield baseline 创建？

**选择**:
- `[s] 跳过` - 写入 `baselineSkipped: true`，后续直接进入 feature-init

**注意**: 跳过后如需重新创建基线，需手动删除 `config.yaml` 中的 `baselineSkipped` 字段

---

## Feature ID 问题

### Q: Feature ID 格式规则是什么？

**标准格式**: `{PREFIX}-{DATE}-{FEAT}-{SEQ}`

**示例**:
- `FSREQ-20260324-AUTH-001` - 常规 Feature
- `FSREQ-19700101-LEGACY-BASELINE` - 存量项目基线（特殊格式）

**字段说明**:
| 字段 | 说明 |
|------|------|
| PREFIX | 默认 `FSREQ`，可简化为 `FEAT` |
| DATE | YYYYMMDD 格式 |
| FEAT | Feature 缩写（大写字母+数字） |
| SEQ | 3位递增序号（001, 002...） |

---

## CLI 执行问题

### Q: CLI 命令执行失败

**常见原因**:
1. `spec-first` 未安装或不在 PATH 中
2. 参数格式错误
3. 目标目录已存在同名 Feature

**排查步骤**:
```bash
# 检查 CLI 是否可用
spec-first --version

# 检查 Feature 是否已存在
ls specs/

# 手动执行 CLI 查看详细错误
spec-first init --feat AUTH --mode N --size M --platforms h5
```

---

## Windows 特有问题

### Q: 文件编码错误

**解决方案**:
- 使用 UTF-8 编码保存所有 YAML 文件
- 使用 LF 换行符（不是 CRLF）

### Q: 路径分隔符问题

**解决方案**:
- 使用 `/` 或 `\\`，Node.js 会自动处理
