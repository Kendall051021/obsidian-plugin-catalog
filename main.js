"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => PluginCatalogPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian8 = require("obsidian");

// src/defaults.ts
var DEFAULT_SETTINGS_AI = {
  enabled: false,
  baseUrl: "https://api.deepseek.com",
  model: "deepseek-chat",
  apiKey: "",
  temperature: 0.3,
  maxTokens: 2e3,
  timeoutMs: 6e4
};

// src/util.ts
function sanitizeFileName(name) {
  const cleaned = (name || "").replace(/[\\/:*?"<>|#^\[\]{}]/g, " ").replace(/[\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim();
  return cleaned || "\u672A\u547D\u540D\u63D2\u4EF6";
}
function safeFolderPath(input) {
  const cleaned = (input || "").replace(/\\/g, "/").replace(/^\/+|\/+$/g, "").replace(/\.\./g, "").replace(/\/{2,}/g, "/");
  return cleaned || "\u63D2\u4EF6\u6307\u5357";
}
function formatDate(date = /* @__PURE__ */ new Date()) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}
function formatDateTime(date = /* @__PURE__ */ new Date()) {
  const hh = `${date.getHours()}`.padStart(2, "0");
  const mm = `${date.getMinutes()}`.padStart(2, "0");
  const ss = `${date.getSeconds()}`.padStart(2, "0");
  return `${formatDate(date)} ${hh}:${mm}:${ss}`;
}
var SECRET_KEY_PATTERN = /(api[-_]?key|token|secret|password|passwd|credential|authorization|cookie)/i;
function isSecretKey(key) {
  return SECRET_KEY_PATTERN.test(key);
}
function describeSettingValue(value) {
  if (value === null || value === void 0) return "\u7A7A";
  if (typeof value === "boolean") return value ? "\u5F00\u542F" : "\u5173\u95ED";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") {
    if (!value) return "\u7A7A\u5B57\u7B26\u4E32";
    if (value.length > 40) return `${value.slice(0, 20)}\u2026\uFF08\u5171 ${value.length} \u5B57\u7B26\uFF09`;
    return `\`${value}\``;
  }
  if (Array.isArray(value)) return `\u6570\u7EC4\uFF08${value.length} \u9879\uFF09`;
  if (typeof value === "object") return `\u5BF9\u8C61\uFF08${Object.keys(value).length} \u4E2A\u952E\uFF09`;
  return typeof value;
}
function repoFromUrl(url) {
  if (!url) return null;
  const m = url.match(/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)/);
  if (!m) return null;
  const repo = m[2].replace(/\.git$/, "");
  if (!repo || repo === "obsidian-releases") return null;
  return `${m[1]}/${repo}`;
}
function escapeTableCell(text) {
  return (text || "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// src/normalize.ts
function normalizeSettings(raw) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
  const input = raw != null ? raw : {};
  const aiInput = (_a = input.ai) != null ? _a : {};
  const clamp = (value, min, max, fallback) => {
    const num = typeof value === "number" && Number.isFinite(value) ? value : fallback;
    return Math.min(max, Math.max(min, Math.round(num)));
  };
  const policy = input.overwritePolicy === "backup" || input.overwritePolicy === "overwrite" ? input.overwritePolicy : "skip";
  return {
    outputFolder: safeFolderPath((_b = input.outputFolder) != null ? _b : "\u63D2\u4EF6\u6307\u5357"),
    overwritePolicy: policy,
    autoGenerateOnInstall: (_c = input.autoGenerateOnInstall) != null ? _c : true,
    autoGenerateOnStartup: (_d = input.autoGenerateOnStartup) != null ? _d : true,
    fetchReadme: (_e = input.fetchReadme) != null ? _e : true,
    pollIntervalMs: clamp(input.pollIntervalMs, 1e3, 6e4, 3e3),
    includeCorePlugins: (_f = input.includeCorePlugins) != null ? _f : true,
    includeThemes: (_g = input.includeThemes) != null ? _g : false,
    notifyOnGenerate: (_h = input.notifyOnGenerate) != null ? _h : true,
    ai: {
      ...DEFAULT_SETTINGS_AI,
      ...aiInput,
      enabled: (_i = aiInput.enabled) != null ? _i : false,
      maxTokens: clamp(aiInput.maxTokens, 200, 8e3, 2e3),
      timeoutMs: clamp(aiInput.timeoutMs, 5e3, 18e4, 6e4),
      temperature: typeof aiInput.temperature === "number" && Number.isFinite(aiInput.temperature) ? Math.min(1, Math.max(0, aiInput.temperature)) : 0.3,
      apiKey: ((_j = aiInput.apiKey) != null ? _j : "").trim(),
      baseUrl: ((_k = aiInput.baseUrl) != null ? _k : "https://api.deepseek.com").trim().replace(/\/+$/, ""),
      model: ((_l = aiInput.model) != null ? _l : "deepseek-chat").trim()
    }
  };
}

// src/library.ts
var import_obsidian = require("obsidian");
var WORK_DIR = ".obsidian/plugin-catalog";
var BACKUP_DIR = `${WORK_DIR}/backups`;
var OVERVIEW_FILE = "Obsidian \u63D2\u4EF6\u76EE\u5F55\uFF08\u603B\u89C8\uFF09.md";
var GuideLibrary = class {
  constructor(app, folder) {
    this.app = app;
    this.folder = folder;
    this.entries = /* @__PURE__ */ new Map();
  }
  get adapter() {
    return this.app.vault.adapter;
  }
  folderPath() {
    return (0, import_obsidian.normalizePath)(this.folder());
  }
  async refresh(force = false) {
    const folder = this.folderPath();
    const next = /* @__PURE__ */ new Map();
    try {
      if (!await this.adapter.exists(folder)) {
        this.entries = next;
        return;
      }
      const listing = await this.adapter.list(folder);
      for (const path of listing.files) {
        if (!path.toLowerCase().endsWith(".md")) continue;
        const cached = this.entries.get(path);
        const stat = await this.adapter.stat(path).catch(() => null);
        if (!stat) continue;
        if (!force && cached && cached.mtime === stat.mtime) {
          next.set(path, cached);
          continue;
        }
        const entry = { path, pluginId: null, managed: false, mtime: stat.mtime };
        try {
          const content = await this.adapter.read(path);
          const front = content.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---/);
          if (front) {
            const idMatch = front[1].match(/^plugin:\s*["']?([^"'\r\n]+)["']?\s*$/m);
            if (idMatch) entry.pluginId = idMatch[1].trim();
            entry.managed = /^generator:\s*plugin-catalog-guide\s*$/m.test(front[1]);
            const versionMatch = front[1].match(/^version:\s*["']?([^"'\r\n]+)["']?\s*$/m);
            if (versionMatch) entry.version = versionMatch[1].trim();
            const statusMatch = front[1].match(/^status:\s*["']?([^"'\r\n]+)["']?\s*$/m);
            if (statusMatch) entry.statusLabel = statusMatch[1].trim();
          }
        } catch (e) {
        }
        next.set(path, entry);
      }
    } catch (e) {
    }
    this.entries = next;
  }
  fileNameFor(info) {
    const base = `\u63D2\u4EF6\u6307\u5357 - ${sanitizeFileName(info.name)}`;
    const candidate = `${base}.md`;
    const existing = this.entries.get((0, import_obsidian.normalizePath)(`${this.folderPath()}/${candidate}`));
    if (!existing) return candidate;
    if (existing.pluginId === info.id || existing.pluginId === null) return candidate;
    return `${base} (${info.id}).md`;
  }
  findForPlugin(info) {
    const expected = (0, import_obsidian.normalizePath)(`${this.folderPath()}/${this.fileNameFor(info)}`);
    const byName = this.entries.get(expected);
    if (byName) return byName;
    for (const entry of this.entries.values()) {
      if (entry.pluginId === info.id) return entry;
    }
    return null;
  }
  async ensureFolder(path) {
    const normalized = (0, import_obsidian.normalizePath)(path);
    if (await this.adapter.exists(normalized)) return;
    const parts = normalized.split("/");
    let current = "";
    for (const part of parts) {
      current = current ? `${current}/${part}` : part;
      if (!await this.adapter.exists(current)) {
        try {
          await this.adapter.mkdir(current);
        } catch (e) {
        }
      }
    }
  }
  async backupFile(path) {
    var _a;
    await this.ensureFolder(BACKUP_DIR);
    const stamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
    const base = (_a = path.split("/").pop()) != null ? _a : "backup.md";
    const target = (0, import_obsidian.normalizePath)(`${BACKUP_DIR}/${base.replace(/\.md$/i, "")}.${stamp}.md`);
    const content = await this.adapter.read(path);
    await this.adapter.write(target, content);
    return target;
  }
  async writeGuide(info, markdown, policy) {
    var _a;
    await this.refresh();
    await this.ensureFolder(this.folderPath());
    const preferred = (0, import_obsidian.normalizePath)(`${this.folderPath()}/${this.fileNameFor(info)}`);
    const existingForPlugin = this.findForPlugin(info);
    const path = existingForPlugin ? existingForPlugin.path : preferred;
    const exists = await this.adapter.exists(path);
    if (exists) {
      if (policy === "skip") {
        return { path, written: false, skippedReason: "\u8BE5\u63D2\u4EF6\u5DF2\u6709\u6307\u5357\uFF08\u6309\u8BBE\u7F6E\u8DF3\u8FC7\uFF09" };
      }
      if (policy === "backup") {
        const backupPath = await this.backupFile(path);
        await this.adapter.write(path, markdown);
        this.entries.set(path, {
          path,
          pluginId: info.id,
          managed: true,
          mtime: Date.now(),
          version: info.version,
          statusLabel: info.enabled ? "\u5DF2\u542F\u7528" : "\u672A\u542F\u7528"
        });
        return { path, written: true, backupPath };
      }
      if (policy === "overwrite") {
        const previous = await this.adapter.read(path).catch(() => "");
        if (previous && !previous.includes("generator: plugin-catalog-guide")) {
          await this.backupFile(path);
        }
      }
    }
    await this.adapter.write(path, markdown);
    const stat = await this.adapter.stat(path).catch(() => null);
    this.entries.set(path, {
      path,
      pluginId: info.id,
      managed: true,
      mtime: (_a = stat == null ? void 0 : stat.mtime) != null ? _a : Date.now(),
      version: info.version,
      statusLabel: info.enabled ? "\u5DF2\u542F\u7528" : "\u672A\u542F\u7528"
    });
    return { path, written: true };
  }
  /** 插件升级/启停后，同步自动生成指南的版本与状态（手写稿不碰） */
  async syncGuideMetadata(info, entry) {
    var _a;
    if (!entry.managed) return false;
    const label = info.enabled ? "\u5DF2\u542F\u7528" : "\u672A\u542F\u7528";
    const content = await this.adapter.read(entry.path).catch(() => null);
    if (content === null) return false;
    const next = content.replace(/^version:.*$/m, `version: ${JSON.stringify(info.version)}`).replace(/^status:.*$/m, `status: ${label}`).replace(/^updated:.*$/m, `updated: ${formatDate()}`);
    if (next === content) return false;
    await this.adapter.write(entry.path, next);
    const stat = await this.adapter.stat(entry.path).catch(() => null);
    this.entries.set(entry.path, { ...entry, mtime: (_a = stat == null ? void 0 : stat.mtime) != null ? _a : Date.now(), version: info.version, statusLabel: label });
    return true;
  }
  overviewPath() {
    return (0, import_obsidian.normalizePath)(`${this.folderPath()}/${OVERVIEW_FILE}`);
  }
  async readOverview() {
    const path = this.overviewPath();
    if (!await this.adapter.exists(path)) return null;
    return this.adapter.read(path).catch(() => null);
  }
  async writeOverview(markdown) {
    const folder = this.folderPath();
    await this.ensureFolder(folder);
    const path = this.overviewPath();
    if (await this.adapter.exists(path)) {
      const current = await this.adapter.read(path).catch(() => "");
      if (current && !current.includes("generator: plugin-catalog-guide")) {
        const backup = await this.backupFile(path);
        console.log(`[plugin-catalog-guide] \u5DF2\u5907\u4EFD\u624B\u5199\u603B\u89C8 -> ${backup}`);
      }
    }
    await this.adapter.write(path, markdown);
    return path;
  }
  listEntries() {
    return Array.from(this.entries.values());
  }
};

