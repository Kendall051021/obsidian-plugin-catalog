# 插件目录与指南 / Plugin Catalog & Guides

An Obsidian plugin that shows every installed community plugin in a live side panel, keeps a Markdown catalog up to date, and writes a usage guide for each plugin — automatically, right after you install it.

本插件在侧边栏实时列出已安装插件；插件目录变化时自动重写「插件目录总览」；并为每个插件生成中文使用指南（Markdown），默认写入库内 `插件指南/` 文件夹。

## Features

- **Live panel** — installed plugins with version, enabled state, real command count, guide status; searchable.
- **Auto catalog** — rewrites `Obsidian 插件目录（总览）.md` whenever the plugin folder or enable state changes (total table, categories, core plugin status, maintenance notes).
- **Auto guides** — detects a newly installed plugin within ~1–3 s (`fs.watch` + polling fallback) and writes `指南-<plugin>.md`.
- **Structured guides** — each guide starts with a concrete goal case, then step-by-step settings with the control name and current state, followed by real commands, pitfalls and official links.
- **Two settings sources** — labels extracted from the plugin bundle (`setName`/`setDesc`/`addToggle`…), plus an optional live scrape of the real settings page (manual generation only) for exact control text and current values.
- **Grounded content** — guides are built from `manifest.json`, the live command registry, saved `data.json` keys (secrets masked), the plugin's GitHub README and the settings sources above. No invented features or shortcuts.
- **Hand-written guides are safe** — existing files are skipped by default; overwriting always backs up to `.obsidian/plugin-catalog/backups/`.
- **Uninstall cleanup** — when a plugin disappears, its auto-generated guide is backed up then deleted; hand-written guides are kept. The catalog updates either way.
- **Legacy name migration** — existing `插件指南 - X.md` files are renamed to `指南-X.md` once, using Obsidian's file manager so links keep working.
- **Optional AI** — with an OpenAI-compatible API key (DeepSeek by default) guides are rewritten in natural Chinese using the same step-by-step format; failures fall back to the template automatically.
- **Stays accurate** — after a plugin update, the generated guide's version/status frontmatter is synced automatically.

## Install

### Manual

