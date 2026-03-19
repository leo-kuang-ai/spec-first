# npm 发布指引

## 前置条件

1. **npm 账号**：确保已注册 [npmjs.com](https://www.npmjs.com/) 账号
2. **本地登录**：
   ```bash
   npm login
   ```
3. **权限确认**：确保对 `spec-first` 包有发布权限

## 发布流程

### 推荐入口

```bash
pnpm run release:publish
```

默认会自动完成以下步骤：

1. 前置检查工作区与分支
2. 执行 `typecheck`
3. 执行 `build`
4. 自动判定版本升级类型并更新 `package.json`
5. 校验发布包内容
6. 执行 `npm publish`
7. 写入发布 commit 和 tag

如需手动指定版本升级类型，可使用：

```bash
pnpm run release:publish -- patch
pnpm run release:publish -- minor
pnpm run release:publish -- major
pnpm run release:publish -- auto --dry-run
```

### 版本与说明

版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)：

- **补丁版本** (1.0.x)：bug 修复
- **次版本** (1.x.0)：新功能，向后兼容
- **主版本** (x.0.0)：破坏性变更

如果需要维护变更记录，可在发布前同步更新 `CHANGELOG.md`：

```markdown
- vX.Y.Z YYYY-MM-DD 作者: 一句话摘要 (user-visible)
```

### 手动流程（仅在需要时）

如果你希望绕过自动发布入口，也可以手动执行：

```bash
npm run typecheck
npm run build
npm run release:check
npm publish
```

然后再手工提交并打 tag：

```bash
git add package.json
git commit -m "chore: release vX.Y.Z"
git tag vX.Y.Z
git push origin master
git push origin vX.Y.Z
```

## 发布检查清单

- [ ] 版本号已更新（或通过 `release:publish` 自动更新）
- [ ] CHANGELOG.md 已更新
- [ ] 所有测试通过
- [ ] 代码已构建
- [ ] 发布包校验通过
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
