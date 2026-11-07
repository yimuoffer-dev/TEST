const { chromium } = require('@playwright/test');
const { mkdir, writeFile } = require('node:fs/promises');
const path = require('node:path');
const pages = { home: '礼序首页', books: '全部礼簿', book: '婚礼礼簿', entry: '记一笔', people: '人情往来', person: '往来详情', stats: '礼簿统计', profile: '我的' };
(async () => {
  const out = path.join(__dirname, 'review');
  await mkdir(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 863, height: 1822 }, deviceScaleFactor: 1 });
    for (const route of Object.keys(pages)) {
      await page.goto('http://127.0.0.1:5180/#' + route);
      await page.evaluate(() => document.fonts.ready);
      await page.locator('img').evaluateAll(imgs => Promise.all(imgs.map(img => img.decode())));
      await page.screenshot({ path: path.join(out, route + '.png'), fullPage: true });
    }
    await writeFile(path.join(out, 'index.html'), `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>礼序 · 八页效果预览</title><style>body{margin:0;background:#e9dece;color:#392d23;font:16px serif}header{padding:24px 4vw}h1{font-size:28px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:24px;padding:0 4vw 40px}figure{margin:0}img{width:100%;display:block;box-shadow:0 8px 25px #65432622}figcaption{padding:12px 0}a{color:#9f3e2d}</style><header><h1>礼序 · 八页效果预览</h1><p>863 × 1822 画布截图 · <a href="../index.html">进入交互页面</a> · <a href="../礼序-完整复刻.html">单文件版</a></p></header><main>${Object.entries(pages).map(([r, name]) => `<figure><a href="../index.html#${r}"><img src="${r}.png" alt="${name}"></a><figcaption>${name}</figcaption></figure>`).join('')}</main></html>`);
    console.log('Captured all eight pages in ' + out);
  } finally { await browser.close(); }
})().catch(err => { console.error(err); process.exitCode = 1; });
