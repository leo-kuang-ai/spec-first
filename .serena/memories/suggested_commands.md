# Spec-First 开发命令

## 开发命令

```bash
# 构建项目
pnpm build

# 类型检查
pnpm typecheck
# 或
pnpm lint

# 运行测试
pnpm test

# 测试监听模式
pnpm test:watch

# 测试覆盖率
pnpm test:coverage

# 性能基准测试
pnpm bench
```

## Stage Viewer（可选）

```bash
# 启动 stage viewer 服务
pnpm viewer:start

# 引导启动并打开浏览器
pnpm viewer:bootstrap
```

## CLI 命令（开发调试）

```bash
# 初始化项目
spec-first init --name <feature-name> --platforms <platforms>

# 查看当前 Feature
spec-first feature current

# 查看阶段状态
spec-first stage current

# 推进阶段
spec-first stage advance

# 环境诊断
spec-first doctor

# ID 生成
spec-first id next <type> <abbr>

# 追踪矩阵检查
spec-first matrix check

# Gate 校验
spec-first gate check

# 覆盖率计算
spec-first metrics coverage

# 帮助
spec-first --help
```

## Git 命令

```bash
# 查看状态
git status

# 查看差异
git diff

# 提交（注意：项目要求变更必须更新 CHANGELOG.md）
git commit -m "feat: xxx"

# 查看日志
git log --oneline -10
```

## 系统命令（macOS/Darwin）

```bash
# 列出目录
ls -la

# 查找文件
find . -name "*.ts"

# 搜索内容
grep -r "pattern" .

# 进程查看
ps aux | grep node
```
