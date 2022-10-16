import { SettingTrigger } from "../../settings/Settings";
import { UserScript } from "../../UserScript";
import { SettingsSectionUi } from "../SettingsSectionUi";
import { UiComponent } from "./UiComponent";

export class TriggerButton extends UiComponent {
  readonly setting: SettingTrigger;
  readonly element: JQuery<HTMLElement>;

  constructor(
    host: UserScript,
    label: string,
    setting: SettingTrigger,
    handler: { onClick?: () => void } = {}
  ) {
    super(host);

    const element = $("<div/>", {
      html: '<svg style="width: 15px; height: 15px;" viewBox="0 0 48 48"><path fill="currentColor" d="M19.95 42 22 27.9h-7.3q-.55 0-.8-.5t0-.95L26.15 6h2.05l-2.05 14.05h7.2q.55 0 .825.5.275.5.025.95L22 42Z" /></svg>',
    }).addClass("ks-icon-button");

    element.on("click", () => {
      const value = SettingsSectionUi.promptPercentage(
        host.engine.i18n("ui.trigger.set", [label]),
        SettingsSectionUi.renderPercentage(setting.trigger)
      );

      if (value !== null) {
        setting.trigger = value;
        host.updateSettings();
        this.refreshUi();
      }

      if (handler.onClick) {
        handler.onClick();
      }
    });

    this.element = element;
    this.setting = setting;
  }

  refreshUi() {
    this.element[0].title = this._host.engine.i18n("ui.trigger", [
      SettingsSectionUi.renderPercentage(this.setting.trigger),
    ]);
  }
}
