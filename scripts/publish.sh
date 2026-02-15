#!/usr/bin/env bash
set -euo pipefail

# Spec-First 发布脚本
# 用法: ./scripts/publish.sh [patch|minor|major] [--dry-run]

VERSION_BUMP="${1:-patch}"
DRY_RUN=""

if [[ "${2:-}" == "--dry-run" ]]; then
  DRY_RUN="--dry-run"
fi

echo "══════════════════════════════════════"
echo "  Spec-First 发布流程"
echo "══════════════════════════════════════"

# 1. 前置检查
echo ""
echo "▸ 前置检查..."

if [[ -n "$(git status --porcelain)" ]]; then
  echo "✗ 工作区有未提交变更，请先提交"
  exit 1
fi

BRANCH=$(git branch --show-current)
if [[ "$BRANCH" != "main" && "$BRANCH" != "master" ]]; then
  echo "✗ 当前分支 $BRANCH，请切换到 main/master"
  exit 1
fi

echo "✓ Git 状态干净，分支: $BRANCH"

# 2. 构建 & 校验
echo ""
echo "▸ TypeScript 类型检查..."
pnpm run typecheck

echo ""
echo "▸ 运行测试..."
pnpm run test

echo ""
echo "▸ 构建产物..."
pnpm run build

# 3. 验证产物
echo ""
echo "▸ 验证构建产物..."

if [[ ! -f "dist/index.js" ]]; then
  echo "✗ dist/index.js 不存在"
  exit 1
fi
echo "✓ dist/index.js 存在"

if [[ ! -d "skills" ]]; then
  echo "✗ skills/ 目录不存在"
  exit 1
fi
echo "✓ skills/ 目录存在"

if [[ ! -d "templates" ]]; then
  echo "✗ templates/ 目录不存在"
  exit 1
fi
echo "✓ templates/ 目录存在"

# 4. npm pack 试打包
echo ""
echo "▸ 试打包 (npm pack --dry-run)..."
npm pack --dry-run 2>&1 | tail -20

# 5. 版本号升级
echo ""
echo "▸ 版本升级: $VERSION_BUMP"
npm version "$VERSION_BUMP" --no-git-tag-version
NEW_VERSION=$(node -p "require('./package.json').version")
echo "✓ 新版本: $NEW_VERSION"

# 6. 发布
echo ""
if [[ -n "$DRY_RUN" ]]; then
  echo "▸ 模拟发布 (dry-run)..."
  npm publish $DRY_RUN
  echo "✓ Dry-run 完成，未实际发布"
else
  echo "▸ 发布到 npm..."
  npm publish
  echo "✓ 已发布 spec-first@$NEW_VERSION"

  # 7. Git tag
  git add package.json
  git commit -m "chore: release v$NEW_VERSION"
  git tag "v$NEW_VERSION"
  echo "✓ 已创建 tag v$NEW_VERSION"
  echo ""
  echo "提示: 运行 git push && git push --tags 推送到远程"
fi

echo ""
echo "══════════════════════════════════════"
echo "  发布完成: spec-first@$NEW_VERSION"
echo "══════════════════════════════════════"
