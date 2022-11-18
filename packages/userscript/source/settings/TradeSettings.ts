import { consumeEntriesPedantic, objectEntries } from "../tools/Entries";
import { Race, Season } from "../types";
import { EmbassySettings } from "./EmbassySettings";
import { Requirement, Setting, SettingLimited, SettingTrigger } from "./Settings";
import { LegacyStorage } from "./SettingsStorage";

export class TradeSettingsItem extends SettingLimited {
  readonly race: Race;
  readonly seasons: Record<Season, Setting>;

  /**
   * A resource that is required to trade with the race.
   */
  require: Requirement;

  constructor(
    race: Race,
    enabled: boolean,
    limited: boolean,
    summer: boolean,
    autumn: boolean,
    winter: boolean,
    spring: boolean,
    require: Requirement = false
  ) {
    super(enabled, limited);
    this.race = race;
    this.seasons = {
      summer: new Setting(summer),
      autumn: new Setting(autumn),
      winter: new Setting(winter),
      spring: new Setting(spring),
    };
    this.require = require;
  }
}

export type TradeSettingsItems = {
  [item in Race]: TradeSettingsItem;
};

export class TradeSettings extends SettingTrigger {
  races: TradeSettingsItems;

  feedLeviathans: Setting;
  buildEmbassies: EmbassySettings;
  tradeBlackcoin: SettingTrigger;
  unlockRaces: Setting;

  constructor(
    enabled = false,
    trigger = 1,
    races = {
      dragons: new TradeSettingsItem("dragons", true, true, true, true, true, true, "titanium"),
      griffins: new TradeSettingsItem("griffins", true, true, false, true, false, false, "wood"),
      leviathans: new TradeSettingsItem(
        "leviathans",
        true,
        true,
        true,
        true,
        true,
        true,
        "unobtainium"
      ),
      lizards: new TradeSettingsItem("lizards", true, true, true, false, false, false, "minerals"),
      nagas: new TradeSettingsItem("nagas", true, true, true, false, false, true),
      sharks: new TradeSettingsItem("sharks", true, true, false, false, true, false, "iron"),
      spiders: new TradeSettingsItem("spiders", true, true, true, true, false, true),
      zebras: new TradeSettingsItem("zebras", true, true, true, true, true, true),
    },
    buildEmbassies = new EmbassySettings(),
    feedLeviathans = new Setting(false),
    tradeBlackcoin = new SettingTrigger(true, 10000),
    unlockRaces = new Setting(true)
  ) {
    super(enabled, trigger);
    this.races = races;

    this.buildEmbassies = buildEmbassies;
    this.feedLeviathans = feedLeviathans;
    this.tradeBlackcoin = tradeBlackcoin;
    this.unlockRaces = unlockRaces;
  }

  load(settings: TradeSettings) {
    this.enabled = settings.enabled;
    this.trigger = settings.trigger;

    consumeEntriesPedantic(this.races, settings.races, (race, item) => {
      race.enabled = item?.enabled ?? race.enabled;
      race.limited = item?.limited ?? race.limited;
      race.seasons.autumn = item?.seasons.autumn ?? race.seasons.autumn;
      race.seasons.spring = item?.seasons.spring ?? race.seasons.spring;
      race.seasons.summer = item?.seasons.summer ?? race.seasons.summer;
      race.seasons.winter = item?.seasons.winter ?? race.seasons.winter;
    });

    this.buildEmbassies.load(settings.buildEmbassies);
    this.feedLeviathans.load(settings.feedLeviathans);
    this.tradeBlackcoin.load(settings.tradeBlackcoin);
    this.unlockRaces.load(settings.unlockRaces);
  }

  static toLegacyOptions(settings: TradeSettings, subject: LegacyStorage) {
    subject.toggles.trade = settings.enabled;
    subject.triggers.trade = settings.trigger;

    for (const [name, item] of objectEntries(settings.races)) {
      subject.items[`toggle-${name}` as const] = item.enabled;
      subject.items[`toggle-limited-${name}` as const] = item.limited;
      subject.items[`toggle-${name}-autumn` as const] = item.seasons.autumn.enabled;
      subject.items[`toggle-${name}-spring` as const] = item.seasons.spring.enabled;
      subject.items[`toggle-${name}-summer` as const] = item.seasons.summer.enabled;
      subject.items[`toggle-${name}-winter` as const] = item.seasons.winter.enabled;
    }

    EmbassySettings.toLegacyOptions(settings.buildEmbassies, subject);

    subject.items["toggle-autofeed"] = settings.feedLeviathans.enabled;
    subject.items["toggle-crypto"] = settings.tradeBlackcoin.enabled;
    subject.items["toggle-races"] = settings.unlockRaces.enabled;
  }

  static fromLegacyOptions(subject: LegacyStorage) {
    const options = new TradeSettings();
    options.enabled = subject.toggles.trade;
    options.trigger = subject.triggers.trade;

    for (const [name, item] of objectEntries(options.races)) {
      item.enabled = subject.items[`toggle-${name}` as const] ?? item.enabled;
      item.limited = subject.items[`toggle-limited-${name}` as const] ?? item.limited;
      item.seasons.autumn.enabled =
        subject.items[`toggle-${name}-autumn` as const] ?? item.seasons.autumn.enabled;
      item.seasons.spring.enabled =
        subject.items[`toggle-${name}-spring` as const] ?? item.seasons.spring.enabled;
      item.seasons.summer.enabled =
        subject.items[`toggle-${name}-summer` as const] ?? item.seasons.summer.enabled;
      item.seasons.winter.enabled =
        subject.items[`toggle-${name}-winter` as const] ?? item.seasons.winter.enabled;
    }

    options.buildEmbassies = EmbassySettings.fromLegacyOptions(subject);

    options.feedLeviathans.enabled =
      subject.items["toggle-autofeed"] ?? options.feedLeviathans.enabled;
    options.tradeBlackcoin.enabled =
      subject.items["toggle-crypto"] ?? options.tradeBlackcoin.enabled;
    options.unlockRaces.enabled = subject.items["toggle-races"] ?? options.unlockRaces.enabled;

    return options;
  }
}
