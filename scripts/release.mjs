import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const OUT_DIR = "release-assets";
const FILES = ["main.js", "manifest.json", "styles.css"];

if (!fs.existsSync("dist/main.js")) {
  console.error("dist/main.js 不存在，请先运行 npm run build");
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync("manifest.json", "utf8"));
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));

if (manifest.version !== pkg.version) {
  console.error(`[release] 版本不一致：manifest ${manifest.version} / package ${pkg.version}`);
  process.exit(1);
}

fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

fs.copyFileSync("dist/main.js", path.join(OUT_DIR, "main.js"));
fs.copyFileSync("manifest.json", path.join(OUT_DIR, "manifest.json"));
fs.copyFileSync("styles.css", path.join(OUT_DIR, "styles.css"));

const bundle = fs.readFileSync(path.join(OUT_DIR, "main.js"), "utf8");
if (!bundle.includes("plugin-catalog-guide")) {
  console.error("[release] main.js 里没有插件 id，可能打包错了");
  process.exit(1);
}

const lines = [];
for (const file of FILES) {
  const full = path.join(OUT_DIR, file);
  const bytes = fs.statSync(full).size;
  const hash = crypto.createHash("sha256").update(fs.readFileSync(full)).digest("hex");
  lines.push(`${hash}  ${file}  (${bytes} bytes)`);
  console.log(`[release] ${file}  ${bytes} bytes  sha256=${hash}`);
}

fs.writeFileSync(path.join(OUT_DIR, "SHA256SUMS.txt"), `${lines.join("\n")}\n`, "utf8");

const assetManifest = JSON.parse(fs.readFileSync(path.join(OUT_DIR, "manifest.json"), "utf8"));
console.log(`[release] 资产目录: ${path.resolve(OUT_DIR)}`);
console.log(`[release] 版本: ${assetManifest.version}  名称: ${assetManifest.name}`);
console.log(`[release] 把 ${OUT_DIR}/ 里的三个文件上传到 tag ${assetManifest.version} 的 Release`);
