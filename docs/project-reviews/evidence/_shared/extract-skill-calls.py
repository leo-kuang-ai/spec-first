#!/usr/bin/env python3
"""从 Claude Code 会话 JSONL 中提取 Skill 调用与命令，供路由与过程类判定使用。

用法：python3 extract-skill-calls.py <session.jsonl> [...]
输出：每个文件一行 JSON，含 skills（按调用顺序的 Skill 名称）、bash（命令前 200 字符）、
edits（Edit/Write 目标路径）。只读，不调用模型。
"""
import json
import sys


def extract(path):
    skills, bash, edits, seen = [], [], [], set()
    with open(path, encoding='utf-8') as fh:
        for line in fh:
            try:
                record = json.loads(line)
            except json.JSONDecodeError:
                continue
            message = record.get('message')
            if not isinstance(message, dict):
                continue
            content = message.get('content')
            if not isinstance(content, list):
                continue
            for block in content:
                if not isinstance(block, dict) or block.get('type') != 'tool_use':
                    continue
                # 同一 tool_use 可能在流式记录中出现多次，按 id 去重
                block_id = block.get('id')
                if block_id in seen:
                    continue
                seen.add(block_id)
                name = block.get('name')
                args = block.get('input') or {}
                if name == 'Skill':
                    skills.append(args.get('skill') or args.get('name'))
                elif name == 'Bash':
                    bash.append(str(args.get('command', ''))[:200])
                elif name in ('Edit', 'Write', 'MultiEdit', 'NotebookEdit'):
                    edits.append(args.get('file_path') or args.get('notebook_path'))
    return {'file': path, 'skills': skills, 'bash': bash, 'edits': edits}


if __name__ == '__main__':
    for p in sys.argv[1:]:
        print(json.dumps(extract(p), ensure_ascii=False))
