#!/bin/bash
# Generates a 550+ source-file multi-end monorepo at eval time (the repo itself
# only checks in README/package.json/this script to stay lightweight), then
# creates the fixture baseline commit.
set -euo pipefail

mkdir -p apps/web/src apps/admin/src apps/h5/src packages/api-client/src packages/ui/src packages/utils/src

printf '{"name":"@shop/web","private":true,"dependencies":{"@shop/api-client":"*","@shop/ui":"*"}}\n' > apps/web/package.json
printf '{"name":"@shop/admin","private":true,"dependencies":{"@shop/api-client":"*"}}\n' > apps/admin/package.json
printf '{"name":"@shop/h5","private":true,"dependencies":{"@shop/api-client":"*","@shop/utils":"*"}}\n' > apps/h5/package.json
printf '{"name":"@shop/api-client","version":"1.0.0","main":"src/index.ts"}\n' > packages/api-client/package.json
printf '{"name":"@shop/ui","version":"1.0.0","main":"src/index.ts"}\n' > packages/ui/package.json
printf '{"name":"@shop/utils","version":"1.0.0","main":"src/index.ts"}\n' > packages/utils/package.json

gen_mod() { # <dir> <count> <prefix>
  for i in $(seq 1 "$2"); do
    printf "import { request } from '@shop/api-client';\nexport const %s%s = () => request('/%s/%s');\n" "$3" "$i" "$3" "$i" > "$1/src/$3$i.ts"
  done
}
gen_mod apps/web 100 web
gen_mod apps/admin 100 adm
gen_mod apps/h5 100 h5
gen_mod packages/utils 150 ut
gen_mod packages/api-client 49 cl
gen_mod packages/ui 49 ui

cat > packages/api-client/src/index.ts <<'EOF'
export async function request(url: string): Promise<unknown> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`request failed: ${res.status}`);
  return res.json();
}
EOF
cat > packages/ui/src/index.ts <<'EOF'
export const Button = (label: string) => `<button>${label}</button>`;
EOF
cat > packages/utils/src/index.ts <<'EOF'
export { ut1, ut2 } from './ut1';
import { ut2 as _u2 } from './ut2';
export const fmtMoney = (n: number) => `${_u2(n)}`;
EOF
mkdir -p apps/admin/src/legacy
cat > apps/admin/src/legacy/OldPanel.ts <<'EOF'
// 2020 遗留面板，待下线；新代码不要参考。
import { web1 } from '../../../web/src/web1';
export const OldPanel = web1;
EOF

git init -q -b main
git add -A
git -c user.name=eval -c user.email=eval@x commit -qm 'fixture baseline'
