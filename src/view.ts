import { ItemView, WorkspaceLeaf } from "obsidian";
import type { CatalogHost, PluginInfo, Snapshot } from "./types";
import { formatDateTime } from "./util";

export const VIEW_TYPE = "plugin-catalog-guide-view";

export class PluginCatalogView extends ItemView {
  private filter = "";
  private listEl: HTMLElement | null = null;
  private footerEl: HTMLElement | null = null;
  private countEl: HTMLElement | null = null;
  private searchEl: HTMLInputElement | null = null;
  private built = false;

  constructor(leaf: WorkspaceLeaf, private host: CatalogHost) {
    super(leaf);
  }

  getViewType(): string {
    return VIEW_TYPE;
  }

  getDisplayText(): string {
    return "插件目录";
  }

  getIcon(): string {
    return "library";
  }

  async onOpen(): Promise<void> {
    this.render();
  }

  private button(parent: HTMLElement, label: string, cls: string, onClick: () => Promise<void> | void): void {
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
  render(): void {
    const container = this.contentEl;
    container.empty();
    container.addClass("pcg-view");

    const header = container.createDiv({ cls: "pcg-header" });
    const titleRow = header.createDiv({ cls: "pcg-title-row" });
    const title = titleRow.createDiv({ cls: "pcg-title" });
    title.createSpan({ text: "插件目录", cls: "pcg-title-text" });
    this.countEl = title.createSpan({ cls: "pcg-count", text: "" });

    const toolbar = header.createDiv({ cls: "pcg-toolbar" });
    this.button(toolbar, "刷新", "pcg-btn-ghost", () => this.host.refreshAll());
    this.button(toolbar, "生成缺失", "pcg-btn-accent", () => this.host.generateMissingGuides());
    this.button(toolbar, "打开总览", "pcg-btn-ghost", () => this.host.openOverview());

    const searchWrap = header.createDiv({ cls: "pcg-search-wrap" });
    this.searchEl = searchWrap.createEl("input", {
      cls: "pcg-search",
      attr: { type: "text", placeholder: "搜索插件名 / id / 描述…" },
    });
    this.searchEl.value = this.filter;
    this.searchEl.addEventListener("input", () => {
      this.filter = this.searchEl?.value ?? "";
      this.renderList();
    });

    this.listEl = container.createDiv({ cls: "pcg-list" });
    this.footerEl = container.createDiv({ cls: "pcg-footer" });
    this.built = true;
    this.refresh();
  }

  /** 只刷新列表与页脚，保留搜索框焦点（扫描每 3 秒会调用一次） */
  refresh(): void {
    if (!this.built || !this.listEl || !this.footerEl) {
      this.render();
      return;
    }
    const snapshot = this.host.getSnapshot();
    const enabledCount = snapshot.plugins.filter((plugin) => plugin.enabled).length;
    if (this.countEl) {
      this.countEl.setText(`${snapshot.plugins.length} 个 · 启用 ${enabledCount}`);
    }
    this.renderList();
    this.renderFooter(snapshot);
  }

  private renderList(): void {
    const list = this.listEl;
    if (!list) return;
    list.empty();
    const snapshot = this.host.getSnapshot();
    if (snapshot.scannedAt === 0) {
      list.createDiv({ cls: "pcg-empty", text: "正在扫描插件目录…" });
      return;
    }
    const query = this.filter.trim().toLowerCase();
    const visible = snapshot.plugins.filter((plugin) => {
      if (!query) return true;
      return (
        plugin.name.toLowerCase().includes(query) ||
        plugin.id.toLowerCase().includes(query) ||
        plugin.description.toLowerCase().includes(query)
      );
    });
    if (visible.length === 0) {
      list.createDiv({ cls: "pcg-empty", text: query ? "没有匹配的插件" : "没有安装社区插件" });
      return;
    }
    this.renderGroup(list, "已启用", visible.filter((plugin) => plugin.enabled));
    this.renderGroup(list, "未启用", visible.filter((plugin) => !plugin.enabled));
  }

  private renderGroup(parent: HTMLElement, label: string, plugins: PluginInfo[]): void {
    if (plugins.length === 0) return;
    const group = parent.createDiv({ cls: "pcg-group" });
    group.createDiv({ cls: "pcg-group-title", text: `${label}（${plugins.length}）` });
    for (const plugin of plugins) {
      this.renderRow(group, plugin);
    }
  }

  private renderRow(parent: HTMLElement, plugin: PluginInfo): void {
    const row = parent.createDiv({ cls: "pcg-row" });
    row.toggleClass("pcg-row-disabled", !plugin.enabled);

    const main = row.createDiv({ cls: "pcg-row-main" });
    const titleRow = main.createDiv({ cls: "pcg-row-title" });
    titleRow.createSpan({ cls: "pcg-name", text: plugin.name });
    titleRow.createSpan({ cls: "pcg-version", text: plugin.version });
    if (plugin.enabled) {
      titleRow.createSpan({ cls: "pcg-badge pcg-badge-on", text: "已启用" });
    }
    const status = this.host.getGuideStatus(plugin.id);
    if (status === "running") titleRow.createSpan({ cls: "pcg-badge pcg-badge-busy", text: "生成中…" });
    if (status === "queued") titleRow.createSpan({ cls: "pcg-badge pcg-badge-busy", text: "排队中" });
    if (status === "failed") titleRow.createSpan({ cls: "pcg-badge pcg-badge-fail", text: "生成失败" });

    const description = plugin.description || plugin.id;
    main.createDiv({
      cls: "pcg-desc",
      text: description.length > 110 ? `${description.slice(0, 110)}…` : description,
    });

    const meta = main.createDiv({ cls: "pcg-meta" });
    meta.createSpan({ text: `id: ${plugin.id}` });
    meta.createSpan({ text: `命令 ${plugin.commands.length}` });
    meta.createSpan({
      text: plugin.guidePath ? `指南：${plugin.guideManaged ? "自动生成" : "已有文件"}` : "指南：缺失",
    });

    const actions = row.createDiv({ cls: "pcg-actions" });
    if (plugin.guidePath) {
      this.button(actions, "打开", "pcg-btn-ghost", () => this.host.openGuide(plugin.id));
      this.button(actions, "重生成", "pcg-btn-ghost", () => this.host.generateGuide(plugin.id));
    } else {
      this.button(actions, "生成", "pcg-btn-accent", () => this.host.generateGuide(plugin.id));
    }
  }

  private renderFooter(snapshot: Snapshot): void {
    const footer = this.footerEl;
    if (!footer) return;
    footer.empty();
    const scanned = snapshot.scannedAt ? formatDateTime(new Date(snapshot.scannedAt)) : "未扫描";
    const watch = snapshot.watcherActive ? "fs.watch 实时监听 + 轮询兜底" : "轮询";
    footer.createDiv({ cls: "pcg-footer-line", text: `最后扫描：${scanned} ｜ 监听：${watch}` });
    footer.createDiv({
      cls: "pcg-footer-line",
      text: `指南目录：${this.host.settings.outputFolder} ｜ 已生成 ${snapshot.plugins.filter((p) => p.guidePath).length}/${snapshot.plugins.length}`,
    });
  }
}
