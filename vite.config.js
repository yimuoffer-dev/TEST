import { defineConfig } from "vite";
import uniImport from "@dcloudio/vite-plugin-uni";
const uni = uniImport.default || uniImport;
export default defineConfig({
  plugins: [uni()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: { "/api": process.env.API_PROXY || "http://127.0.0.1:3001" },
  },
});
