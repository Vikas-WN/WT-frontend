// Bakes the address WebTrak opens into the app. Set WEBTRAK_URL to build for another environment, e.g.
//   WEBTRAK_URL=https://uat-webtrak.webknot-dev.in npm run build:mac
const fs = require("node:fs");
const path = require("node:path");

const DEFAULT_URL = "https://webtrak.webknot-dev.in";
const raw = (process.env.WEBTRAK_URL || DEFAULT_URL).trim();
let url;
try {
  url = new URL(raw);
} catch {
  console.error(`WEBTRAK_URL is not a valid address: ${raw}`);
  process.exit(1);
}
if (url.protocol !== "https:" && url.hostname !== "localhost") {
  console.error("WEBTRAK_URL must be https (or localhost for development).");
  process.exit(1);
}
const out = path.join(__dirname, "..", "src", "config.json");
fs.writeFileSync(out, JSON.stringify({ url: url.origin }, null, 2) + "\n");
console.log(`WebTrak desktop will open ${url.origin}`);
