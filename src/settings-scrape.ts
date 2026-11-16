import type { App } from "obsidian";
import type { SettingItem, SettingKind } from "./types";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function waitFor<T>(probe: () => T | null | undefined, timeoutMs: number, intervalMs = 100): Promise<T | null> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const value = probe();
      if (value) return value;
    } catch {
      /* ignore */
    }
    await sleep(intervalMs);
  }
  return null;
}

function currentOfControl(el: HTMLElement): { kind: SettingKind; current: string } {
  const toggle = el.querySelector<HTMLElement>(".checkbox-container");
  if (toggle) {
    return { kind: "toggle", current: toggle.classList.contains("is-enabled") ? "已开启 ✅" : "已关闭 ⬜" };
  }
  const select = el.querySelector<HTMLSelectElement>("select");
  if (select) {
    const option = select.selectedOptions?.[0];
    return { kind: "dropdown", current: option?.textContent?.trim() || select.value || "未选择" };
  }
  const slider = el.querySelector<HTMLInputElement>("input[type=range]");
  if (slider) {
    return { kind: "slider", current: slider.value };
  }
  const text = el.querySelector<HTMLInputElement | HTMLTextAreaElement>(
    "input[type=text], input[type=number], input[type=password], textarea"
  );
  if (text) {
    const value = text.value ?? "";
    return { kind: "text", current: value.length > 40 ? `${value.slice(0, 20)}…（${value.length} 字符）` : value || "空" };
  }
  if (el.querySelector("button")) {
    return { kind: "button", current: "" };
  }
  return { kind: "unknown", current: "" };
}

export function parseSettingsDom(root: Element): SettingItem[] {
  const items: SettingItem[] = [];
  let group = "";
  root.querySelectorAll<HTMLElement>(".setting-item").forEach((el) => {
    const name = el.querySelector(".setting-item-name")?.textContent?.trim() ?? "";
    if (el.classList.contains("setting-item-heading")) {
      if (name) group = name;
      return;
    }
    if (!name) return;
    const desc = el.querySelector(".setting-item-description")?.textContent?.trim() ?? "";
    const { kind, current } = currentOfControl(el);
    items.push({
      label: name,
      desc: desc || undefined,
      kind,
      current: current || undefined,
      group: group || undefined,
      source: "scrape",
    });
  });
  return items;
}

/**
 * 打开某个插件的设置页并抓取真实控件文本与当前状态。
 * 使用 Obsidian 内部 API：设置窗口会在抓取期间短暂出现，结束后关闭。
 */
export async function scrapeSettingsTab(app: App, pluginId: string): Promise<SettingItem[]> {
  if (typeof document === "undefined") return [];
  const setting = (app as any).setting;
  if (!setting || typeof setting.openTabById !== "function") return [];
  let opened = false;
  try {
    setting.open?.();
    setting.openTabById(pluginId);
    opened = true;
    const container = await waitFor(
      () => document.querySelector<HTMLElement>(".vertical-tab-content"),
      2000
    );
    if (!container) return [];
    await waitFor(() => (container.querySelector(".setting-item") ? true : null), 3000);
    await sleep(200);
    return parseSettingsDom(container);
  } catch (error) {
    console.warn("[plugin-catalog-guide] 抓取设置页失败", error);
    return [];
  } finally {
    if (opened) {
      try {
        setting.close?.();
      } catch {
        /* ignore */
      }
    }
  }
}
