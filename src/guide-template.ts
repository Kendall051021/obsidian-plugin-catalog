import type { GuideFacts } from "./guide-generator";
import type { Category } from "./category";
import type { SettingItem } from "./types";

const KIND_ACTION: Record<SettingItem["kind"], string> = {
  toggle: "切换开关",
  dropdown: "从下拉框选择一项",
  slider: "拖动滑块调整",
  text: "填写输入框",
  button: "点击按钮",
  unknown: "按需调整",
};

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

function goalFor(category: Category, name: string): { title: string; body: string[] } {
  switch (category.key) {
    case "task":
      return {
        title: `把待办收进 ${name}，每天看得见、清得掉`,
        body: [
          `目标：不再到处翻待办，所有任务在一个地方收集、在一处推进。`,
          `1. 建一个收集箱（或一个看板文件），先只放 3 条真实待办。`,
          `2. 用 ${name} 的命令创建/移动卡片，跑通一次完整流程。`,
          `3. 每天固定 5 分钟清理：完成的归档，过期的重排。`,
        ],
      };
    case "query":
      return {
        title: `给「学科资料」建一个自动索引页`,
        body: [
          `目标：打开一个页面就能看到所有笔记的课程、进度、最近修改，不用手动维护目录。`,
          `1. 先给 5 篇笔记补上 frontmatter（课程、类型、进度）。`,
          `2. 在索引页里写一个最小查询（LIST 或 TABLE），只筛选一个文件夹。`,
          `3. 再逐步加 WHERE / SORT / GROUP BY，确认结果无误后再扩大范围。`,
        ],
      };
    case "ai":
      return {
        title: `让 ${name} 帮你整理一篇长笔记`,
        body: [
          `目标：把一份散乱的记录整理成结构化摘要，而不是从零重写。`,
          `1. 先复制一份笔记做副本，所有 AI 操作先在副本上试。`,
          `2. 用只读提问确认它理解正确，再让它输出带小标题的结构。`,
          `3. 满意后再应用到正式笔记，保留原始版本方便对比。`,
        ],
      };
    case "edit":
      return {
        title: `写长文时少用鼠标，排版一次到位`,
        body: [
          `目标：标题层级、列表、表格、强调一次性排好，不用来回点菜单。`,
          `1. 在一篇测试笔记里试用它的工具栏/命令。`,
          `2. 把最常用的 2–3 个操作绑定到快捷键。`,
          `3. 批量处理前先备份，或先在单独文件夹试运行。`,
        ],
      };
    case "style":
      return {
        title: `把主题的配色和字体层级调到顺眼`,
        body: [
          `目标：标题、链接、强调在浅色/深色下都清晰，并且配色固定下来不来回变。`,
          `1. 先确认相关 CSS 片段已启用（设置 → 外观 → CSS 片段）。`,
          `2. 打开样式插件的设置页，一次只改一项，改完立刻看效果。`,
          `3. 确定后在设置里固定浅色/深色两套取值，避免换主题后失效。`,
        ],
      };
    case "sync":
      return {
        title: `多设备保持一致，冲突可控`,
        body: [
          `目标：换设备能接着写，出现冲突时知道怎么处理。`,
          `1. 首次同步前备份整个 .obsidian 目录。`,
          `2. 先同步一个小文件夹，确认双向都正常。`,
          `3. 看到冲突副本先比对内容，再决定保留哪一份。`,
        ],
      };
    case "media":
      return {
        title: `附件集中管理，笔记不被图片淹没`,
        body: [
          `目标：图片、PDF 统一放在固定文件夹，笔记正文保持干净。`,
          `1. 先定一个附件文件夹，并在插件设置里指向它。`,
          `2. 试插入一张图片，确认它落在正确位置。`,
          `3. 大附件考虑压缩或外链，减少同步体积。`,
        ],
      };
    case "file":
      return {
        title: `更快找到和移动笔记`,
        body: [
          `目标：常用文件触手可及，重命名/移动不破坏链接。`,
          `1. 先在一个测试文件夹里试用重命名与移动。`,
          `2. 确认链接自动更新后再用于正式笔记。`,
          `3. 批量操作前确认没有正在同步的文件。`,
        ],
      };
    default:
      return {
        title: `先跑通 ${name} 的最小可用流程`,
        body: [
          `目标：不追求一次配全，先让它替你完成一件小事。`,
          `1. 打开设置页，只改一个最关键的选项。`,
          `2. 用一条真实笔记/一个真实任务试运行。`,
          `3. 确认结果符合预期后，再逐步启用高级功能。`,
        ],
      };
  }
}

