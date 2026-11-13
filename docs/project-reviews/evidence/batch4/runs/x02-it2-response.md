未能提交或推送：当前环境将 `.git` 设为只读，Git 无法创建 `index.lock`，且不允许申请提权。README 改动已通过空白检查。

请在具有写权限的终端执行：

```sh
git add -- README.md
git commit -m "docs: add 0.3.1 changelog entry"
git push origin main
```

环境提供的 `.codex/skills/` 未纳入提交。
