import { App, Platform } from "obsidian";

/**
 * 监听插件目录变化：
 * - 桌面端优先 fs.watch（近实时）
 * - 所有平台都保留定时轮询兜底（移动端 / 监听失效 / 启用状态变化）
 */
export class DirectoryWatcher {
  private fsWatcher: any = null;
  private pollTimer: number | null = null;
  private debounceTimer: number | null = null;
  private running = false;

  constructor(
    private app: App,
    private getPollMs: () => number,
    private onChange: () => void
  ) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.startPolling();
    this.startFsWatch();
  }

  stop(): void {
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
      } catch {
        /* ignore */
      }
      this.fsWatcher = null;
    }
  }

  get active(): boolean {
    return this.fsWatcher !== null;
  }

  private schedule(): void {
    if (this.debounceTimer !== null) window.clearTimeout(this.debounceTimer);
    this.debounceTimer = window.setTimeout(() => {
      this.debounceTimer = null;
      if (this.running) this.onChange();
    }, 400);
  }

  private startPolling(): void {
    if (this.pollTimer !== null) return;
    const tick = () => {
      if (this.running) this.onChange();
    };
    this.pollTimer = window.setInterval(tick, Math.max(1000, this.getPollMs()));
  }

  private startFsWatch(): void {
    if (!Platform.isDesktopApp) return;
    try {
      const fs = require("fs") as typeof import("fs");
      const path = require("path") as typeof import("path");
      const adapter = this.app.vault.adapter as any;
      const basePath =
        typeof adapter.getBasePath === "function" ? adapter.getBasePath() : adapter.basePath;
      if (!basePath) return;
      const dir = path.join(basePath, ".obsidian", "plugins");
      if (!fs.existsSync(dir)) return;
      this.fsWatcher = fs.watch(dir, { recursive: true }, () => this.schedule());
      if (typeof this.fsWatcher?.on === "function") {
        this.fsWatcher.on("error", () => {
          /* 监听出错时轮询仍然有效 */
        });
      }
    } catch (error) {
      console.warn("[plugin-catalog-guide] fs.watch 不可用，使用轮询", error);
      this.fsWatcher = null;
    }
  }
}
