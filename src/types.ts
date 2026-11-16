export type OverwritePolicy = "skip" | "backup" | "overwrite";

export interface AIConfig {
  enabled: boolean;
  baseUrl: string;
  model: string;
  apiKey: string;
  temperature: number;
  maxTokens: number;
  timeoutMs: number;
}

export interface PluginCatalogSettings {
  /** 指南与总览写入的库内文件夹（相对库根，/ 分隔） */
  outputFolder: string;
  /** 已存在同名指南时的处理策略 */
  overwritePolicy: OverwritePolicy;
  /** 检测到新插件时自动生成指南 */
  autoGenerateOnInstall: boolean;
  /** 启动时补齐缺失的指南 */
  autoGenerateOnStartup: boolean;
  /** 尝试抓取 GitHub README 作为素材 */
  fetchReadme: boolean;
  /** 轮询间隔（毫秒），桌面端另有 fs.watch */
  pollIntervalMs: number;
  /** 总览里附带核心插件状态 */
  includeCorePlugins: boolean;
  /** 总览里附带主题与片段 */
  includeThemes: boolean;
  /** 生成完成后弹通知 */
  notifyOnGenerate: boolean;
  ai: AIConfig;
}

export interface PluginInfo {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  minAppVersion: string;
  isDesktopOnly: boolean;
  authorUrl: string;
  dirName: string;
  folderPath: string;
  enabled: boolean;
  manifestMtime: number;
  guidePath: string | null;
  guideManaged: boolean;
  commands: string[];
}

export interface CorePluginInfo {
  id: string;
  name: string;
  enabled: boolean;
}

export interface ThemeInfo {
  name: string;
  active: boolean;
}

export interface Snapshot {
  plugins: PluginInfo[];
  corePlugins: CorePluginInfo[];
  themes: ThemeInfo[];
  scannedAt: number;
  watcherActive: boolean;
}

export interface GuideEntry {
  path: string;
  pluginId: string | null;
  managed: boolean;
  mtime: number;
  version?: string;
  statusLabel?: string;
}

export type GuideStatus = "idle" | "queued" | "running" | "failed";

export interface CatalogHost {
  settings: PluginCatalogSettings;
  getSnapshot(): Snapshot;
  getGuideStatus(id: string): GuideStatus;
  isBusy(): boolean;
  refreshAll(): Promise<void>;
  generateGuide(id: string): Promise<void>;
  generateMissingGuides(): Promise<void>;
  openGuide(id: string): Promise<void>;
  openOverview(): Promise<void>;
  saveSettings(): Promise<void>;
}
