const { performance } = require('node:perf_hooks');
const size = Number(process.argv[2] || 16000);
const entries = Array.from({ length: size }, (_, i) => ({ id: i + 1, category: i % 100, amount: (i % 17) + 1 }));
const start = performance.now();
const categoryTotals = new Map();
for (const entry of entries) {
  categoryTotals.set(entry.category, (categoryTotals.get(entry.category) || 0) + entry.amount);
}
const report = entries.map((entry) => ({
  ...entry,
  categoryTotal: categoryTotals.get(entry.category),
}));
const checksum = report.reduce((sum, row) => sum + row.id + row.amount + row.categoryTotal, 0);
console.log(JSON.stringify({ size, checksum, elapsed_ms: performance.now() - start }));
