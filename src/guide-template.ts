import type { GuideFacts } from "./guide-generator";
import { categoryHints } from "./category";

function cleanReadme(text: string, max: number): string[] {
  const cleaned = text
    .replace(/\[!\[[^\]]*\]\([^)]*\)\]\([^)]*\)/g, "") // 徽章链接
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // 图片（相对路径在库里会裂图）
    .replace(/<[^>]+>/g, "") // HTML 标签
    .replace(/\[\]\([^)]*\)/g, "")
    .replace(/\r\n/g, "\n");
  const lines: string[] = [];
  let length = 0;
  for (const line of cleaned.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (lines.length > 0 && lines[lines.length - 1] !== "") lines.push("");
      continue;
    }
    if (length + trimmed.length > max) break;
    lines.push(line.replace(/\s+$/, ""));
    length += trimmed.length;
  }
  return lines;
}

export function buildTemplateGuideBody(facts: GuideFacts): string {
  const { info, repo, readme, settings, related, category, vaultName } = facts;
  const lines: string[] = [];

  const support = info.isDesktopOnly ? "仅桌面端" : "桌面端与移动端均可";
  const state = info.enabled ? "已启用" : "已安装但未启用";

  lines.push(`# ${info.name} 使用指南`);
  lines.push("");
  lines.push(
    `**版本** ${info.version} ｜ **作者** ${info.author || "未注明"} ｜ **插件 id** \`${info.id}\` ｜ **${support}**`
  );
  lines.push(`**当前状态** ${state} ｜ **所属分类** ${category.label} ｜ **所在库** ${vaultName}`);
  lines.push("");
  lines.push("> [!info] 一句话定位");
  lines.push(`> ${info.description || "（插件清单未提供描述，请以官方 README 为准）"}`);
  lines.push("");

  lines.push("## 1. 它解决什么问题");
  lines.push("");
  if (info.description) {
    lines.push(`${info.name} 的官方定位是：**${info.description}**`);
  } else {
    lines.push(`插件清单没有提供 ${info.name} 的描述，请参考下方官方 README 摘录。`);
  }
  lines.push("");
  lines.push("| 项目 | 值 |");
  lines.push("|------|-----|");
  lines.push(`| 插件 id | \`${info.id}\` |`);
  lines.push(`| 安装目录 | \`${info.folderPath}\` |`);
  lines.push(`| 最低 Obsidian 版本 | ${info.minAppVersion || "未声明"} |`);
  lines.push(`| 平台支持 | ${support} |`);
  lines.push(`| 官方仓库 | ${repo ? `https://github.com/${repo}` : info.authorUrl || "未提供"} |`);
  lines.push("");

  lines.push("## 2. 快速上手");
  lines.push("");
  lines.push(`1. 打开「设置 → 第三方插件」，确认 **${info.name}** 处于「${state}」状态。`);
  if (info.commands.length > 0) {
    lines.push(
      `2. 按 \`Ctrl/Cmd + P\` 打开命令面板，搜索「${info.name}」，可以看到 ${info.commands.length} 个可用命令（见下一节）。`
    );
  } else {
    lines.push("2. 该插件没有注册命令，入口通常在设置页、侧边栏图标，或笔记中的代码块/视图里。");
  }
  lines.push(
    info.enabled
      ? "3. 先打开插件设置完成基础配置，再按下面的用法示例试一个小任务。"
      : "3. 需要先启用插件，再打开其设置完成基础配置。"
  );
  lines.push("");

  lines.push("## 3. 命令与入口");
  lines.push("");
  if (info.commands.length > 0) {
    lines.push("以下命令名来自 Obsidian 实时命令表，可在命令面板直接搜索执行：");
    lines.push("");
    for (const command of info.commands) {
      lines.push(`- \`${command}\``);
    }
    lines.push("");
    lines.push("> 快捷键需要在「设置 → 快捷键」里自行绑定，本文不猜测默认快捷键。");
  } else {
    lines.push("当前没有检测到该插件注册的命令。说明它的入口不是命令面板，可能是：");
    lines.push("");
    lines.push("- 设置页里的开关与配置项");
    lines.push("- 侧边栏图标（Ribbon）或右侧面板视图");
    lines.push("- 笔记正文中的代码块、内联字段或特殊文件类型");
  }
  lines.push("");

  lines.push("## 4. 设置项");
  lines.push("");
  if (settings.length > 0) {
    lines.push("下表键名来自插件自己的 `data.json`（已保存的配置）：");
    lines.push("");
    lines.push("| 设置键 | 当前值 |");
    lines.push("|--------|--------|");
    for (const item of settings) {
      lines.push(`| \`${item.key}\` | ${item.value.replace(/\|/g, "\\|")} |`);
    }
    lines.push("");
    lines.push("> 含 key / token / secret / password 的字段已脱敏，不会写入明文。");
  } else {
    lines.push("该插件还没有保存过自定义配置（`data.json` 不存在或为空），所有设置项都是默认值。");
    lines.push("打开「设置 → 第三方插件 → 选项」即可看到插件的完整设置页。");
  }
  lines.push("");

  lines.push("## 5. 常用用法");
  lines.push("");
  for (const hint of categoryHints(category)) {
    lines.push(`- ${hint}`);
  }
  lines.push("");
  if (category.key === "task") {
    lines.push("尝试顺序：先建一个收集箱 → 再建一个本周清单 → 最后再考虑视图与统计。");
  } else if (category.key === "query") {
    lines.push("尝试顺序：先给 5 篇笔记补属性 → 写一个最简单的 `LIST` 查询 → 再逐步加 `WHERE` 和 `SORT`。");
  } else if (category.key === "ai") {
    lines.push("尝试顺序：先只读提问 → 再让它改一篇副本 → 最后才允许批量写入。");
  } else {
    lines.push("建议先用一个小文件夹或一篇测试笔记跑通完整流程，再应用到全库。");
  }
  lines.push("");

  lines.push("## 6. 注意事项");
  lines.push("");
  if (info.isDesktopOnly) {
    lines.push("- 该插件标记为**仅桌面端**，手机/平板无法使用。");
  }
  if (info.minAppVersion) {
    lines.push(`- 需要 Obsidian **${info.minAppVersion} 及以上**；升级 Obsidian 前先确认插件是否跟进。`);
  }
  lines.push("- 插件升级后如果行为异常，先重启 Obsidian，再检查设置是否被重置。");
  lines.push("- 本指南由程序根据插件元数据自动整理，具体功能以插件设置页与官方说明为准。");
  lines.push("");

  lines.push("## 7. 与本库其他插件的配合");
  lines.push("");
  if (related.length > 0) {
    lines.push(`当前库里同时启用的插件有：${related.join("、")}。`);
  }
  lines.push("常见的配合方式是：让这个插件负责它最擅长的一件事，把结果交给 Dataview/看板/日记等插件展示，避免两个插件抢同一类文件。");
  lines.push("");

  if (readme) {
    lines.push("## 8. 官方说明摘录（README）");
    lines.push("");
    lines.push("> [!note]- 点击展开原文摘录");
    for (const line of cleanReadme(readme, 2500)) {
      lines.push(line ? `> ${line}` : ">");
    }
    lines.push("");
  }

  lines.push(`## ${readme ? 9 : 8}. 官方资源`);
  lines.push("");
  if (repo) {
    lines.push(`- [官方仓库](https://github.com/${repo})`);
    lines.push(`- [问题反馈](https://github.com/${repo}/issues)`);
  }
  if (info.authorUrl) {
    lines.push(`- [作者主页](${info.authorUrl})`);
  }
  lines.push(`- [插件社区页面](https://obsidian.md/plugins?id=${encodeURIComponent(info.id)})`);
  lines.push("");

  const infoIndex = readme ? 10 : 9;
  lines.push(`## ${infoIndex}. 指南信息`);
  lines.push("");
  lines.push(`- 生成方式：模板自动生成（未启用 AI 时），资料来自 manifest、实时命令表、data.json 与 README`);
  lines.push(`- 修改本文件后再次生成，会按设置里的「跳过 / 备份后覆盖 / 覆盖」策略处理`);
  lines.push("- 想获得更详细的中文说明：在插件设置里填入 OpenAI 兼容的 API Key，重新生成即可");
  lines.push("");

  return lines.join("\n");
}
