import { Setting } from "../../options/Settings";
import { UserScript } from "../../UserScript";
import { UiComponent } from "./UiComponent";

export class SettingListItem extends UiComponent {
  readonly settings: Setting;
  readonly element: JQuery<HTMLElement>;
  readonly checkbox: JQuery<HTMLElement>;

  /**
   * Construct a new setting element.
   * This is a simple checkbox with a label.
   *
   * @param host The userscript instance.
   * @param label The label on the setting element.
   * @param setting The setting this element is linked to.
   * @param handler The event handlers for this setting element.
   * @param handler.onCheck Will be invoked when the user checks the checkbox.
   * @param handler.onUnCheck Will be invoked when the user unchecks the checkbox.
   * @param delimiter Should there be additional padding below this element?
   * @param upgradeIndicator Should an indicator be rendered in front of the elemnt,
   * to indicate that this is an upgrade of a prior setting?
   * @param additionalClasses A list of CSS classes to attach to the element.
   */
  constructor(
    host: UserScript,
    label: string,
    setting: Setting,
    handler: {
      onCheck: () => void;
      onUnCheck: () => void;
    },
    delimiter = false,
    upgradeIndicator = false,
    additionalClasses = []
  ) {
    super(host);

    const element = $(`<li/>`);
    for (const cssClass of ["ks-setting", delimiter ? "ks-delimiter" : "", ...additionalClasses]) {
      element.addClass(cssClass);
    }

    const elementLabel = $("<label/>", {
      text: `${upgradeIndicator ? `⮤ ` : ""}${label}`,
    }).addClass("ks-label");

    const checkbox = $("<input/>", {
      type: "checkbox",
    }).addClass("ks-checkbox");

    checkbox.on("change", () => {
      if (checkbox.is(":checked") && setting.enabled === false) {
        handler.onCheck();
        host.updateSettings(() => (setting.enabled = true));
      } else if (!checkbox.is(":checked") && setting.enabled === true) {
        handler.onUnCheck();
        host.updateSettings(() => (setting.enabled = false));
      }
    });

    elementLabel.prepend(checkbox);
    element.append(elementLabel);

    this.checkbox = checkbox;
    this.element = element;
    this.settings = setting;
  }

  refreshUi() {
    super.refreshUi();
    this.checkbox.prop("checked", this.settings.enabled);
  }
}
