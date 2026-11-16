import { App, PluginSettingTab, Setting } from "obsidian";
import type PluginCatalogPlugin from "./main";

export class PluginCatalogSettingTab extends PluginSettingTab {
  private saveTimer: number | null = null;

  constructor(app: App, private plugin: PluginCatalogPlugin) {
    super(app, plugin);
  }

  private scheduleSave(): void {
    if (this.saveTimer !== null) window.clearTimeout(this.saveTimer);
    this.saveTimer = window.setTimeout(() => {
      this.saveTimer = null;
      void this.plugin.saveSettings();
    }, 700);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.addClass("pcg-settings");
    containerEl.createEl("h2", { text: "插件目录与指南" });
    containerEl.createEl("p", {
      cls: "pcg-settings-desc",
      text: "实时列出已安装插件；插件目录变化时自动重写总览，并为新插件生成中文使用指南。指南全部以 .md 写入下面指定的文件夹。",
    });

    const snapshot = this.plugin.getSnapshot();
    const withGuide = snapshot.plugins.filter((plugin) => plugin.guidePath).length;
    containerEl.createEl("p", {
      cls: "pcg-settings-stats",
      text: `当前：${snapshot.plugins.length} 个社区插件，已生成指南 ${withGuide} 份。`,
    });

    containerEl.createEl("h3", { text: "输出位置" });

    new Setting(containerEl)
      .setName("指南与总览的文件夹")
      .setDesc("相对库根目录，例如「插件指南」。不存在会自动创建。")
      .addText((text) =>
        text
          .setPlaceholder("插件指南")
          .setValue(this.plugin.settings.outputFolder)
          .onChange((value) => {
            this.plugin.settings.outputFolder = value.trim() || "插件指南";
            this.scheduleSave();
          })
      );

    new Setting(containerEl)
      .setName("已存在同名指南时")
      .setDesc("默认跳过，保护手写稿；选「备份后覆盖」会先把旧文件复制到 .obsidian/plugin-catalog/backups。")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("skip", "跳过，保留已有文件")
          .addOption("backup", "备份旧文件后覆盖")
          .addOption("overwrite", "直接覆盖（仍会备份手写稿）")
          .setValue(this.plugin.settings.overwritePolicy)
          .onChange(async (value) => {
            this.plugin.settings.overwritePolicy = value as typeof this.plugin.settings.overwritePolicy;
            await this.plugin.saveSettings();
          })
      );

    containerEl.createEl("h3", { text: "自动化" });

