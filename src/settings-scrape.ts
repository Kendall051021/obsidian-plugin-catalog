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
 * 用 openTabById 返回的 tab 自带容器，避免拿到别的标签页。
 * 抓取结束后关闭设置窗口（用户原本打开的其他设置页会被关掉）。
 */
export async function scrapeSettingsTab(app: App, pluginId: string): Promise<SettingItem[]> {
  if (typeof document === "undefined") return [];
  const setting = (app as any).setting;
  if (!setting) return [];
  let opened = false;
  try {
    setting.open?.();
    opened = true;
    let tab: any = null;
    if (typeof setting.openTabById === "function") {
      tab = setting.openTabById(pluginId) ?? null;
    }
    if (!tab && typeof setting.findTabById === "function") {
      tab = setting.findTabById(pluginId) ?? null;
    }
    let container: HTMLElement | null = tab?.containerEl ?? null;
    if (!container) {
      container = await waitFor(
        () => document.querySelector<HTMLElement>(".modal.mod-settings .vertical-tab-content"),
        2000
      );
    }
    if (!container) return [];
    const rendered = await waitFor(
      () => (container!.querySelector(".setting-item") ? true : null),
      5000
    );
    if (!rendered) return [];
    await sleep(150);
    const items = parseSettingsDom(container);
    if (items.length === 0) {
      console.warn("[plugin-catalog-guide] 设置页已打开，但没解析到 .setting-item");
    }
    return items;
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
