import { objectEntries } from "../tools/Entries";
import { PolicySettings } from "./PolicySettings";
import { SettingsSection, SettingToggle } from "./SettingsSection";
import { KittenStorageType } from "./SettingsStorage";

export type UnlockItem = "policies" | "techs";
export type UnlockingSettingsItem = SettingToggle | PolicySettings;

export class UnlockingSettings extends SettingsSection {
  items: {
    [key in UnlockItem]: UnlockingSettingsItem;
  } = {
    techs: { enabled: true },
    policies: new PolicySettings(),
  };

  static fromLegacyOptions(subject: KittenStorageType) {
    const options = new UnlockingSettings();
    options.enabled = subject.toggles.upgrade;
    for (const [name, item] of objectEntries(options.items)) {
      item.enabled = subject.items[`toggle-${name}` as const] ?? item.enabled;
    }
    for (const [name, item] of objectEntries((options.items.policies as PolicySettings).items)) {
      item.enabled = subject.items[`toggle-${name}` as const] ?? item.enabled;
    }
    return options;
  }
}
