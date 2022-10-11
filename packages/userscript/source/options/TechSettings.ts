import { difference } from "../tools/Array";
import { objectEntries } from "../tools/Entries";
import { cwarn } from "../tools/Log";
import { GamePage, Technology } from "../types";
import { Setting } from "./Settings";
import { KittenStorageType } from "./SettingsStorage";

export class TechSetting extends Setting {
  readonly tech: Technology;

  constructor(tech: Technology, enabled = false) {
    super("", enabled);
    this.tech = tech;
  }
}

export class TechSettings extends Setting {
  items: {
    [item in Technology]: Setting;
  };

  constructor(
    id = "techs",
    enabled = false,
    items = {
      acoustics: new TechSetting("acoustics", true),
      advExogeology: new TechSetting("advExogeology", true),
      agriculture: new TechSetting("agriculture", true),
      ai: new TechSetting("ai", true),
      animal: new TechSetting("animal", true),
      antimatter: new TechSetting("antimatter", true),
      archeology: new TechSetting("archeology", true),
      archery: new TechSetting("archery", true),
      architecture: new TechSetting("architecture", true),
      artificialGravity: new TechSetting("artificialGravity", true),
      astronomy: new TechSetting("astronomy", true),
      biochemistry: new TechSetting("biochemistry", true),
      biology: new TechSetting("biology", true),
      blackchain: new TechSetting("blackchain", true),
      brewery: new TechSetting("brewery", true),
      calendar: new TechSetting("calendar", true),
      chemistry: new TechSetting("chemistry", true),
      chronophysics: new TechSetting("chronophysics", true),
      civil: new TechSetting("civil", true),
      combustion: new TechSetting("combustion", true),
      construction: new TechSetting("construction", true),
      cryptotheology: new TechSetting("cryptotheology", true),
      currency: new TechSetting("currency", true),
      dimensionalPhysics: new TechSetting("dimensionalPhysics", true),
      drama: new TechSetting("drama", true),
      ecology: new TechSetting("ecology", true),
      electricity: new TechSetting("electricity", true),
      electronics: new TechSetting("electronics", true),
      engineering: new TechSetting("engineering", true),
      exogeology: new TechSetting("exogeology", true),
      exogeophysics: new TechSetting("exogeophysics", true),
      genetics: new TechSetting("genetics", true),
      hydroponics: new TechSetting("hydroponics", true),
      industrialization: new TechSetting("industrialization", true),
      machinery: new TechSetting("machinery", true),
      math: new TechSetting("math", true),
      mechanization: new TechSetting("mechanization", true),
      metal: new TechSetting("metal", true),
      metalurgy: new TechSetting("metalurgy", true),
      metaphysics: new TechSetting("metaphysics", true),
      mining: new TechSetting("mining", true),
      nanotechnology: new TechSetting("nanotechnology", true),
      navigation: new TechSetting("navigation", true),
      nuclearFission: new TechSetting("nuclearFission", true),
      oilProcessing: new TechSetting("oilProcessing", true),
      orbitalEngineering: new TechSetting("orbitalEngineering", true),
      paradoxalKnowledge: new TechSetting("paradoxalKnowledge", true),
      particlePhysics: new TechSetting("particlePhysics", true),
      philosophy: new TechSetting("philosophy", true),
      physics: new TechSetting("physics", true),
      quantumCryptography: new TechSetting("quantumCryptography", true),
      robotics: new TechSetting("robotics", true),
      rocketry: new TechSetting("rocketry", true),
      sattelites: new TechSetting("sattelites", true),
      steel: new TechSetting("steel", true),
      superconductors: new TechSetting("superconductors", true),
      tachyonTheory: new TechSetting("tachyonTheory", true),
      terraformation: new TechSetting("terraformation", true),
      theology: new TechSetting("theology", true),
      thorium: new TechSetting("thorium", true),
      voidSpace: new TechSetting("voidSpace", true),
      writing: new TechSetting("writing", true),
    }
  ) {
    super(id, enabled);
    this.items = items;
  }

  static validateGame(game: GamePage, settings: TechSettings) {
    const inSettings = Object.keys(settings.items);
    const inGame = game.science.techs.map(tech => tech.name);

    const missingInSettings = difference(inGame, inSettings);
    const redundantInSettings = difference(inSettings, inGame);

    for (const tech of missingInSettings) {
      cwarn(`The technology '${tech}' is not tracked in Kitten Scientists!`);
    }
    for (const tech of redundantInSettings) {
      cwarn(`The technology '${tech}' is not a technology in Kitten Game!`);
    }
  }

  load(settings: TechSettings) {
    this.enabled = settings.enabled;

    for (const [name, item] of objectEntries(settings.items)) {
      this.items[name].enabled = item.enabled;
    }
  }

  static toLegacyOptions(settings: TechSettings, subject: KittenStorageType) {
    subject.items["toggle-techs"] = settings.enabled;

    for (const [name, item] of objectEntries(settings.items)) {
      subject.items[`toggle-tech-${name}` as const] = item.enabled;
    }
  }

  static fromLegacyOptions(subject: KittenStorageType) {
    const options = new TechSettings();
    options.enabled = subject.items["toggle-policies"] ?? options.enabled;

    for (const [name, item] of objectEntries(options.items)) {
      item.enabled = subject.items[`toggle-tech-${name}` as const] ?? item.enabled;
    }

    return options;
  }
}
