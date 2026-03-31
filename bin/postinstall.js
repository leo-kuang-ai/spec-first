#!/usr/bin/env node

const pkg = require('../package.json');

console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚀 Spec-First v${pkg.version} installed successfully!          ║
║                                                            ║
║   📦 Harness Engineering for Claude Code & Codex         ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝

✨ Next Steps:

  1️⃣  Initialize in your project:
     $ cd your-project
     $ spec-first init --claude   # for Claude Code
     $ spec-first init --codex    # for Codex

  2️⃣  Start your first spec workflow:
     $ /spec:brainstorm

  3️⃣  Learn more:
     📖 Docs: https://github.com/sunrain520/spec-first
     💡 Quick Start: Run 'spec-first --help'

🎯 Core Commands:
   /spec:brainstorm  - Clarify requirements
   /spec:plan        - Design solution
   /spec:work        - Execute implementation
   /spec:review      - Structured review
   /spec:compound    - Knowledge accumulation

Happy coding! 🎉
`);
