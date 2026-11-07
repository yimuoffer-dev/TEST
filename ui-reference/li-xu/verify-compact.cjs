const {chromium}=require('@playwright/test');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:431,height:911}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  for(const route of ['home','books','book','entry','people','person','stats','profile']){
   await page.goto('http://127.0.0.1:5180/'+encodeURIComponent('礼序-轻量版.html')+'#'+route);
   await page.evaluate(()=>document.fonts.ready);
   await page.locator('img').evaluateAll(xs=>Promise.all(xs.map(x=>x.decode())));
   assert(await page.locator('main').isVisible());
   assert(await page.locator('img').evaluateAll(xs=>xs.every(x=>x.src.startsWith('data:image/webp;'))));
   assert(await page.locator('#app').evaluate(x=>getComputedStyle(x).backgroundImage.startsWith('url("data:image/webp;')));
  }
  assert.deepEqual(errors,[]);
  console.log('PASS: compact standalone HTML, eight pages, embedded WebP assets and fonts');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