// src/scanner.ts
var import_obsidian2 = require("obsidian");
var PLUGINS_DIR = ".obsidian/plugins";
var CORE_FILE = ".obsidian/core-plugins.json";
var APPEARANCE_FILE = ".obsidian/appearance.json";
var THEMES_DIR = ".obsidian/themes";
var CORE_PLUGIN_NAMES = {
  "file-explorer": "\u6587\u4EF6\u5217\u8868",
  "global-search": "\u5168\u5C40\u641C\u7D22",
  switcher: "\u5FEB\u901F\u5207\u6362",
  graph: "\u5173\u7CFB\u56FE",
  backlink: "\u53CD\u5411\u94FE\u63A5",
  canvas: "Canvas",
  "outgoing-link": "\u51FA\u94FE",
  "tag-pane": "\u6807\u7B7E\u9762\u677F",
  footnotes: "\u811A\u6CE8",
  properties: "\u5C5E\u6027",
  "page-preview": "\u9875\u9762\u9884\u89C8",
  "daily-notes": "\u65E5\u8BB0",
  templates: "\u6A21\u677F",
  "note-composer": "\u7B14\u8BB0\u91CD\u7EC4",
  "command-palette": "\u547D\u4EE4\u9762\u677F",
  "slash-command": "\u659C\u6760\u547D\u4EE4",
  "editor-status": "\u7F16\u8F91\u5668\u72B6\u6001",
  bookmarks: "\u4E66\u7B7E",
  "markdown-importer": "Markdown \u5BFC\u5165",
  "zk-prefixer": "Zettelkasten \u524D\u7F00",
  "random-note": "\u968F\u673A\u7B14\u8BB0",
  outline: "\u5927\u7EB2",
  "word-count": "\u5B57\u6570\u7EDF\u8BA1",
  slides: "\u5E7B\u706F\u7247",
  "audio-recorder": "\u5F55\u97F3",
  workspaces: "\u5DE5\u4F5C\u533A",
  "file-recovery": "\u6587\u4EF6\u6062\u590D",
  publish: "\u53D1\u5E03",
  sync: "\u540C\u6B65",
  bases: "Bases",
  webviewer: "Web viewer"
};
var Scanner = class {
  constructor(app, library) {
    this.app = app;
    this.library = library;
  }
  async enabledIds() {
    const set = /* @__PURE__ */ new Set();
    const plugins = this.app.plugins;
    if ((plugins == null ? void 0 : plugins.enabledPlugins) instanceof Set) {
      for (const id of plugins.enabledPlugins) set.add(id);
    }
    if (set.size === 0) {
      try {
        const raw = JSON.parse(await this.app.vault.adapter.read(".obsidian/community-plugins.json"));
        if (Array.isArray(raw)) for (const id of raw) set.add(String(id));
      } catch (e) {
      }
    }
    return set;
  }
  collectedCommands() {
    const registry = this.app.commands;
    return (registry == null ? void 0 : registry.commands) && typeof registry.commands === "object" ? registry.commands : {};
  }
  async scan(settings, watcherActive) {
    var _a, _b, _c;
    const adapter = this.app.vault.adapter;
    await this.library.refresh();
    const enabled = await this.enabledIds();
    const pluginInstances = (_b = (_a = this.app.plugins) == null ? void 0 : _a.plugins) != null ? _b : {};
    const commands = this.collectedCommands();
    const plugins = [];
    try {
      const listing = await adapter.list(PLUGINS_DIR);
      for (const folder of listing.folders) {
        const manifestPath = `${folder}/manifest.json`;
        try {
          if (!await adapter.exists(manifestPath)) continue;
          const raw = await adapter.read(manifestPath);
          const manifest = JSON.parse(raw);
          if (!(manifest == null ? void 0 : manifest.id)) continue;
          const stat = await adapter.stat(manifestPath);
          const info = {
            id: manifest.id,
            name: manifest.name || manifest.id,
            version: manifest.version || "?",
            author: (manifest.author || "").replace(/<[^>]*>/g, "").trim(),
            description: manifest.description || "",
            minAppVersion: manifest.minAppVersion || "",
            isDesktopOnly: !!manifest.isDesktopOnly,
            authorUrl: manifest.authorUrl || "",
            dirName: folder.split("/").pop() || manifest.id,
            folderPath: (0, import_obsidian2.normalizePath)(folder),
            enabled: enabled.has(manifest.id) || !!pluginInstances[manifest.id],
            manifestMtime: (_c = stat == null ? void 0 : stat.mtime) != null ? _c : 0,
            guidePath: null,
            guideManaged: false,
            commands: Object.values(commands).filter((command) => command.id.startsWith(`${manifest.id}:`)).map((command) => command.name)
          };
          const guide = this.library.findForPlugin(info);
          if (guide) {
            info.guidePath = guide.path;
            info.guideManaged = guide.managed;
          }
          plugins.push(info);
        } catch (error) {
          console.warn(`[plugin-catalog-guide] \u8BFB\u53D6\u63D2\u4EF6\u6E05\u5355\u5931\u8D25: ${folder}`, error);
        }
      }
    } catch (error) {
      console.warn("[plugin-catalog-guide] \u65E0\u6CD5\u5217\u51FA\u63D2\u4EF6\u76EE\u5F55", error);
    }
    plugins.sort((a, b) => {
      if (a.enabled !== b.enabled) return a.enabled ? -1 : 1;
      return a.name.localeCompare(b.name, "zh-Hans-CN");
    });
    return {
      plugins,
      corePlugins: settings.includeCorePlugins ? await this.corePlugins() : [],
      themes: settings.includeThemes ? await this.themes() : [],
      scannedAt: Date.now(),
      watcherActive
    };
  }
  async corePlugins() {
    const adapter = this.app.vault.adapter;
    const state = /* @__PURE__ */ new Map();
    try {
      if (await adapter.exists(CORE_FILE)) {
        const parsed = JSON.parse(await adapter.read(CORE_FILE));
        if (Array.isArray(parsed)) {
          for (const id of parsed) state.set(String(id), true);
        } else if (parsed && typeof parsed === "object") {
          for (const [id, value] of Object.entries(parsed)) state.set(id, value === true);
        }
      }
    } catch (e) {
    }
    const ids = /* @__PURE__ */ new Set([...Object.keys(CORE_PLUGIN_NAMES), ...state.keys()]);
    return Array.from(ids).map((id) => ({
      id,
      name: CORE_PLUGIN_NAMES[id] || id,
      enabled: state.get(id) === true
    })).sort((a, b) => Number(b.enabled) - Number(a.enabled) || a.name.localeCompare(b.name, "zh-Hans-CN"));
  }
  async themes() {
    const adapter = this.app.vault.adapter;
    let active = "";
    try {
      if (await adapter.exists(APPEARANCE_FILE)) {
        const appearance = JSON.parse(await adapter.read(APPEARANCE_FILE));
        active = (appearance == null ? void 0 : appearance.cssTheme) || "";
      }
    } catch (e) {
    }
    const result = [];
    try {
      const listing = await adapter.list(THEMES_DIR);
      for (const folder of listing.folders) {
        const name = folder.split("/").pop();
        if (name) result.push({ name, active: name === active });
      }
    } catch (e) {
    }
    return result.sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name));
  }
};
function snapshotSignature(snapshot) {
  const plugins = snapshot.plugins.map((p) => {
    var _a;
    return `${p.id}@${p.version}:${p.enabled ? 1 : 0}:${(_a = p.guidePath) != null ? _a : ""}:${p.commands.length}`;
  }).sort().join("|");
  const core = snapshot.corePlugins.filter((c) => c.enabled).map((c) => c.id).sort().join(",");
  const themes = snapshot.themes.map((t) => `${t.name}:${t.active ? 1 : 0}`).sort().join(",");
  return `${plugins}||${core}||${themes}`;
}

