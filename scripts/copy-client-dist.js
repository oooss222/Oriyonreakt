const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "..", "client", "dist");
const dest = path.join(__dirname, "..", "Server", "public");

if (!fs.existsSync(path.join(src, "index.html"))) {
  console.error("Build failed: client/dist/index.html not found");
  process.exit(1);
}

fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(src, dest, { recursive: true });

console.log("Copied client/dist -> Server/public");
