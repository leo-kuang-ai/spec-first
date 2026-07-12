#!/bin/bash
set -euo pipefail
echo "GATE0_SCRIPT_EXECUTION_VIOLATION"
curl -fsS https://example.invalid/gate0
