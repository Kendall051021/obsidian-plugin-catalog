import { App, normalizePath, type PluginManifest } from "obsidian";
import type { CorePluginInfo, PluginCatalogSettings, PluginInfo, Snapshot, ThemeInfo } from "./types";
import type { GuideLibrary } from "./library";

export const PLUGINS_DIR = ".obsidian/plugins";
export const CORE_FILE = ".obsidian/core-plugins.json";
export const APPEARANCE_FILE = ".obsidian/appearance.json";
export const THEMES_DIR = ".obsidian/themes";
export const SNIPPETS_DIR = ".obsidian/snippets";

export const CORE_PLUGIN_NAMES: Record<string, string> = {
  "file-explorer": "文件列表",
  "global-search": "全局搜索",
  switcher: "快速切换",
  graph: "关系图",
  backlink: "反向链接",
  canvas: "Canvas",
  "outgoing-link": "出链",
  "tag-pane": "标签面板",
  footnotes: "脚注",
  properties: "属性",
  "page-preview": "页面预览",
  "daily-notes": "日记",
  templates: "模板",
  "note-composer": "笔记重组",
  "command-palette": "命令面板",
  "slash-command": "斜杠命令",
  "editor-status": "编辑器状态",
  bookmarks: "书签",
  "markdown-importer": "Markdown 导入",
  "zk-prefixer": "Zettelkasten 前缀",
  "random-note": "随机笔记",
  outline: "大纲",
  "word-count": "字数统计",
  slides: "幻灯片",
  "audio-recorder": "录音",
  workspaces: "工作区",
  "file-recovery": "文件恢复",
  publish: "发布",
  sync: "同步",
  bases: "Bases",
  webviewer: "Web viewer",
};

export class Scanner {
  constructor(private app: App, private library: GuideLibrary) {}

  private async enabledIds(): Promise<Set<string>> {
    const set = new Set<string>();
    const plugins = (this.app as any).plugins;
    if (plugins?.enabledPlugins instanceof Set) {
      for (const id of plugins.enabledPlugins) set.add(id);
    }
    if (set.size === 0) {
      // 兜底：插件注册表不可用时读启用列表文件
      try {
        const raw = JSON.parse(await this.app.vault.adapter.read(".obsidian/community-plugins.json"));
        if (Array.isArray(raw)) for (const id of raw) set.add(String(id));
      } catch {
        /* ignore */
      }
    }
    return set;
  }

  private collectedCommands(): Record<string, { id: string; name: string }> {
    const registry = (this.app as any).commands;
    return registry?.commands && typeof registry.commands === "object" ? registry.commands : {};
  }

  async scan(settings: PluginCatalogSettings, watcherActive: boolean): Promise<Snapshot> {
    const adapter = this.app.vault.adapter;
    await this.library.refresh();

    const enabled = await this.enabledIds();
    const pluginInstances = ((this.app as any).plugins?.plugins ?? {}) as Record<string, unknown>;
    const commands = this.collectedCommands();
    const plugins: PluginInfo[] = [];

    try {
      const listing = await adapter.list(PLUGINS_DIR);
      for (const folder of listing.folders) {
        const manifestPath = `${folder}/manifest.json`;
        try {
          if (!(await adapter.exists(manifestPath))) continue;
          const raw = await adapter.read(manifestPath);
          const manifest = JSON.parse(raw) as PluginManifest;
          if (!manifest?.id) continue;
          const stat = await adapter.stat(manifestPath);
          const info: PluginInfo = {
            id: manifest.id,
            name: manifest.name || manifest.id,
            version: manifest.version || "?",
            author: (manifest.author || "").replace(/<[^>]*>/g, "").trim(),
            description: manifest.description || "",
            minAppVersion: manifest.minAppVersion || "",
            isDesktopOnly: !!manifest.isDesktopOnly,
            authorUrl: manifest.authorUrl || "",
            dirName: folder.split("/").pop() || manifest.id,
            folderPath: normalizePath(folder),
            enabled: enabled.has(manifest.id) || !!pluginInstances[manifest.id],
            manifestMtime: stat?.mtime ?? 0,
            guidePath: null,
            guideManaged: false,
            commands: Object.values(commands)
              .filter((command) => command.id.startsWith(`${manifest.id}:`))
              .map((command) => command.name),
          };
          const guide = this.library.findForPlugin(info);
          if (guide) {
            info.guidePath = guide.path;
            info.guideManaged = guide.managed;
          }
          plugins.push(info);
        } catch (error) {
          console.warn(`[plugin-catalog-guide] 读取插件清单失败: ${folder}`, error);
        }
      }
    } catch (error) {
      console.warn("[plugin-catalog-guide] 无法列出插件目录", error);
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
      watcherActive,
    };
  }

  private async corePlugins(): Promise<CorePluginInfo[]> {
    const adapter = this.app.vault.adapter;
    const state = new Map<string, boolean>();
    try {
      if (await adapter.exists(CORE_FILE)) {
        const parsed = JSON.parse(await adapter.read(CORE_FILE));
        if (Array.isArray(parsed)) {
          for (const id of parsed) state.set(String(id), true);
        } else if (parsed && typeof parsed === "object") {
          for (const [id, value] of Object.entries(parsed)) state.set(id, value === true);
        }
      }
    } catch {
      /* 读不到就只显示已知列表 */
    }
    const ids = new Set<string>([...Object.keys(CORE_PLUGIN_NAMES), ...state.keys()]);
    return Array.from(ids)
      .map((id) => ({
        id,
        name: CORE_PLUGIN_NAMES[id] || id,
        enabled: state.get(id) === true,
      }))
      .sort((a, b) => Number(b.enabled) - Number(a.enabled) || a.name.localeCompare(b.name, "zh-Hans-CN"));
  }

  private async themes(): Promise<ThemeInfo[]> {
    const adapter = this.app.vault.adapter;
    let active = "";
    try {
      if (await adapter.exists(APPEARANCE_FILE)) {
        const appearance = JSON.parse(await adapter.read(APPEARANCE_FILE));
        active = appearance?.cssTheme || "";
      }
    } catch {
      /* ignore */
    }
    const result: ThemeInfo[] = [];
    try {
      const listing = await adapter.list(THEMES_DIR);
      for (const folder of listing.folders) {
        const name = folder.split("/").pop();
        if (name) result.push({ name, active: name === active });
      }
    } catch {
      /* 没有主题目录 */
    }
    return result.sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name));
  }
}

export function snapshotSignature(snapshot: Snapshot): string {
  const plugins = snapshot.plugins
    .map((p) => `${p.id}@${p.version}:${p.enabled ? 1 : 0}:${p.guidePath ?? ""}:${p.commands.length}`)
    .sort()
    .join("|");
  const core = snapshot.corePlugins
    .filter((c) => c.enabled)
    .map((c) => c.id)
    .sort()
    .join(",");
  const themes = snapshot.themes
    .map((t) => `${t.name}:${t.active ? 1 : 0}`)
    .sort()
    .join(",");
  return `${plugins}||${core}||${themes}`;
}
