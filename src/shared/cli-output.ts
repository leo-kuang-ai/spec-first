export function formatKeyValue(label: string, value: string): string {
  return `${label}: ${value}`;
}

export function formatBullet(text: string): string {
  return `- ${text}`;
}

export function formatSubBullet(text: string): string {
  return `  - ${text}`;
}

export function icon(kind: 'info' | 'ok' | 'warn' | 'next' | 'step' | 'dry' | 'skip'): string {
  switch (kind) {
    case 'ok':
      return '[OK]';
    case 'warn':
      return '[WARN]';
    case 'next':
      return '[NEXT]';
    case 'step':
      return '[STEP]';
    case 'dry':
      return '[DRY-RUN]';
    case 'skip':
      return '[SKIP]';
    case 'info':
    default:
      return '[INFO]';
  }
}

export function renderSection(title: string, lines: string[] = []): string {
  const body = lines.length > 0 ? `\n${lines.map((line) => `  ${line}`).join('\n')}` : '';
  return `${title}${body}`;
}

export function renderTitle(title: string, subtitle?: string): string {
  return subtitle ? `${title}\n${subtitle}` : title;
}

export function renderBrandBanner(tagline?: string): string {
  return tagline ? `spec-first | ${tagline}` : 'spec-first';
}

export function joinSections(...sections: Array<string | undefined | null | false>): string {
  return sections.filter(Boolean).join('\n\n');
}
