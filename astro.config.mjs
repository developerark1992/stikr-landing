// @ts-check
import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import vercel from "@astrojs/vercel";

// Vercel by default; `DEPLOY_TARGET=hostinger npm run build` builds the standalone Node server
// that Hostinger runs through app.cjs (see DEPLOY-HOSTINGER.md).
const hostinger = process.env.DEPLOY_TARGET === "hostinger";

export default defineConfig({
  site: hostinger ? "https://yourstikr.com" : undefined,
  adapter: hostinger ? node({ mode: "standalone" }) : vercel(),
});
