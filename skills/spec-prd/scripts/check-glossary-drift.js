#!/usr/bin/env node
'use strict';

// Deterministic term drift detection: scan PRD text for literal matches of canonical glossary terms to avoid.
// These are script-owned facts — the script only reports "where the literal term 'avoid' appears", and whether this constitutes a real issue.
// (Whether to cite, discuss, or genuinely misuse the term) is adjudicated by the LLM in the readiness judgment.
// The script does not extract new terms or judge whether definitions deviate from canonical — those are LLM-owned semantic judgments.

const fs = require('fs');
const path = require('path');

const DEFAULT_GLOSSARY = 'docs/contracts/domain-glossary.md';

function parseArgs(argv) {
  const args = { target: null, glossary: DEFAULT_GLOSSARY, error: null };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--glossary') {
      if (!argv[i + 1] || argv[i + 1].startsWith('--')) {
        args.error = 'missing value for --glossary';
        break;
      }
      args.glossary = argv[i + 1];
      i += 1;
    } else if (!args.target) {
      args.target = a;
    } else {
      args.error = `unexpected extra argument: ${a}`;
      break;
    }
  }
  return args;
}

// Parse the ### entries in glossary, extract { canonical_name, avoid[], status }
function parseGlossary(text) {
  // First extract the fenced code blocks —— the glossary document will embed format examples (``` code block contents
  // (Example items are not real items); without stripping, examples might be mistakenly treated as canonical terms.
  const withoutFences = text.replace(/^```[\s\S]*?^```/gm, '');
  const entries = [];
  const blocks = withoutFences.split(/^### /m).slice(1);
  for (const block of blocks) {
    const lines = block.split('\n');
    const canonical = lines[0].trim();
    if (!canonical) continue;
    const avoidLine = lines.find((l) => /^-\s*avoid\s*:/i.test(l));
    const statusLine = lines.find((l) => /^-\s*status\s*:/i.test(l));
    const avoid = avoidLine
      ? avoidLine
          .replace(/^-\s*avoid\s*:/i, '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    const status = statusLine
      ? statusLine.replace(/^-\s*status\s*:/i, '').trim()
      : 'active';
    entries.push({ canonical_name: canonical, avoid, status });
  }
  return entries;
}

// Perform a literal search to check if an alias appears in a line.
// No regular expressions — the `g` flag in regular expressions has state (lastIndex accumulates across calls, leading to missed matches)
// Moreover, the `\b` word boundary always fails for terms ending with non-alphabetic or non-numeric characters (C++, .NET, C#).
// Modify to stateless indexOf scanning + explicit boundary checking:
//   - Pure ASCII alphanumeric terms require "whole word" matching (non-alphanumeric on both sides), to avoid matching "bill" in "billing";
//   - Terms containing non-ASCII (e.g., Chinese) or non-alphanumeric characters are matched literally.
//     Since these terms lack reliable word boundary concepts, false positives are handled by the LLM in readiness decisions.
function lineContainsAlias(line, alias) {
  if (!alias) return false;
  const hay = line.toLowerCase();
  const needle = alias.toLowerCase();
  const isAsciiWord = /^[a-z0-9]+$/i.test(alias);
  let from = 0;
  for (;;) {
    const idx = hay.indexOf(needle, from);
    if (idx === -1) return false;
    if (!isAsciiWord) return true;
    const before = idx === 0 ? '' : hay[idx - 1];
    const after = idx + needle.length >= hay.length ? '' : hay[idx + needle.length];
    const boundedLeft = before === '' || !/[a-z0-9]/i.test(before);
    const boundedRight = after === '' || !/[a-z0-9]/i.test(after);
    if (boundedLeft && boundedRight) return true;
    from = idx + needle.length;
  }
}

function detectDrift(targetText, entries) {
  const findings = [];
  const lines = targetText.split('\n');
  for (const entry of entries) {
    for (const alias of entry.avoid) {
      lines.forEach((line, idx) => {
        if (lineContainsAlias(line, alias)) {
          findings.push({
            reason_code: 'avoid_term_used',
            term_used: alias,
            canonical_name: entry.canonical_name,
            canonical_status: entry.status,
            line: idx + 1,
          });
        }
      });
    }
  }
  return findings;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.error || !args.target) {
    if (args.error) {
      process.stderr.write(`${args.error}\n`);
    }
    process.stderr.write(
      'usage: check-glossary-drift.js <target-prd-path> [--glossary <path>]\n'
    );
    process.exit(2);
  }

  let targetText;
  try {
    targetText = fs.readFileSync(path.resolve(args.target), 'utf8');
  } catch (err) {
    process.stderr.write(`cannot read target: ${args.target}\n`);
    process.exit(2);
  }

  const result = {
    glossary: args.glossary,
    target: args.target,
    glossary_status: 'present',
    findings: [],
  };

  let glossaryText;
  try {
    glossaryText = fs.readFileSync(path.resolve(args.glossary), 'utf8');
  } catch (err) {
    // glossary is opt-in; if not present, gracefully degrades to none drift, no error reported
    result.glossary_status = 'absent';
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    process.exit(0);
  }

  const entries = parseGlossary(glossaryText);
  if (entries.length === 0) {
    result.glossary_status = 'empty';
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    process.exit(0);
  }

  result.findings = detectDrift(targetText, entries);
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  process.exit(0);
}

main();
