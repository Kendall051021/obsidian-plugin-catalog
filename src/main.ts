import { Notice, Plugin, TFile, normalizePath } from "obsidian";
import { normalizeSettings } from "./normalize";
import { GuideLibrary, WORK_DIR } from "./library";
import { Scanner, snapshotSignature } from "./scanner";
import { DirectoryWatcher } from "./watcher";
import { GuideGenerator } from "./guide-generator";
import { buildOverview } from "./index-writer";
import { VIEW_TYPE, PluginCatalogView } from "./view";
import { PluginCatalogSettingTab } from "./settings-tab";
import type { CatalogHost, GuideStatus, PluginCatalogSettings, PluginInfo, Snapshot } from "./types";
import { formatDateTime, sanitizeFileName, sleep } from "./util";

interface QueueItem {
  id: string;
  manual: boolean;
}

interface GenerationResult {
  id: string;
  name: string;
  source: "template" | "ai";
  written: boolean;
  path: string;
  error?: string;
}

const EMPTY_SNAPSHOT: Snapshot = {
  plugins: [],
  corePlugins: [],
  themes: [],
  scannedAt: 0,
  watcherActive: false,
};

export default class PluginCatalogPlugin extends Plugin implements CatalogHost {
  settings!: PluginCatalogSettings;

  private library!: GuideLibrary;
  private scanner!: Scanner;
  private watcher!: DirectoryWatcher;
  private generator!: GuideGenerator;

  private snapshot: Snapshot = EMPTY_SNAPSHOT;
  private lastSnapshot: Snapshot | null = null;
  private lastSignature = "";

  private status = new Map<string, GuideStatus>();
  private generatedKeys = new Set<string>();
  private queue: QueueItem[] = [];
  private processing = false;

  private scanTimer: number | null = null;
  private scanQueued = false;
  private scanning = false;
  private booted = false;
  private knownIds: string[] | null = null;

  async onload(): Promise<void> {
    try {
      await this.setup();
    } catch (error) {
      console.error("[plugin-catalog-guide] 初始化失败", error);
      // 落盘一份崩溃日志，便于在没有控制台的情况下排查
      try {
        await this.app.vault.adapter.mkdir(WORK_DIR);
      } catch {
        /* 目录可能已存在 */
      }
      try {
        const detail = error instanceof Error ? `${error.message}\n${error.stack ?? ""}` : String(error);
        await this.app.vault.adapter.write(
          `${WORK_DIR}/crash.log`,
          `${formatDateTime(new Date())}\n${detail}\n`
        );
      } catch {
        /* 写不了就算了 */
      }
    }
  }