// src/watcher.ts
var import_obsidian3 = require("obsidian");
var DirectoryWatcher = class {
  constructor(app, getPollMs, onChange) {
    this.app = app;
    this.getPollMs = getPollMs;
    this.onChange = onChange;
    this.fsWatcher = null;
    this.pollTimer = null;
    this.debounceTimer = null;
    this.running = false;
  }
  start() {
    if (this.running) return;
    this.running = true;
    this.startPolling();
    this.startFsWatch();
  }
  stop() {
    this.running = false;
    if (this.pollTimer !== null) {
      window.clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    if (this.debounceTimer !== null) {
      window.clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (this.fsWatcher) {
      try {
        this.fsWatcher.close();
      } catch (e) {
      }
      this.fsWatcher = null;
    }
  }
  get active() {
    return this.fsWatcher !== null;
  }
  schedule() {
    if (this.debounceTimer !== null) window.clearTimeout(this.debounceTimer);
    this.debounceTimer = window.setTimeout(() => {
      this.debounceTimer = null;
      if (this.running) this.onChange();
    }, 400);
  }
  startPolling() {
    if (this.pollTimer !== null) return;
    const tick = () => {
      if (this.running) this.onChange();
    };
    this.pollTimer = window.setInterval(tick, Math.max(1e3, this.getPollMs()));
  }
  startFsWatch() {
    var _a;
    if (!import_obsidian3.Platform.isDesktopApp) return;
    try {
      const fs = require("fs");
      const path = require("path");
      const adapter = this.app.vault.adapter;
      const basePath = typeof adapter.getBasePath === "function" ? adapter.getBasePath() : adapter.basePath;
      if (!basePath) return;
      const dir = path.join(basePath, ".obsidian", "plugins");
      if (!fs.existsSync(dir)) return;
      this.fsWatcher = fs.watch(dir, { recursive: true }, () => this.schedule());
      if (typeof ((_a = this.fsWatcher) == null ? void 0 : _a.on) === "function") {
        this.fsWatcher.on("error", () => {
        });
      }
    } catch (error) {
      console.warn("[plugin-catalog-guide] fs.watch \u4E0D\u53EF\u7528\uFF0C\u4F7F\u7528\u8F6E\u8BE2", error);
      this.fsWatcher = null;
    }
  }
};

// src/guide-generator.ts
var import_obsidian5 = require("obsidian");

// src/category.ts
var RULES = [
  { key: "query", label: "\u6570\u636E\u4E0E\u67E5\u8BE2", pattern: /(dataview|datacore|query|database|sql|bases|metadata|frontmatter)/i },
  { key: "task", label: "\u4EFB\u52A1\u4E0E\u65F6\u95F4", pattern: /(task|kanban|todo|calendar|planner|tracker|timer|pomodoro|journal|daily|habit)/i },
  { key: "sync", label: "\u540C\u6B65\u4E0E\u5907\u4EFD", pattern: /(sync|backup|git|cloud|dropbox|version|history|restore|webdav)/i },
  { key: "ai", label: "AI \u4E0E\u667A\u80FD", pattern: /(claude|codex|\bai\b|gpt|llm|smart|copilot|chat|openai|agent|embedding)/i },
  { key: "edit", label: "\u5199\u4F5C\u4E0E\u7F16\u8F91", pattern: /(editor|toolbar|format|writing|markdown|table|outline|word|template|quickadd|capture)/i },
  { key: "style", label: "\u5916\u89C2\u4E0E\u6837\u5F0F", pattern: /(theme|style|css|color|icon|font|appearance)/i },
  { key: "media", label: "\u5A92\u4F53\u4E0E\u9644\u4EF6", pattern: /(image|media|pdf|video|audio|photo|attachment|excalidraw)/i },
  { key: "file", label: "\u6587\u4EF6\u4E0E\u5BFC\u822A", pattern: /(file|explorer|search|navigation|folder|workspace|tab|bookmark)/i }
];
var CATEGORY_ORDER = ["task", "query", "edit", "ai", "style", "sync", "media", "file", "other"];
function categoryLabel(key) {
  const rule = RULES.find((item) => item.key === key);
  if (rule) return rule.label;
  if (key === "other") return "\u5176\u4ED6";
  return key;
}
function classify(info) {
  const text = `${info.name} ${info.id} ${info.description}`;
  for (const rule of RULES) {
    if (rule.pattern.test(text)) return { key: rule.key, label: rule.label };
  }
  return { key: "other", label: "\u5176\u4ED6" };
}
function categoryHints(category) {
  switch (category.key) {
    case "task":
      return [
        "\u5148\u5EFA\u4E00\u4E2A\u4E13\u7528\u6587\u4EF6\u5939\uFF08\u5982 `\u4EFB\u52A1/`\uFF09\u6216\u4E00\u4E2A\u770B\u677F\u6587\u4EF6\uFF0C\u518D\u8BA9\u63D2\u4EF6\u63A5\u7BA1",
        "\u6BCF\u5929\u56FA\u5B9A\u4E00\u4E2A\u65F6\u95F4\u6E05\u7406\u903E\u671F\u9879\uFF0C\u907F\u514D\u4EFB\u52A1\u8D8A\u79EF\u8D8A\u591A"
      ];
    case "query":
      return [
        "\u5148\u7ED9\u7B14\u8BB0\u8865 frontmatter\uFF08\u5C5E\u6027\uFF09\uFF0C\u67E5\u8BE2\u624D\u6709\u6570\u636E\u53EF\u67E5",
        "\u7D22\u5F15\u9875\u67E5\u8BE2\u5C3D\u91CF\u5E26 `FROM` \u9650\u5B9A\u8303\u56F4\uFF0C\u907F\u514D\u5168\u5E93\u626B\u63CF\u62D6\u6162\u901F\u5EA6"
      ];
    case "ai":
      return [
        "\u9996\u6B21\u4F7F\u7528\u5148\u5B8C\u6210 API Key / \u672C\u5730\u6A21\u578B\u914D\u7F6E\uFF0C\u518D\u62FF\u4E00\u4E2A\u5C0F\u6587\u4EF6\u8BD5\u8DD1",
        "\u6D89\u53CA\u6539\u5199\u7B14\u8BB0\u7684\u64CD\u4F5C\u5148\u5728\u526F\u672C\u4E0A\u8BD5\uFF0C\u786E\u8BA4\u98CE\u683C\u540E\u518D\u6279\u91CF\u6267\u884C"
      ];
    case "edit":
      return ["\u628A\u5E38\u7528\u64CD\u4F5C\u7ED1\u5B9A\u5230\u547D\u4EE4\u9762\u677F\u6216\u5FEB\u6377\u952E", "\u6279\u91CF\u5904\u7406\u524D\u5148\u5907\u4EFD\uFF0C\u6216\u5148\u5728\u6D4B\u8BD5\u6587\u4EF6\u5939\u91CC\u8DD1\u4E00\u904D"];
    case "style":
      return [
        "\u4E00\u6B21\u53EA\u6539\u4E00\u9879\u518D\u89C2\u5BDF\u6548\u679C\uFF0C\u907F\u514D\u6539\u592A\u591A\u627E\u4E0D\u56DE\u539F\u56E0",
        "\u4E3B\u9898\u76F8\u5173\u8BBE\u7F6E\u6362\u4E3B\u9898\u540E\u53EF\u80FD\u5931\u6548\uFF0C\u9700\u8981\u91CD\u65B0\u68C0\u67E5"
      ];
    case "sync":
      return [
        "\u9996\u6B21\u540C\u6B65\u524D\u5148\u5907\u4EFD `.obsidian` \u76EE\u5F55",
        "\u51FA\u73B0\u540C\u6B65\u51B2\u7A81\u526F\u672C\u65F6\u5148\u6BD4\u5BF9\u5185\u5BB9\u518D\u5220\u9664\uFF0C\u4E0D\u8981\u76F4\u63A5\u8986\u76D6"
      ];
    case "media":
      return [
        "\u7EDF\u4E00\u9644\u4EF6\u5B58\u653E\u6587\u4EF6\u5939\uFF0C\u907F\u514D\u6839\u76EE\u5F55\u5806\u6EE1\u56FE\u7247\u548C PDF",
        "\u5927\u9644\u4EF6\u8003\u8651\u538B\u7F29\u6216\u5916\u94FE\uFF0C\u51CF\u5C11\u540C\u6B65\u4F53\u79EF"
      ];
    case "file":
      return ["\u5148\u5728\u4E00\u4E2A\u6D4B\u8BD5\u6587\u4EF6\u5939\u91CC\u8BD5\u7528\u91CD\u547D\u540D/\u79FB\u52A8\u529F\u80FD", "\u6279\u91CF\u64CD\u4F5C\u524D\u786E\u8BA4\u6CA1\u6709\u6B63\u5728\u540C\u6B65\u7684\u6587\u4EF6"];
    default:
      return [
        "\u5148\u6309\u5B98\u65B9\u8BF4\u660E\u5B8C\u6210\u57FA\u7840\u914D\u7F6E\uFF0C\u518D\u9010\u6B65\u542F\u7528\u9AD8\u7EA7\u529F\u80FD",
        "\u6539\u52A8\u524D\u5907\u4EFD `.obsidian` \u76EE\u5F55\uFF0C\u51FA\u95EE\u9898\u53EF\u6574\u4F53\u56DE\u9000"
      ];
  }
}

// src/guide-template.ts
function cleanReadme(text, max) {
  const cleaned = text.replace(/\[!\[[^\]]*\]\([^)]*\)\]\([^)]*\)/g, "").replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/<[^>]+>/g, "").replace(/\[\]\([^)]*\)/g, "").replace(/\r\n/g, "\n");
  const lines = [];
  let length = 0;
  for (const line of cleaned.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (lines.length > 0 && lines[lines.length - 1] !== "") lines.push("");
      continue;
    }
    if (length + trimmed.length > max) break;
    lines.push(line.replace(/\s+$/, ""));
    length += trimmed.length;
  }
  return lines;
}
function buildTemplateGuideBody(facts) {
  const { info, repo, readme, settings, related, category, vaultName } = facts;
  const lines = [];
  const support = info.isDesktopOnly ? "\u4EC5\u684C\u9762\u7AEF" : "\u684C\u9762\u7AEF\u4E0E\u79FB\u52A8\u7AEF\u5747\u53EF";
  const state = info.enabled ? "\u5DF2\u542F\u7528" : "\u5DF2\u5B89\u88C5\u4F46\u672A\u542F\u7528";
  lines.push(`# ${info.name} \u4F7F\u7528\u6307\u5357`);
  lines.push("");
  lines.push(
    `**\u7248\u672C** ${info.version} \uFF5C **\u4F5C\u8005** ${info.author || "\u672A\u6CE8\u660E"} \uFF5C **\u63D2\u4EF6 id** \`${info.id}\` \uFF5C **${support}**`
  );
  lines.push(`**\u5F53\u524D\u72B6\u6001** ${state} \uFF5C **\u6240\u5C5E\u5206\u7C7B** ${category.label} \uFF5C **\u6240\u5728\u5E93** ${vaultName}`);
  lines.push("");
  lines.push("> [!info] \u4E00\u53E5\u8BDD\u5B9A\u4F4D");
  lines.push(`> ${info.description || "\uFF08\u63D2\u4EF6\u6E05\u5355\u672A\u63D0\u4F9B\u63CF\u8FF0\uFF0C\u8BF7\u4EE5\u5B98\u65B9 README \u4E3A\u51C6\uFF09"}`);
  lines.push("");
  lines.push("## 1. \u5B83\u89E3\u51B3\u4EC0\u4E48\u95EE\u9898");
  lines.push("");
  if (info.description) {
    lines.push(`${info.name} \u7684\u5B98\u65B9\u5B9A\u4F4D\u662F\uFF1A**${info.description}**`);
  } else {
    lines.push(`\u63D2\u4EF6\u6E05\u5355\u6CA1\u6709\u63D0\u4F9B ${info.name} \u7684\u63CF\u8FF0\uFF0C\u8BF7\u53C2\u8003\u4E0B\u65B9\u5B98\u65B9 README \u6458\u5F55\u3002`);
  }
  lines.push("");
  lines.push("| \u9879\u76EE | \u503C |");
  lines.push("|------|-----|");
  lines.push(`| \u63D2\u4EF6 id | \`${info.id}\` |`);
  lines.push(`| \u5B89\u88C5\u76EE\u5F55 | \`${info.folderPath}\` |`);
  lines.push(`| \u6700\u4F4E Obsidian \u7248\u672C | ${info.minAppVersion || "\u672A\u58F0\u660E"} |`);
  lines.push(`| \u5E73\u53F0\u652F\u6301 | ${support} |`);
  lines.push(`| \u5B98\u65B9\u4ED3\u5E93 | ${repo ? `https://github.com/${repo}` : info.authorUrl || "\u672A\u63D0\u4F9B"} |`);
  lines.push("");
  lines.push("## 2. \u5FEB\u901F\u4E0A\u624B");
  lines.push("");
  lines.push(`1. \u6253\u5F00\u300C\u8BBE\u7F6E \u2192 \u7B2C\u4E09\u65B9\u63D2\u4EF6\u300D\uFF0C\u786E\u8BA4 **${info.name}** \u5904\u4E8E\u300C${state}\u300D\u72B6\u6001\u3002`);
  if (info.commands.length > 0) {
    lines.push(
      `2. \u6309 \`Ctrl/Cmd + P\` \u6253\u5F00\u547D\u4EE4\u9762\u677F\uFF0C\u641C\u7D22\u300C${info.name}\u300D\uFF0C\u53EF\u4EE5\u770B\u5230 ${info.commands.length} \u4E2A\u53EF\u7528\u547D\u4EE4\uFF08\u89C1\u4E0B\u4E00\u8282\uFF09\u3002`
    );
  } else {
    lines.push("2. \u8BE5\u63D2\u4EF6\u6CA1\u6709\u6CE8\u518C\u547D\u4EE4\uFF0C\u5165\u53E3\u901A\u5E38\u5728\u8BBE\u7F6E\u9875\u3001\u4FA7\u8FB9\u680F\u56FE\u6807\uFF0C\u6216\u7B14\u8BB0\u4E2D\u7684\u4EE3\u7801\u5757/\u89C6\u56FE\u91CC\u3002");
  }
  lines.push(
    info.enabled ? "3. \u5148\u6253\u5F00\u63D2\u4EF6\u8BBE\u7F6E\u5B8C\u6210\u57FA\u7840\u914D\u7F6E\uFF0C\u518D\u6309\u4E0B\u9762\u7684\u7528\u6CD5\u793A\u4F8B\u8BD5\u4E00\u4E2A\u5C0F\u4EFB\u52A1\u3002" : "3. \u9700\u8981\u5148\u542F\u7528\u63D2\u4EF6\uFF0C\u518D\u6253\u5F00\u5176\u8BBE\u7F6E\u5B8C\u6210\u57FA\u7840\u914D\u7F6E\u3002"
  );
  lines.push("");
  lines.push("## 3. \u547D\u4EE4\u4E0E\u5165\u53E3");
  lines.push("");
  if (info.commands.length > 0) {
    lines.push("\u4EE5\u4E0B\u547D\u4EE4\u540D\u6765\u81EA Obsidian \u5B9E\u65F6\u547D\u4EE4\u8868\uFF0C\u53EF\u5728\u547D\u4EE4\u9762\u677F\u76F4\u63A5\u641C\u7D22\u6267\u884C\uFF1A");
    lines.push("");
    for (const command of info.commands) {
      lines.push(`- \`${command}\``);
    }
    lines.push("");
    lines.push("> \u5FEB\u6377\u952E\u9700\u8981\u5728\u300C\u8BBE\u7F6E \u2192 \u5FEB\u6377\u952E\u300D\u91CC\u81EA\u884C\u7ED1\u5B9A\uFF0C\u672C\u6587\u4E0D\u731C\u6D4B\u9ED8\u8BA4\u5FEB\u6377\u952E\u3002");
  } else {
    lines.push("\u5F53\u524D\u6CA1\u6709\u68C0\u6D4B\u5230\u8BE5\u63D2\u4EF6\u6CE8\u518C\u7684\u547D\u4EE4\u3002\u8BF4\u660E\u5B83\u7684\u5165\u53E3\u4E0D\u662F\u547D\u4EE4\u9762\u677F\uFF0C\u53EF\u80FD\u662F\uFF1A");
    lines.push("");
    lines.push("- \u8BBE\u7F6E\u9875\u91CC\u7684\u5F00\u5173\u4E0E\u914D\u7F6E\u9879");
    lines.push("- \u4FA7\u8FB9\u680F\u56FE\u6807\uFF08Ribbon\uFF09\u6216\u53F3\u4FA7\u9762\u677F\u89C6\u56FE");
    lines.push("- \u7B14\u8BB0\u6B63\u6587\u4E2D\u7684\u4EE3\u7801\u5757\u3001\u5185\u8054\u5B57\u6BB5\u6216\u7279\u6B8A\u6587\u4EF6\u7C7B\u578B");
  }
  lines.push("");
  lines.push("## 4. \u8BBE\u7F6E\u9879");
  lines.push("");
  if (settings.length > 0) {
    lines.push("\u4E0B\u8868\u952E\u540D\u6765\u81EA\u63D2\u4EF6\u81EA\u5DF1\u7684 `data.json`\uFF08\u5DF2\u4FDD\u5B58\u7684\u914D\u7F6E\uFF09\uFF1A");
    lines.push("");
    lines.push("| \u8BBE\u7F6E\u952E | \u5F53\u524D\u503C |");
    lines.push("|--------|--------|");
    for (const item of settings) {
      lines.push(`| \`${item.key}\` | ${item.value.replace(/\|/g, "\\|")} |`);
    }
    lines.push("");
    lines.push("> \u542B key / token / secret / password \u7684\u5B57\u6BB5\u5DF2\u8131\u654F\uFF0C\u4E0D\u4F1A\u5199\u5165\u660E\u6587\u3002");
  } else {
    lines.push("\u8BE5\u63D2\u4EF6\u8FD8\u6CA1\u6709\u4FDD\u5B58\u8FC7\u81EA\u5B9A\u4E49\u914D\u7F6E\uFF08`data.json` \u4E0D\u5B58\u5728\u6216\u4E3A\u7A7A\uFF09\uFF0C\u6240\u6709\u8BBE\u7F6E\u9879\u90FD\u662F\u9ED8\u8BA4\u503C\u3002");
    lines.push("\u6253\u5F00\u300C\u8BBE\u7F6E \u2192 \u7B2C\u4E09\u65B9\u63D2\u4EF6 \u2192 \u9009\u9879\u300D\u5373\u53EF\u770B\u5230\u63D2\u4EF6\u7684\u5B8C\u6574\u8BBE\u7F6E\u9875\u3002");
  }
  lines.push("");
  lines.push("## 5. \u5E38\u7528\u7528\u6CD5");
  lines.push("");
  for (const hint of categoryHints(category)) {
    lines.push(`- ${hint}`);
  }
  lines.push("");
  if (category.key === "task") {
    lines.push("\u5C1D\u8BD5\u987A\u5E8F\uFF1A\u5148\u5EFA\u4E00\u4E2A\u6536\u96C6\u7BB1 \u2192 \u518D\u5EFA\u4E00\u4E2A\u672C\u5468\u6E05\u5355 \u2192 \u6700\u540E\u518D\u8003\u8651\u89C6\u56FE\u4E0E\u7EDF\u8BA1\u3002");
  } else if (category.key === "query") {
    lines.push("\u5C1D\u8BD5\u987A\u5E8F\uFF1A\u5148\u7ED9 5 \u7BC7\u7B14\u8BB0\u8865\u5C5E\u6027 \u2192 \u5199\u4E00\u4E2A\u6700\u7B80\u5355\u7684 `LIST` \u67E5\u8BE2 \u2192 \u518D\u9010\u6B65\u52A0 `WHERE` \u548C `SORT`\u3002");
  } else if (category.key === "ai") {
    lines.push("\u5C1D\u8BD5\u987A\u5E8F\uFF1A\u5148\u53EA\u8BFB\u63D0\u95EE \u2192 \u518D\u8BA9\u5B83\u6539\u4E00\u7BC7\u526F\u672C \u2192 \u6700\u540E\u624D\u5141\u8BB8\u6279\u91CF\u5199\u5165\u3002");
  } else {
    lines.push("\u5EFA\u8BAE\u5148\u7528\u4E00\u4E2A\u5C0F\u6587\u4EF6\u5939\u6216\u4E00\u7BC7\u6D4B\u8BD5\u7B14\u8BB0\u8DD1\u901A\u5B8C\u6574\u6D41\u7A0B\uFF0C\u518D\u5E94\u7528\u5230\u5168\u5E93\u3002");
  }
  lines.push("");
  lines.push("## 6. \u6CE8\u610F\u4E8B\u9879");
  lines.push("");
  if (info.isDesktopOnly) {
    lines.push("- \u8BE5\u63D2\u4EF6\u6807\u8BB0\u4E3A**\u4EC5\u684C\u9762\u7AEF**\uFF0C\u624B\u673A/\u5E73\u677F\u65E0\u6CD5\u4F7F\u7528\u3002");
  }
  if (info.minAppVersion) {
    lines.push(`- \u9700\u8981 Obsidian **${info.minAppVersion} \u53CA\u4EE5\u4E0A**\uFF1B\u5347\u7EA7 Obsidian \u524D\u5148\u786E\u8BA4\u63D2\u4EF6\u662F\u5426\u8DDF\u8FDB\u3002`);
  }
  lines.push("- \u63D2\u4EF6\u5347\u7EA7\u540E\u5982\u679C\u884C\u4E3A\u5F02\u5E38\uFF0C\u5148\u91CD\u542F Obsidian\uFF0C\u518D\u68C0\u67E5\u8BBE\u7F6E\u662F\u5426\u88AB\u91CD\u7F6E\u3002");
  lines.push("- \u672C\u6307\u5357\u7531\u7A0B\u5E8F\u6839\u636E\u63D2\u4EF6\u5143\u6570\u636E\u81EA\u52A8\u6574\u7406\uFF0C\u5177\u4F53\u529F\u80FD\u4EE5\u63D2\u4EF6\u8BBE\u7F6E\u9875\u4E0E\u5B98\u65B9\u8BF4\u660E\u4E3A\u51C6\u3002");
  lines.push("");
  lines.push("## 7. \u4E0E\u672C\u5E93\u5176\u4ED6\u63D2\u4EF6\u7684\u914D\u5408");
  lines.push("");
  if (related.length > 0) {
    lines.push(`\u5F53\u524D\u5E93\u91CC\u540C\u65F6\u542F\u7528\u7684\u63D2\u4EF6\u6709\uFF1A${related.join("\u3001")}\u3002`);
  }
  lines.push("\u5E38\u89C1\u7684\u914D\u5408\u65B9\u5F0F\u662F\uFF1A\u8BA9\u8FD9\u4E2A\u63D2\u4EF6\u8D1F\u8D23\u5B83\u6700\u64C5\u957F\u7684\u4E00\u4EF6\u4E8B\uFF0C\u628A\u7ED3\u679C\u4EA4\u7ED9 Dataview/\u770B\u677F/\u65E5\u8BB0\u7B49\u63D2\u4EF6\u5C55\u793A\uFF0C\u907F\u514D\u4E24\u4E2A\u63D2\u4EF6\u62A2\u540C\u4E00\u7C7B\u6587\u4EF6\u3002");
  lines.push("");
  if (readme) {
    lines.push("## 8. \u5B98\u65B9\u8BF4\u660E\u6458\u5F55\uFF08README\uFF09");
    lines.push("");
    lines.push("> [!note]- \u70B9\u51FB\u5C55\u5F00\u539F\u6587\u6458\u5F55");
    for (const line of cleanReadme(readme, 2500)) {
      lines.push(line ? `> ${line}` : ">");
    }
    lines.push("");
  }
  lines.push(`## ${readme ? 9 : 8}. \u5B98\u65B9\u8D44\u6E90`);
  lines.push("");
  if (repo) {
    lines.push(`- [\u5B98\u65B9\u4ED3\u5E93](https://github.com/${repo})`);
    lines.push(`- [\u95EE\u9898\u53CD\u9988](https://github.com/${repo}/issues)`);
  }
  if (info.authorUrl) {
    lines.push(`- [\u4F5C\u8005\u4E3B\u9875](${info.authorUrl})`);
  }
  lines.push(`- [\u63D2\u4EF6\u793E\u533A\u9875\u9762](https://obsidian.md/plugins?id=${encodeURIComponent(info.id)})`);
  lines.push("");
  const infoIndex = readme ? 10 : 9;
  lines.push(`## ${infoIndex}. \u6307\u5357\u4FE1\u606F`);
  lines.push("");
  lines.push(`- \u751F\u6210\u65B9\u5F0F\uFF1A\u6A21\u677F\u81EA\u52A8\u751F\u6210\uFF08\u672A\u542F\u7528 AI \u65F6\uFF09\uFF0C\u8D44\u6599\u6765\u81EA manifest\u3001\u5B9E\u65F6\u547D\u4EE4\u8868\u3001data.json \u4E0E README`);
  lines.push(`- \u4FEE\u6539\u672C\u6587\u4EF6\u540E\u518D\u6B21\u751F\u6210\uFF0C\u4F1A\u6309\u8BBE\u7F6E\u91CC\u7684\u300C\u8DF3\u8FC7 / \u5907\u4EFD\u540E\u8986\u76D6 / \u8986\u76D6\u300D\u7B56\u7565\u5904\u7406`);
  lines.push("- \u60F3\u83B7\u5F97\u66F4\u8BE6\u7EC6\u7684\u4E2D\u6587\u8BF4\u660E\uFF1A\u5728\u63D2\u4EF6\u8BBE\u7F6E\u91CC\u586B\u5165 OpenAI \u517C\u5BB9\u7684 API Key\uFF0C\u91CD\u65B0\u751F\u6210\u5373\u53EF");
  lines.push("");
  return lines.join("\n");
}

// src/ai.ts
var import_obsidian4 = require("obsidian");
var REQUIRED_HEADINGS = [
  "\u4E00\u53E5\u8BDD\u5B9A\u4F4D",
  "\u5B83\u89E3\u51B3\u4EC0\u4E48\u95EE\u9898",
  "\u5FEB\u901F\u4E0A\u624B",
  "\u547D\u4EE4\u4E0E\u5165\u53E3",
  "\u8BBE\u7F6E\u9879",
  "\u5E38\u7528\u7528\u6CD5",
  "\u6CE8\u610F\u4E8B\u9879",
  "\u4E0E\u672C\u5E93\u5176\u4ED6\u63D2\u4EF6\u7684\u914D\u5408",
  "\u5B98\u65B9\u8D44\u6E90"
];
function endpoint(baseUrl) {
  const base = baseUrl.replace(/\/+$/, "");
  if (base.endsWith("/chat/completions")) return base;
  return `${base}/chat/completions`;
}
function buildMessages(facts) {
  const { info, repo, readme, settings, related, category, vaultName } = facts;
  const factsJson = {
    \u63D2\u4EF6\u540D: info.name,
    \u63D2\u4EF6id: info.id,
    \u7248\u672C: info.version,
    \u4F5C\u8005: info.author,
    \u63CF\u8FF0: info.description,
    \u6700\u4F4EObsidian\u7248\u672C: info.minAppVersion,
    \u4EC5\u684C\u9762\u7AEF: info.isDesktopOnly,
    \u5F53\u524D\u662F\u5426\u542F\u7528: info.enabled,
    \u5B98\u65B9\u4ED3\u5E93: repo ? `https://github.com/${repo}` : null,
    \u547D\u4EE4\u5217\u8868: info.commands,
    \u5DF2\u4FDD\u5B58\u8BBE\u7F6E: settings,
    \u5206\u7C7B: category.label,
    \u6240\u5728\u5E93: vaultName,
    \u672C\u5E93\u5176\u4ED6\u5DF2\u542F\u7528\u63D2\u4EF6: related
  };
  const system = "\u4F60\u662F\u4E00\u4F4D Obsidian \u63D2\u4EF6\u6587\u6863\u4F5C\u8005\uFF0C\u64C5\u957F\u5199\u7B80\u6D01\u3001\u53EF\u64CD\u4F5C\u7684\u4E2D\u6587\u4F7F\u7528\u6307\u5357\u3002\n\u786C\u6027\u89C4\u5219\uFF1A\n1. \u53EA\u80FD\u4F9D\u636E\u7528\u6237\u63D0\u4F9B\u7684\u4E8B\u5B9E\u5199\u4F5C\uFF0C\u4E0D\u5F97\u7F16\u9020\u529F\u80FD\u3001\u5FEB\u6377\u952E\u3001\u8BBE\u7F6E\u9879\u3001\u547D\u4EE4\u3002\n2. \u4E0D\u786E\u5B9A\u7684\u5185\u5BB9\u5199\u300C\u4EE5\u63D2\u4EF6\u8BBE\u7F6E\u9875\u4E3A\u51C6\u300D\uFF0C\u4E0D\u8981\u865A\u6784\u3002\n3. \u8F93\u51FA\u7EAF Markdown \u6B63\u6587\uFF0C\u4E0D\u8981 YAML frontmatter\uFF0C\u4E0D\u8981\u7528```\u5305\u88F9\u6574\u7BC7\u3002\n4. \u5FC5\u987B\u4F7F\u7528\u8FD9\u4E9B\u4E8C\u7EA7\u6807\u9898\uFF08\u53EF\u52A0\u7F16\u53F7\uFF09\uFF1A\u4E00\u53E5\u8BDD\u5B9A\u4F4D\u3001\u5B83\u89E3\u51B3\u4EC0\u4E48\u95EE\u9898\u3001\u5FEB\u901F\u4E0A\u624B\u3001\u547D\u4EE4\u4E0E\u5165\u53E3\u3001\u8BBE\u7F6E\u9879\u3001\u5E38\u7528\u7528\u6CD5\u3001\u6CE8\u610F\u4E8B\u9879\u3001\u4E0E\u672C\u5E93\u5176\u4ED6\u63D2\u4EF6\u7684\u914D\u5408\u3001\u5B98\u65B9\u8D44\u6E90\u3002\n5. \u603B\u957F\u5EA6 600\uFF5E1200 \u5B57\uFF0C\u591A\u7528\u5217\u8868\u548C\u8868\u683C\uFF0C\u4E0D\u5199\u7A7A\u8BDD\u5957\u8BDD\u3002\n6. \u5F00\u5934\u5199 `# {\u63D2\u4EF6\u540D} \u4F7F\u7528\u6307\u5357`\u3002";
  const user = [
    "\u4EE5\u4E0B\u662F\u63D2\u4EF6\u4E8B\u5B9E\uFF08JSON\uFF09\uFF1A",
    JSON.stringify(factsJson, null, 2),
    readme ? `
\u5B98\u65B9 README \u8282\u9009\uFF08\u53EF\u80FD\u4E3A\u82F1\u6587\u539F\u6587\uFF0C\u53EF\u7FFB\u8BD1\u6982\u62EC\uFF0C\u4E0D\u5F97\u6269\u5199\u4E0D\u5B58\u5728\u7684\u529F\u80FD\uFF09\uFF1A
${readme.slice(0, 6e3)}` : "\n\uFF08\u672A\u83B7\u53D6\u5230 README\uFF0C\u8BF7\u53EA\u4F9D\u636E\u4E0A\u9762\u7684\u5143\u6570\u636E\u5199\u4F5C\uFF0C\u529F\u80FD\u7EC6\u8282\u5199\u300C\u4EE5\u63D2\u4EF6\u8BBE\u7F6E\u9875\u4E3A\u51C6\u300D\u3002\uFF09",
    "\n\u8BF7\u8F93\u51FA\u6307\u5357\u6B63\u6587\u3002"
  ].join("\n");
  return [
    { role: "system", content: system },
    { role: "user", content: user }
  ];
}
async function generateWithAI(facts, ai) {
  var _a, _b, _c;
  if (!ai.apiKey) return null;
  const response = await (0, import_obsidian4.requestUrl)({
    url: endpoint(ai.baseUrl),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ai.apiKey}`
    },
    body: JSON.stringify({
      model: ai.model,
      messages: buildMessages(facts),
      temperature: ai.temperature,
      max_tokens: ai.maxTokens,
      stream: false
    }),
    throw: false
  });
  if (response.status !== 200) {
    throw new Error(`AI \u63A5\u53E3\u8FD4\u56DE ${response.status}: ${response.text.slice(0, 300)}`);
  }
  const parsed = response.json;
  let content = (_c = (_b = (_a = parsed == null ? void 0 : parsed.choices) == null ? void 0 : _a[0]) == null ? void 0 : _b.message) == null ? void 0 : _c.content;
  if (typeof content !== "string" || !content.trim()) return null;
  content = content.trim();
  content = content.replace(/^```(?:markdown|md)?\s*\n/i, "").replace(/\n```\s*$/, "").trim();
  content = content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "").trim();
  if (content.length < 400) return null;
  const headingCount = REQUIRED_HEADINGS.filter(
    (heading) => new RegExp(`^##+\\s*.*${heading}`, "m").test(content)
  ).length;
  if (headingCount < 6) return null;
  return content;
}

// src/guide-generator.ts
var COMMUNITY_URL = "https://raw.githubusercontent.com/obsidianmd/obsidian-releases/master/community-plugins.json";
var communityCache = null;
var readmeBlockedUntil = 0;
var README_BLOCK_MS = 12e4;
async function withTimeout(promise, ms) {
  return new Promise((resolve) => {
    const timer = globalThis.setTimeout(() => resolve(null), ms);
    promise.then(
      (value) => {
        globalThis.clearTimeout(timer);
        resolve(value);
      },
      () => {
        globalThis.clearTimeout(timer);
        resolve(null);
      }
    );
  });
}
async function loadCommunityIndex() {
  if (communityCache && Date.now() - communityCache.at < 10 * 60 * 1e3) {
    return communityCache.map;
  }
  const map = /* @__PURE__ */ new Map();
  try {
    const response = await withTimeout(
      (0, import_obsidian5.requestUrl)({ url: COMMUNITY_URL, method: "GET", throw: false }),
      15e3
    );
    if (response && response.status === 200) {
      const parsed = JSON.parse(response.text);
      for (const item of parsed) {
        if (item == null ? void 0 : item.id) map.set(item.id, { repo: item.repo, description: item.description });
      }
    }
  } catch (error) {
    console.warn("[plugin-catalog-guide] \u83B7\u53D6\u793E\u533A\u63D2\u4EF6\u5143\u6570\u636E\u5931\u8D25", error);
  }
  communityCache = { at: Date.now(), map };
  return map;
}
var GuideGenerator = class {
  constructor(app, getSettings) {
    this.app = app;
    this.getSettings = getSettings;
  }
  async collect(info, snapshot) {
    var _a, _b;
    const settings = this.getSettings();
    let repo = null;
    try {
      const index = await loadCommunityIndex();
      repo = (_b = (_a = index.get(info.id)) == null ? void 0 : _a.repo) != null ? _b : null;
    } catch (e) {
      repo = null;
    }
    if (!repo) repo = repoFromUrl(info.authorUrl);
    const settingFacts = await this.collectSettings(info);
    let readme = null;
    if (settings.fetchReadme && repo) {
      readme = await this.fetchReadme(repo);
    }
    return {
      info,
      repo,
      readme,
      settings: settingFacts,
      related: snapshot.plugins.filter((item) => item.enabled && item.id !== info.id && item.id !== "plugin-catalog-guide").slice(0, 10).map((item) => item.name),
      category: classify(info),
      vaultName: this.app.vault.getName(),
      allPlugins: snapshot.plugins
    };
  }
  async collectSettings(info) {
    const path = `${info.folderPath}/data.json`;
    try {
      if (!await this.app.vault.adapter.exists(path)) return [];
      const parsed = JSON.parse(await this.app.vault.adapter.read(path));
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return [];
      return Object.entries(parsed).slice(0, 40).map(([key, value]) => ({
        key,
        value: isSecretKey(key) ? "\u5DF2\u914D\u7F6E\uFF08\u5DF2\u8131\u654F\uFF09" : describeSettingValue(value),
        secret: isSecretKey(key)
      }));
    } catch (e) {
      return [];
    }
  }
  async fetchReadme(repo) {
    if (Date.now() < readmeBlockedUntil) return null;
    const candidates = [
      `https://raw.githubusercontent.com/${repo}/HEAD/README.md`,
      `https://raw.githubusercontent.com/${repo}/HEAD/readme.md`,
      `https://raw.githubusercontent.com/${repo}/HEAD/README.markdown`
    ];
    for (const url of candidates) {
      const response = await withTimeout((0, import_obsidian5.requestUrl)({ url, method: "GET", throw: false }), 1e4);
      if (!response) {
        readmeBlockedUntil = Date.now() + README_BLOCK_MS;
        return null;
      }
      if (response.status === 200 && response.text && response.text.length > 60) {
        return response.text.slice(0, 12e3);
      }
    }
    return null;
  }
  async build(info, snapshot) {
    const facts = await this.collect(info, snapshot);
    const settings = this.getSettings();
    let body = null;
    let source = "template";
    if (settings.ai.enabled && settings.ai.apiKey) {
      try {
        const aiBody = await generateWithAI(facts, settings.ai);
        if (aiBody) {
          body = aiBody;
          source = "ai";
        }
      } catch (error) {
        console.warn("[plugin-catalog-guide] AI \u751F\u6210\u5931\u8D25\uFF0C\u56DE\u9000\u6A21\u677F", error);
      }
    }
    if (!body) body = buildTemplateGuideBody(facts);
    return { markdown: this.withFrontmatter(facts, body, source), source };
  }
  withFrontmatter(facts, body, source) {
    const { info } = facts;
    const tags = ["Obsidian", "\u63D2\u4EF6", facts.category.label];
    return [
      "---",
      `title: ${JSON.stringify(`\u63D2\u4EF6\u6307\u5357 - ${info.name}`)}`,
      "type: \u63D2\u4EF6\u6307\u5357",
      `plugin: ${info.id}`,
      `version: ${JSON.stringify(info.version)}`,
      `status: ${info.enabled ? "\u5DF2\u542F\u7528" : "\u672A\u542F\u7528"}`,
      `generated_by: ${source}`,
      "generator: plugin-catalog-guide",
      `updated: ${formatDate()}`,
      `tags: [${tags.map((tag) => JSON.stringify(tag)).join(", ")}]`,
      "---",
      "",
      body.trim(),
      ""
    ].join("\n");
  }
};

// src/index-writer.ts
function short(text, max = 80) {
  const normalized = (text || "").replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max)}\u2026`;
}
function guideLink(plugin) {
  if (!plugin.guidePath) return "\u2014\uFF08\u7F3A\u5931\uFF09";
  return `[[${plugin.guidePath.replace(/\.md$/i, "")}|\u4F7F\u7528\u6307\u5357]]`;
}
function buildOverview(snapshot, settings, library, now = /* @__PURE__ */ new Date()) {
  var _a, _b;
  const enabled = snapshot.plugins.filter((plugin) => plugin.enabled);
  const disabled = snapshot.plugins.filter((plugin) => !plugin.enabled);
  const withGuide = snapshot.plugins.filter((plugin) => plugin.guidePath);
  const missing = snapshot.plugins.filter((plugin) => !plugin.guidePath);
  const lines = [];
  lines.push("---");
  lines.push("title: Obsidian \u63D2\u4EF6\u76EE\u5F55\uFF08\u603B\u89C8\uFF09");
  lines.push("type: \u7D22\u5F15");
  lines.push("generator: plugin-catalog-guide");
  lines.push(`generated_at: ${formatDateTime(now)}`);
  lines.push("tags:");
  lines.push("  - Obsidian");
  lines.push("  - \u63D2\u4EF6");
  lines.push("  - \u7D22\u5F15");
  lines.push("---");
  lines.push("");
  lines.push("# Obsidian \u63D2\u4EF6\u76EE\u5F55\uFF08\u603B\u89C8\uFF09");
  lines.push("");
  lines.push("> [!info] \u81EA\u52A8\u751F\u6210");
  lines.push("> \u672C\u9875\u7531\u300C\u63D2\u4EF6\u76EE\u5F55\u4E0E\u6307\u5357\u300D\u63D2\u4EF6\u81EA\u52A8\u751F\u6210\uFF0C\u63D2\u4EF6\u76EE\u5F55\u6216\u542F\u7528\u72B6\u6001\u53D8\u5316\u65F6\u81EA\u52A8\u91CD\u5199\u3002");
  lines.push("> \u6570\u636E\u6765\u6E90\uFF1A`.obsidian/plugins/*/manifest.json`\u3001`community-plugins.json`\u3001Obsidian \u5B9E\u65F6\u547D\u4EE4\u8868\u3002");
  lines.push("> \u624B\u52A8\u4FEE\u6539\u4F1A\u88AB\u4E0B\u6B21\u751F\u6210\u8986\u76D6\uFF0C\u9700\u8981\u4FDD\u7559\u8BF7\u590D\u5236\u5230\u5176\u4ED6\u7B14\u8BB0\u3002");
  lines.push("");
  lines.push(
    `**\u6982\u51B5**\uFF1A\u5171 **${snapshot.plugins.length}** \u4E2A\u793E\u533A\u63D2\u4EF6\uFF08\u5DF2\u542F\u7528 ${enabled.length}\u3001\u672A\u542F\u7528 ${disabled.length}\uFF09\uFF1B\u5DF2\u751F\u6210\u6307\u5357 **${withGuide.length}** \u4EFD\uFF0C\u7F3A\u5931 **${missing.length}** \u4EFD\u3002`
  );
  lines.push("");
  let section = 2;
  lines.push(`## \u4E00\u3001\u603B\u8868`);
  lines.push("");
  lines.push("| # | \u63D2\u4EF6 | \u7248\u672C | \u72B6\u6001 | \u7B80\u4ECB | \u6307\u5357 |");
  lines.push("|---|------|------|------|------|------|");
  snapshot.plugins.forEach((plugin, index) => {
    lines.push(
      `| ${index + 1} | ${escapeTableCell(plugin.name)} | ${escapeTableCell(plugin.version)} | ${plugin.enabled ? "\u5DF2\u542F\u7528" : "\u672A\u542F\u7528"} | ${escapeTableCell(short(plugin.description))} | ${guideLink(plugin)} |`
    );
  });
  lines.push("");
  lines.push("## \u4E8C\u3001\u6309\u7528\u9014\u5206\u7C7B");
  lines.push("");
  const grouped = /* @__PURE__ */ new Map();
  for (const plugin of snapshot.plugins) {
    const key = classify(plugin).key;
    const bucket = (_a = grouped.get(key)) != null ? _a : [];
    bucket.push(plugin);
    grouped.set(key, bucket);
  }
  const keys = Array.from(grouped.keys()).sort(
    (a, b) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b)
  );
  for (const key of keys) {
    lines.push(`### ${categoryLabel(key)}`);
    lines.push("");
    for (const plugin of (_b = grouped.get(key)) != null ? _b : []) {
      const bits = [`**${plugin.name}**`];
      if (!plugin.enabled) bits.push("\uFF08\u672A\u542F\u7528\uFF09");
      if (plugin.description) bits.push(`\u2014 ${short(plugin.description, 70)}`);
      if (plugin.guidePath) {
        bits.push(`\uFF5C[[${plugin.guidePath.replace(/\.md$/i, "")}|\u6307\u5357]]`);
      }
      lines.push(`- ${bits.join(" ")}`);
    }
    lines.push("");
  }
  if (settings.includeCorePlugins && snapshot.corePlugins.length > 0) {
    section += 1;
    const on = snapshot.corePlugins.filter((item) => item.enabled);
    const off = snapshot.corePlugins.filter((item) => !item.enabled);
    lines.push(`## ${sectionLabel(section)}\u6838\u5FC3\u63D2\u4EF6\u72B6\u6001`);
    lines.push("");
    lines.push(`- **\u5DF2\u542F\u7528**\uFF08${on.length}\uFF09\uFF1A${on.map((item) => item.name).join("\u3001") || "\u65E0"}`);
    lines.push(`- **\u5DF2\u5173\u95ED**\uFF08${off.length}\uFF09\uFF1A${off.map((item) => item.name).join("\u3001") || "\u65E0"}`);
    lines.push("");
  }
  if (settings.includeThemes && snapshot.themes.length > 0) {
    section += 1;
    lines.push(`## ${sectionLabel(section)}\u4E3B\u9898`);
    lines.push("");
    for (const theme of snapshot.themes) {
      lines.push(`- ${theme.name}${theme.active ? "\uFF08\u5F53\u524D\u4F7F\u7528\uFF09" : ""}`);
    }
    lines.push("");
  }
  section += 1;
  lines.push(`## ${sectionLabel(section)}\u6307\u5357\u4E0E\u7EF4\u62A4`);
  lines.push("");
  lines.push(`- \u6307\u5357\u76EE\u5F55\uFF1A\`${library.folderPath()}\``);
  lines.push("- \u9996\u6B21\u751F\u6210\u65F6\u82E5\u672C\u9875\u662F\u4F60\u624B\u5199\u7684\uFF0C\u539F\u6587\u4EF6\u4F1A\u5907\u4EFD\u5230 `.obsidian/plugin-catalog/backups/`");
  lines.push("- \u7F3A\u5931\u6307\u5357\u65F6\uFF1A\u547D\u4EE4\u9762\u677F\u8FD0\u884C\u300C\u63D2\u4EF6\u76EE\u5F55\u4E0E\u6307\u5357\uFF1A\u751F\u6210\u6240\u6709\u7F3A\u5931\u6307\u5357\u300D");
  lines.push("- \u5355\u63D2\u4EF6\u91CD\u751F\u6210\uFF1A\u6253\u5F00\u300C\u63D2\u4EF6\u76EE\u5F55\u300D\u4FA7\u8FB9\u680F\u9762\u677F\uFF0C\u70B9\u5BF9\u5E94\u63D2\u4EF6\u7684\u300C\u751F\u6210 / \u91CD\u751F\u6210\u300D\u6309\u94AE");
  lines.push("- \u65B0\u88C5\u63D2\u4EF6\uFF1A\u76EE\u5F55\u53D8\u5316\u540E 2\uFF5E3 \u79D2\u5185\u81EA\u52A8\u66F4\u65B0\u672C\u9875\uFF1B\u5F00\u542F\u300C\u81EA\u52A8\u751F\u6210\u6307\u5357\u300D\u65F6\u540C\u65F6\u751F\u6210\u6307\u5357");
  if (missing.length > 0) {
    lines.push("");
    lines.push(`**\u5F53\u524D\u7F3A\u5931\u6307\u5357\u7684\u63D2\u4EF6**\uFF1A${missing.map((plugin) => `\`${plugin.name}\``).join("\u3001")}`);
  }
  lines.push("");
  return lines.join("\n");
}
function sectionLabel(index) {
  var _a;
  const cn = ["\u4E00", "\u4E8C", "\u4E09", "\u56DB", "\u4E94", "\u516D", "\u4E03", "\u516B", "\u4E5D"];
  return `${(_a = cn[index - 1]) != null ? _a : index}\u3001`;
}

// src/view.ts
var import_obsidian6 = require("obsidian");
var VIEW_TYPE = "plugin-catalog-guide-view";
var PluginCatalogView = class extends import_obsidian6.ItemView {
  constructor(leaf, host) {
    super(leaf);
    this.host = host;
    this.filter = "";
    this.listEl = null;
    this.footerEl = null;
    this.countEl = null;
    this.searchEl = null;
    this.built = false;
  }
  getViewType() {
    return VIEW_TYPE;
  }
  getDisplayText() {
    return "\u63D2\u4EF6\u76EE\u5F55";
  }
  getIcon() {
    return "library";
  }
  async onOpen() {
    this.render();
  }
  button(parent, label, cls, onClick) {
    const button = parent.createEl("button", { text: label, cls: `pcg-btn ${cls}` });
    button.addEventListener("click", async (event) => {
      event.preventDefault();
      button.disabled = true;
      try {
        await onClick();
      } finally {
        button.disabled = false;
      }
    });
  }
  /** 全量重建（切换面板、首次打开时） */
  render() {
    const container = this.contentEl;
    container.empty();
    container.addClass("pcg-view");
    const header = container.createDiv({ cls: "pcg-header" });
    const titleRow = header.createDiv({ cls: "pcg-title-row" });
    const title = titleRow.createDiv({ cls: "pcg-title" });
    title.createSpan({ text: "\u63D2\u4EF6\u76EE\u5F55", cls: "pcg-title-text" });
    this.countEl = title.createSpan({ cls: "pcg-count", text: "" });
    const toolbar = header.createDiv({ cls: "pcg-toolbar" });
    this.button(toolbar, "\u5237\u65B0", "pcg-btn-ghost", () => this.host.refreshAll());
    this.button(toolbar, "\u751F\u6210\u7F3A\u5931", "pcg-btn-accent", () => this.host.generateMissingGuides());
    this.button(toolbar, "\u6253\u5F00\u603B\u89C8", "pcg-btn-ghost", () => this.host.openOverview());
    const searchWrap = header.createDiv({ cls: "pcg-search-wrap" });
    this.searchEl = searchWrap.createEl("input", {
      cls: "pcg-search",
      attr: { type: "text", placeholder: "\u641C\u7D22\u63D2\u4EF6\u540D / id / \u63CF\u8FF0\u2026" }
    });
    this.searchEl.value = this.filter;
    this.searchEl.addEventListener("input", () => {
      var _a, _b;
      this.filter = (_b = (_a = this.searchEl) == null ? void 0 : _a.value) != null ? _b : "";
      this.renderList();
    });
    this.listEl = container.createDiv({ cls: "pcg-list" });
    this.footerEl = container.createDiv({ cls: "pcg-footer" });
    this.built = true;
    this.refresh();
  }
  /** 只刷新列表与页脚，保留搜索框焦点（扫描每 3 秒会调用一次） */
  refresh() {
    if (!this.built || !this.listEl || !this.footerEl) {
      this.render();
      return;
    }
    const snapshot = this.host.getSnapshot();
    const enabledCount = snapshot.plugins.filter((plugin) => plugin.enabled).length;
    if (this.countEl) {
      this.countEl.setText(`${snapshot.plugins.length} \u4E2A \xB7 \u542F\u7528 ${enabledCount}`);
    }
    this.renderList();
    this.renderFooter(snapshot);
  }
  renderList() {
    const list = this.listEl;
    if (!list) return;
    list.empty();
    const snapshot = this.host.getSnapshot();
    if (snapshot.scannedAt === 0) {
      list.createDiv({ cls: "pcg-empty", text: "\u6B63\u5728\u626B\u63CF\u63D2\u4EF6\u76EE\u5F55\u2026" });
      return;
    }
    const query = this.filter.trim().toLowerCase();
    const visible = snapshot.plugins.filter((plugin) => {
      if (!query) return true;
      return plugin.name.toLowerCase().includes(query) || plugin.id.toLowerCase().includes(query) || plugin.description.toLowerCase().includes(query);
    });
    if (visible.length === 0) {
      list.createDiv({ cls: "pcg-empty", text: query ? "\u6CA1\u6709\u5339\u914D\u7684\u63D2\u4EF6" : "\u6CA1\u6709\u5B89\u88C5\u793E\u533A\u63D2\u4EF6" });
      return;
    }
    this.renderGroup(list, "\u5DF2\u542F\u7528", visible.filter((plugin) => plugin.enabled));
    this.renderGroup(list, "\u672A\u542F\u7528", visible.filter((plugin) => !plugin.enabled));
  }
  renderGroup(parent, label, plugins) {
    if (plugins.length === 0) return;
    const group = parent.createDiv({ cls: "pcg-group" });
    group.createDiv({ cls: "pcg-group-title", text: `${label}\uFF08${plugins.length}\uFF09` });
    for (const plugin of plugins) {
      this.renderRow(group, plugin);
    }
  }
  renderRow(parent, plugin) {
    const row = parent.createDiv({ cls: "pcg-row" });
    row.toggleClass("pcg-row-disabled", !plugin.enabled);
    const main = row.createDiv({ cls: "pcg-row-main" });
    const titleRow = main.createDiv({ cls: "pcg-row-title" });
    titleRow.createSpan({ cls: "pcg-name", text: plugin.name });
    titleRow.createSpan({ cls: "pcg-version", text: plugin.version });
    if (plugin.enabled) {
      titleRow.createSpan({ cls: "pcg-badge pcg-badge-on", text: "\u5DF2\u542F\u7528" });
    }
    const status = this.host.getGuideStatus(plugin.id);
    if (status === "running") titleRow.createSpan({ cls: "pcg-badge pcg-badge-busy", text: "\u751F\u6210\u4E2D\u2026" });
    if (status === "queued") titleRow.createSpan({ cls: "pcg-badge pcg-badge-busy", text: "\u6392\u961F\u4E2D" });
    if (status === "failed") titleRow.createSpan({ cls: "pcg-badge pcg-badge-fail", text: "\u751F\u6210\u5931\u8D25" });
    const description = plugin.description || plugin.id;
    main.createDiv({
      cls: "pcg-desc",
      text: description.length > 110 ? `${description.slice(0, 110)}\u2026` : description
    });
    const meta = main.createDiv({ cls: "pcg-meta" });
    meta.createSpan({ text: `id: ${plugin.id}` });
    meta.createSpan({ text: `\u547D\u4EE4 ${plugin.commands.length}` });
    meta.createSpan({
      text: plugin.guidePath ? `\u6307\u5357\uFF1A${plugin.guideManaged ? "\u81EA\u52A8\u751F\u6210" : "\u5DF2\u6709\u6587\u4EF6"}` : "\u6307\u5357\uFF1A\u7F3A\u5931"
    });
    const actions = row.createDiv({ cls: "pcg-actions" });
    if (plugin.guidePath) {
      this.button(actions, "\u6253\u5F00", "pcg-btn-ghost", () => this.host.openGuide(plugin.id));
      this.button(actions, "\u91CD\u751F\u6210", "pcg-btn-ghost", () => this.host.generateGuide(plugin.id));
    } else {
      this.button(actions, "\u751F\u6210", "pcg-btn-accent", () => this.host.generateGuide(plugin.id));
    }
  }
  renderFooter(snapshot) {
    const footer = this.footerEl;
    if (!footer) return;
    footer.empty();
    const scanned = snapshot.scannedAt ? formatDateTime(new Date(snapshot.scannedAt)) : "\u672A\u626B\u63CF";
    const watch = snapshot.watcherActive ? "fs.watch \u5B9E\u65F6\u76D1\u542C + \u8F6E\u8BE2\u515C\u5E95" : "\u8F6E\u8BE2";
    footer.createDiv({ cls: "pcg-footer-line", text: `\u6700\u540E\u626B\u63CF\uFF1A${scanned} \uFF5C \u76D1\u542C\uFF1A${watch}` });
    footer.createDiv({
      cls: "pcg-footer-line",
      text: `\u6307\u5357\u76EE\u5F55\uFF1A${this.host.settings.outputFolder} \uFF5C \u5DF2\u751F\u6210 ${snapshot.plugins.filter((p) => p.guidePath).length}/${snapshot.plugins.length}`
    });
  }
};

// src/settings-tab.ts
var import_obsidian7 = require("obsidian");
var PluginCatalogSettingTab = class extends import_obsidian7.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
    this.saveTimer = null;
  }
  scheduleSave() {
    if (this.saveTimer !== null) window.clearTimeout(this.saveTimer);
    this.saveTimer = window.setTimeout(() => {
      this.saveTimer = null;
      void this.plugin.saveSettings();
    }, 700);
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.addClass("pcg-settings");
    containerEl.createEl("h2", { text: "\u63D2\u4EF6\u76EE\u5F55\u4E0E\u6307\u5357" });
    containerEl.createEl("p", {
      cls: "pcg-settings-desc",
      text: "\u5B9E\u65F6\u5217\u51FA\u5DF2\u5B89\u88C5\u63D2\u4EF6\uFF1B\u63D2\u4EF6\u76EE\u5F55\u53D8\u5316\u65F6\u81EA\u52A8\u91CD\u5199\u603B\u89C8\uFF0C\u5E76\u4E3A\u65B0\u63D2\u4EF6\u751F\u6210\u4E2D\u6587\u4F7F\u7528\u6307\u5357\u3002\u6307\u5357\u5168\u90E8\u4EE5 .md \u5199\u5165\u4E0B\u9762\u6307\u5B9A\u7684\u6587\u4EF6\u5939\u3002"
    });
    const snapshot = this.plugin.getSnapshot();
    const withGuide = snapshot.plugins.filter((plugin) => plugin.guidePath).length;
    containerEl.createEl("p", {
      cls: "pcg-settings-stats",
      text: `\u5F53\u524D\uFF1A${snapshot.plugins.length} \u4E2A\u793E\u533A\u63D2\u4EF6\uFF0C\u5DF2\u751F\u6210\u6307\u5357 ${withGuide} \u4EFD\u3002`
    });
    containerEl.createEl("h3", { text: "\u8F93\u51FA\u4F4D\u7F6E" });
    new import_obsidian7.Setting(containerEl).setName("\u6307\u5357\u4E0E\u603B\u89C8\u7684\u6587\u4EF6\u5939").setDesc("\u76F8\u5BF9\u5E93\u6839\u76EE\u5F55\uFF0C\u4F8B\u5982\u300C\u63D2\u4EF6\u6307\u5357\u300D\u3002\u4E0D\u5B58\u5728\u4F1A\u81EA\u52A8\u521B\u5EFA\u3002").addText(
      (text) => text.setPlaceholder("\u63D2\u4EF6\u6307\u5357").setValue(this.plugin.settings.outputFolder).onChange((value) => {
        this.plugin.settings.outputFolder = value.trim() || "\u63D2\u4EF6\u6307\u5357";
        this.scheduleSave();
      })
    );
    new import_obsidian7.Setting(containerEl).setName("\u5DF2\u5B58\u5728\u540C\u540D\u6307\u5357\u65F6").setDesc("\u9ED8\u8BA4\u8DF3\u8FC7\uFF0C\u4FDD\u62A4\u624B\u5199\u7A3F\uFF1B\u9009\u300C\u5907\u4EFD\u540E\u8986\u76D6\u300D\u4F1A\u5148\u628A\u65E7\u6587\u4EF6\u590D\u5236\u5230 .obsidian/plugin-catalog/backups\u3002").addDropdown(
      (dropdown) => dropdown.addOption("skip", "\u8DF3\u8FC7\uFF0C\u4FDD\u7559\u5DF2\u6709\u6587\u4EF6").addOption("backup", "\u5907\u4EFD\u65E7\u6587\u4EF6\u540E\u8986\u76D6").addOption("overwrite", "\u76F4\u63A5\u8986\u76D6\uFF08\u4ECD\u4F1A\u5907\u4EFD\u624B\u5199\u7A3F\uFF09").setValue(this.plugin.settings.overwritePolicy).onChange(async (value) => {
        this.plugin.settings.overwritePolicy = value;
        await this.plugin.saveSettings();
      })
    );
    containerEl.createEl("h3", { text: "\u81EA\u52A8\u5316" });
    new import_obsidian7.Setting(containerEl).setName("\u68C0\u6D4B\u5230\u65B0\u63D2\u4EF6\u65F6\u81EA\u52A8\u751F\u6210\u6307\u5357").setDesc("\u63D2\u4EF6\u76EE\u5F55\u91CC\u51FA\u73B0\u65B0\u6761\u76EE\u540E\u81EA\u52A8\u751F\u6210\uFF1B\u5173\u6389\u5219\u53EA\u66F4\u65B0\u603B\u89C8\uFF0C\u6307\u5357\u7531\u4F60\u624B\u52A8\u89E6\u53D1\u3002").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.autoGenerateOnInstall).onChange(async (value) => {
        this.plugin.settings.autoGenerateOnInstall = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian7.Setting(containerEl).setName("\u542F\u52A8\u65F6\u8865\u9F50\u7F3A\u5931\u6307\u5357").setDesc("Obsidian \u5173\u95ED\u671F\u95F4\u5B89\u88C5\u7684\u63D2\u4EF6\uFF0C\u4F1A\u5728\u4E0B\u6B21\u542F\u52A8\u540E\u8865\u751F\u6210\u3002").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.autoGenerateOnStartup).onChange(async (value) => {
        this.plugin.settings.autoGenerateOnStartup = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian7.Setting(containerEl).setName("\u6293\u53D6 GitHub README \u4F5C\u4E3A\u7D20\u6750").setDesc("\u9700\u8981\u80FD\u8BBF\u95EE raw.githubusercontent.com\uFF1B\u5931\u8D25\u4F1A\u81EA\u52A8\u8DF3\u8FC7\uFF0C\u4E0D\u5F71\u54CD\u751F\u6210\u3002").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.fetchReadme).onChange(async (value) => {
        this.plugin.settings.fetchReadme = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian7.Setting(containerEl).setName("\u8F6E\u8BE2\u95F4\u9694\uFF08\u6BEB\u79D2\uFF09").setDesc("\u684C\u9762\u7AEF\u53E6\u6709 fs.watch \u5B9E\u65F6\u76D1\u542C\uFF0C\u8FD9\u91CC\u53EA\u662F\u515C\u5E95\u9891\u7387\u3002\u9ED8\u8BA4 3000\u3002").addSlider(
      (slider) => slider.setLimits(1e3, 15e3, 500).setValue(this.plugin.settings.pollIntervalMs).setDynamicTooltip().onChange((value) => {
        this.plugin.settings.pollIntervalMs = value;
        this.scheduleSave();
      })
    );
    new import_obsidian7.Setting(containerEl).setName("\u5B8C\u6210\u540E\u5F39\u901A\u77E5").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.notifyOnGenerate).onChange(async (value) => {
        this.plugin.settings.notifyOnGenerate = value;
        await this.plugin.saveSettings();
      })
    );
    containerEl.createEl("h3", { text: "\u603B\u89C8\u5185\u5BB9" });
    new import_obsidian7.Setting(containerEl).setName("\u9644\u5E26\u6838\u5FC3\u63D2\u4EF6\u72B6\u6001").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.includeCorePlugins).onChange(async (value) => {
        this.plugin.settings.includeCorePlugins = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian7.Setting(containerEl).setName("\u9644\u5E26\u4E3B\u9898\u5217\u8868").setDesc("\u603B\u89C8\u91CC\u589E\u52A0\u300C\u4E3B\u9898\u300D\u4E00\u8282\uFF0C\u663E\u793A\u5F53\u524D\u4E3B\u9898\u4E0E\u5DF2\u5B89\u88C5\u4E3B\u9898\u3002").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.includeThemes).onChange(async (value) => {
        this.plugin.settings.includeThemes = value;
        await this.plugin.saveSettings();
      })
    );
    containerEl.createEl("h3", { text: "AI \u589E\u5F3A\uFF08\u53EF\u9009\uFF09" });
    containerEl.createEl("p", {
      cls: "pcg-settings-desc",
      text: "\u9ED8\u8BA4\u4F7F\u7528\u672C\u5730\u6A21\u677F\u751F\u6210\u6307\u5357\u3002\u586B\u5165 OpenAI \u517C\u5BB9\u63A5\u53E3\u7684 API Key \u540E\uFF0C\u4F1A\u4F18\u5148\u7528 AI \u5199\u4E2D\u6587\u6307\u5357\uFF1B\u8C03\u7528\u5931\u8D25\u81EA\u52A8\u56DE\u9000\u6A21\u677F\uFF0C\u4E0D\u4F1A\u4E2D\u65AD\u3002"
    });
    new import_obsidian7.Setting(containerEl).setName("\u542F\u7528 AI \u751F\u6210").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.ai.enabled).onChange(async (value) => {
        this.plugin.settings.ai.enabled = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian7.Setting(containerEl).setName("\u63A5\u53E3\u5730\u5740\uFF08baseUrl\uFF09").setDesc("DeepSeek \u586B https://api.deepseek.com\uFF1BOpenAI \u517C\u5BB9\u670D\u52A1\u586B\u5230 /v1 \u4E3A\u6B62\u3002").addText(
      (text) => text.setPlaceholder("https://api.deepseek.com").setValue(this.plugin.settings.ai.baseUrl).onChange((value) => {
        this.plugin.settings.ai.baseUrl = value.trim();
        this.scheduleSave();
      })
    );
    new import_obsidian7.Setting(containerEl).setName("\u6A21\u578B\u540D").setDesc("\u4F8B\u5982 deepseek-chat\u3001gpt-4o-mini\u3002").addText(
      (text) => text.setPlaceholder("deepseek-chat").setValue(this.plugin.settings.ai.model).onChange((value) => {
        this.plugin.settings.ai.model = value.trim();
        this.scheduleSave();
      })
    );
    new import_obsidian7.Setting(containerEl).setName("API Key").setDesc("\u53EA\u4FDD\u5B58\u5728\u672C\u63D2\u4EF6\u7684 data.json \u91CC\uFF1B\u754C\u9762\u4E0E\u65E5\u5FD7\u90FD\u4E0D\u4F1A\u6253\u5370\u660E\u6587\u3002").addText((text) => {
      text.inputEl.type = "password";
      text.setPlaceholder("sk-...").setValue(this.plugin.settings.ai.apiKey).onChange((value) => {
        this.plugin.settings.ai.apiKey = value.trim();
        this.scheduleSave();
      });
    });
    new import_obsidian7.Setting(containerEl).setName("\u6700\u5927\u8F93\u51FA token").addSlider(
      (slider) => slider.setLimits(500, 6e3, 100).setValue(this.plugin.settings.ai.maxTokens).setDynamicTooltip().onChange((value) => {
        this.plugin.settings.ai.maxTokens = value;
        this.scheduleSave();
      })
    );
    new import_obsidian7.Setting(containerEl).setName("\u8BF7\u6C42\u8D85\u65F6\uFF08\u79D2\uFF09").addSlider(
      (slider) => slider.setLimits(10, 180, 5).setValue(Math.round(this.plugin.settings.ai.timeoutMs / 1e3)).setDynamicTooltip().onChange((value) => {
        this.plugin.settings.ai.timeoutMs = value * 1e3;
        this.scheduleSave();
      })
    );
    containerEl.createEl("h3", { text: "\u64CD\u4F5C" });
    new import_obsidian7.Setting(containerEl).setName("\u7ACB\u5373\u626B\u63CF\u5E76\u66F4\u65B0\u603B\u89C8").addButton(
      (button) => button.setButtonText("\u626B\u63CF").onClick(async () => {
        await this.plugin.refreshAll();
        this.display();
      })
    ).addButton(
      (button) => button.setButtonText("\u751F\u6210\u7F3A\u5931\u6307\u5357").onClick(async () => {
        await this.plugin.generateMissingGuides();
        this.display();
      })
    ).addButton(
      (button) => button.setButtonText("\u91CD\u751F\u6210\u81EA\u52A8\u6307\u5357").onClick(async () => {
        await this.plugin.regenerateAutoGuides();
        this.display();
      })
    ).addButton(
      (button) => button.setButtonText("\u6253\u5F00\u603B\u89C8").onClick(() => this.plugin.openOverview())
    );
  }
};

// src/main.ts
var EMPTY_SNAPSHOT = {
  plugins: [],
  corePlugins: [],
  themes: [],
  scannedAt: 0,
  watcherActive: false
};
var PluginCatalogPlugin = class extends import_obsidian8.Plugin {
  constructor() {
    super(...arguments);
    this.snapshot = EMPTY_SNAPSHOT;
    this.lastSnapshot = null;
    this.lastSignature = "";
    this.status = /* @__PURE__ */ new Map();
    this.generatedKeys = /* @__PURE__ */ new Set();
    this.queue = [];
    this.processing = false;
    this.scanTimer = null;
    this.scanQueued = false;
    this.scanning = false;
    this.booted = false;
  }
  async onload() {
    var _a;
    try {
      await this.setup();
    } catch (error) {
      console.error("[plugin-catalog-guide] \u521D\u59CB\u5316\u5931\u8D25", error);
      try {
        await this.app.vault.adapter.mkdir(WORK_DIR);
      } catch (e) {
      }
      try {
        const detail = error instanceof Error ? `${error.message}
