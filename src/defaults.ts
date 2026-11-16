import type { AIConfig, PluginCatalogSettings } from "./types";

export const DEFAULT_SETTINGS_AI: AIConfig = {
  enabled: false,
  baseUrl: "https://api.deepseek.com",
  model: "deepseek-chat",
  apiKey: "",
  temperature: 0.3,
  maxTokens: 2000,
  timeoutMs: 60000,
};

export const DEFAULT_SETTINGS: PluginCatalogSettings = {
  outputFolder: "插件指南",
  overwritePolicy: "skip",
  autoGenerateOnInstall: true,
  autoGenerateOnStartup: true,
  deleteGuidesOnUninstall: true,
  scrapeSettingsOnManual: true,
  namingMigrated: false,
  fetchReadme: true,
  pollIntervalMs: 3000,
  includeCorePlugins: true,
  includeThemes: false,
  notifyOnGenerate: true,
  ai: DEFAULT_SETTINGS_AI,
};
