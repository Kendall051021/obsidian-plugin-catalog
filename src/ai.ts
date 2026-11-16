import { requestUrl } from "obsidian";
import type { AIConfig } from "./types";
import type { GuideFacts } from "./guide-generator";

export const REQUIRED_HEADINGS = [
  "一句话定位",
  "它解决什么问题",
  "快速上手",
  "命令与入口",
  "设置项",
  "常用用法",
  "注意事项",
  "与本库其他插件的配合",
  "官方资源",
];

function endpoint(baseUrl: string): string {
  const base = baseUrl.replace(/\/+$/, "");
  if (base.endsWith("/chat/completions")) return base;
  return `${base}/chat/completions`;
}

function buildMessages(facts: GuideFacts) {
  const { info, repo, readme, settings, related, category, vaultName } = facts;
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
    分类: category.label,
    所在库: vaultName,
    本库其他已启用插件: related,
  };
  const system =
    "你是一位 Obsidian 插件文档作者，擅长写简洁、可操作的中文使用指南。\n" +
    "硬性规则：\n" +
    "1. 只能依据用户提供的事实写作，不得编造功能、快捷键、设置项、命令。\n" +
    "2. 不确定的内容写「以插件设置页为准」，不要虚构。\n" +
    "3. 输出纯 Markdown 正文，不要 YAML frontmatter，不要用```包裹整篇。\n" +
    "4. 必须使用这些二级标题（可加编号）：一句话定位、它解决什么问题、快速上手、命令与入口、设置项、常用用法、注意事项、与本库其他插件的配合、官方资源。\n" +
    "5. 总长度 600～1200 字，多用列表和表格，不写空话套话。\n" +
    "6. 开头写 `# {插件名} 使用指南`。";
  const user = [
    "以下是插件事实（JSON）：",
    JSON.stringify(factsJson, null, 2),
    readme ? `\n官方 README 节选（可能为英文原文，可翻译概括，不得扩写不存在的功能）：\n${readme.slice(0, 6000)}` : "\n（未获取到 README，请只依据上面的元数据写作，功能细节写「以插件设置页为准」。）",
    "\n请输出指南正文。",
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
  if (headingCount < 6) return null;

  return content;
}
