import { DEFAULT_SETTINGS_AI } from "./defaults";
import type { PluginCatalogSettings } from "./types";
import { safeFolderPath } from "./util";

export function normalizeSettings(raw: unknown): PluginCatalogSettings {
  const input = (raw ?? {}) as Partial<PluginCatalogSettings>;
  const aiInput = (input.ai ?? {}) as Partial<PluginCatalogSettings["ai"]>;

  const clamp = (value: unknown, min: number, max: number, fallback: number): number => {
    const num = typeof value === "number" && Number.isFinite(value) ? value : fallback;
    return Math.min(max, Math.max(min, Math.round(num)));
  };

  const policy =
    input.overwritePolicy === "backup" || input.overwritePolicy === "overwrite"
      ? input.overwritePolicy
      : "skip";

  return {
    outputFolder: safeFolderPath(input.outputFolder ?? "插件指南"),
    overwritePolicy: policy,
    autoGenerateOnInstall: input.autoGenerateOnInstall ?? true,
    autoGenerateOnStartup: input.autoGenerateOnStartup ?? true,
    fetchReadme: input.fetchReadme ?? true,
    pollIntervalMs: clamp(input.pollIntervalMs, 1000, 60000, 3000),
    includeCorePlugins: input.includeCorePlugins ?? true,
    includeThemes: input.includeThemes ?? false,
    notifyOnGenerate: input.notifyOnGenerate ?? true,
    ai: {
      ...DEFAULT_SETTINGS_AI,
      ...aiInput,
      enabled: aiInput.enabled ?? false,
      maxTokens: clamp(aiInput.maxTokens, 200, 8000, 2000),
      timeoutMs: clamp(aiInput.timeoutMs, 5000, 180000, 60000),
      temperature:
        typeof aiInput.temperature === "number" && Number.isFinite(aiInput.temperature)
          ? Math.min(1, Math.max(0, aiInput.temperature))
          : 0.3,
      apiKey: (aiInput.apiKey ?? "").trim(),
      baseUrl: (aiInput.baseUrl ?? "https://api.deepseek.com").trim().replace(/\/+$/, ""),
      model: (aiInput.model ?? "deepseek-chat").trim(),
    },
  };
}