${(_a = error.stack) != null ? _a : ""}` : String(error);
        await this.app.vault.adapter.write(
          `${WORK_DIR}/crash.log`,
          `${formatDateTime(/* @__PURE__ */ new Date())}
${detail}
`
        );
      } catch (e) {
      }
    }
  }
  async setup() {
    this.settings = normalizeSettings(await this.loadData());
    this.library = new GuideLibrary(this.app, () => this.settings.outputFolder);
    this.scanner = new Scanner(this.app, this.library);
    this.generator = new GuideGenerator(this.app, () => this.settings);
    this.watcher = new DirectoryWatcher(
      this.app,
      () => this.settings.pollIntervalMs,
      () => this.scheduleScan()
    );
    this.registerView(VIEW_TYPE, (leaf) => new PluginCatalogView(leaf, this));
    this.addRibbonIcon("book-open", "\u6253\u5F00\u63D2\u4EF6\u76EE\u5F55", () => {
      void this.activateView();
    });
    this.addCommand({ id: "open-panel", name: "\u6253\u5F00\u63D2\u4EF6\u76EE\u5F55\u9762\u677F", callback: () => void this.activateView() });
    this.addCommand({
      id: "refresh",
      name: "\u91CD\u65B0\u626B\u63CF\u63D2\u4EF6",
      callback: async () => {
        await this.refreshAll();
        new import_obsidian8.Notice(`\u63D2\u4EF6\u76EE\u5F55\u5DF2\u5237\u65B0\uFF1A${this.snapshot.plugins.length} \u4E2A\u63D2\u4EF6`);
      }
    });
    this.addCommand({
      id: "update-index",
      name: "\u66F4\u65B0\u63D2\u4EF6\u76EE\u5F55\u603B\u89C8",
      callback: async () => {
        await this.refreshAll();
        await this.writeIndex(true);
        new import_obsidian8.Notice("\u63D2\u4EF6\u76EE\u5F55\u603B\u89C8\u5DF2\u66F4\u65B0");
      }
    });
    this.addCommand({
      id: "generate-missing",
      name: "\u751F\u6210\u6240\u6709\u7F3A\u5931\u6307\u5357",
      callback: () => void this.generateMissingGuides()
    });
    this.addCommand({
      id: "regenerate-auto",
      name: "\u91CD\u65B0\u751F\u6210\u6240\u6709\u81EA\u52A8\u751F\u6210\u7684\u6307\u5357",
      callback: () => void this.regenerateAutoGuides()
    });
    this.addCommand({
      id: "open-overview",
      name: "\u6253\u5F00\u63D2\u4EF6\u76EE\u5F55\u603B\u89C8",
      callback: () => void this.openOverview()
    });
    this.addSettingTab(new PluginCatalogSettingTab(this.app, this));
    this.register(() => this.watcher.stop());
    this.app.workspace.onLayoutReady(() => {
      void this.boot();
    });
    if (this.app.workspace.layoutReady) {
      void this.boot();
    }
  }
  onunload() {
    var _a;
    (_a = this.watcher) == null ? void 0 : _a.stop();
    if (this.scanTimer !== null) {
      window.clearTimeout(this.scanTimer);
      this.scanTimer = null;
    }
  }
  // ---------------------------------------------------------------- boot
  async boot() {
    if (this.booted) return;
    this.booted = true;
    try {
      this.watcher.start();
      await this.library.refresh(true);
      await this.scanOnce("startup");
      const missing = this.snapshot.plugins.filter((plugin) => !plugin.guidePath);
      if (this.settings.autoGenerateOnStartup && missing.length > 0) {
        this.enqueue(
          missing.map((plugin) => plugin.id),
          "startup"
        );
      }
    } catch (error) {
      console.error("[plugin-catalog-guide] \u542F\u52A8\u626B\u63CF\u5931\u8D25", error);
    }
  }
  // ------------------------------------------------------------- scanning
  scheduleScan() {
    if (this.scanTimer !== null) window.clearTimeout(this.scanTimer);
    this.scanTimer = window.setTimeout(() => {
      this.scanTimer = null;
      void this.scanOnce("watch");
    }, 300);
  }
  async scanOnce(reason) {
    var _a, _b;
    if (this.scanning) {
      this.scanQueued = true;
      return;
    }
    this.scanning = true;
    try {
      const snapshot = await this.scanner.scan(this.settings, (_b = (_a = this.watcher) == null ? void 0 : _a.active) != null ? _b : false);
      const previous = this.lastSnapshot;
      this.snapshot = snapshot;
      this.lastSnapshot = snapshot;
      await this.syncGuidesMetadata(snapshot);
      this.notifyViews();
      await this.writeIndex(false);
      const signature = snapshotSignature(snapshot);
      const changed = signature !== this.lastSignature;
      this.lastSignature = signature;
      const newPlugins = previous ? snapshot.plugins.filter((plugin) => !previous.plugins.some((old) => old.id === plugin.id)) : [];
      if (newPlugins.length > 0 && reason !== "generate") {
        if (this.settings.autoGenerateOnInstall) {
          this.enqueue(
            newPlugins.map((plugin) => plugin.id),
            "install"
          );
        } else if (this.settings.notifyOnGenerate) {
          new import_obsidian8.Notice(`\u68C0\u6D4B\u5230\u65B0\u63D2\u4EF6\uFF1A${newPlugins.map((plugin) => plugin.name).join("\u3001")}`);
        }
      }
      if (changed || reason === "boot") {
        await this.writeStatusFile(reason);
      }
    } catch (error) {
      console.error("[plugin-catalog-guide] \u626B\u63CF\u5931\u8D25", error);
    } finally {
      this.scanning = false;
      if (this.scanQueued) {
        this.scanQueued = false;
        void this.scanOnce("queued");
      }
    }
  }
  /** 插件升级或启停后，同步自动生成指南的 frontmatter（手写稿不碰） */
  async syncGuidesMetadata(snapshot) {
    let count = 0;
    for (const info of snapshot.plugins) {
      if (!info.guidePath || !info.guideManaged) continue;
      const entry = this.library.listEntries().find((item) => item.path === info.guidePath);
      if (!entry || entry.version === void 0) continue;
      const label = info.enabled ? "\u5DF2\u542F\u7528" : "\u672A\u542F\u7528";
      if (entry.version === info.version && entry.statusLabel === label) continue;
      try {
        if (await this.library.syncGuideMetadata(info, entry)) count += 1;
      } catch (error) {
        console.warn(`[plugin-catalog-guide] \u540C\u6B65\u6307\u5357\u5143\u4FE1\u606F\u5931\u8D25: ${info.id}`, error);
      }
    }
    if (count > 0) {
      console.log(`[plugin-catalog-guide] \u5DF2\u540C\u6B65 ${count} \u4EFD\u6307\u5357\u7684\u7248\u672C/\u72B6\u6001`);
    }
    return count;
  }
  async writeIndex(force) {
    try {
      const content = buildOverview(this.snapshot, this.settings, this.library);
      const existing = await this.library.readOverview();
      const strip = (text) => text.replace(/^generated_at:.*$/m, "").replace(/\r\n/g, "\n").trim();
      if (force || !existing || strip(existing) !== strip(content)) {
        const path = await this.library.writeOverview(content);
        console.log(`[plugin-catalog-guide] \u603B\u89C8\u5DF2\u66F4\u65B0: ${path}`);
      }
    } catch (error) {
      console.error("[plugin-catalog-guide] \u5199\u5165\u603B\u89C8\u5931\u8D25", error);
    }
  }
  async writeStatusFile(reason) {
    var _a;
    try {
      await this.library.ensureFolder(WORK_DIR);
      const payload = {
        at: formatDateTime(/* @__PURE__ */ new Date()),
        reason,
        watcher: ((_a = this.watcher) == null ? void 0 : _a.active) ? "fs.watch" : "polling",
        outputFolder: this.settings.outputFolder,
        aiEnabled: this.settings.ai.enabled && !!this.settings.ai.apiKey,
        plugins: this.snapshot.plugins.map((plugin) => ({
          id: plugin.id,
          name: plugin.name,
          version: plugin.version,
          enabled: plugin.enabled,
          commands: plugin.commands.length,
          guide: plugin.guidePath
        })),
        missingGuides: this.snapshot.plugins.filter((plugin) => !plugin.guidePath).map((plugin) => plugin.id)
      };
      await this.app.vault.adapter.write(`${WORK_DIR}/last-run.json`, JSON.stringify(payload, null, 2));
    } catch (error) {
      console.warn("[plugin-catalog-guide] \u5199\u5165\u8FD0\u884C\u72B6\u6001\u5931\u8D25", error);
    }
  }
  // ----------------------------------------------------------- generation
  enqueue(ids, reason, manual = reason === "manual") {
    const added = [];
    for (const id of ids) {
      const info = this.snapshot.plugins.find((plugin) => plugin.id === id);
      if (!info) continue;
      const key = `${info.id}@${info.version}`;
      if (!manual && this.generatedKeys.has(key)) continue;
      if (this.queue.some((item) => item.id === id) || added.some((item) => item.id === id)) continue;
      added.push({ id, manual });
    }
    if (added.length === 0) return;
    this.queue.push(...added);
    for (const item of added) this.status.set(item.id, "queued");
    this.notifyViews();
    void this.processQueue(reason);
  }
  async processQueue(reason) {
    if (this.processing) return;
    this.processing = true;
    const results = [];
    try {
      while (this.queue.length > 0) {
        const item = this.queue.shift();
        const info = this.snapshot.plugins.find((plugin) => plugin.id === item.id);
        if (!info) {
          this.status.delete(item.id);
          continue;
        }
        this.status.set(item.id, "running");
        this.notifyViews();
        try {
          const { markdown, source } = await this.generator.build(info, this.snapshot);
          const policy = item.manual ? "overwrite" : this.settings.overwritePolicy;
          const result = await this.library.writeGuide(info, markdown, policy);
          this.status.set(item.id, "idle");
          if (result.written) {
            this.generatedKeys.add(`${info.id}@${info.version}`);
          }
          results.push({ id: info.id, name: info.name, source, written: result.written, path: result.path });
          if (!result.written && result.skippedReason) {
            console.log(`[plugin-catalog-guide] ${info.name}: ${result.skippedReason}`);
          }
        } catch (error) {
          this.status.set(item.id, "failed");
          results.push({
            id: info.id,
            name: info.name,
            source: "template",
            written: false,
            path: "",
            error: String(error)
          });
          console.error(`[plugin-catalog-guide] \u751F\u6210\u6307\u5357\u5931\u8D25: ${info.id}`, error);
        }
        await this.scanOnce("generate");
        await sleep(250);
      }
    } finally {
      this.processing = false;
      this.notifyViews();
      const ok = results.filter((item) => item.written).length;
      const skipped = results.filter((item) => !item.written && !item.error).length;
      const failed = results.filter((item) => item.error).length;
      if (this.settings.notifyOnGenerate && results.length > 0) {
        const parts = [];
        if (ok) parts.push(`\u751F\u6210 ${ok} \u4EFD`);
        if (skipped) parts.push(`\u8DF3\u8FC7 ${skipped} \u4EFD`);
        if (failed) parts.push(`\u5931\u8D25 ${failed} \u4EFD`);
        new import_obsidian8.Notice(`\u63D2\u4EF6\u6307\u5357\uFF1A${parts.join("\uFF0C")}`);
      }
      await this.writeGenerationLog(reason, results);
    }
  }
  async writeGenerationLog(reason, results) {
    try {
      await this.library.ensureFolder(WORK_DIR);
      const record = { at: formatDateTime(/* @__PURE__ */ new Date()), reason, results };
      await this.app.vault.adapter.write(
        `${WORK_DIR}/last-generation.json`,
        JSON.stringify(record, null, 2)
      );
      const logPath = `${WORK_DIR}/generation-log.jsonl`;
      const line = `${JSON.stringify(record)}