  private async setup(): Promise<void> {
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
    this.addRibbonIcon("book-open", "打开插件目录", () => {
      void this.activateView();
    });

    this.addCommand({ id: "open-panel", name: "打开插件目录面板", callback: () => void this.activateView() });
    this.addCommand({
      id: "refresh",
      name: "重新扫描插件",
      callback: async () => {
        await this.refreshAll();
        new Notice(`插件目录已刷新：${this.snapshot.plugins.length} 个插件`);
      },
    });
    this.addCommand({
      id: "update-index",
      name: "更新插件目录总览",
      callback: async () => {
        await this.refreshAll();
        await this.writeIndex(true);
        new Notice("插件目录总览已更新");
      },
    });
    this.addCommand({
      id: "generate-missing",
      name: "生成所有缺失指南",
      callback: () => void this.generateMissingGuides(),
    });
    this.addCommand({
      id: "regenerate-auto",
      name: "重新生成所有自动生成的指南",
      callback: () => void this.regenerateAutoGuides(),
    });
    this.addCommand({
      id: "open-overview",
      name: "打开插件目录总览",
      callback: () => void this.openOverview(),
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

  onunload(): void {
    this.watcher?.stop();
    if (this.scanTimer !== null) {
      window.clearTimeout(this.scanTimer);
      this.scanTimer = null;
    }
  }

  // ---------------------------------------------------------------- boot

  private async boot(): Promise<void> {
    if (this.booted) return;
    this.booted = true;
    try {
      this.watcher.start();
      await this.migrateNaming();
      this.knownIds = await this.readKnownIds();
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
      console.error("[plugin-catalog-guide] 启动扫描失败", error);
    }
  }

  /** 旧命名 插件指南 - X.md → 指南-X.md；用 Obsidian 文件管理器重命名以同步库内链接 */
  private async migrateNaming(): Promise<void> {
    if (this.settings.namingMigrated) return;
    try {
      const folder = this.library.folderPath();
      if (!(await this.app.vault.adapter.exists(folder))) {
        this.settings.namingMigrated = true;
        await this.saveData(this.settings);
        return;
      }
      const listing = await this.app.vault.adapter.list(folder);
      let renamed = 0;
      for (const path of listing.files) {
        const name = path.split("/").pop() ?? "";
        const match = name.match(/^插件指南\s*-\s*(.+)\.md$/);
        if (!match) continue;
        const target = normalizePath(`${folder}/指南-${sanitizeFileName(match[1])}.md`);
        if (await this.app.vault.adapter.exists(target)) continue;
        const file = this.app.vault.getAbstractFileByPath(path);
        if (file instanceof TFile) {
          await this.app.fileManager.renameFile(file, target);
        } else {
          await this.app.vault.adapter.write(target, await this.app.vault.adapter.read(path));
          await this.app.vault.adapter.remove(path);
        }
        renamed += 1;
      }
      this.settings.namingMigrated = true;
      await this.saveData(this.settings);
      if (renamed > 0) {
        new Notice(`插件目录与指南：已把 ${renamed} 份指南重命名为「指南-XXX」`);
        console.log(`[plugin-catalog-guide] 重命名 ${renamed} 份指南`);
      }
    } catch (error) {
      console.warn("[plugin-catalog-guide] 重命名旧指南失败", error);
    }
  }

  private async readKnownIds(): Promise<string[] | null> {
    try {
      const path = `${WORK_DIR}/known-plugins.json`;
      if (!(await this.app.vault.adapter.exists(path))) return null;
      const parsed = JSON.parse(await this.app.vault.adapter.read(path));
      return Array.isArray(parsed?.ids) ? parsed.ids.map(String) : null;
    } catch {
      return null;
    }
  }

  private async updateKnownIds(snapshot: Snapshot): Promise<void> {
    const ids = snapshot.plugins.map((plugin) => plugin.id).sort();
    const known = (this.knownIds ?? []).slice().sort();
    if (ids.join("\u0000") === known.join("\u0000")) return;
    this.knownIds = ids;
    try {
      await this.library.ensureFolder(WORK_DIR);
      await this.app.vault.adapter.write(
        `${WORK_DIR}/known-plugins.json`,
        JSON.stringify({ at: formatDateTime(new Date()), ids }, null, 2)
      );
    } catch (error) {
      console.warn("[plugin-catalog-guide] 写入插件清单失败", error);
    }
  }

  /** 插件被卸载：删除其自动生成的指南（手写稿保留），并让总览同步移除 */
  private async cleanupRemovedGuides(snapshot: Snapshot, previous: Snapshot | null): Promise<void> {
    const currentIds = new Set(snapshot.plugins.map((plugin) => plugin.id));
    const known = new Set<string>(this.knownIds ?? []);
    for (const plugin of previous?.plugins ?? []) known.add(plugin.id);
    const removed = Array.from(known).filter((id) => !currentIds.has(id));
    if (removed.length === 0) return;

    if (!this.settings.deleteGuidesOnUninstall) {
      console.log(`[plugin-catalog-guide] 检测到卸载：${removed.join(", ")}（已关闭自动删除指南）`);
      return;
    }

    let deleted = 0;
    for (const id of removed) {
      const entries = this.library.entriesForPlugin(id);
      for (const entry of entries) {
        if (!entry.managed) continue;
        try {
          if (await this.library.deleteGuide(entry)) {
            deleted += 1;
            console.log(`[plugin-catalog-guide] 已删除自动指南：${entry.path}（插件 ${id} 已卸载）`);
          }
        } catch (error) {
          console.warn(`[plugin-catalog-guide] 删除指南失败：${entry.path}`, error);
        }
      }
    }
    if (deleted > 0) {
      await this.library.refresh(true);
      new Notice(`插件已卸载，已删除 ${deleted} 份自动生成的指南`);
    }
  }

  // ------------------------------------------------------------- scanning

  private scheduleScan(): void {
    if (this.scanTimer !== null) window.clearTimeout(this.scanTimer);
    this.scanTimer = window.setTimeout(() => {
      this.scanTimer = null;
      void this.scanOnce("watch");
    }, 300);
  }

  private async scanOnce(reason: string): Promise<void> {
    if (this.scanning) {
      this.scanQueued = true;
      return;
    }
    this.scanning = true;
    try {
      const snapshot = await this.scanner.scan(this.settings, this.watcher?.active ?? false);
      const previous = this.lastSnapshot;
      this.snapshot = snapshot;
      this.lastSnapshot = snapshot;
      await this.cleanupRemovedGuides(snapshot, previous);
      await this.syncGuidesMetadata(snapshot);
      this.notifyViews();
      await this.writeIndex(false);
      await this.updateKnownIds(snapshot);

      const signature = snapshotSignature(snapshot);
      const changed = signature !== this.lastSignature;
      this.lastSignature = signature;

      const newPlugins = previous
        ? snapshot.plugins.filter((plugin) => !previous.plugins.some((old) => old.id === plugin.id))
        : [];
      if (newPlugins.length > 0 && reason !== "generate") {
        if (this.settings.autoGenerateOnInstall) {
          this.enqueue(
            newPlugins.map((plugin) => plugin.id),
            "install"
          );
        } else if (this.settings.notifyOnGenerate) {
          new Notice(`检测到新插件：${newPlugins.map((plugin) => plugin.name).join("、")}`);
        }
      }
      if (changed || reason === "boot") {
        await this.writeStatusFile(reason);
      }
    } catch (error) {
      console.error("[plugin-catalog-guide] 扫描失败", error);
    } finally {
      this.scanning = false;
      if (this.scanQueued) {
        this.scanQueued = false;
        void this.scanOnce("queued");
      }
    }
  }

  /** 插件升级或启停后，同步自动生成指南的 frontmatter（手写稿不碰） */
  private async syncGuidesMetadata(snapshot: Snapshot): Promise<number> {
    let count = 0;
    for (const info of snapshot.plugins) {
      if (!info.guidePath || !info.guideManaged) continue;
      const entry = this.library.listEntries().find((item) => item.path === info.guidePath);
      if (!entry || entry.version === undefined) continue;
      const label = info.enabled ? "已启用" : "未启用";
      if (entry.version === info.version && entry.statusLabel === label) continue;
      try {
        if (await this.library.syncGuideMetadata(info, entry)) count += 1;
      } catch (error) {
        console.warn(`[plugin-catalog-guide] 同步指南元信息失败: ${info.id}`, error);
      }
    }
    if (count > 0) {
      console.log(`[plugin-catalog-guide] 已同步 ${count} 份指南的版本/状态`);
    }
    return count;
  }

  private async writeIndex(force: boolean): Promise<void> {
    try {
      const content = buildOverview(this.snapshot, this.settings, this.library);
      const existing = await this.library.readOverview();
      const strip = (text: string) => text.replace(/^generated_at:.*$/m, "").replace(/\r\n/g, "\n").trim();
      if (force || !existing || strip(existing) !== strip(content)) {
        const path = await this.library.writeOverview(content);
        console.log(`[plugin-catalog-guide] 总览已更新: ${path}`);
      }
    } catch (error) {
      console.error("[plugin-catalog-guide] 写入总览失败", error);
    }
  }

  private async writeStatusFile(reason: string): Promise<void> {
    try {
      await this.library.ensureFolder(WORK_DIR);
      const payload = {
        at: formatDateTime(new Date()),
        reason,
        watcher: this.watcher?.active ? "fs.watch" : "polling",
        outputFolder: this.settings.outputFolder,
        aiEnabled: this.settings.ai.enabled && !!this.settings.ai.apiKey,
        plugins: this.snapshot.plugins.map((plugin) => ({
          id: plugin.id,
          name: plugin.name,
          version: plugin.version,
          enabled: plugin.enabled,
          commands: plugin.commands.length,
          guide: plugin.guidePath,
        })),
        missingGuides: this.snapshot.plugins
          .filter((plugin) => !plugin.guidePath)
          .map((plugin) => plugin.id),
      };
      await this.app.vault.adapter.write(`${WORK_DIR}/last-run.json`, JSON.stringify(payload, null, 2));
    } catch (error) {
      console.warn("[plugin-catalog-guide] 写入运行状态失败", error);
    }
  }

  // ----------------------------------------------------------- generation

  private enqueue(ids: string[], reason: "install" | "startup" | "manual", manual = reason === "manual"): void {
    const added: QueueItem[] = [];
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

  private async processQueue(reason: "install" | "startup" | "manual"): Promise<void> {
    if (this.processing) return;
    this.processing = true;
    const results: GenerationResult[] = [];
    try {
      while (this.queue.length > 0) {
        const item = this.queue.shift()!;
        const info = this.snapshot.plugins.find((plugin) => plugin.id === item.id);
        if (!info) {
          this.status.delete(item.id);
          continue;
        }
        this.status.set(item.id, "running");
        this.notifyViews();
        try {
          const { markdown, source } = await this.generator.build(info, this.snapshot, {
            manual: item.manual,
          });
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
            error: String(error),
          });
          console.error(`[plugin-catalog-guide] 生成指南失败: ${info.id}`, error);
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
        const parts: string[] = [];
        if (ok) parts.push(`生成 ${ok} 份`);
        if (skipped) parts.push(`跳过 ${skipped} 份`);
        if (failed) parts.push(`失败 ${failed} 份`);
        new Notice(`插件指南：${parts.join("，")}`);
      }
      await this.writeGenerationLog(reason, results);
    }
  }

  private async writeGenerationLog(reason: string, results: GenerationResult[]): Promise<void> {
    try {
      await this.library.ensureFolder(WORK_DIR);
      const record = { at: formatDateTime(new Date()), reason, results };
      await this.app.vault.adapter.write(
        `${WORK_DIR}/last-generation.json`,
        JSON.stringify(record, null, 2)
      );
      const logPath = `${WORK_DIR}/generation-log.jsonl`;
      const line = `${JSON.stringify(record)}\n`;
      if (await this.app.vault.adapter.exists(logPath)) {
        await this.app.vault.adapter.append(logPath, line);
      } else {
        await this.app.vault.adapter.write(logPath, line);
      }
    } catch (error) {
      console.warn("[plugin-catalog-guide] 写入生成日志失败", error);
    }
  }

  // -------------------------------------------------------------- UI glue

  async activateView(): Promise<void> {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE);
    let leaf = leaves[0];
    if (!leaf) {
      const right = this.app.workspace.getRightLeaf(false);
      leaf = right ?? this.app.workspace.getLeaf(true);
      await leaf.setViewState({ type: VIEW_TYPE, active: true });
    }
    this.app.workspace.revealLeaf(leaf);
    this.notifyViews();
  }

  private notifyViews(): void {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE)) {
      const view = leaf.view as unknown as PluginCatalogView;
      if (view && typeof view.refresh === "function") {
        view.refresh();
      }
    }
  }

