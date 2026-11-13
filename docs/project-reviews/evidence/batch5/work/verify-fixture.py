#!/usr/bin/env python3
"""校准独立验收：原始实现失败，参考实现通过，三个错误变体失败。"""
import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('prepare', HERE / 'prepare.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

DOMAIN = """'use strict';
const { get, withTx } = require('../lib/db');
const audit = require('../lib/audit');
function cancelInvoice(id) {
  const invoice = get('invoices', id);
  if (!invoice) throw Object.assign(new Error('missing'), { status: 404 });
  if (invoice.status === 'cancelled') return { id, status: 'cancelled' };
  if (invoice.status !== 'open') throw Object.assign(new Error('conflict'), { status: 409 });
  return withTx(tx => {
    tx.update('invoices', id, { status: 'cancelled' });
    audit.record(tx, 'invoice.cancel', id);
    return { id, status: 'cancelled' };
  });
}
module.exports = { cancelInvoice };
"""
ROUTE = """    const match = /^\\/invoices\\/([^/]+)\\/cancel$/.exec(req.path);
    if (req.method === 'POST' && match) {
      try { return { status: 200, body: require('../invoices/cancel').cancelInvoice(match[1]) }; }
      catch (err) { return { status: err.status || 500, error: err.message }; }
    }
"""


def run(args, root):
    result = subprocess.run(args, cwd=root, capture_output=True, text=True)
    return {'exit_code': result.returncode, 'stdout': result.stdout, 'stderr': result.stderr}


with tempfile.TemporaryDirectory(prefix='s06-fixture-check-') as directory:
    root = Path(directory) / 'repo'
    module.prepare(root)
    out = {'kind': 'fixture_calibration', 'model_calls': 0}
    out['base_tests'] = run(['npm', 'test'], root)
    out['base_oracle'] = run(['node', str(HERE / 'grade.cjs'), str(root)], root)
    domain = root / 'src/invoices/cancel.js'
    domain.write_text(DOMAIN)
    route = root / 'src/http/routes.js'
    original = route.read_text()
    route.write_text(original.replace('  try {\n', '  try {\n' + ROUTE, 1))
    out['reference_tests'] = run(['npm', 'test'], root)
    out['reference_oracle'] = run(['node', str(HERE / 'grade.cjs'), str(root)], root)
    mutants = {
        'no_audit': DOMAIN.replace("    audit.record(tx, 'invoice.cancel', id);\n", ''),
        'no_idempotency': DOMAIN.replace("  if (invoice.status === 'cancelled') return { id, status: 'cancelled' };\n", ''),
        'paid_allowed': DOMAIN.replace("invoice.status !== 'open'", "!['open', 'paid'].includes(invoice.status)"),
    }
    out['mutants'] = {}
    for name, content in mutants.items():
        domain.write_text(content)
        out['mutants'][name] = run(['node', str(HERE / 'grade.cjs'), str(root)], root)
    out['passed'] = (out['base_tests']['exit_code'] == 0 and out['base_oracle']['exit_code'] == 1
                     and out['reference_tests']['exit_code'] == 0 and out['reference_oracle']['exit_code'] == 0
                     and all(item['exit_code'] == 1 for item in out['mutants'].values()))
    (HERE / 'calibration.json').write_text(json.dumps(out, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'passed': out['passed'], 'model_calls': 0, 'mutants': len(mutants)}))
    raise SystemExit(0 if out['passed'] else 1)
