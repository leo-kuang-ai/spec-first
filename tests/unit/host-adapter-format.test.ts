import { describe, expect, it } from 'vitest';
import { formatHostDoctorMessage, formatHostUpdateSummary } from '../../src/core/host-adapters/format.js';
import type { HostAdapterStatus } from '../../src/core/host-adapters/types.js';

const geminiStatus: HostAdapterStatus = {
  id: 'gemini',
  label: 'Gemini CLI',
  detected: true,
  summary: 'gemini home=/tmp/.gemini config=/tmp/.gemini/config baseline=partial',
  capabilities: {
    supportsSkills: true,
    supportsMcp: true,
    supportsHooks: false,
    supportsSessionStart: false,
    supportsViewer: false,
    supportsBrowser: false,
  },
  maturity: 'experimental',
  remediation: '运行 spec-first update --host gemini',
  baselineState: 'partial',
  missingBaseline: ['skills', 'mcp'],
};

describe('host adapter formatter', () => {
  it('should format update summary with baseline detail', () => {
    expect(formatHostUpdateSummary(geminiStatus)).toBe(
      'gemini: detected baseline=partial missing=skills+mcp | gemini home=/tmp/.gemini config=/tmp/.gemini/config baseline=partial'
    );
  });

  it('should format doctor message with capabilities, missing baseline, and experimental tag', () => {
    expect(formatHostDoctorMessage(geminiStatus)).toBe(
      'skills, mcp | gemini home=/tmp/.gemini config=/tmp/.gemini/config baseline=partial missing=skills+mcp | experimental'
    );
  });

  it('should format planned hosts without experimental suffix when not detected', () => {
    const plannedCursor: HostAdapterStatus = {
      ...geminiStatus,
      id: 'cursor',
      label: 'Cursor',
      detected: false,
      summary: 'cursor home=/tmp/.cursor config=/tmp/.cursor/config baseline=partial',
      maturity: 'stable',
      missingBaseline: ['mcp'],
    };

    expect(formatHostDoctorMessage(plannedCursor)).toBe(
      'skills, mcp | cursor home=/tmp/.cursor config=/tmp/.cursor/config baseline=partial'
    );
  });
});
