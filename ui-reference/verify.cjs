const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
for (const file of ['index.html', '冰蓝通透-完整复刻.html']) {
  const html = fs.readFileSync(path.join(__dirname, file), 'utf8');
  const script = html.match(/<script>([\s\S]*?)<\/script>/);
  assert(script, `${file}: missing script`);
  new Function(script[1]);
  assert.equal((html.match(/<section class="panel/g) || []).length, 6);
  const ids = new Set([...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]));
  for (const match of html.matchAll(/href="#([a-z0-9]+)"/g)) {
    assert(ids.has(match[1]), `Missing SVG symbol: ${match[1]}`);
  }
  assert(!/<img\b/i.test(html), 'Icons and illustrations must use SVG');
  if (file !== 'index.html') {
    assert(!html.includes('url(campus.svg)'), 'Standalone HTML requires an external asset');
    assert(html.includes('data:image/svg+xml,'));
  }
}
assert(fs.existsSync(path.join(__dirname, 'campus.svg')));
console.log('Validated six screens, JavaScript syntax, SVG references, and standalone assets.');
