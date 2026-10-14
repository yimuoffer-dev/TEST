import { test, expect } from '@playwright/test';
import fs from 'node:fs';
// 独立账号会话与仅只读截图，不依赖测试间的数据变更顺序。
async function login(page) {
  const response = await page.request.post('http://127.0.0.1:3101/api/auth/demo', {data:{type:'senior'}});
  const {token} = await response.json();
  await page.addInitScript(t => localStorage.setItem('campus-token', t), token);
}
const sizes = [{name:'small',width:320,height:568},{name:'standard',width:375,height:812},
  {name:'android',width:393,height:873},{name:'large',width:430,height:932},
  {name:'tablet',width:768,height:1024}];
for (const size of sizes) {
  test(`交付适配 ${size.width}×${size.height} 四主页面与分销`, async ({page}) => {
    await login(page);
    const errors=[]; page.on('pageerror', e => errors.push(e.message));
    await page.setViewportSize(size);
    for (const route of ['home','daily','records','profile','distribution']) {
      await page.goto(`/#/pages/${route==='home'?'index':route}/index?screen=${route}`);
      await expect(page.locator('.app-shell')).toHaveAttribute('data-ready','true');
      await expect(page.locator('.error-banner')).toHaveCount(0);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      if (route!=='distribution') await expect(page.locator('.bottom-tabs')).toBeVisible();
      await page.waitForTimeout(400);
      await page.screenshot({path:`artifacts/delivery/${size.width}x${size.height}-${route}.png`});
    }
    expect(errors).toEqual([]);
  });
}
test('原型颜色、刷新分页绑定与大字体下可操作', async ({page}) => {
  await login(page); await page.goto('/');
  await expect(page.locator('.app-shell')).toHaveAttribute('data-ready','true');
  expect(await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--blue').trim())).toBe('#1464ff');
  const source=fs.readFileSync('src/components/Screen.vue','utf8');
  expect(source).toContain('@refresherrefresh="pullRefresh"');
  expect(source).toContain('@scrolltolower="reachBottom"');
  await page.addStyleTag({content: 'body, uni-page-body {font-size:20px !important} .topic,.stat-caption,.bottom-tabs .ui-reset {font-size:16px !important}'});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.locator('.bottom-tabs .ui-reset').filter({hasText:'个人中心'}).click();
  await expect(page.locator('.page-title')).toHaveText('个人中心');
  await page.screenshot({path:'artifacts/delivery/375-large-font.png'});
});
test('二级页面、弹层与表单状态截图', async ({page}) => {
  await login(page); await page.goto('/');
  await expect(page.locator('.app-shell')).toHaveAttribute('data-ready','true');
  await page.locator('.filter-trigger').click();
  await expect(page.locator('.city-list')).toBeVisible();
  await page.screenshot({path:'artifacts/delivery/filter-location.png'});
  await page.locator('.sheet-heading .icon-button').click();
  await page.locator('.job-card').first().click();
  await expect(page.locator('.page-title')).toHaveText('招聘详情');
  await page.waitForTimeout(400);
  await page.screenshot({path:'artifacts/delivery/detail.png'});
  for (const route of ['membership','profile-edit','account']) {
    await page.goto(`/#/pages/${route}/index?screen=${route}`);
    await expect(page.locator('.app-shell')).toHaveAttribute('data-ready','true');
    await page.waitForTimeout(300);
    await page.screenshot({path:`artifacts/delivery/${route}.png`});
  }
  await page.goto('/#/pages/records/index?screen=records');
  await expect(page.locator('.record-card').first()).toBeVisible();
  await page.locator('.floating-add').click();
  await page.locator('.sheet-footer .primary').click();
  await expect(page.locator('.field-error')).toHaveCount(2);
  await page.screenshot({path:'artifacts/delivery/progress-validation.png'});
});
test('卡片收藏独立操作，搜索按钮与空态', async ({page}) => {
  await login(page); await page.goto('/');
  await expect(page.locator('.job-card')).toHaveCount(10);
  const save=page.locator('.card-save').first();
  const initial=await save.getAttribute('aria-pressed');
  await save.click();
  await expect(page.locator('.page-title')).toHaveText('校招信息');
  await expect(save).toHaveAttribute('aria-pressed', initial==='true'?'false':'true');
  await page.locator('.search-field input').fill('无匹配企业-visual-empty');
  await page.locator('.search-submit').click();
  await expect(page.locator('.job-card')).toHaveCount(0);
  await expect(page.locator('.empty-state')).toBeVisible();
  await page.screenshot({path:'artifacts/delivery/search-empty.png'});
});