1. Download `main.js`, `manifest.json`, `styles.css` from the [latest release](https://github.com/Kendall051021/obsidian-plugin-catalog/releases).
2. Put them in `<vault>/.obsidian/plugins/plugin-catalog-guide/`.
3. In Obsidian: **Settings → Community plugins → Installed plugins**, enable **插件目录与指南**.

### BRAT

Add `Kendall051021/obsidian-plugin-catalog` as a beta plugin in [BRAT](https://github.com/TfTHacker/obsidian42-brat).

## Usage

- Click the book icon in the ribbon, or run **插件目录与指南: 打开插件目录面板**.
- Panel buttons: **刷新** (rescan), **生成缺失** (generate missing guides), **打开总览**; per-row **生成 / 重生成 / 打开**.
- Commands:
  - `打开插件目录面板`
  - `重新扫描插件`
  - `更新插件目录总览`
  - `生成所有缺失指南`
  - `重新生成所有自动生成的指南`
  - `打开插件目录总览`
- Settings:
  - output folder (default `插件指南`), overwrite policy (`skip` / `backup` / `overwrite`)
  - auto-generate on install, on startup; README fetching; polling interval
  - uninstall cleanup: delete auto-generated guides only (hand-written kept)
  - manual generation may scrape the real settings page for exact control text and current state
  - catalog extras: core plugin status, themes
  - AI: base URL (default `https://api.deepseek.com`), model (`deepseek-chat`), API key, max tokens, timeout

## How guides are generated

1. `manifest.json` → name, version, author, compatibility, platform.
2. Obsidian command registry → the plugin's real command names.
3. `data.json` → saved setting keys (values containing key/token/secret/password are masked).
4. `community-plugins.json` (GitHub) → repository, then README raw text.
5. Settings items:
   - **code extraction** — `.setName` / `.setDesc` / `.addToggle` / `.addDropdown` / `.addOption` strings from the plugin bundle;
   - **live scrape** (manual generation, enabled by default) — opens the plugin settings tab briefly, reads every control label, widget type and current state, then closes;
   - tried in that order, falling back silently.
6. Output: AI first when configured, otherwise the local template. Every generated file carries `generator: plugin-catalog-guide` in its frontmatter.

> Generated guides are in Chinese. The plugin UI and README are bilingual where practical.

## Network access and privacy

The plugin works offline except for the requests below. It collects **no telemetry** and uploads **no note content**.

| Request | When | What is sent |
|---|---|---|
| `raw.githubusercontent.com/obsidianmd/obsidian-releases` | When generating a guide (or opening the settings page) | Nothing; fetches the public plugin index to find the plugin's repository. Cached for 10 minutes, failures cached for 2 minutes. |
| `raw.githubusercontent.com/<repo>/HEAD/README.md` | When generating a guide, if **Fetch GitHub README** is enabled | Nothing; fetches the plugin's public README to use as guide material. Disabled with one toggle. |
| Your configured AI endpoint (OpenAI-compatible) | Only if **AI** is enabled and an API key is set | Plugin name, version, author, description, command list, saved setting keys (values for key/token/secret/password are masked), and a README excerpt. Never your notes. Used only to write the guide. |

The API key is stored locally in this plugin's `data.json`. Settings and generated files never leave your vault.

## Changes to your vault

- Creates `指南-<plugin>.md` files and the catalog `Obsidian 插件目录（总览）.md` in the configured folder (default `插件指南`).
- Renames existing `插件指南 - X.md` files to `指南-X.md` **once**, using Obsidian's rename API so links in your notes are updated. A flag prevents it from running again.
- On plugin uninstall, deletes only guides carrying `generator: plugin-catalog-guide`; every deletion is backed up to `.obsidian/plugin-catalog/backups/` first. Hand-written guides are kept.
- Overwriting an existing guide follows the configured policy (`skip` by default); manual regeneration backs up hand-written files before replacing them.

## Limitations

- **Desktop only** (`isDesktopOnly: true`). The plugin uses Node's `fs.watch` for near-instant detection; mobile uses no Node APIs, but this build is declared desktop-only.
- Obsidian has no "plugin installed" event, so detection is directory watching + polling (≈1–3 s).
- Plugins installed but not enabled are listed and marked 未启用; their settings tab cannot be scraped (the plugin isn't loaded), so code extraction is used.
- Scraping relies on Obsidian's settings UI internals; if it fails, generation falls back to code extraction without interrupting.
- README fetching needs access to `raw.githubusercontent.com`; failure degrades to the template without stopping.
- Writes are serialized, but a cloud-sync plugin may still create conflict copies in the guide folder.

## Development

```bash
npm install
npm run dev        # esbuild watch → dist/
npm run build      # production bundle → dist/
npm run release    # bundle + copy main.js to repo root (release asset)
npm run typecheck
```

Deploying to a vault is intentionally not hard-coded: set `PLUGIN_CATALOG_DEPLOY_DIR` and pass `--deploy` to `esbuild.config.mjs` if you want an automatic copy.

Source layout: `src/main.ts` (lifecycle/commands), `scanner.ts` (plugin snapshot), `library.ts` (guide files/backups), `guide-generator.ts` + `guide-template.ts` (content), `ai.ts` (OpenAI-compatible client), `index-writer.ts` (catalog), `view.ts` (panel), `settings-tab.ts`.

## License

MIT — see [LICENSE](LICENSE).

## 中文说明（简版）

- 侧边栏面板实时列出插件；安装/卸载/升级插件后 1–3 秒内自动更新总览。
- 新插件自动生成中文使用指南：先给目标案例，再一步步写设置页；命名统一为 `指南-XXX.md`，旧的 `插件指南 - XXX.md` 会在首次加载时自动改名（并同步库内链接）。
- 设置细节来源：优先抓取真实设置页（手动生成时，会短暂打开设置窗口），失败时从插件 `main.js` 提取 `setName/setDesc/...` 标签，当前值结合 `data.json`。
- 卸载插件时只删除本插件自动生成的指南（先备份），手写指南保留并从总览移除。
- 可选 AI：填入 OpenAI 兼容 API Key 后，用命令「重新生成所有自动生成的指南」把模板指南升级为 AI 版，手写稿不会被碰。
- **仅桌面端**（使用 `fs.watch`）；网络访问与隐私见上一节，插件不收集遥测、不上传笔记内容。
