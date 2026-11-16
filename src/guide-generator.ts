import { App, requestUrl } from "obsidian";
import type { PluginCatalogSettings, PluginInfo, Snapshot } from "./types";
import { classify, type Category } from "./category";
import { describeSettingValue, formatDate, isSecretKey, repoFromUrl, truncate } from "./util";
import { buildTemplateGuideBody } from "./guide-template";
import { generateWithAI } from "./ai";

const COMMUNITY_URL =
  "https://raw.githubusercontent.com/obsidianmd/obsidian-releases/master/community-plugins.json";

interface CommunityEntry {
  repo?: string;
  description?: string;
}

export interface SettingFact {
  key: string;
  value: string;
  secret: boolean;
}

export interface GuideFacts {
  info: PluginInfo;
  repo: string | null;
  readme: string | null;
  settings: SettingFact[];
  related: string[];
  category: Category;
  vaultName: string;
  allPlugins: PluginInfo[];
}

let communityCache: { at: number; map: Map<string, CommunityEntry> } | null = null;
let readmeBlockedUntil = 0;
const README_BLOCK_MS = 120000;

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
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

async function loadCommunityIndex(): Promise<Map<string, CommunityEntry>> {
  if (communityCache && Date.now() - communityCache.at < 10 * 60 * 1000) {
    return communityCache.map;
  }
  const map = new Map<string, CommunityEntry>();
  try {
    const response = await withTimeout(
      requestUrl({ url: COMMUNITY_URL, method: "GET", throw: false }),
      15000
    );
    if (response && response.status === 200) {
      const parsed = JSON.parse(response.text) as Array<CommunityEntry & { id: string }>;
      for (const item of parsed) {
        if (item?.id) map.set(item.id, { repo: item.repo, description: item.description });
      }
    }
  } catch (error) {
    console.warn("[plugin-catalog-guide] 获取社区插件元数据失败", error);
  }
  // 成功与失败都缓存，避免离线时每个插件都等一次超时
  communityCache = { at: Date.now(), map };
  return map;
}

export class GuideGenerator {
  constructor(private app: App, private getSettings: () => PluginCatalogSettings) {}

  async collect(info: PluginInfo, snapshot: Snapshot): Promise<GuideFacts> {
    const settings = this.getSettings();
    let repo: string | null = null;
    try {
      const index = await loadCommunityIndex();
      repo = index.get(info.id)?.repo ?? null;
    } catch {
      repo = null;
    }
    if (!repo) repo = repoFromUrl(info.authorUrl);

    const settingFacts = await this.collectSettings(info);
    let readme: string | null = null;
    if (settings.fetchReadme && repo) {
      readme = await this.fetchReadme(repo);
    }

    return {
      info,
      repo,
      readme,
      settings: settingFacts,
      related: snapshot.plugins
        .filter((item) => item.enabled && item.id !== info.id && item.id !== "plugin-catalog-guide")
        .slice(0, 10)
        .map((item) => item.name),
      category: classify(info),
      vaultName: this.app.vault.getName(),
      allPlugins: snapshot.plugins,
    };
  }

  private async collectSettings(info: PluginInfo): Promise<SettingFact[]> {
    const path = `${info.folderPath}/data.json`;
    try {
      if (!(await this.app.vault.adapter.exists(path))) return [];
      const parsed = JSON.parse(await this.app.vault.adapter.read(path));
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return [];
      return Object.entries(parsed as Record<string, unknown>)
        .slice(0, 40)
        .map(([key, value]) => ({
          key,
          value: isSecretKey(key) ? "已配置（已脱敏）" : describeSettingValue(value),
          secret: isSecretKey(key),
        }));
    } catch {
      return [];
    }
  }

  private async fetchReadme(repo: string): Promise<string | null> {
    if (Date.now() < readmeBlockedUntil) return null;
    const candidates = [
      `https://raw.githubusercontent.com/${repo}/HEAD/README.md`,
      `https://raw.githubusercontent.com/${repo}/HEAD/readme.md`,
      `https://raw.githubusercontent.com/${repo}/HEAD/README.markdown`,
    ];
    for (const url of candidates) {
      const response = await withTimeout(requestUrl({ url, method: "GET", throw: false }), 10000);
      if (!response) {
        // 超时或网络错误：本次会话 2 分钟内不再尝试，避免批量生成时逐个卡 10 秒
        readmeBlockedUntil = Date.now() + README_BLOCK_MS;
        return null;
      }
      if (response.status === 200 && response.text && response.text.length > 60) {
        return response.text.slice(0, 12000);
      }
    }
    return null;
  }

  async build(info: PluginInfo, snapshot: Snapshot): Promise<{ markdown: string; source: "template" | "ai" }> {
    const facts = await this.collect(info, snapshot);
    const settings = this.getSettings();
    let body: string | null = null;
    let source: "template" | "ai" = "template";
    if (settings.ai.enabled && settings.ai.apiKey) {
      try {
        const aiBody = await generateWithAI(facts, settings.ai);
        if (aiBody) {
          body = aiBody;
          source = "ai";
        }
      } catch (error) {
        console.warn("[plugin-catalog-guide] AI 生成失败，回退模板", error);
      }
    }
    if (!body) body = buildTemplateGuideBody(facts);
    return { markdown: this.withFrontmatter(facts, body, source), source };
  }

  private withFrontmatter(facts: GuideFacts, body: string, source: "template" | "ai"): string {
    const { info } = facts;
    const tags = ["Obsidian", "插件", facts.category.label];
    return [
      "---",
      `title: ${JSON.stringify(`插件指南 - ${info.name}`)}`,
      "type: 插件指南",
      `plugin: ${info.id}`,
      `version: ${JSON.stringify(info.version)}`,
      `status: ${info.enabled ? "已启用" : "未启用"}`,
      `generated_by: ${source}`,
      "generator: plugin-catalog-guide",
      `updated: ${formatDate()}`,
      `tags: [${tags.map((tag) => JSON.stringify(tag)).join(", ")}]`,
      "---",
      "",
      body.trim(),
      "",
    ].join("\n");
  }
}

export { truncate };
