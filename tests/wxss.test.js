import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';

// Mirror the platform directives to catch WXSS-incompatible selectors before a build.
function platformStyles(platform) {
  const source = fs.readFileSync('src/styles.css', 'utf8');
  const stack = [true];
  return source.split('\n').filter(line => {
    const start = line.match(/\/\*\s*#(ifdef|ifndef)\s+(\S+)\s*\*\//);
    if (start) {
      const matches = start[2].split('||').includes(platform);
      stack.push(stack.at(-1) && (start[1] === 'ifdef' ? matches : !matches));
      return false;
    }
    if (/\/\*\s*#endif\s*\*\//.test(line)) { stack.pop(); return false; }
    return stack.at(-1);
  }).join('\n');
}
function assertWxssSelectors(css, file) {
  postcss.parse(css, { from: file }).walkRules(rule => {
    assert.ok(!/(^|[\s,>+~])\*(?=[\s,>+~.#:[\]]|$)/.test(rule.selector), `${file}: unsupported universal selector ${rule.selector}`);
    assert.ok(!/:root\b|:focus-visible\b/.test(rule.selector), `${file}: browser selector ${rule.selector}`);
  });
}
test('WeChat output excludes universal and browser-only selectors', () => {
  assertWxssSelectors(platformStyles('MP-WEIXIN'), 'src/styles.css (MP-WEIXIN)');
});
test('H5 retains root theme variables and keyboard focus styling', () => {
  const css = platformStyles('H5');
  assert.match(css, /:root/);
  assert.match(css, /button:focus-visible/);
  assert.match(css, /--blue:\s*#1464ff/);
});
test('generated WXSS excludes unsupported selectors', { skip: !fs.existsSync('dist/build/mp-weixin/app.wxss') }, () => {
  function visit(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(file);
      else if (file.endsWith('.wxss')) assertWxssSelectors(fs.readFileSync(file,'utf8'), file);
    }
  }
  visit('dist/build/mp-weixin');
});
