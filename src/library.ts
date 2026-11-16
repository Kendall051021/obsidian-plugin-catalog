import { App, normalizePath } from "obsidian";
import type { GuideEntry, PluginInfo } from "./types";
import { formatDate, sanitizeFileName } from "./util";

export const WORK_DIR = ".obsidian/plugin-catalog";
export const BACKUP_DIR = `${WORK_DIR}/backups`;
export const OVERVIEW_FILE = "Obsidian 插件目录（总览）.md";

export interface WriteResult {
  path: string;
  written: boolean;
  skippedReason?: string;
  backupPath?: string;
}

export class GuideLibrary {
  private entries = new Map<string, GuideEntry>();

  constructor(private app: App, private folder: () => string) {}

  private get adapter() {
    return this.app.vault.adapter;
  }

  folderPath(): string {
    return normalizePath(this.folder());
  }

  async refresh(force = false): Promise<void> {
    const folder = this.folderPath();
    const next = new Map<string, GuideEntry>();
    try {
      if (!(await this.adapter.exists(folder))) {
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
        const entry: GuideEntry = { path, pluginId: null, managed: false, mtime: stat.mtime };
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
        } catch {
          /* 读取失败不阻塞扫描 */
        }
        next.set(path, entry);
      }
    } catch {
      /* 目录不存在或不可读 */
    }
    this.entries = next;
  }

  fileNameFor(info: PluginInfo): string {
    const base = `插件指南 - ${sanitizeFileName(info.name)}`;
    const candidate = `${base}.md`;
    const existing = this.entries.get(normalizePath(`${this.folderPath()}/${candidate}`));
    if (!existing) return candidate;
    if (existing.pluginId === info.id || existing.pluginId === null) return candidate;
    return `${base} (${info.id}).md`;
  }

  findForPlugin(info: PluginInfo): GuideEntry | null {
    const expected = normalizePath(`${this.folderPath()}/${this.fileNameFor(info)}`);
    const byName = this.entries.get(expected);
    if (byName) return byName;
    for (const entry of this.entries.values()) {
      if (entry.pluginId === info.id) return entry;
    }
    return null;
  }

  async ensureFolder(path: string): Promise<void> {
    const normalized = normalizePath(path);
    if (await this.adapter.exists(normalized)) return;
    const parts = normalized.split("/");
    let current = "";
    for (const part of parts) {
      current = current ? `${current}/${part}` : part;
      if (!(await this.adapter.exists(current))) {
        try {
          await this.adapter.mkdir(current);
        } catch {
          /* 并发创建时忽略 */
        }
      }
    }
  }

  async backupFile(path: string): Promise<string> {
    await this.ensureFolder(BACKUP_DIR);
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const base = path.split("/").pop() ?? "backup.md";
    const target = normalizePath(`${BACKUP_DIR}/${base.replace(/\.md$/i, "")}.${stamp}.md`);
    const content = await this.adapter.read(path);
    await this.adapter.write(target, content);
    return target;
  }

  async writeGuide(info: PluginInfo, markdown: string, policy: "skip" | "backup" | "overwrite"): Promise<WriteResult> {
    await this.refresh();
    await this.ensureFolder(this.folderPath());
    const preferred = normalizePath(`${this.folderPath()}/${this.fileNameFor(info)}`);
    const existingForPlugin = this.findForPlugin(info);
    const path = existingForPlugin ? existingForPlugin.path : preferred;
    const exists = await this.adapter.exists(path);
    if (exists) {
      if (policy === "skip") {
        return { path, written: false, skippedReason: "该插件已有指南（按设置跳过）" };
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
          statusLabel: info.enabled ? "已启用" : "未启用",
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
      mtime: stat?.mtime ?? Date.now(),
      version: info.version,
      statusLabel: info.enabled ? "已启用" : "未启用",
    });
    return { path, written: true };
  }

  /** 插件升级/启停后，同步自动生成指南的版本与状态（手写稿不碰） */
  async syncGuideMetadata(info: PluginInfo, entry: GuideEntry): Promise<boolean> {
    if (!entry.managed) return false;
    const label = info.enabled ? "已启用" : "未启用";
    const content = await this.adapter.read(entry.path).catch(() => null);
    if (content === null) return false;
    const next = content
      .replace(/^version:.*$/m, `version: ${JSON.stringify(info.version)}`)
      .replace(/^status:.*$/m, `status: ${label}`)
      .replace(/^updated:.*$/m, `updated: ${formatDate()}`);
    if (next === content) return false;
    await this.adapter.write(entry.path, next);
    const stat = await this.adapter.stat(entry.path).catch(() => null);
    this.entries.set(entry.path, { ...entry, mtime: stat?.mtime ?? Date.now(), version: info.version, statusLabel: label });
    return true;
  }

  overviewPath(): string {
    return normalizePath(`${this.folderPath()}/${OVERVIEW_FILE}`);
  }

  async readOverview(): Promise<string | null> {
    const path = this.overviewPath();
    if (!(await this.adapter.exists(path))) return null;
    return this.adapter.read(path).catch(() => null);
  }

  async writeOverview(markdown: string): Promise<string> {
    const folder = this.folderPath();
    await this.ensureFolder(folder);
    const path = this.overviewPath();
    if (await this.adapter.exists(path)) {
      const current = await this.adapter.read(path).catch(() => "");
      if (current && !current.includes("generator: plugin-catalog-guide")) {
        const backup = await this.backupFile(path);
        console.log(`[plugin-catalog-guide] 已备份手写总览 -> ${backup}`);
      }
    }
    await this.adapter.write(path, markdown);
    return path;
  }

  listEntries(): GuideEntry[] {
    return Array.from(this.entries.values());
  }
}
