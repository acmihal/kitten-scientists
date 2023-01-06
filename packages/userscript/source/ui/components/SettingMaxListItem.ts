import { SettingMax } from "../../settings/Settings";
import { UserScript } from "../../UserScript";
import { MaxButton } from "./buttons-text/MaxButton";
import { SettingListItem } from "./SettingListItem";

export class SettingMaxListItem extends SettingListItem<SettingMax> {
  readonly maxButton: MaxButton;

  /**
   * Create a UI element for a setting that can have a maximum.
   * This will result in an element with a labeled checkbox and a "Max" indicator,
   * which controls the respective `max` property in the setting model.
   *
   * @param host The userscript instance.
   * @param label The label for the setting.
   * @param setting The setting model.
   * @param handler Handlers to call when the setting is checked or unchecked.
   * @param handler.onCheck Is called when the setting is checked.
   * @param handler.onUnCheck Is called when the setting is unchecked.
   * @param delimiter Should a delimiter be rendered after this element?
   * @param upgradeIndicator Should an indicator be rendered in front of the elemnt,
   * to indicate that this is an upgrade of a prior setting?
   */
  constructor(
    host: UserScript,
    label: string,
    setting: SettingMax,
    handler: {
      onCheck: () => void;
      onUnCheck: () => void;
    },
    delimiter = false,
    upgradeIndicator = false
  ) {
    super(host, label, setting, handler, delimiter, upgradeIndicator);

    this.maxButton = new MaxButton(host, label, setting);
    this.element.append(this.maxButton.element);
  }

  refreshUi() {
    super.refreshUi();

    this.maxButton.refreshUi();
  }
}
