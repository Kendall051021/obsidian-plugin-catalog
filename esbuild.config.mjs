import esbuild from "esbuild";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const args = process.argv.slice(2);
const prod = args.includes("production");
const deploy = args.includes("--deploy");
const watch = !prod && args.includes("--watch");

const VAULT_PLUGIN_DIR = process.env.PLUGIN_CATALOG_DEPLOY_DIR || "";

const common = {
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: [
    "obsidian",
    "electron",
    "fs",
    "fs/promises",
    "path",
    "os",
    "crypto",
    "child_process",
    "node:fs",
    "node:path",
  ],
  format: "cjs",
  target: "es2018",
  platform: "browser",
  logLevel: "info",
  sourcemap: prod ? false : "inline",
  treeShaking: true,
  legalComments: "none",
  outfile: "dist/main.js",
};

function copyStatic() {
  fs.mkdirSync("dist", { recursive: true });
  fs.copyFileSync("manifest.json", path.join("dist", "manifest.json"));
  if (fs.existsSync("styles.css")) {
    fs.copyFileSync("styles.css", path.join("dist", "styles.css"));
  }
}

function deployToVault() {
  if (!VAULT_PLUGIN_DIR) {
    console.warn("[deploy] 未设置 PLUGIN_CATALOG_DEPLOY_DIR，已跳过部署");
    return;
  }
  fs.mkdirSync(VAULT_PLUGIN_DIR, { recursive: true });
  for (const f of ["main.js", "manifest.json", "styles.css"]) {
    const src = path.join("dist", f);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(VAULT_PLUGIN_DIR, f));
    }
  }
  console.log(`[deploy] -> ${VAULT_PLUGIN_DIR}`);
}

if (watch) {
  const ctx = await esbuild.context({
    ...common,
    plugins: [
      {
        name: "copy-static",
        setup(build) {
          build.onEnd((result) => {
            copyStatic();
            if (!result.errors.length && deploy) deployToVault();
          });
        },
      },
    ],
  });
  await ctx.watch();
  console.log("[dev] watching src/ ...");
} else {
  const result = await esbuild.build(common);
  copyStatic();
  if (deploy) deployToVault();
  if (result.errors.length > 0) process.exit(1);
}
