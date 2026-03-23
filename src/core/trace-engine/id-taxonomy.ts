/**
 * ID taxonomy
 * 统一管理 ID 类型、TC 级别、允许集合与 ID 格式定义。
 */

export const NEXT_ID_TYPES = [
  'FR',
  'DS',
  'TASK',
  'TC',
  'RFC',
  'REQ',
  'SYS',
  'ARCH',
  'MOD',
  'ATP',
  'STP',
  'ITP',
  'UTP',
] as const;

export type NextIdType = (typeof NEXT_ID_TYPES)[number];

export const ID_TYPES = [...NEXT_ID_TYPES, 'Feature'] as const;

export type IdType = (typeof ID_TYPES)[number];

/** TC 级别前缀 */
export const TC_LEVELS = ['UT', 'IT', 'E2E', 'ST'] as const;

export type TcLevel = (typeof TC_LEVELS)[number];

export const VALID_NEXT_ID_TYPES: ReadonlySet<NextIdType> = new Set(NEXT_ID_TYPES);
export const VALID_ID_TYPES: ReadonlySet<IdType> = new Set(ID_TYPES);
export const VALID_TC_LEVELS: ReadonlySet<TcLevel> = new Set(TC_LEVELS);

export const ID_PATTERNS: ReadonlyArray<{ type: IdType; regex: RegExp }> = [
  { type: 'Feature', regex: /^FSREQ-\d{8}-[A-Z][A-Z0-9]{1,15}-\d{3}$/ },
  { type: 'FR', regex: /^FR-[A-Z][A-Z0-9]{1,15}-\d{3}$/ },
  { type: 'DS', regex: /^DS-[A-Z][A-Z0-9]{1,15}-\d{3}$/ },
  { type: 'TASK', regex: /^TASK-[A-Z][A-Z0-9]{1,15}-\d{3}$/ },
  { type: 'REQ', regex: /^REQ-[A-Z][A-Z0-9]{1,15}-\d{3}$/ },
  { type: 'SYS', regex: /^SYS-[A-Z][A-Z0-9]{1,15}-\d{3}$/ },
  { type: 'ARCH', regex: /^ARCH-[A-Z][A-Z0-9]{1,15}-\d{3}$/ },
  { type: 'MOD', regex: /^MOD-[A-Z][A-Z0-9]{1,15}-\d{3}$/ },
  { type: 'ATP', regex: /^ATP-[A-Z][A-Z0-9]{1,15}-\d{3}$/ },
  { type: 'STP', regex: /^STP-[A-Z][A-Z0-9]{1,15}-\d{3}$/ },
  { type: 'ITP', regex: /^ITP-[A-Z][A-Z0-9]{1,15}-\d{3}$/ },
  { type: 'UTP', regex: /^UTP-[A-Z][A-Z0-9]{1,15}-\d{3}$/ },
  { type: 'TC', regex: /^TC-(UT|IT|E2E|ST)-[A-Z][A-Z0-9]{1,15}-\d{3}$/ },
  { type: 'RFC', regex: /^RFC-\d{3}$/ },
];

const ID_SCAN_PATTERN_SOURCE = ID_PATTERNS.map(({ regex }) =>
  regex.source.replace(/^\^/, '').replace(/\$$/, '')
).join('|');

export const ID_SCAN_PATTERN = new RegExp(`\\b(?:${ID_SCAN_PATTERN_SOURCE})\\b`, 'g');

export function isNextIdType(value: string): value is NextIdType {
  return VALID_NEXT_ID_TYPES.has(value as NextIdType);
}

export function isIdType(value: string): value is IdType {
  return VALID_ID_TYPES.has(value as IdType);
}

export function isTcLevel(value: string): value is TcLevel {
  return VALID_TC_LEVELS.has(value as TcLevel);
}
