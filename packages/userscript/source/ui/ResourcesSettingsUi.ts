import { ResourcesSettings, ResourcesSettingsItem } from "../settings/ResourcesSettings";
import { ucfirst } from "../tools/Format";
import { UserScript } from "../UserScript";
import { ConsumeButton } from "./components/buttons-text/ConsumeButton";
import { StockButton } from "./components/buttons-text/StockButton";
import { LabelListItem } from "./components/LabelListItem";
import { SettingListItem } from "./components/SettingListItem";
import { SettingsList } from "./components/SettingsList";
import { SettingsPanel, SettingsPanelOptions } from "./components/SettingsPanel";

export class ResourcesSettingsUi extends SettingsPanel<ResourcesSettings> {
  private readonly _resources: Array<SettingListItem>;

  constructor(
    host: UserScript,
    settings: ResourcesSettings,
    options?: SettingsPanelOptions<SettingsPanel<ResourcesSettings>>
  ) {
    const label = host.engine.i18n("ui.resources");
    super(host, label, settings, {
      ...options,
      settingItem: new LabelListItem(host, label, {
        icon: "M38.4 42 25.85 29.45l2.85-2.85 12.55 12.55ZM9.35 42 6.5 39.15 21 24.65l-5.35-5.35-1.15 1.15-2.2-2.2v4.25l-1.2 1.2L5 17.6l1.2-1.2h4.3L8.1 14l6.55-6.55q.85-.85 1.85-1.15 1-.3 2.2-.3 1.2 0 2.2.425 1 .425 1.85 1.275l-5.35 5.35 2.4 2.4-1.2 1.2 5.2 5.2 6.1-6.1q-.4-.65-.625-1.5-.225-.85-.225-1.8 0-2.65 1.925-4.575Q32.9 5.95 35.55 5.95q.75 0 1.275.15.525.15.875.4l-4.25 4.25 3.75 3.75 4.25-4.25q.25.4.425.975t.175 1.325q0 2.65-1.925 4.575Q38.2 19.05 35.55 19.05q-.9 0-1.55-.125t-1.2-.375Z",
      }),
    });

    // Disable checkbox. Resource control is always active.
    //this.readOnly = true;

    // Add all the current resources
    this._resources = [];
    for (const setting of Object.values(this.setting.resources)) {
      this._resources.push(
        this._makeResourceSetting(
          ucfirst(this._host.engine.i18n(`$resources.${setting.resource}.title`)),
          setting
        )
      );
    }
    const listResource = new SettingsList(this._host);
    listResource.addChildren(this._resources);
    this.addChild(listResource);
  }

  /**
   * Creates a UI element that reflects stock and consume values for a given resource.
   * This is currently only used for the craft section.
   *
   * @param title The title to apply to the option.
   * @param setting The option that is being controlled.
   * @returns A new option with stock and consume values.
   */
  private _makeResourceSetting(title: string, setting: ResourcesSettingsItem) {
    // The overall container for this resource item.
    const container = new SettingListItem(this._host, title, setting, {
      onCheck: () => this._host.engine.imessage("status.resource.enable", [title]),
      onUnCheck: () => this._host.engine.imessage("status.resource.disable", [title]),
    });

    // How many items to stock.
    const stockElement = new StockButton(this._host, title, setting);
    stockElement.element.addClass("ks-stock-button");
    container.addChild(stockElement);

    // The consume rate for the resource.
    const consumeElement = new ConsumeButton(this._host, title, setting);
    container.addChild(consumeElement);

    return container;
  }
}
