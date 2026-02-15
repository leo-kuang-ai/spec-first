/**
 * feature CLI 命令
 * spec-first feature list | current | switch <featureId>
 */
import { join } from 'node:path';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { ExitCode } from '../../shared/types.js';
import { exists, ensureDir, readJson } from '../../shared/fs-utils.js';
import type { StageState } from '../../shared/types.js';

export function handleFeature(args: string[]): number {
  const sub = args[0];
  const rest = args.slice(1);

  switch (sub) {
    case 'list': return handleList();
    case 'current': return handleCurrent();
    case 'switch': return handleSwitch(rest);
    default:
      if (sub) console.error(`Unknown feature subcommand: ${sub}`);
      printFeatureHelp();
      return ExitCode.VALIDATION_ERROR;
  }
}

function handleList(): number {
  const projectRoot = process.cwd();
  const specsDir = join(projectRoot, 'specs');
  if (!exists(specsDir)) {
    console.log('No specs/ directory found.');
    return ExitCode.SUCCESS;
  }

  const entries = readdirSync(specsDir, { withFileTypes: true })
    .filter(e => e.isDirectory() && e.name.startsWith('FSREQ-'));

  if (entries.length === 0) {
    console.log('No Features found.');
    return ExitCode.SUCCESS;
  }

  console.log('Features:\n');
  console.log('ID'.padEnd(35) + 'Title'.padEnd(25) + 'Stage'.padEnd(18) + 'Updated');
  console.log('-'.repeat(90));

  for (const entry of entries) {
    const statePath = join(specsDir, entry.name, 'stage-state.json');
    if (!exists(statePath)) continue;
    const state = readJson<StageState>(statePath);
    console.log(
      state.featureId.padEnd(35) +
      (state.title ?? '').padEnd(25) +
      state.currentStage.padEnd(18) +
      (state.updatedAt ?? ''),
    );
  }

  return ExitCode.SUCCESS;
}

function handleCurrent(): number {
  const projectRoot = process.cwd();
  const currentFile = join(projectRoot, '.spec-first', 'current');

  if (!exists(currentFile)) {
    console.log('No current Feature set. Use: spec-first feature switch <featureId>');
    return ExitCode.SUCCESS;
  }

  const featureId = readFileSync(currentFile, 'utf-8').trim();
  const statePath = join(projectRoot, 'specs', featureId, 'stage-state.json');

  if (!exists(statePath)) {
    console.log(`Current: ${featureId} (stage-state.json not found)`);
    return ExitCode.SUCCESS;
  }

  const state = readJson<StageState>(statePath);
  console.log(`Current Feature: ${state.featureId}`);
  console.log(`  Title: ${state.title ?? 'N/A'}`);
  console.log(`  Stage: ${state.currentStage}`);
  console.log(`  Mode: ${state.mode}  Size: ${state.size}`);
  console.log(`  Platforms: ${state.platforms.join(', ')}`);

  return ExitCode.SUCCESS;
}

function handleSwitch(args: string[]): number {
  const featureId = args[0];
  if (!featureId) {
    console.error('Usage: spec-first feature switch <featureId>');
    return ExitCode.VALIDATION_ERROR;
  }

  const projectRoot = process.cwd();
  const specsDir = join(projectRoot, 'specs', featureId);

  if (!exists(specsDir)) {
    console.error(`Feature not found: ${featureId}`);
    return ExitCode.VALIDATION_ERROR;
  }

  const configDir = join(projectRoot, '.spec-first');
  ensureDir(configDir);
  writeFileSync(join(configDir, 'current'), featureId, 'utf-8');
  console.log(`Switched to: ${featureId}`);

  return ExitCode.SUCCESS;
}

function printFeatureHelp(): void {
  console.log(`Usage: spec-first feature <subcommand>

Subcommands:
  list      List all Features
  current   Show current Feature details
  switch    Switch current Feature`);
}