function renderSettingStep(step: number, item: SettingItem, pluginName: string): string[] {
  const lines: string[] = [];
  const current = item.current ? `（当前：${item.current}）` : "";
  lines.push(
    `**第 ${step} 步 · ${item.label}**：设置 → 第三方插件 → ${pluginName} → 选项 → ${item.label} → ${
      KIND_ACTION[item.kind] ?? KIND_ACTION.unknown
    }${current}`
  );
  if (item.desc) lines.push(`- 说明：${item.desc}`);
  if (item.options && item.options.length > 0) {
    lines.push(`- 可选值：${item.options.join(" / ")}`);
  }
  if (!item.desc && !item.current) {
    lines.push("- 说明：按插件设置页里的实际文案为准。");
  }
  return lines;
}

export function buildTemplateGuideBody(facts: GuideFacts): string {
  const { info, repo, readme, settings, settingItems, settingsScraped, related, category, vaultName } = facts;
  const lines: string[] = [];

  const support = info.isDesktopOnly ? "仅桌面端" : "桌面端与移动端均可";
  const state = info.enabled ? "已启用" : "已安装但未启用";
  const items = settingItems ?? [];
  const sourceLabel = settingsScraped
    ? `抓取真实设置页（${items.length} 项，含当前状态）`
    : items.length > 0
      ? `从插件代码提取（${items.length} 项，当前值按 data.json 匹配）`
      : "未读取到设置项";

  lines.push(`# ${info.name} 使用指南`);
  lines.push("");
  lines.push(
    `**版本** ${info.version} ｜ **作者** ${info.author || "未注明"} ｜ **插件 id** \`${info.id}\` ｜ **${support}**`
  );
  lines.push(`**当前状态** ${state} ｜ **所属分类** ${category.label} ｜ **所在库** ${vaultName}`);
  lines.push(`**设置来源** ${sourceLabel}`);
  lines.push("");
  lines.push("> [!info] 一句话定位");
  lines.push(`> ${info.description || "（插件清单未提供描述，请以官方 README 为准）"}`);
  lines.push("");

  let step = 0;

  const goal = goalFor(category, info.name);
  lines.push(`## 一、目标案例：${goal.title}`);
  lines.push("");
  for (const line of goal.body) lines.push(line);
  lines.push("");

  lines.push("## 二、分步设置");
  lines.push("");
  step += 1;
  lines.push(`**第 ${step} 步 · 确认插件已启用**：设置 → 第三方插件 → ${info.name} → 开关`);
  lines.push(`- 当前：${info.enabled ? "已启用 ✅" : "未启用 ⬜（先打开开关）"}`);
  lines.push("");

  step += 1;
  lines.push(`**第 ${step} 步 · 打开插件设置页**：设置 → 第三方插件 → ${info.name} → 齿轮「选项」`);
  lines.push("- 如果这里找不到入口，用命令面板（Ctrl/Cmd + P）搜索插件名或它的命令。");
  lines.push("");

  if (items.length > 0) {
    lines.push("以下设置项名称来自插件代码或真实设置页；如果你的版本文案不同，以实际界面为准。");
    lines.push("");
    if (!settingsScraped) {
      lines.push("> [!warning] 名称来自插件代码提取");
      lines.push("> 可能混入弹窗/表单字段；在面板里点「重生成」可抓取真实设置页，名称与当前值会更准。");
      lines.push("");
    }
    let group: string | undefined;
    for (const item of items) {
      if (item.group && item.group !== group) {
        group = item.group;
        lines.push(`### ${group}`);
        lines.push("");
      }
      step += 1;
      for (const line of renderSettingStep(step, item, info.name)) lines.push(line);
      lines.push("");
    }
  } else {
    lines.push("没有从插件代码中提取到设置项（可能插件没有设置界面，或用了非常规写法）。");
    lines.push("请直接打开设置页逐项检查；本指南的其余部分仍然适用。");
    lines.push("");
  }

  if (settings.length > 0) {
    lines.push("### 已保存的配置值（data.json）");
    lines.push("");
    lines.push("| 设置键 | 当前值 |");
    lines.push("|--------|--------|");
    for (const fact of settings) {
      lines.push(`| \`${fact.key}\` | ${fact.value.replace(/\|/g, "\\|")} |`);
    }
    lines.push("");
    lines.push("> 含 key / token / secret / password 的字段已脱敏，不会写入明文。");
    lines.push("");
  }

  lines.push("## 三、命令速查");
  lines.push("");
  if (info.commands.length > 0) {
    lines.push("命令名来自 Obsidian 实时命令表，可复制到命令面板搜索：");
    lines.push("");
    lines.push("| 命令 | 说明 |");
    lines.push("|------|------|");
    for (const command of info.commands) {
      lines.push(`| \`${command.replace(/\|/g, "\\|")}\` | 在命令面板搜索该名称执行 |`);
    }
    lines.push("");
    lines.push("> 快捷键需要在「设置 → 快捷键」里自行绑定，本文不猜测默认快捷键。");
  } else {
    lines.push("当前没有检测到该插件注册的命令，入口通常是设置页、侧边栏图标或笔记内的代码块。");
  }
  lines.push("");

  lines.push("## 四、常见问题与坑");
  lines.push("");
  lines.push("- **启用后没反应**：先重启 Obsidian，再确认版本满足下面的最低要求。");
  lines.push("- **设置改了不生效**：多数插件即时生效，少数需要重开设置页或重载窗口。");
  lines.push("- **配置存在哪**：`.obsidian/plugins/" + info.id + "/data.json`；迁移设备前整体备份 `.obsidian`。");
  if (info.minAppVersion) {
    lines.push(`- **版本要求**：需要 Obsidian ${info.minAppVersion} 及以上。`);
  }
  if (info.isDesktopOnly) {
    lines.push("- **平台限制**：该插件仅桌面端可用，手机/平板无法使用。");
  }
  lines.push("- 本指南由程序根据插件代码/设置页自动整理；功能细节以插件设置页与官方说明为准。");
  lines.push("");

  lines.push("## 五、与本库其他插件的配合");
  lines.push("");
  if (related.length > 0) {
    lines.push(`当前库里同时启用的插件有：${related.join("、")}。`);
  }
  lines.push("建议让它只负责最擅长的一件事，把结果交给 Dataview/看板/日记等展示，避免两个插件抢同一类文件。");
  lines.push("");

  if (readme) {
    lines.push("## 六、官方说明摘录（README）");
    lines.push("");
    lines.push("> [!note]- 点击展开原文摘录");
    for (const line of cleanReadme(readme, 2500)) {
      lines.push(line ? `> ${line}` : ">");
    }
    lines.push("");
  }

  lines.push(`## ${readme ? "七" : "六"}、官方资源`);
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

  const infoIndex = readme ? "八" : "七";
  lines.push(`## ${infoIndex}、指南信息`);
  lines.push("");
  lines.push(`- 设置来源：${sourceLabel}`);
  lines.push(`- 内容来源：manifest、实时命令表、data.json、插件代码/设置页${readme ? "、README" : ""}`);
  lines.push("- 修改本文件后再次生成，会按设置里的「跳过 / 备份后覆盖 / 覆盖」策略处理");
  if (!settingsScraped) {
    lines.push("- 想要「设置页每一按钮 + 当前状态」：在插件设置里开启「手动生成时抓取设置页」，再点「重生成」");
  } else {
    lines.push("- 本指南的设置项与当前状态来自真实设置页抓取；插件升级后建议重新生成一次");
  }
  lines.push("");

  return lines.join("\n");
}
