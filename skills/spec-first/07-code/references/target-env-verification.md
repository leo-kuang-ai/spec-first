# 目标环境验证清单

## 前端代码验证

### 必须执行的步骤

1. **打开目标页面**
   ```bash
   # 启动本地服务器（如果需要）
   open scripts/stage-viewer/index.html
   # 或
   python -m http.server 8000
   open http://localhost:8000/scripts/stage-viewer/
   ```

2. **检查浏览器控制台**
   - 打开 DevTools (F12)
   - 切换到 Console 标签
   - 刷新页面
   - **阻断条件**: 出现以下错误立即失败
     - `ReferenceError: xxx is not defined`
     - `TypeError: xxx is not a function`
     - `Uncaught SyntaxError`

3. **验证核心功能**
   - 点击主要按钮（如刷新按钮）
   - 输入搜索关键词
   - 检查数据是否正常加载
   - **阻断条件**: 核心功能不可用

4. **记录证据**
   - 截图控制台（无错误）
   - 截图页面正常显示
   - 写入 findings.md

## 后端代码验证

### 必须执行的步骤

1. **启动服务**
   ```bash
   # 根据项目类型选择
   npm start
   # 或
   python main.py
   ```

2. **检查启动日志**
   - 无 `Error` 或 `Exception`
   - 端口正常监听

3. **调用关键 API**
   ```bash
   curl http://localhost:3000/api/health
   curl http://localhost:3000/api/features
   ```

4. **记录证据**
   - 复制 curl 输出到 findings.md
   - 记录响应状态码

## 失败处理

如果验证失败：
1. 立即标记 TASK 为 blocked
2. 记录错误信息到 findings.md
3. 不推进 TASK 状态
4. 修复后重新验证
