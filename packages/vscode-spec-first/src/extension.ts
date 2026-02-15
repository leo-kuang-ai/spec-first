import * as vscode from 'vscode';
import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

interface IdItem {
  id: string;
  type: string;
  title?: string;
}

let idCache: IdItem[] = [];

export function activate(context: vscode.ExtensionContext): void {
  refreshCache();

  // ID 自动补全
  const provider = vscode.languages.registerCompletionItemProvider(
    [{ scheme: 'file', language: 'markdown' }, { scheme: 'file', language: 'typescript' }],
    new SpecFirstCompletionProvider(),
    '-',
  );

  // 刷新命令
  const refreshCmd = vscode.commands.registerCommand('specFirst.refreshIds', () => {
    refreshCache();
    vscode.window.showInformationMessage('Spec-First: ID cache refreshed');
  });

  // 跳转到定义
  const defProvider = vscode.languages.registerDefinitionProvider(
    [{ scheme: 'file', language: 'markdown' }, { scheme: 'file', language: 'typescript' }],
    new SpecFirstDefinitionProvider(),
  );

  context.subscriptions.push(provider, refreshCmd, defProvider);
}

export function deactivate(): void {
  idCache = [];
}

// ─── ID 缓存刷新 ────────────────────────────────────────

function refreshCache(): void {
  const ws = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!ws) return;

  const featureId = getCurrentFeatureId(ws);
  if (!featureId) {
    idCache = [];
    return;
  }

  try {
    const prefixes = ['FR-', 'DS-', 'TASK-', 'TC-', 'RFC-'];
    const merged = new Map<string, IdItem>();

    for (const prefix of prefixes) {
      const raw = execSync(`npx spec-first id search ${prefix} --feature ${featureId}`, {
        cwd: ws, timeout: 5000, encoding: 'utf-8',
      });
      for (const item of parseSearchOutput(raw)) {
        merged.set(item.id, item);
      }
    }

    idCache = [...merged.values()];
  } catch {
    // CLI 不可用时回退到空缓存
    idCache = [];
  }
}

function getCurrentFeatureId(workspaceRoot: string): string | undefined {
  const p = join(workspaceRoot, '.spec-first', 'current');
  if (!existsSync(p)) return undefined;
  const id = readFileSync(p, 'utf-8').trim().split(/\r?\n/)[0];
  return id || undefined;
}

function parseSearchOutput(raw: string): IdItem[] {
  const items: IdItem[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const m = line.trim().match(/^([A-Z0-9-]+)\s+\(([^)]+)\)$/);
    if (!m) continue;
    items.push({
      id: m[1],
      type: m[2],
    });
  }
  return items;
}

// ─── 自动补全 ────────────────────────────────────────────

const ID_PREFIXES = ['FR-', 'DS-', 'TASK-', 'TC-', 'RFC-'];

class SpecFirstCompletionProvider implements vscode.CompletionItemProvider {
  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): vscode.CompletionItem[] | undefined {
    const lineText = document.lineAt(position).text;
    const textBefore = lineText.substring(0, position.character);

    // 检查是否匹配 ID 前缀
    const match = textBefore.match(/(FR|DS|TASK|TC|RFC)-\w*$/);
    if (!match) return undefined;

    const prefix = match[0].toUpperCase();
    return idCache
      .filter(item => item.id.toUpperCase().startsWith(prefix))
      .map(item => {
        const ci = new vscode.CompletionItem(item.id, vscode.CompletionItemKind.Reference);
        ci.detail = `(${item.type}) ${item.title ?? ''}`;
        ci.insertText = item.id;
        return ci;
      });
  }
}

// ─── 跳转到定义 ──────────────────────────────────────────

const ID_PATTERN = /\b(FR|DS|TASK|TC|RFC)-[A-Z]+-\d{3}\b/g;

class SpecFirstDefinitionProvider implements vscode.DefinitionProvider {
  provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): vscode.Location | undefined {
    const range = document.getWordRangeAtPosition(position, /[\w-]+/);
    if (!range) return undefined;

    const word = document.getText(range);
    if (!ID_PATTERN.test(word)) return undefined;
    ID_PATTERN.lastIndex = 0;

    // 在追踪矩阵中查找该 ID
    const ws = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!ws) return undefined;

    const glob = new vscode.RelativePattern(ws, 'specs/**/traceability-matrix.md');
    const files = vscode.workspace.findFiles(glob, undefined, 1);

    // 同步回退：直接搜索 specs 目录
    try {
      const { execSync: exec } = require('child_process');
      const result = exec(
        `grep -rn "${word}" specs/*/traceability-matrix.md`,
        { cwd: ws, encoding: 'utf-8', timeout: 3000 },
      );
      const firstLine = result.split('\n')[0];
      if (firstLine) {
        const [filePath, lineStr] = firstLine.split(':');
        const uri = vscode.Uri.file(`${ws}/${filePath}`);
        const line = Math.max(0, parseInt(lineStr, 10) - 1);
        return new vscode.Location(uri, new vscode.Position(line, 0));
      }
    } catch {
      // grep 未找到
    }
    return undefined;
  }
}
