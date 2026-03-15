import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { detectHostPaths } from '../../shared/host-paths.js';
import { hasRequiredCodexMcpBaseline } from '../../shared/host-mcp-baseline.js';
import { getHostCapability } from '../tool-integration/capability-matrix.js';
import type { HostAdapter, HostBaselinePart, HostBaselineState } from './types.js';

export class CodexAdapter implements HostAdapter {
  id = 'codex' as const;

  detect(): boolean {
    const paths = detectHostPaths();
    return existsSync(paths.codexConfigPath) || existsSync(paths.codexSkillsDir);
  }

  capabilities() {
    return getHostCapability(this.id);
  }

  summary(): string {
    const paths = detectHostPaths();
    return `codex config=${paths.codexConfigPath} skills=${paths.codexSkillsDir} baseline=${this.computeBaseline(paths).state}`;
  }

  maturity() {
    return 'stable' as const;
  }

  remediation(detected: boolean): string {
    return detected
      ? '如需刷新 Codex 基线能力，运行 spec-first update --host codex'
      : '安装 Codex 后运行 spec-first update --host codex 补齐 skills / MCP';
  }

  baselineState() {
    return this.computeBaseline(detectHostPaths()).state;
  }

  missingBaseline() {
    return this.computeBaseline(detectHostPaths()).missing;
  }

  private computeBaseline(paths: ReturnType<typeof detectHostPaths>): {
    state: HostBaselineState;
    missing: HostBaselinePart[];
  } {
    if (!this.detect()) {
      return { state: 'unknown', missing: [] };
    }

    const missing: HostBaselinePart[] = [];
    if (!hasRequiredCodexMcpBaseline(paths.codexConfigPath)) {
      missing.push('mcp');
    }
    if (!existsSync(join(paths.codexSkillsDir, 'spec-first'))) {
      missing.push('skills');
    }

    return {
      state: missing.length === 0 ? 'ready' : 'partial',
      missing,
    };
  }
}
