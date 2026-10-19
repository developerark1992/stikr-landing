// Startup file for Hostinger (LiteSpeed / Passenger Node.js apps).
// The web server hands us PORT (often a socket path), so we create the server ourselves.
const http = require("node:http");
const path = require("node:path");

process.chdir(__dirname);
process.env.ASTRO_NODE_AUTOSTART = "disabled";
try {
  process.loadEnvFile(path.join(__dirname, ".env"));
} catch {}

import("./dist/server/entry.mjs").then(({ handler }) => {
  const port = process.env.PORT || 4321;
  http.createServer(handler).listen(port, () => {
    console.log(`STIKR listening on ${port}`);
  });
});
