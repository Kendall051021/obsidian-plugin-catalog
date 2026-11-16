import type { SettingItem, SettingKind } from "./types";

const NAME_RE = /\.setName\(\s*(["'`])([^"'`]{1,120})\1\s*\)/g;
const DESC_RE = /\.setDesc\(\s*(["'`])([^"'`]{1,300})\1\s*\)/;
const OPTION_RE = /\.addOption\(\s*(["'`])([^"'`]{1,120})\1\s*,\s*(["'`])([^"'`]{1,120})\3\s*\)/g;

const KIND_PATTERNS: { kind: SettingKind; re: RegExp }[] = [
  { kind: "toggle", re: /\.addToggle\(/ },
  { kind: "dropdown", re: /\.addDropdown\(/ },
  { kind: "slider", re: /\.addSlider\(/ },
  { kind: "text", re: /\.addText(?:Area)?\(/ },
  { kind: "button", re: /\.addButton\(/ },
];

function clean(text: string): string {
  return text
    .replace(/\\n/g, " ")
    .replace(/\\t/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function detectKind(windowText: string): SettingKind {
  let best: { kind: SettingKind; index: number } | null = null;
  for (const pattern of KIND_PATTERNS) {
    const match = windowText.match(pattern.re);
    if (!match || match.index === undefined) continue;
    if (!best || match.index < best.index) best = { kind: pattern.kind, index: match.index };
  }
  return best?.kind ?? "unknown";
}

/**
 * 从插件打包后的 main.js 里提取设置项（.setName / .setDesc / .addToggle ...）。
 * 属于尽力而为：能覆盖大多数用 Obsidian Setting API 的插件，但拿不到运行时的开关状态。
 */
export function parseSettingsFromCode(code: string, limit = 120): SettingItem[] {
  const matches = Array.from(code.matchAll(NAME_RE));
  const items: SettingItem[] = [];
  const seen = new Set<string>();
  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const start = match.index ?? 0;
    const nextStart = matches[index + 1]?.index ?? Math.min(code.length, start + 3000);
    const windowText = code.slice(start, Math.min(nextStart, start + 3000));
    const label = clean(match[2]);
    if (!label || label.length < 2 || seen.has(label)) continue;
    const descMatch = windowText.match(DESC_RE);
    const kind = detectKind(windowText);
    const options =
      kind === "dropdown"
        ? Array.from(windowText.matchAll(OPTION_RE))
            .map((option) => clean(option[4]))
            .filter(Boolean)
            .slice(0, 20)
        : undefined;
    seen.add(label);
    items.push({
      label,
      desc: descMatch ? clean(descMatch[2]) : undefined,
      kind,
      options: options && options.length > 0 ? options : undefined,
      source: "code",
    });
    if (items.length >= limit) break;
  }
  return items;
}
