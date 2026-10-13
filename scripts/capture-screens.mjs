import { chromium, expect } from "@playwright/test";
import express from "express";
import { resolve } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";
import { createApp } from "../server/app.js";
const { app } = createApp();
app.use(express.static(resolve("dist/build/h5")));
const server = app.listen(3201, "127.0.0.1");
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
const issues = [];
page.on("pageerror", (error) => issues.push(error.message));
mkdirSync("artifacts/screens", { recursive: true });
try {
  const { token } = await fetch("http://127.0.0.1:3201/api/auth/demo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: '{"type":"senior"}',
  }).then((r) => r.json());
  await page.goto("http://127.0.0.1:3201");
  await page.evaluate((t) => localStorage.setItem("campus-token", t), token);
  const routes = [
    ["home", "", ".job-card"],
    ["daily", "", ".daily-stats"],
    ["detail", "&id=job-1", ".detail-info"],
    ["records", "", ".record-card"],
    ["profile", "", ".identity-card"],
    ["distribution", "", ".balance-panel"],
    ["membership", "", ".packages"],
    ["withdraw", "", ".withdraw-balance"],
    ["gifts", "", ".gift-quotas"],
  ];
  for (const [route, query, selector] of routes) {
    await page.goto(
      "http://127.0.0.1:3201/#/pages/" +
        (route === "home" ? "index" : route) +
        "/index?screen=" +
        route +
        query,
    );
    await page.reload();
    await expect(page.locator(".app-shell")).toHaveAttribute(
      "data-ready",
      "true",
    );
    await expect(page.locator(selector).first()).toBeVisible();
    await expect(page.locator(".error-banner")).toHaveCount(0);
    await page.screenshot({ path: "artifacts/screens/" + route + ".png" });
    console.log("Captured " + route);
  }
  await page.goto("http://127.0.0.1:3201/#/pages/index/index?screen=home");
  await page.reload();
  await expect(page.locator(".job-card").first()).toBeVisible();
  await page.locator(".filter-trigger").click();
  await expect(page.locator(".bottom-sheet")).toBeVisible();
  await page.screenshot({ path: "artifacts/screens/filter.png" });
  await page.locator(".sheet-heading .icon-button").click();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({ path: "artifacts/screens/desktop.png" });
  writeFileSync(
    "artifacts/screens/validation.json",
    JSON.stringify(
      {
        runtimeErrors: issues,
        widths: [375, 1440],
        source: "release H5 build",
      },
      null,
      2,
    ),
  );
  if (issues.length) throw new Error(issues.join("\n"));
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