  // ---------------------------------------------------------- CatalogHost

  getSnapshot(): Snapshot {
    return this.snapshot;
  }

  getGuideStatus(id: string): GuideStatus {
    return this.status.get(id) ?? "idle";
  }

  isBusy(): boolean {
    return this.processing;
  }

  async refreshAll(): Promise<void> {
    await this.library.refresh(true);
    await this.scanOnce("manual");
    this.notifyViews();
  }

  async generateGuide(id: string): Promise<void> {
    const info = this.snapshot.plugins.find((plugin) => plugin.id === id);
    if (!info) {
      new Notice("插件不存在或已卸载");
      return;
    }
    if (this.status.get(id) === "running") {
      new Notice(`${info.name} 正在生成中`);
      return;
    }
    this.enqueue([id], "manual");
    new Notice(`已加入生成队列：${info.name}`);
  }

  async generateMissingGuides(): Promise<void> {
    const missing = this.snapshot.plugins.filter((plugin) => !plugin.guidePath).map((plugin) => plugin.id);
    if (missing.length === 0) {
      new Notice("所有插件都已有指南");
      return;
    }
    this.enqueue(missing, "manual");
    new Notice(`已加入生成队列：${missing.length} 个插件`);
  }

  /** 重新生成所有「自动生成」的指南（手写稿不参与），用于配置 AI 后批量升级 */
  async regenerateAutoGuides(): Promise<void> {
    const targets = this.snapshot.plugins.filter((plugin) => plugin.guideManaged).map((plugin) => plugin.id);
    if (targets.length === 0) {
      new Notice("没有可重新生成的自动指南");
      return;
    }
    this.enqueue(targets, "manual");
    new Notice(`已加入重生成队列：${targets.length} 份自动指南`);
  }

  async openGuide(id: string): Promise<void> {
    const info = this.snapshot.plugins.find((plugin) => plugin.id === id);
    if (!info?.guidePath) {
      new Notice("该插件还没有指南，可点「生成」");
      return;
    }
    await this.app.workspace.openLinkText(info.guidePath, "", false);
  }

  async openOverview(): Promise<void> {
    await this.writeIndex(true);
    const path = this.library.overviewPath();
    if (await this.app.vault.adapter.exists(path)) {
      await this.app.workspace.openLinkText(path, "", false);
    } else {
      new Notice("还没有生成总览，请先运行一次扫描");
    }
  }

  async saveSettings(): Promise<void> {
    this.settings = normalizeSettings(this.settings);
    await this.saveData(this.settings);
    this.watcher.stop();
    this.watcher.start();
    await this.library.refresh(true);
    await this.scanOnce("settings");
  }

  pluginInfo(id: string): PluginInfo | undefined {
    return this.snapshot.plugins.find((plugin) => plugin.id === id);
  }
}
