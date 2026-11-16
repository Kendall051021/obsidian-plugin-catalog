/** 文件名安全化：去掉 Windows/Obsidian 双端非法字符，压缩空白 */
export function sanitizeFileName(name: string): string {
  const cleaned = (name || "")
    .replace(/[\\/:*?"<>|#^\[\]{}]/g, " ")
    .replace(/[\u0000-\u001f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || "未命名插件";
}

export function safeFolderPath(input: string): string {
  const cleaned = (input || "")
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "")
    .replace(/\.\./g, "")
    .replace(/\/{2,}/g, "/");
  return cleaned || "插件指南";
}

export function formatDate(date = new Date()): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatDateTime(date = new Date()): string {
  const hh = `${date.getHours()}`.padStart(2, "0");
  const mm = `${date.getMinutes()}`.padStart(2, "0");
  const ss = `${date.getSeconds()}`.padStart(2, "0");
  return `${formatDate(date)} ${hh}:${mm}:${ss}`;
}

export function truncate(text: string, max: number): string {
  if (!text) return "";
  const normalized = text.replace(/\r\n/g, "\n").trim();
  return normalized.length <= max ? normalized : `${normalized.slice(0, max).trim()}\n\n…（已截断，完整内容见官方说明）`;
}

const SECRET_KEY_PATTERN = /(api[-_]?key|token|secret|password|passwd|credential|authorization|cookie)/i;

export function isSecretKey(key: string): boolean {
  return SECRET_KEY_PATTERN.test(key);
}

/** 用于设置项表格：敏感键只显示是否已配置 */
export function describeSettingValue(value: unknown): string {
  if (value === null || value === undefined) return "空";
  if (typeof value === "boolean") return value ? "开启" : "关闭";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") {
    if (!value) return "空字符串";
    if (value.length > 40) return `${value.slice(0, 20)}…（共 ${value.length} 字符）`;
    return `\`${value}\``;
  }
  if (Array.isArray(value)) return `数组（${value.length} 项）`;
  if (typeof value === "object") return `对象（${Object.keys(value as object).length} 个键）`;
  return typeof value;
}

/** 从作者主页推断 GitHub 仓库（仅当 URL 已包含 owner/repo 时） */
export function repoFromUrl(url: string): string | null {
  if (!url) return null;
  const m = url.match(/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)/);
  if (!m) return null;
  const repo = m[2].replace(/\.git$/, "");
  if (!repo || repo === "obsidian-releases") return null;
  return `${m[1]}/${repo}`;
}

export function escapeTableCell(text: string): string {
  return (text || "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

export function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
