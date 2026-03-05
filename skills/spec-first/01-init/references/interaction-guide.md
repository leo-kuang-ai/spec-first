# 交互引导规范

> Init Skill 的逐步交互引导流程

---

## 核心原则

**逐步引导**: 禁止一次性要求用户提交全部字段

**推荐顺序**: feat → mode → size → platforms → title → feature-id → bootstrap

---

## 引导流程

### Step 1: feat 参数

**提示**:
```
🚀 初始化 Feature 工作区

Step 1/7: Feature 缩写

请输入 Feature 缩写 (大写字母开头，1-16字符):
示例: AUTH, REPORT, ORDER

feat:
```

**验证**:
- 格式: `^[A-Z][A-Z0-9]{0,15}$`
- 失败提示: "格式错误，请使用大写字母和数字"

---

### Step 2: mode 参数

**提示**:
```
Step 2/7: Feature 模式

请选择:
1. N - 新功能 (默认)
2. I - 迭代优化

请输入 [1/2]:
```

**默认值**: 直接回车选择 N

---

### Step 3: size 参数

**提示**:
```
Step 3/7: Feature 规模

请选择:
1. S - 小型 (< 2 天)
2. M - 中型 (2-5 天，默认)
3. L - 大型 (> 5 天)

请输入 [1/2/3]:
```

**默认值**: 直接回车选择 M

---

### Step 4: platforms 参数（多选）

**提示**:
```
Step 4/7: 平台选择

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

**交互逻辑**:
1. 用户输入序号 → 切换该项勾选状态
2. 用户输入 a → 全选
3. 用户输入 c → 清空
4. 用户输入 d → 完成（至少选 1 项）

**示例交互**:
```
请输入操作: 1
[✓] 1. h5
[ ] 2. java-backend
[ ] 3. ios
[ ] 4. android

当前已选: h5

请输入操作: 2
[✓] 1. h5
[✓] 2. java-backend
[ ] 3. ios
[ ] 4. android

当前已选: h5, java-backend

请输入操作: d
已选择: h5, java-backend
```

---

### Step 5: title 参数

**提示**:
```
Step 5/7: Feature 标题

请输入标题 (可选，直接回车使用默认):
默认: Feature AUTH

title:
```

**默认值**: `Feature {feat}`

---

### Step 6: feature-id 参数

**提示**:
```
Step 6/7: Feature ID

请输入自定义 ID (可选，直接回车自动生成):
自动生成格式: FSREQ-20260305-AUTH-001

feature-id:
```

**默认值**: 自动生成

---

### Step 7: bootstrap 参数

**提示**:
```
Step 7/7: 宿主环境检查

是否执行宿主环境检查？
- 是: 检查并自动修复 MCP/skills 配置
- 否: 仅初始化项目（推荐）

请输入 [y/N]:
```

**默认值**: N

---

## 参数确认（P3）

### 确认提示

**格式**:
```
📋 参数确认

Feature 缩写: AUTH
模式: N (新功能)
规模: M (中型)
平台: h5, java-backend
标题: 用户认证功能
Feature ID: FSREQ-20260305-AUTH-001
宿主检查: 否

是否确认并开始初始化？[Y/n]
```

**用户选择**:
- Y/y/回车 → 继续执行
- N/n → 取消初始化

---

## 错误处理

### 格式验证失败

```
❌ 格式错误

feat 必须符合格式: ^[A-Z][A-Z0-9]{0,15}$

示例:
✅ AUTH
✅ REPORT
❌ auth (小写)
❌ user-report (包含连字符)

请重新输入:
```

### platforms 未选择

```
⚠️  至少选择 1 个平台

当前已选: (无)

请继续选择或输入 a 全选。
```

---

## 快捷模式

### 跳过交互（命令行参数）

```bash
# 提供全部参数，跳过交互
spec-first init \
  --feat AUTH \
  --mode N \
  --size M \
  --platforms h5,java-backend \
  --title "用户认证" \
  --feature-id FEAT-001
```
