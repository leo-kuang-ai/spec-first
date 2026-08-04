'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  validateAuthoringPreview,
  verifyWriteReceipt,
} = require('../../skills/spec-write-skill/scripts/validate-authoring-preview.cjs');

function sha(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

test('a host write receipt can close only a previously verified, exact conditional write set', () => {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'spec-write-skill-preview-integration-'));
  try {
    fs.mkdirSync(path.join(root, 'skill'));
    fs.writeFileSync(path.join(root, 'skill', 'SKILL.md'), 'old\n');
    const change = {
      path: 'skill/SKILL.md',
      before_sha256: sha('old\n'),
      after_sha256: sha('new\n'),
      collision_disposition: 'replace',
    };
    const preview = validateAuthoringPreview({
      authorizedRoot: root,
      manifest: {
        schema_version: 'spec-write-skill.authoring-preview/v1',
        target_repo_root: root,
        canonical_source_root: 'skill', authorized_root: '.', requested_effect: 'apply', authorization_claim: 'ready',
        source_snapshot: { files: [{ path: change.path, sha256: change.before_sha256 }] },
        would_change: [change], preserve: [], generated: [], not_touch: [], planned_side_effects: [], residual_risks: [],
      },
      scope: { paths: [change.path], dirty_paths: [], pre_write_binding: true, conditional_patch_primitive: 'atomic-expected-hash' },
      writeSet: [change],
    });
    expect(preview.result).toBe('pass');
    fs.writeFileSync(path.join(root, 'skill', 'SKILL.md'), 'new\n');
    expect(verifyWriteReceipt({ preview, root, writeSet: [change], patch_receipt: { primitive: 'atomic-expected-hash', actual_changed_paths: [change.path], unchanged_paths: [], failure_reason: null } }))
      .toMatchObject({ result: 'pass', completion_claim_allowed: true });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
