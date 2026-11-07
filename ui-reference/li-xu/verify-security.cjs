const {chromium}=require('@playwright/test');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  for(const file of ['index.html','礼序-轻量版.html','礼序-完整复刻.html']){
   const page=await browser.newPage();const outbound=[];
   page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith('http://127.0.0.1:5180/'))outbound.push(r.url())});
   const base='http://127.0.0.1:5180/'+encodeURIComponent(file);
   await page.goto(base+'#entry');
   const payload='<img data-injected="true" src="x" onerror="window.injected=true">';
   await page.locator('#name').fill(payload);await page.locator('[data-save="exit"]').click();
   await page.locator('.entry-rows').waitFor();
   assert((await page.locator('.entry-rows').textContent()).includes(payload),'name must render literally');
   assert.equal(await page.locator('[data-injected]').count(),0);
   await page.goto(base+'#home');await page.locator('[data-do="new"]').click();
   await page.locator('#new-name').fill(payload);await page.locator('#create-book').click();
   await page.locator('#book-list').waitFor();
   assert((await page.locator('#book-list').textContent()).includes(payload),'book title must render literally');
   assert.equal(await page.locator('[data-injected]').count(),0);
   await page.evaluate(()=>{const s=document.createElement('script');s.textContent='window.untrustedScriptRan=true';document.body.append(s)});
   assert.equal(await page.evaluate(()=>window.untrustedScriptRan),undefined,'CSP must block untrusted inline script');
   const blocked=await page.evaluate(async()=>{try{await fetch('https://example.invalid/security-check');return false}catch{return true}});
   assert(blocked,'CSP must block outbound connections');
   await page.goto(base+'#%22%3E%3Cimg%20data-injected=true%3E');
   assert.equal(await page.locator('[data-injected]').count(),0);
   assert.equal(await page.locator('#app').getAttribute('data-page'),'home');
   assert.deepEqual(outbound,[],'no outbound requests');
   await page.close();
  }
  console.log('PASS: all three versions escape input; routes are allowlisted; CSP blocks injected scripts and connections; no outbound requests');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