    new Setting(containerEl)
      .setName("检测到新插件时自动生成指南")
      .setDesc("插件目录里出现新条目后自动生成；关掉则只更新总览，指南由你手动触发。")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.autoGenerateOnInstall).onChange(async (value) => {
          this.plugin.settings.autoGenerateOnInstall = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("启动时补齐缺失指南")
      .setDesc("Obsidian 关闭期间安装的插件，会在下次启动后补生成。")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.autoGenerateOnStartup).onChange(async (value) => {
          this.plugin.settings.autoGenerateOnStartup = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("抓取 GitHub README 作为素材")
      .setDesc("需要能访问 raw.githubusercontent.com；失败会自动跳过，不影响生成。")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.fetchReadme).onChange(async (value) => {
          this.plugin.settings.fetchReadme = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("轮询间隔（毫秒）")
      .setDesc("桌面端另有 fs.watch 实时监听，这里只是兜底频率。默认 3000。")
      .addSlider((slider) =>
        slider
          .setLimits(1000, 15000, 500)
          .setValue(this.plugin.settings.pollIntervalMs)
          .setDynamicTooltip()
          .onChange((value) => {
            this.plugin.settings.pollIntervalMs = value;
            this.scheduleSave();
          })
      );

    new Setting(containerEl)
      .setName("完成后弹通知")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.notifyOnGenerate).onChange(async (value) => {
          this.plugin.settings.notifyOnGenerate = value;
          await this.plugin.saveSettings();
        })
      );

    containerEl.createEl("h3", { text: "总览内容" });

    new Setting(containerEl)
      .setName("附带核心插件状态")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.includeCorePlugins).onChange(async (value) => {
          this.plugin.settings.includeCorePlugins = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("附带主题列表")
      .setDesc("总览里增加「主题」一节，显示当前主题与已安装主题。")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.includeThemes).onChange(async (value) => {
          this.plugin.settings.includeThemes = value;
          await this.plugin.saveSettings();
        })
      );

    containerEl.createEl("h3", { text: "AI 增强（可选）" });
    containerEl.createEl("p", {
      cls: "pcg-settings-desc",
      text: "默认使用本地模板生成指南。填入 OpenAI 兼容接口的 API Key 后，会优先用 AI 写中文指南；调用失败自动回退模板，不会中断。",
    });

    new Setting(containerEl)
      .setName("启用 AI 生成")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.ai.enabled).onChange(async (value) => {
          this.plugin.settings.ai.enabled = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("接口地址（baseUrl）")
      .setDesc("DeepSeek 填 https://api.deepseek.com；OpenAI 兼容服务填到 /v1 为止。")
      .addText((text) =>
        text
          .setPlaceholder("https://api.deepseek.com")
          .setValue(this.plugin.settings.ai.baseUrl)
          .onChange((value) => {
            this.plugin.settings.ai.baseUrl = value.trim();
            this.scheduleSave();
          })
      );

    new Setting(containerEl)
      .setName("模型名")
      .setDesc("例如 deepseek-chat、gpt-4o-mini。")
      .addText((text) =>
        text
          .setPlaceholder("deepseek-chat")
          .setValue(this.plugin.settings.ai.model)
          .onChange((value) => {
            this.plugin.settings.ai.model = value.trim();
            this.scheduleSave();
          })
      );

    new Setting(containerEl)
      .setName("API Key")
      .setDesc("只保存在本插件的 data.json 里；界面与日志都不会打印明文。")
      .addText((text) => {
        text.inputEl.type = "password";
        text
          .setPlaceholder("sk-...")
          .setValue(this.plugin.settings.ai.apiKey)
          .onChange((value) => {
            this.plugin.settings.ai.apiKey = value.trim();
            this.scheduleSave();
          });
      });

    new Setting(containerEl)
      .setName("最大输出 token")
      .addSlider((slider) =>
        slider
          .setLimits(500, 6000, 100)
          .setValue(this.plugin.settings.ai.maxTokens)
          .setDynamicTooltip()
          .onChange((value) => {
            this.plugin.settings.ai.maxTokens = value;
            this.scheduleSave();
          })
      );

    new Setting(containerEl)
      .setName("请求超时（秒）")
      .addSlider((slider) =>
        slider
          .setLimits(10, 180, 5)
          .setValue(Math.round(this.plugin.settings.ai.timeoutMs / 1000))
          .setDynamicTooltip()
          .onChange((value) => {
            this.plugin.settings.ai.timeoutMs = value * 1000;
            this.scheduleSave();
          })
      );

    containerEl.createEl("h3", { text: "操作" });

    new Setting(containerEl)
      .setName("立即扫描并更新总览")
      .addButton((button) =>
        button.setButtonText("扫描").onClick(async () => {
          await this.plugin.refreshAll();
          this.display();
        })
      )
      .addButton((button) =>
        button.setButtonText("生成缺失指南").onClick(async () => {
          await this.plugin.generateMissingGuides();
          this.display();
        })
      )
      .addButton((button) =>
        button.setButtonText("重生成自动指南").onClick(async () => {
          await this.plugin.regenerateAutoGuides();
          this.display();
        })
      )
      .addButton((button) =>
        button.setButtonText("打开总览").onClick(() => this.plugin.openOverview())
      );
  }
}
