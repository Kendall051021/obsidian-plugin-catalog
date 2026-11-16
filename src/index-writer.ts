import type { GuideLibrary } from "./library";
import type { PluginInfo, PluginCatalogSettings, Snapshot } from "./types";
import { categoryLabel, classify, CATEGORY_ORDER } from "./category";
import { escapeTableCell, formatDateTime } from "./util";

function short(text: string, max = 80): string {
  const normalized = (text || "").replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max)}…`;
}

function guideLink(plugin: PluginInfo): string {
  if (!plugin.guidePath) return "—（缺失）";
  return `[[${plugin.guidePath.replace(/\.md$/i, "")}|使用指南]]`;
}

export function buildOverview(
  snapshot: Snapshot,
  settings: PluginCatalogSettings,
  library: GuideLibrary,
  now = new Date()
): string {
  const enabled = snapshot.plugins.filter((plugin) => plugin.enabled);
  const disabled = snapshot.plugins.filter((plugin) => !plugin.enabled);
  const withGuide = snapshot.plugins.filter((plugin) => plugin.guidePath);
  const missing = snapshot.plugins.filter((plugin) => !plugin.guidePath);

  const lines: string[] = [];
  lines.push("---");
  lines.push("title: Obsidian 插件目录（总览）");
  lines.push("type: 索引");
  lines.push("generator: plugin-catalog-guide");
  lines.push(`generated_at: ${formatDateTime(now)}`);
  lines.push("tags:");
  lines.push("  - Obsidian");
  lines.push("  - 插件");
  lines.push("  - 索引");
  lines.push("---");
  lines.push("");
  lines.push("# Obsidian 插件目录（总览）");
  lines.push("");
  lines.push("> [!info] 自动生成");
  lines.push("> 本页由「插件目录与指南」插件自动生成，插件目录或启用状态变化时自动重写。");
  lines.push("> 数据来源：`.obsidian/plugins/*/manifest.json`、`community-plugins.json`、Obsidian 实时命令表。");
  lines.push("> 手动修改会被下次生成覆盖，需要保留请复制到其他笔记。");
  lines.push("");
  lines.push(
    `**概况**：共 **${snapshot.plugins.length}** 个社区插件（已启用 ${enabled.length}、未启用 ${disabled.length}）；` +
      `已生成指南 **${withGuide.length}** 份，缺失 **${missing.length}** 份。`
  );
  lines.push("");

  let section = 2;

  lines.push(`## 一、总表`);
  lines.push("");
  lines.push("| # | 插件 | 版本 | 状态 | 简介 | 指南 |");
  lines.push("|---|------|------|------|------|------|");
  snapshot.plugins.forEach((plugin, index) => {
    lines.push(
      `| ${index + 1} | ${escapeTableCell(plugin.name)} | ${escapeTableCell(plugin.version)} | ${
        plugin.enabled ? "已启用" : "未启用"
      } | ${escapeTableCell(short(plugin.description))} | ${guideLink(plugin)} |`
    );
  });
  lines.push("");

  lines.push("## 二、按用途分类");
  lines.push("");
  const grouped = new Map<string, PluginInfo[]>();
  for (const plugin of snapshot.plugins) {
    const key = classify(plugin).key;
    const bucket = grouped.get(key) ?? [];
    bucket.push(plugin);
    grouped.set(key, bucket);
  }
  const keys = Array.from(grouped.keys()).sort(
    (a, b) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b)
  );
  for (const key of keys) {
    lines.push(`### ${categoryLabel(key)}`);
    lines.push("");
    for (const plugin of grouped.get(key) ?? []) {
      const bits = [`**${plugin.name}**`];
      if (!plugin.enabled) bits.push("（未启用）");
      if (plugin.description) bits.push(`— ${short(plugin.description, 70)}`);
      if (plugin.guidePath) {
        bits.push(`｜[[${plugin.guidePath.replace(/\.md$/i, "")}|指南]]`);
      }
      lines.push(`- ${bits.join(" ")}`);
    }
    lines.push("");
  }

  if (settings.includeCorePlugins && snapshot.corePlugins.length > 0) {
    section += 1;
    const on = snapshot.corePlugins.filter((item) => item.enabled);
    const off = snapshot.corePlugins.filter((item) => !item.enabled);
    lines.push(`## ${sectionLabel(section)}核心插件状态`);
    lines.push("");
    lines.push(`- **已启用**（${on.length}）：${on.map((item) => item.name).join("、") || "无"}`);
    lines.push(`- **已关闭**（${off.length}）：${off.map((item) => item.name).join("、") || "无"}`);
    lines.push("");
  }

  if (settings.includeThemes && snapshot.themes.length > 0) {
    section += 1;
    lines.push(`## ${sectionLabel(section)}主题`);
    lines.push("");
    for (const theme of snapshot.themes) {
      lines.push(`- ${theme.name}${theme.active ? "（当前使用）" : ""}`);
    }
    lines.push("");
  }

  section += 1;
  lines.push(`## ${sectionLabel(section)}指南与维护`);
  lines.push("");
  lines.push(`- 指南目录：\`${library.folderPath()}\``);
  lines.push("- 首次生成时若本页是你手写的，原文件会备份到 `.obsidian/plugin-catalog/backups/`");
  lines.push("- 缺失指南时：命令面板运行「插件目录与指南：生成所有缺失指南」");
  lines.push("- 单插件重生成：打开「插件目录」侧边栏面板，点对应插件的「生成 / 重生成」按钮");
  lines.push("- 新装插件：目录变化后 2～3 秒内自动更新本页；开启「自动生成指南」时同时生成指南");
  if (missing.length > 0) {
    lines.push("");
    lines.push(`**当前缺失指南的插件**：${missing.map((plugin) => `\`${plugin.name}\``).join("、")}`);
  }
  lines.push("");
  return lines.join("\n");
}

function sectionLabel(index: number): string {
  const cn = ["一", "二", "三", "四", "五", "六", "七", "八", "九"];
  return `${cn[index - 1] ?? index}、`;
}
