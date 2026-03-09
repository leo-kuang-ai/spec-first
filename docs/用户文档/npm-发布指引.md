# npm 发布指引

## 前置条件

1. **npm 账号**：确保已注册 [npmjs.com](https://www.npmjs.com/) 账号
2. **本地登录**：
   ```bash
   npm login
   ```
3. **权限确认**：确保对 `@spec-first/core` 包有发布权限

## 发布流程

### 1. 版本更新

修改 `package.json` 中的版本号，遵循 [语义化版本](https://semver.org/lang/zh-CN/)：

- **补丁版本** (1.0.x)：bug 修复
- **次版本** (1.x.0)：新功能，向后兼容
- **主版本** (x.0.0)：破坏性变更

```bash
# 自动升级版本
npm version patch  # 1.0.0 → 1.0.1
npm version minor  # 1.0.0 → 1.1.0
npm version major  # 1.0.0 → 2.0.0
```

### 2. 更新 CHANGELOG

在 `CHANGELOG.md` 添加版本记录：

```markdown
- vX.Y.Z YYYY-MM-DD 作者: 一句话摘要 (user-visible)
```

### 3. 质量检查

```bash
# 类型检查
npm run typecheck

# 代码检查
npm run lint

# 运行测试
npm test

# 构建产物
npm run build
```

### 4. 发布到 npm

```bash
# 发布
npm publish

# 如果是 scoped package 首次发布
npm publish --access public
```

### 5. 提交代码

```bash
git add .
git commit -m "chore: release vX.Y.Z"
git push origin master
git tag vX.Y.Z
git push origin vX.Y.Z
```

## 发布检查清单

- [ ] 版本号已更新
- [ ] CHANGELOG.md 已更新
- [ ] 所有测试通过
- [ ] 代码已构建
- [ ] npm 发布成功
- [ ] 代码已提交并打 tag

## 常见问题

**Q: 发布失败提示权限不足？**
A: 联系包维护者添加发布权限，或使用 `npm owner add <username> <package>`

**Q: 如何撤回已发布版本？**
A: 发布后 72 小时内可使用 `npm unpublish <package>@<version>`，但不推荐

**Q: 如何发布 beta 版本？**
A: 使用 `npm publish --tag beta`，安装时需指定 `npm install <package>@beta`

## 相关链接

- [npm 官方文档](https://docs.npmjs.com/)
- [语义化版本规范](https://semver.org/lang/zh-CN/)
- [项目 CHANGELOG](../../CHANGELOG.md)