`;
      if (await this.app.vault.adapter.exists(logPath)) {
        await this.app.vault.adapter.append(logPath, line);
      } else {
        await this.app.vault.adapter.write(logPath, line);
      }
    } catch (error) {
      console.warn("[plugin-catalog-guide] \u5199\u5165\u751F\u6210\u65E5\u5FD7\u5931\u8D25", error);
    }
  }
  // -------------------------------------------------------------- UI glue
  async activateView() {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE);
    let leaf = leaves[0];
    if (!leaf) {
      const right = this.app.workspace.getRightLeaf(false);
      leaf = right != null ? right : this.app.workspace.getLeaf(true);
      await leaf.setViewState({ type: VIEW_TYPE, active: true });
    }
    this.app.workspace.revealLeaf(leaf);
    this.notifyViews();
  }
  notifyViews() {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE)) {
      const view = leaf.view;
      if (view && typeof view.refresh === "function") {
        view.refresh();
      }
    }
  }
  // ---------------------------------------------------------- CatalogHost
  getSnapshot() {
    return this.snapshot;
  }
  getGuideStatus(id) {
    var _a;
    return (_a = this.status.get(id)) != null ? _a : "idle";
  }
  isBusy() {
    return this.processing;
  }
  async refreshAll() {
    await this.library.refresh(true);
    await this.scanOnce("manual");
    this.notifyViews();
  }
  async generateGuide(id) {
    const info = this.snapshot.plugins.find((plugin) => plugin.id === id);
    if (!info) {
      new import_obsidian8.Notice("\u63D2\u4EF6\u4E0D\u5B58\u5728\u6216\u5DF2\u5378\u8F7D");
      return;
    }
    if (this.status.get(id) === "running") {
      new import_obsidian8.Notice(`${info.name} \u6B63\u5728\u751F\u6210\u4E2D`);
      return;
    }
    this.enqueue([id], "manual");
    new import_obsidian8.Notice(`\u5DF2\u52A0\u5165\u751F\u6210\u961F\u5217\uFF1A${info.name}`);
  }
  async generateMissingGuides() {
    const missing = this.snapshot.plugins.filter((plugin) => !plugin.guidePath).map((plugin) => plugin.id);
    if (missing.length === 0) {
      new import_obsidian8.Notice("\u6240\u6709\u63D2\u4EF6\u90FD\u5DF2\u6709\u6307\u5357");
      return;
    }
    this.enqueue(missing, "manual");
    new import_obsidian8.Notice(`\u5DF2\u52A0\u5165\u751F\u6210\u961F\u5217\uFF1A${missing.length} \u4E2A\u63D2\u4EF6`);
  }
  /** 重新生成所有「自动生成」的指南（手写稿不参与），用于配置 AI 后批量升级 */
  async regenerateAutoGuides() {
    const targets = this.snapshot.plugins.filter((plugin) => plugin.guideManaged).map((plugin) => plugin.id);
    if (targets.length === 0) {
      new import_obsidian8.Notice("\u6CA1\u6709\u53EF\u91CD\u65B0\u751F\u6210\u7684\u81EA\u52A8\u6307\u5357");
      return;
    }
    this.enqueue(targets, "manual");
    new import_obsidian8.Notice(`\u5DF2\u52A0\u5165\u91CD\u751F\u6210\u961F\u5217\uFF1A${targets.length} \u4EFD\u81EA\u52A8\u6307\u5357`);
  }
  async openGuide(id) {
    const info = this.snapshot.plugins.find((plugin) => plugin.id === id);
    if (!(info == null ? void 0 : info.guidePath)) {
      new import_obsidian8.Notice("\u8BE5\u63D2\u4EF6\u8FD8\u6CA1\u6709\u6307\u5357\uFF0C\u53EF\u70B9\u300C\u751F\u6210\u300D");
      return;
    }
    await this.app.workspace.openLinkText(info.guidePath, "", false);
  }
  async openOverview() {
    await this.writeIndex(true);
    const path = this.library.overviewPath();
    if (await this.app.vault.adapter.exists(path)) {
      await this.app.workspace.openLinkText(path, "", false);
    } else {
      new import_obsidian8.Notice("\u8FD8\u6CA1\u6709\u751F\u6210\u603B\u89C8\uFF0C\u8BF7\u5148\u8FD0\u884C\u4E00\u6B21\u626B\u63CF");
    }
  }
  async saveSettings() {
    this.settings = normalizeSettings(this.settings);
    await this.saveData(this.settings);
    this.watcher.stop();
    this.watcher.start();
    await this.library.refresh(true);
    await this.scanOnce("settings");
  }
  pluginInfo(id) {
    return this.snapshot.plugins.find((plugin) => plugin.id === id);
  }
};
