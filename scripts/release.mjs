import fs from "node:fs";

if (!fs.existsSync("dist/main.js")) {
  console.error("dist/main.js 不存在，请先运行 npm run build");
  process.exit(1);
}

fs.copyFileSync("dist/main.js", "main.js");

const manifest = JSON.parse(fs.readFileSync("manifest.json", "utf8"));
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));

if (manifest.version !== pkg.version) {
  console.warn(`[release] 版本不一致：manifest ${manifest.version} / package ${pkg.version}`);
}

for (const file of ["main.js", "manifest.json", "styles.css"]) {
  if (!fs.existsSync(file)) {
    console.error(`[release] 缺少发布文件：${file}`);
    process.exit(1);
  }
  console.log(`[release] ${file}  ${fs.statSync(file).size} bytes`);
}

console.log(`[release] 就绪：把这三个文件作为 v${manifest.version} 的 Release 附件上传`);
