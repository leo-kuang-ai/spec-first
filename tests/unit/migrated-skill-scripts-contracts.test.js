'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..');

const EXPECTED_MIGRATED_SCRIPTS = {
  'spec-resolve-pr-feedback': [
    'scripts/get-pr-comments',
    'scripts/get-thread-for-comment',
    'scripts/reply-to-pr-thread',
    'scripts/resolve-pr-thread',
  ],
  'spec-brainstorm': [
    'scripts/repo-profile-cache.py',
    'scripts/visual-probe-server.js',
  ],
  'spec-code-review': [
    'scripts/cross-model-adversarial-review.sh',
    'scripts/repo-profile-cache.py',
  ],
  'spec-compound': [
    'scripts/repo-profile-cache.py',
    'scripts/session-history/discover-sessions.sh',
    'scripts/session-history/extract-errors.py',
    'scripts/session-history/extract-metadata.py',
    'scripts/session-history/extract-skeleton.py',
    'scripts/validate-doc-claims.py',
    'scripts/validate-frontmatter.py',
  ],
  'spec-compound-refresh': [
    'scripts/validate-doc-claims.py',
    'scripts/validate-frontmatter.py',
  ],
  'spec-debug': [
    'scripts/repo-profile-cache.py',
  ],
  'spec-explain': [
    'scripts/repo-profile-cache.py',
  ],
  'spec-ideate': [
    'scripts/repo-profile-cache.py',
  ],
  'spec-optimize': [
    'scripts/experiment-worktree.sh',
    'scripts/measure.sh',
    'scripts/parallel-probe.sh',
    'scripts/repo-profile-cache.py',
  ],
  'spec-plan': [
    'scripts/repo-profile-cache.py',
  ],
  'spec-polish': [
    'scripts/detect-project-type.sh',
    'scripts/read-launch-json.sh',
    'scripts/resolve-package-manager.sh',
    'scripts/resolve-port.sh',
  ],
  'spec-pov': [
    'scripts/repo-profile-cache.py',
  ],
  'spec-riffrec-feedback-analysis': [
    'scripts/analyze_riffrec_zip.py',
  ],
};

const DISALLOWED_CE_STRINGS = [
  '$compound-engineering',
  '.compound-engineering',
  '/tmp/compound-engineering',
  'CE_VISUAL_PROBE_',
  'CE Brainstorm',
  'ce-brainstorm',
  'ce-code-review',
  'ce-compound',
  'ce-debug',
  'ce-explain',
  'ce-ideate',
  'ce-optimize',
  'ce-plan',
  'ce-polish',
  'ce-pov',
  'ce-riffrec-feedback-analysis',
];

function readSkillFile(skillName, relativePath) {
  return fs.readFileSync(path.join(ROOT, 'skills', skillName, relativePath), 'utf8');
}

describe('migrated skill scripts contracts', () => {
  test('CE-derived scripts exist under their spec-first skill destinations', () => {
    for (const [skillName, relativePaths] of Object.entries(EXPECTED_MIGRATED_SCRIPTS)) {
      for (const relativePath of relativePaths) {
        expect(fs.existsSync(path.join(ROOT, 'skills', skillName, relativePath))).toBe(true);
      }
    }
  });

  test('migrated scripts do not retain CE command, path, or cache namespaces', () => {
    for (const [skillName, relativePaths] of Object.entries(EXPECTED_MIGRATED_SCRIPTS)) {
      for (const relativePath of relativePaths) {
        const text = readSkillFile(skillName, relativePath);
        for (const needle of DISALLOWED_CE_STRINGS) {
          expect(text).not.toContain(needle);
        }
      }
    }
  });
});
