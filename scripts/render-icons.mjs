import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";
const source = readFileSync("src/components/Icon.vue", "utf8");
const body = source.match(/const paths\s*=\s*(\{.*?\});/s)[1];
const paths = Function("return (" + body + ")")();
const colors = {
  blue: "#007AFF",
  gray: "#65758E",
  dark: "#17233B",
  white: "#FFFFFF",
  red: "#E5484D",
  orange: "#F59A23",
  green: "#1B9A67",
  gold: "#B1874E",
  cream: "#FFEDCC",
  light: "#8DBAFF",
};
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 72, height: 72 } });
mkdirSync("src/static/icons", { recursive: true });
for (const [color, value] of Object.entries(colors)) {
  for (const [name, path] of Object.entries(paths)) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${value}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></svg>`;
    await page.setContent(
      `<style>body{margin:0}svg{width:72px;height:72px}</style>${svg}`,
    );
    await page.screenshot({
      path: `src/static/icons/${name}-${color}.png`,
      omitBackground: true,
    });
  }
  console.log("Rendered " + color);
}
writeFileSync(
  "src/static/icons/NOTICE.md",
  "图标为本项目原创SVG路径，经浏览器渲染为72px PNG，用于微信端的离线兼容。重建命令：node scripts/render-icons.mjs。\n",
);
await browser.close();
