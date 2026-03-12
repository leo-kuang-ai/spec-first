const SESSION_START_MANAGED_MARKER = 'SPEC_FIRST_MANAGED_SESSION=1';
const VIEWER_OPEN_WITH_FLAGS = /\bviewer\s+open\b[\s\S]*--print-url\b[\s\S]*--background\b/i;
const LEGACY_SHORT_FORM_PATTERN =
  /^\s*['"][^'"\n]+['"]\s+viewer\s+open\b[\s\S]*--print-url\b[\s\S]*--background\b[\s\S]*$/i;

interface SessionStartHookCommand {
  type?: unknown;
  command?: unknown;
  timeout?: unknown;
}

interface SessionStartEntry {
  hooks?: unknown;
  matcher?: unknown;
}

export function getSessionStartManagedMarker(): string {
  return SESSION_START_MANAGED_MARKER;
}

export function isManagedSessionStartCommand(command: unknown): boolean {
  if (typeof command !== 'string') return false;
  if (!VIEWER_OPEN_WITH_FLAGS.test(command)) return false;
  return hasStrongManagedSignal(command) || isLegacyShortFormCommand(command);
}

export function isManagedSessionStartEntry(entry: unknown): boolean {
  const typed = entry as SessionStartEntry | undefined;
  if (!Array.isArray(typed?.hooks)) return false;

  return typed.hooks.some((hook) => {
    const hookConfig = hook as SessionStartHookCommand | undefined;
    const command = hookConfig?.command;
    if (!isManagedSessionStartCommand(command)) return false;

    const commandText = typeof command === 'string' ? command : '';
    if (hasStrongManagedSignal(commandText)) return true;

    // 兜底仅用于兼容旧短格式，并要求命中历史 entry 指纹，避免误删非托管命令。
    return (
      isLegacyShortFormCommand(commandText) && hasLegacyManagedEntryFingerprint(typed, hookConfig)
    );
  });
}

function hasStrongManagedSignal(command: string): boolean {
  const normalized = command.toLowerCase();
  return (
    command.includes(SESSION_START_MANAGED_MARKER) ||
    normalized.includes('.spec-first/current') ||
    normalized.includes('spec-first') ||
    normalized.includes('spec_first_bin_fallback=') ||
    normalized.includes('spec_first_bin_resolved=') ||
    normalized.includes('spec_first_bin=')
  );
}

function isLegacyShortFormCommand(command: string): boolean {
  return LEGACY_SHORT_FORM_PATTERN.test(command);
}

function hasLegacyManagedEntryFingerprint(
  entry: SessionStartEntry,
  hook: SessionStartHookCommand | undefined
): boolean {
  return entry.matcher === '*' && hook?.type === 'command' && hook?.timeout === 15;
}
