import { requestUrl } from "obsidian";
import type { AIConfig } from "./types";
import type { GuideFacts } from "./guide-generator";

export const REQUIRED_HEADINGS = [
  "一句话定位",
  "目标案例",
  "分步设置",
  "命令速查",
  "常见问题",
  "与本库其他插件的配合",
  "官方资源",
];

function endpoint(baseUrl: string): string {
  const base = baseUrl.replace(/\/+$/, "");
  if (base.endsWith("/chat/completions")) return base;
  return `${base}/chat/completions`;
}

function buildMessages(facts: GuideFacts) {
  const { info, repo, readme, settings, settingItems, settingsScraped, related, category, vaultName } = facts;
  const factsJson = {
    插件名: info.name,
    插件id: info.id,
    版本: info.version,
    作者: info.author,
    描述: info.description,
    最低Obsidian版本: info.minAppVersion,
    仅桌面端: info.isDesktopOnly,
    当前是否启用: info.enabled,
    官方仓库: repo ? `https://github.com/${repo}` : null,
    命令列表: info.commands,
    已保存设置: settings,
    设置项: settingItems.map((item) => ({
      名称: item.label,
      说明: item.desc ?? null,
      控件: item.kind,
      当前值: item.current ?? null,
      可选项: item.options ?? null,
      来源: item.source,
    })),
    设置来源: settingsScraped ? "真实设置页抓取" : "插件代码提取（当前值来自 data.json）",
    分类: category.label,
    所在库: vaultName,
    本库其他已启用插件: related,
  };
  const system =
    "你是一位 Obsidian 插件文档作者，擅长把插件设置页写成一步步能照做的中文教程。\n" +
    "硬性规则：\n" +
    "1. 只能使用给定事实中的设置项名称、命令、选项与当前值，不得编造设置项、按钮、快捷键或路径。\n" +
    "2. 每一步必须写成：`**第 N 步 · 标题**：设置 → 第三方插件 → {插件名} → 选项 → {控件名} → 操作（当前：…）`。\n" +
    "3. 不确定的写「以插件设置页为准」。\n" +
    "4. 输出纯 Markdown 正文，不要 frontmatter，不要用```包住整篇。\n" +
    "5. 必须使用这些二级标题（可加编号）：一句话定位、目标案例、分步设置、命令速查、常见问题、与本库其他插件的配合、官方资源。\n" +
    "6. 开头先给一个具体目标案例，再给分步操作；总长度 800～1600 字。\n" +
    "7. 开头写 `# {插件名} 使用指南`。";
  const user = [
    "以下是插件事实（JSON）：",
    JSON.stringify(factsJson, null, 2),
    readme
      ? `\n官方 README 节选（可能为英文原文，可翻译概括，不得扩写不存在的功能）：\n${readme.slice(0, 6000)}`
      : "\n（未获取到 README，只依据上面的元数据写作，功能细节写「以插件设置页为准」。）",
    "\n请按规则输出指南正文，重点把「分步设置」写成能照着点的一步一步。",
  ].join("\n");
  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

export async function generateWithAI(facts: GuideFacts, ai: AIConfig): Promise<string | null> {
  if (!ai.apiKey) return null;
  const response = await requestUrl({
    url: endpoint(ai.baseUrl),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ai.apiKey}`,
    },
    body: JSON.stringify({
      model: ai.model,
      messages: buildMessages(facts),
      temperature: ai.temperature,
      max_tokens: ai.maxTokens,
      stream: false,
    }),
    throw: false,
  });

  if (response.status !== 200) {
    throw new Error(`AI 接口返回 ${response.status}: ${response.text.slice(0, 300)}`);
  }
  const parsed = response.json as any;
  let content: string | undefined = parsed?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) return null;

  content = content.trim();
  content = content.replace(/^```(?:markdown|md)?\s*\n/i, "").replace(/\n```\s*$/, "").trim();
  content = content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "").trim();
  if (content.length < 400) return null;

  const headingCount = REQUIRED_HEADINGS.filter((heading) =>
    new RegExp(`^##+\\s*.*${heading}`, "m").test(content)
  ).length;
  if (headingCount < 5) return null;

  return content;
}
