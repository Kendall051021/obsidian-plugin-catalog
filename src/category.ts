import type { PluginInfo } from "./types";

export interface Category {
  key: string;
  label: string;
}

const RULES: { key: string; label: string; pattern: RegExp }[] = [
  { key: "query", label: "数据与查询", pattern: /(dataview|datacore|query|database|sql|bases|metadata|frontmatter)/i },
  { key: "task", label: "任务与时间", pattern: /(task|kanban|todo|calendar|planner|tracker|timer|pomodoro|journal|daily|habit)/i },
  { key: "sync", label: "同步与备份", pattern: /(sync|backup|git|cloud|dropbox|version|history|restore|webdav)/i },
  { key: "ai", label: "AI 与智能", pattern: /(claude|codex|\bai\b|gpt|llm|smart|copilot|chat|openai|agent|embedding)/i },
  { key: "edit", label: "写作与编辑", pattern: /(editor|toolbar|format|writing|markdown|table|outline|word|template|quickadd|capture)/i },
  { key: "style", label: "外观与样式", pattern: /(theme|style|css|color|icon|font|appearance)/i },
  { key: "media", label: "媒体与附件", pattern: /(image|media|pdf|video|audio|photo|attachment|excalidraw)/i },
  { key: "file", label: "文件与导航", pattern: /(file|explorer|search|navigation|folder|workspace|tab|bookmark)/i },
];

export const CATEGORY_ORDER = ["task", "query", "edit", "ai", "style", "sync", "media", "file", "other"];

export function categoryLabel(key: string): string {
  const rule = RULES.find((item) => item.key === key);
  if (rule) return rule.label;
  if (key === "other") return "其他";
  return key;
}

export function classify(info: PluginInfo): Category {
  const text = `${info.name} ${info.id} ${info.description}`;
  for (const rule of RULES) {
    if (rule.pattern.test(text)) return { key: rule.key, label: rule.label };
  }
  return { key: "other", label: "其他" };
}

/** 按分类给出的通用上手建议（不猜测具体功能） */
export function categoryHints(category: Category): string[] {
  switch (category.key) {
    case "task":
      return [
        "先建一个专用文件夹（如 `任务/`）或一个看板文件，再让插件接管",
        "每天固定一个时间清理逾期项，避免任务越积越多",
      ];
    case "query":
      return [
        "先给笔记补 frontmatter（属性），查询才有数据可查",
        "索引页查询尽量带 `FROM` 限定范围，避免全库扫描拖慢速度",
      ];
    case "ai":
      return [
        "首次使用先完成 API Key / 本地模型配置，再拿一个小文件试跑",
        "涉及改写笔记的操作先在副本上试，确认风格后再批量执行",
      ];
    case "edit":
      return ["把常用操作绑定到命令面板或快捷键", "批量处理前先备份，或先在测试文件夹里跑一遍"];
    case "style":
      return [
        "一次只改一项再观察效果，避免改太多找不回原因",
        "主题相关设置换主题后可能失效，需要重新检查",
      ];
    case "sync":
      return [
        "首次同步前先备份 `.obsidian` 目录",
        "出现同步冲突副本时先比对内容再删除，不要直接覆盖",
      ];
    case "media":
      return [
        "统一附件存放文件夹，避免根目录堆满图片和 PDF",
        "大附件考虑压缩或外链，减少同步体积",
      ];
    case "file":
      return ["先在一个测试文件夹里试用重命名/移动功能", "批量操作前确认没有正在同步的文件"];
    default:
      return [
        "先按官方说明完成基础配置，再逐步启用高级功能",
        "改动前备份 `.obsidian` 目录，出问题可整体回退",
      ];
  }
}
