import { test, expect } from "@playwright/test";
const route = (name, params = "") =>
  "/#/pages/" +
  (name === "home" ? "index" : name) +
  "/index?screen=" +
  name +
  params;
async function login(page, type = "senior", target = "home") {
  const result = await page.request.post(
    "http://127.0.0.1:3101/api/auth/demo",
    { data: { type } },
  );
  const { token } = await result.json();
  if (page.url() === "about:blank") await page.goto("/");
  await page.evaluate(
    (token) => localStorage.setItem("campus-token", token),
    token,
  );
  await page.goto(route(target));
  await page.reload();
  await expect(page.locator(".page-title")).not.toHaveText("");
  await expect(page.locator(".app-shell")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await expect(page.locator(".error-banner")).toHaveCount(0);
}
async function ready(page) {
  await expect(page.locator(".platform-stats .stat-value").first()).toHaveText(
    "18",
  );
}
test("游客首页与按需登录，成功后继续进入当前招聘详情", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await ready(page);
  await expect(page.locator(".modal-layer")).toHaveCount(0);
  await page.locator(".job-card").first().click();
  await expect(page.locator(".sheet-heading")).toContainText("欢迎来到");
  await page.locator(".demo-login .text-button").click();
  await page.locator(".demo-account").first().click();
  await expect(page.locator(".page-title")).toHaveText("招聘详情");
  await expect(page.locator(".detail-info")).toContainText("投递中");
  expect(errors).toEqual([]);
});
test("专题条件回填、临时草稿取消、移除入口条件及组合筛选", async ({ page }) => {
  await login(page);
  await ready(page);
  await page.locator(".topic").filter({ hasText: "央国企" }).click();
  await expect(page.locator(".page-title")).toHaveText("央国企");
  await page.locator(".list-summary .text-button").click();
  await expect(
    page.locator(".filter-options .selected").filter({ hasText: "央企" }),
  ).toHaveCount(1);
  await page.locator(".city-list").getByText("深圳", { exact: true }).click();
  await page.locator(".sheet-heading .icon-button").click();
  await page.locator(".list-summary .text-button").click();
  await expect(page.locator(".city-list .selected")).toHaveCount(0);
  await page.locator(".sheet-footer .secondary").click();
  await page
    .locator(".filter-options")
    .getByText("私企", { exact: true })
    .click();
  await page.locator(".city-list").getByText("深圳", { exact: true }).click();
  await page.locator(".sheet-footer .primary").click();
  await expect(page.locator(".page-title")).toHaveText("筛选结果");
  await expect(page.locator(".condition-tags")).toContainText("私企");
  await expect(page.locator(".condition-tags")).toContainText("深圳");
  await expect(page.locator(".job-card")).toHaveCount(4);
});
test("普通用户10条限制、提醒不含套餐、会员开通后恢复权限", async ({ page }) => {
  await login(page, "normal");
  await ready(page);
  await expect(page.locator(".job-card")).toHaveCount(10);
  await page.locator(".refresh-button").click();
  await expect(page.locator(".confirm-title")).toHaveText("更多机会，等你探索");
  await expect(page.locator(".packages")).toHaveCount(0);
  await page.locator(".confirm-dialog .primary").click();
  await expect(page.locator(".page-title")).toHaveText("开通会员");
  await page.locator(".page-content>.primary").click();
  await expect(page.locator(".page-title")).toHaveText("校招信息");
  await expect(page.locator(".toast")).toContainText("已更新至最新信息");
  await page.locator(".load-more").click();
  await expect(page.locator(".job-card")).toHaveCount(16);
});
test("投递新增校验、自由岗位、关闭放弃提示、追加历史与删除", async ({
  page,
}) => {
  await login(page, "senior", "records");
  await expect(page.locator(".record-card")).toHaveCount(6);
  await page.locator(".floating-add").click();
  await page.locator(".sheet-footer .primary").click();
  await expect(page.locator(".field-error")).toHaveCount(2);
  await page
    .locator("uni-input")
    .filter({ hasText: "请输入单位名称" })
    .locator("input")
    .fill("测试企业");
  await page
    .locator("uni-input")
    .filter({ hasText: "自由填写岗位，例如前端开发工程师" })
    .locator("input")
    .fill("全栈开发工程师");
  await page.locator(".sheet-heading .icon-button").click();
  await expect(page.locator(".discard-layer")).toContainText("放弃本次填写");
  await page.locator(".discard-layer .primary").click();
  await page.locator(".sheet-footer .primary").click();
  await expect(page.locator(".record-card")).toHaveCount(7);
  await page.locator(".record-card").filter({ hasText: "测试企业" }).click();
  await expect(page.locator(".timeline-event")).toHaveCount(1);
  await page.locator(".sticky-action .primary").click();
  await page.locator(".sheet-footer .primary").click();
  await expect(page.locator(".timeline-event")).toHaveCount(2);
  await page
    .locator(".danger-text")
    .filter({ hasText: "删除记录及全部历史" })
    .click();
  await page.locator(".confirm-dialog .primary").click();
  await expect(page.locator(".page-title")).toHaveText("投递记录");
  await expect(page.locator(".record-card")).toHaveCount(6);
});
test("周历、历史日期、截止列表与回到本周", async ({ page }) => {
  await login(page, "senior", "daily");
  await expect(page.locator(".week-calendar .active")).toHaveCount(1);
  await page.locator(".week-heading .icon-button").first().click();
  await expect(page.locator(".return-today")).toBeVisible();
  await expect(page.locator(".job-card")).toHaveCount(0);
  await page.locator(".return-today").click();
  await expect(page.locator(".return-today")).toHaveCount(0);
  await page.locator(".orange-stat").click();
  await expect(page.locator(".section-heading.plain")).toContainText(
    "截止公告",
  );
});
test("高级赠送、永久权益不核销、跨账号兑换及权益记录", async ({ page }) => {
  await login(page, "senior", "gifts");
  await page.locator(".page-content>.primary").click();
  await expect(page.locator(".gift-code")).toHaveCount(1);
  const giftCode = await page.locator(".gift-code").first().innerText();
  const ctx = page.context();
  const normal = await ctx.newPage();
  const result = await normal.request.post(
    "http://127.0.0.1:3101/api/auth/demo",
    { data: { type: "vip" } },
  );
  const { token } = await result.json();
  await normal.addInitScript(
    (t) => localStorage.setItem("campus-token", t),
    token,
  );
  await normal.goto(route("redeem"));
  await normal
    .locator("uni-input")
    .filter({ hasText: "请输入会员兑换码" })
    .locator("input")
    .fill(giftCode);
  await normal.locator(".page-content>.primary").click();
  await expect(normal.locator(".page-title")).toHaveText("权益记录");
  await expect(normal.locator(".order-card")).toContainText([
    "演示授权",
    "赠送兑换",
  ]);
  await normal.close();
});
test("提现完整资料校验、冻结余额、撤销退回以及状态显示", async ({ page }) => {
  await login(page, "senior", "withdraw");
  await page
    .locator("uni-input")
    .filter({ hasText: "请输入提现金额" })
    .locator("input")
    .fill("49");
  await page.locator(".page-content>.primary").click();
  await expect(page.locator(".form-error")).toContainText("至少50元");
  await page
    .locator("uni-input")
    .filter({ hasText: "请输入提现金额" })
    .locator("input")
    .fill("50");
  await expect(page.locator(".page-content>.primary")).toContainText("¥50.00");
  await page.locator(".page-content>.primary").click();
  await expect(page.locator(".form-error")).toContainText("上传收款码");
  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.locator(".upload-area").click();
  const chooser = await fileChooserPromise;
  await chooser.setFiles({
    name: "receipt.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await expect(
    page.locator(".upload-preview image, .upload-preview uni-image"),
  ).toBeVisible();
  await page.locator(".page-content>.primary").click();
  await expect(page.locator(".page-title")).toHaveText("资金明细");
  await expect(page.locator(".withdrawal-record")).toContainText("待审核");
  await page.locator(".withdrawal-record .text-button").click();
  await page.locator(".confirm-dialog .primary").click();
  await expect(page.locator(".withdrawal-record")).toContainText("已撤销");
});
test("所有路由可加载，管理后台角色隔离，无运行异常", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await login(page);
  for (const name of [
    "profile",
    "messages",
    "favorites",
    "membership",
    "orders",
    "rights",
    "profile-edit",
    "account",
    "help",
    "about",
    "distribution",
    "partner",
    "funds",
    "customers",
    "team",
    "distribution-orders",
    "promotion",
    "gifts",
    "redeem",
  ]) {
    await page.goto(route(name));
    await expect(page.locator(".page-title")).not.toHaveText("");
    await expect(page.locator(".app-shell")).toHaveAttribute(
      "data-ready",
      "true",
    );
    await expect(page.locator(".error-banner")).toHaveCount(0);
    await page.waitForTimeout(120);
  }
  expect(errors).toEqual([]);
  await login(page, "editor", "admin");
  await expect(page.locator(".admin-role")).toContainText("招聘编辑");
  await expect(page.locator(".admin-tabs")).not.toContainText("订单退款");
  await login(page, "admin", "admin");
  await expect(page.locator(".admin-tabs")).toContainText("订单退款");
});
test("375/320/430/768/1440屏幕，无横向溢出且底部导航不遮挡", async ({
  page,
}) => {
  await login(page);
  for (const width of [320, 375, 430, 768, 1440]) {
    await page.setViewportSize({ width, height: 812 });
    await page.goto("/");
    await ready(page);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    const tabs = await page.locator(".bottom-tabs").boundingBox();
    expect(tabs.y + tabs.height).toBeLessThanOrEqual(813);
    await expect(page.locator(".topic").last()).toBeVisible();
    await page.screenshot({ path: `artifacts/home-${width}.png` });
  }
});
test("招聘编辑标准Excel下载、上传校验、保存草稿与专题维护", async ({
  page,
}) => {
  await login(page, "editor", "admin");
  await expect(page.locator(".admin-job")).toHaveCount(19);
  await page
    .locator(".admin-tabs")
    .getByText("模板导入", { exact: true })
    .click();
  const headers = {
    Authorization:
      "Bearer " +
      (await page.evaluate(() => localStorage.getItem("campus-token"))),
  };
  const response = await page.request.get(
    "http://127.0.0.1:3101/api/admin/import/template",
    { headers },
  );
  const { file } = await response.json();
  const choose = page.waitForEvent("filechooser");
  await page.getByText("上传 Excel 文件并校验", { exact: true }).click();
  await (
    await choose
  ).setFiles({
    name: "template.xlsx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer: Buffer.from(file, "base64"),
  });
  await expect(page.locator(".import-row")).toHaveCount(1);
  await expect(page.locator(".form-error")).toHaveCount(0);
  await page.getByText("确认保存 1 条草稿", { exact: true }).click();
  await expect(page.locator(".toast")).toContainText("草稿已保存");
  await page
    .locator(".admin-tabs")
    .getByText("招聘公告", { exact: true })
    .click();
  await expect(page.locator(".admin-job")).toHaveCount(20);
  await expect(
    page.locator(".admin-job").filter({ hasText: "示例2027届校园招聘" }),
  ).toContainText("草稿");
  await page
    .locator(".admin-tabs")
    .getByText("专题维护", { exact: true })
    .click();
  await expect(page.getByText("保存专题", { exact: true })).toBeVisible();
});
test("加载更多后详情返回保留列表页数，首屏请求失败可重试恢复", async ({
  page,
}) => {
  await login(page);
  await ready(page);
  await page.locator(".load-more").click();
  await expect(page.locator(".job-card")).toHaveCount(16);
  await page.locator(".job-card").first().click();
  await expect(page.locator(".page-title")).toHaveText("招聘详情");
  await page.locator(".back-button").click();
  await expect(page.locator(".page-title")).toHaveText("校招信息");
  await expect(page.locator(".job-card")).toHaveCount(16);
  await page.route("**/api/jobs?**", (route) => route.abort());
  await page.reload();
  await expect(page.locator(".error-banner")).toContainText("网络连接失败");
  await expect(page.locator(".page-title")).toHaveText("校招信息");
  await expect(page.locator(".search-field")).toBeVisible();
  await page.unroute("**/api/jobs?**");
  await page.locator(".error-banner .text-button").click();
  await expect(page.locator(".error-banner")).toHaveCount(0);
  await expect(page.locator(".job-card")).toHaveCount(10);
});

// Simulate the production bootstrap flag while retaining isolated test identities.
// This catches accidentally nesting administrative navigation under the demo panel.
test('生产模式个人中心后台入口按管理员、编辑和普通用户权限显示', async ({page}) => {
  await page.route('**/api/bootstrap',async route=>{
    const response=await route.fetch();
    const data=await response.json();
    await route.fulfill({response,json:{...data,demo:false}});
  });
  for(const type of ['admin','editor']) {
    await login(page,type,'profile');
    await expect(page.locator('.demo-panel')).toHaveCount(0);
    await expect(page.locator('.admin-entry')).toBeVisible();
    await page.locator('.admin-entry').click();
    await expect(page.locator('.page-title')).toHaveText('管理后台');
    await expect(page.locator('.admin-tabs')).toContainText('招聘公告');
    if(type==='editor') await expect(page.locator('.admin-tabs')).not.toContainText('系统配置');
  }
  await login(page,'normal','profile');
  await expect(page.locator('.demo-panel')).toHaveCount(0);
  await expect(page.locator('.admin-entry')).toHaveCount(0);
});
