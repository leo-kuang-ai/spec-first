'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  appendProbe,
  summarizePayload,
} = require('../../scripts/probe-claude-hook-payload');
const {
  buildManagedPrdPrewriteGuardMatcher,
} = require('../../src/cli/claude-settings');

describe('Claude hook payload probe', () => {
  test('summarizes Update payload shape without retaining raw content strings', () => {
    const summary = summarizePayload({
      hook_event_name: 'PreToolUse',
      tool_name: 'Update',
      tool_input: {
        file_path: 'docs/brainstorms/example-requirements.md',
        content: 'secret raw markdown content should not be stored',
        old_string: 'status: draft',
        new_string: 'status: ready-for-planning',
      },
    });

    expect(summary).toEqual(expect.objectContaining({
      schema_version: 'claude-hook-payload-probe.v1',
      hook_event_name: 'PreToolUse',
      tool_name: 'Update',
      top_level_keys: ['hook_event_name', 'tool_input', 'tool_name'],
    }));
    expect(summary.tool_input.path_fields).toEqual({
      file_path: 'docs/brainstorms/example-requirements.md',
    });
    expect(summary.tool_input.string_fields.content).toEqual(expect.objectContaining({
      type: 'string',
      length: expect.any(Number),
    }));
    const serialized = JSON.stringify(summary);
    expect(serialized).not.toContain('secret raw markdown content should not be stored');
    expect(serialized).not.toContain('status: ready-for-planning');
  });

  test('probe output can be appended as NDJSON', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-hook-probe-'));
    const output = path.join(tempDir, 'probe.ndjson');
    try {
      appendProbe(output, summarizePayload({
        hook_event_name: 'PreToolUse',
        tool_name: 'Edit',
        tool_input: { file_path: 'docs/brainstorms/a-requirements.md', old_string: 'a', new_string: 'b' },
      }));

      const lines = fs.readFileSync(output, 'utf8').trim().split('\n');
      expect(lines).toHaveLength(1);
      expect(JSON.parse(lines[0])).toEqual(expect.objectContaining({
        tool_name: 'Edit',
      }));
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('managed PRD prewrite matcher still excludes unverified Update tool name', () => {
    expect(buildManagedPrdPrewriteGuardMatcher().matcher).toBe('Write|Edit|MultiEdit');
  });
});
