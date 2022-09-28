import { BonfireSettingsItem } from "../options/BonfireSettings";
import { ReligionSettingsItem } from "../options/ReligionSettings";
import { ResourcesSettingsItem } from "../options/ResourcesSettings";
import { Setting, SettingLimited, SettingMax, SettingTrigger } from "../options/Settings";
import { SettingsSection } from "../options/SettingsSection";
import { TimeControlResourcesSettingsItem } from "../options/TimeControlSettings";
import { ucfirst } from "../tools/Format";
import { clog } from "../tools/Log";
import { mustExist } from "../tools/Maybe";
import { Resource } from "../types";
import { UserScript } from "../UserScript";
import { WorkshopManager } from "../WorkshopManager";

export type SettingsSectionUiComposition = {
  checkbox: JQuery<HTMLElement>;
  items: JQuery<HTMLElement>;
  label: JQuery<HTMLElement>;
  panel: JQuery<HTMLElement>;
};

/**
 * Base class for all automation UI sections.
 * This provides common functionality to help build the automation sections themselves.
 */
export abstract class SettingsSectionUi {
  protected _host: UserScript;
  protected _mainChild: JQuery<HTMLElement> | null = null;
  protected _itemsExpanded = false;

  constructor(host: UserScript) {
    this._host = host;
  }

  abstract refreshUi(): void;

  private static _provisionedOptionElements = new Map<string, JQuery<HTMLElement>>();

  /**
   * Expands the options list if true, and collapses it if false.
   * Changes the value of _itemsExpanded even if _mainChild is not defined.
   *
   * @param display Force a display state.
   * @returns the value of _itemsExpanded
   */
  public toggleOptions(display = !this._itemsExpanded) {
    this._itemsExpanded = display;
    if (this._mainChild) {
      this._mainChild.toggle(display);
    }
    return this._itemsExpanded;
  }

  /**
   * Constructs a settings panel that is used to contain a major section of the UI.
   *
   * @param id The ID of the settings panel.
   * @param label The label to put main checkbox of this section.
   * @param options An options section for which this is the settings panel.
   * @param mainChild The main child element in the panel that should be toggled with
   * the sections' expando button.
   * @returns The constructed settings panel.
   */
  protected _getSettingsPanel(
    id: string,
    label: string,
    options: SettingsSection,
    mainChild: JQuery<HTMLElement>
  ): SettingsSectionUiComposition {
    this._mainChild = mainChild;

    const panelElement = $("<li/>", { id: `ks-${id}` });
    // Add a border on the element
    panelElement.css("borderTop", "1px solid rgba(185, 185, 185, 0.2)");

    // The checkbox to enable/disable this panel.
    const enabledElement = $("<input/>", {
      id: `toggle-${id}`,
      type: "checkbox",
    });
    panelElement.append(enabledElement);

    enabledElement.on("change", () => {
      if (enabledElement.is(":checked") && options.enabled === false) {
        this._host.updateOptions(() => (options.enabled = true));
        this._host.imessage("status.auto.enable", [label]);
      } else if (!enabledElement.is(":checked") && options.enabled === true) {
        this._host.updateOptions(() => (options.enabled = false));
        this._host.imessage("status.auto.disable", [label]);
      }
    });

    // The label for this panel.
    const labelElement = $("<label/>", {
      text: label,
    });
    panelElement.append(labelElement);

    // The expando button for this panel.
    const itemsElement = this._getItemsToggle(id);
    panelElement.append(itemsElement);

    itemsElement.on("click", () => {
      this.toggleOptions();

      itemsElement.text(this._itemsExpanded ? "-" : "+");
      itemsElement.prop(
        "title",
        this._itemsExpanded ? this._host.i18n("ui.itemsHide") : this._host.i18n("ui.itemsShow")
      );
    });

    // When clicking the label of a major section, expand it instead of
    // checking the checkbox.
    // TODO: Maybe not?
    labelElement.on("click", () => itemsElement.trigger("click"));

    return {
      checkbox: enabledElement,
      items: itemsElement,
      label: labelElement,
      panel: panelElement,
    };
  }

  /**
   * Constructs an expando element that is commonly used to expand and
   * collapses a section of the UI.
   *
   * @param id The ID of the section this is the expando for.
   * @returns The constructed expando element.
   */
  protected _getItemsToggle(id: string): JQuery<HTMLElement> {
    return $("<div/>", {
      id: `toggle-items-${id}`,
      text: "+",
      title: this._host.i18n("ui.itemsShow"),
      css: {
        border: "1px solid rgba(255, 255, 255, 0.2)",
        cursor: "pointer",
        display: "inline-block",
        float: "right",
        minWidth: "10px",
        padding: "0px 3px",
        textAlign: "center",
      },
    });
  }

  /**
   * Constructs a button to configure the trigger value of an
   * automation section.
   *
   * @param id The ID of this trigger button.
   * @param handler Handlers to register on the control.
   * @param handler.onClick Call this method when the trigger button
   * is clicked.
   * @returns The constructed trigger button.
   */
  protected _getTriggerButton(id: string, handler: { onClick?: () => void } = {}) {
    const triggerButton = $("<div/>", {
      id: `trigger-${id}`,
      html: '<svg style="width:15px;height:15px" viewBox="0 0 24 24"><path fill="currentColor" d="M11 15H6L13 1V9H18L11 23V15Z" /></svg>',
      css: {
        cursor: "pointer",
        display: "inline-block",
        float: "right",
        marginBottom: "-2px",
        paddingRight: "3px",
        paddingTop: "2px",
      },
    });

    if (handler.onClick) {
      triggerButton.on("click", handler.onClick);
    }

    return triggerButton;
  }

  /**
   * Creates a new button to control a trigger value in a configuration section.
   *
   * @param id The ID of the button.
   * @param itext The label of the section this trigger is for.
   * @param options The settings section this trigger is for.
   * @returns The created button.
   */
  protected _registerTriggerButton(id: string, itext: string, options: SettingTrigger) {
    return this._getTriggerButton(id, {
      onClick: () => {
        const value = this._promptPercentage(
          this._host.i18n("ui.trigger.set", [itext]),
          this._renderPercentage(options.trigger)
        );

        if (value !== null) {
          this._host.updateOptions(() => (options.trigger = value));
          this.refreshUi();
        }
      },
    });
  }

  /**
   * Constructs a list panel that is used to contain a list of options.
   * The panel has "enable all" and "disable all" buttons to check and
   * uncheck all checkboxes in the section at once.
   *
   * @param id The ID for this list.
   * @returns The constructed list.
   */
  protected _getOptionList(id: string): JQuery<HTMLElement> {
    const containerList = $("<ul/>", {
      id: `items-list-${id}`,
      css: { display: "none", paddingLeft: "20px", paddingTop: "4px" },
    });

    const disableAllButton = $("<div/>", {
      id: `toggle-all-items-${id}`,
      text: this._host.i18n("ui.disable.all"),
      css: {
        border: "1px solid grey",
        cursor: "pointer",
        float: "right",
        display: "inline-block",
        marginBottom: "4px",
        padding: "1px 2px",
      },
    });

    disableAllButton.on("click", function () {
      // can't use find as we only want one layer of checkboxes
      const items = containerList.children().children(":checkbox");
      items.prop("checked", false);
      items.trigger("change");
      containerList.children().children(":checkbox").trigger("change");
    });

    containerList.append(disableAllButton);

    const enableAllButton = $("<div/>", {
      id: `toggle-all-items-${id}`,
      text: this._host.i18n("ui.enable.all"),
      css: {
        border: "1px solid grey",
        cursor: "pointer",
        float: "right",
        display: "inline-block",
        marginBottom: "4px",
        marginRight: "8px",
        padding: "1px 2px",
      },
    });

    enableAllButton.on("click", function () {
      // can't use find as we only want one layer of checkboxes
      const items = containerList.children().children(":checkbox");
      items.prop("checked", true);
      items.trigger("change");
      containerList.children().children(":checkbox").trigger("change");
    });

    containerList.append(enableAllButton);
    return containerList;
  }

  /**
   * Construct a subsection header.
   * This is purely for cosmetic/informational value in the UI.
   *
   * @param text The text to appear on the header element.
   * @returns The constructed header element.
   */
  protected _getHeader(text: string): JQuery<HTMLElement> {
    const headerElement = $("<li/>");
    const header = $("<span/>", {
      text,
      css: {
        color: "grey",
        cursor: "default",
        display: "inline-block",
        minWidth: "100px",
        userSelect: "none",
      },
    });

    headerElement.append(header);

    return headerElement;
  }

  /**
   * Construct an informational text item.
   * This is purely for cosmetic/informational value in the UI.
   *
   * @param text The text to appear on the header element.
   * @returns The constructed header element.
   */
  protected _getExplainer(text: string): JQuery<HTMLElement> {
    const headerElement = $("<li/>");
    const header = $("<span/>", {
      text,
      css: {
        color: "#888",
        cursor: "default",
        display: "inline-block",
        minWidth: "100px",
        userSelect: "none",
        padding: "4px",
      },
    });

    headerElement.append(header);

    return headerElement;
  }

  /**
   * Construct a new option element.
   * This is a simple checkbox with a label.
   *
   * @param name The internal ID of this option. Should be unique throughout the script.
   * @param option The option this element is linked to.
   * @param i18nName The label on the option element.
   * @param delimiter Should there be additional padding below this element?
   * @param upgradeIndicator Should an indicator be rendered in front of the elemnt,
   * to indicate that this is an upgrade of a prior option?
   * @param handler The event handlers for this option element.
   * @param handler.onCheck Will be invoked when the user checks the checkbox.
   * @param handler.onUnCheck Will be invoked when the user unchecks the checkbox.
   * @returns The constructed option element.
   */
  protected _getOption(
    name: string,
    option: Setting,
    i18nName: string,
    delimiter = false,
    upgradeIndicator = false,
    handler: {
      onCheck?: () => void;
      onUnCheck?: () => void;
    } = {}
  ): JQuery<HTMLElement> {
    if (SettingsSectionUi._provisionedOptionElements.has(name)) {
      throw new Error(
        `Duplicate option ID requested! The option ID '${name}' has already been assigned to a previously provisoned element.`
      );
    }
    const element = $("<li/>");
    const elementLabel = `${upgradeIndicator ? `⮤ ` : ""}${i18nName}`;

    const label = $("<label/>", {
      for: `toggle-${name}`,
      text: elementLabel,
      css: {
        display: "inline-block",
        marginBottom: delimiter ? "10px" : undefined,
        minWidth: "100px",
      },
    });

    const input = $("<input/>", {
      id: `toggle-${name}`,
      type: "checkbox",
    }).data("option", option);
    option.$enabled = input;

    input.on("change", () => {
      if (input.is(":checked") && option.enabled === false) {
        if (handler.onCheck) {
          handler.onCheck();
          return;
        }

        this._host.updateOptions(() => (option.enabled = true));
        clog("Unlogged action item");
      } else if (!input.is(":checked") && option.enabled === true) {
        if (handler.onUnCheck) {
          handler.onUnCheck();
          return;
        }

        this._host.updateOptions(() => (option.enabled = false));
        clog("Unlogged action item");
      }
    });

    element.append(input, label);

    SettingsSectionUi._provisionedOptionElements.set(name, element);

    return element;
  }

  /**
   * Create a UI element for an option that can have a maximum.
   * This will result in an element with a labeled checkbox and a "Max" indicator,
   * which controls the respective `max` property in the option model.
   *
   * @param name A unique name for this option.
   * @param option The option model.
   * @param label The label for the option.
   * @param delimiter Should a delimiter be rendered after this element?
   * @param upgradeIndicator Should an indicator be rendered in front of the elemnt,
   * to indicate that this is an upgrade of a prior option?
   * @param handler Handlers to call when the option is checked or unchecked.
   * @param handler.onCheck Is called when the option is checked.
   * @param handler.onUnCheck Is called when the option is unchecked.
   * @returns The created element.
   */
  protected _getOptionWithMax(
    name: string,
    option: SettingMax,
    label: string,
    delimiter = false,
    upgradeIndicator = false,
    handler: {
      onCheck?: () => void;
      onUnCheck?: () => void;
    } = {}
  ): JQuery<HTMLElement> {
    const element = this._getOption(name, option, label, delimiter, upgradeIndicator, handler);

    const maxButton = $("<div/>", {
      id: `set-${name}-max`,
      css: {
        cursor: "pointer",
        display: "inline-block",
        float: "right",
        paddingRight: "5px",
      },
    }).data("option", option);
    option.$max = maxButton;

    maxButton.on("click", () => {
      const value = this._promptLimit(
        this._host.i18n("ui.max.set", [label]),
        option.max.toString()
      );

      if (value !== null) {
        const limit = this._renderLimit(value);
        this._host.updateOptions(() => (option.max = value));
        maxButton[0].title = limit;
        maxButton[0].innerText = this._host.i18n("ui.max", [limit]);
      }
    });

    element.append(maxButton);

    return element;
  }

  /**
   * Create a UI element for an option that can be limited.
   * This will result in an element with a checkbox that has a "Limited" label.
   *
   * @param name A unique name for this option.
   * @param option The option model.
   * @param label The label for the option.
   * @param delimiter Should a delimiter be rendered after this element?
   * @param upgradeIndicator Should an indicator be rendered in front of the elemnt,
   * to indicate that this is an upgrade of a prior option?
   * @param handler Handlers to call when the option is checked or unchecked.
   * @param handler.onCheck Is called when the option is checked.
   * @param handler.onUnCheck Is called when the option is unchecked.
   * @param handler.onLimitedCheck Is called when the "Limited" checkbox is checked.
   * @param handler.onLimitedUnCheck Is called when the "Limited" checkbox is unchecked.
   * @returns The created element.
   */
  protected _getOptionWithLimited(
    name: string,
    option: SettingLimited,
    label: string,
    delimiter = false,
    upgradeIndicator = false,
    handler: {
      onCheck?: () => void;
      onUnCheck?: () => void;
      onLimitedCheck?: () => void;
      onLimitedUnCheck?: () => void;
    } = {}
  ): JQuery<HTMLElement> {
    const element = this._getOption(name, option, label, delimiter, upgradeIndicator, handler);

    const labelElement = $("<label/>", {
      for: `toggle-limited-${name}`,
      text: this._host.i18n("ui.limit"),
    });

    const input = $("<input/>", {
      id: `toggle-limited-${name}`,
      type: "checkbox",
    }).data("option", option);
    option.$limited = input;

    input.on("change", () => {
      if (input.is(":checked") && option.limited === false) {
        if (handler.onLimitedCheck) {
          handler.onLimitedCheck();
          return;
        }

        this._host.updateOptions(() => (option.limited = true));
        clog("Unlogged action item");
      } else if (!input.is(":checked") && option.limited === true) {
        if (handler.onLimitedUnCheck) {
          handler.onLimitedUnCheck();
          return;
        }

        this._host.updateOptions(() => (option.limited = false));
        clog("Unlogged action item");
      }
    });

    element.append(input, labelElement);

    return element;
  }

  protected _getOptionWithTrigger(
    name: string,
    option: SettingTrigger,
    label: string,
    delimiter = false,
    upgradeIndicator = false,
    handler: {
      onCheck?: () => void;
      onUnCheck?: () => void;
    } = {}
  ) {
    const element = this._getOption(name, option, label, delimiter, upgradeIndicator, handler);

    if (option.trigger !== undefined) {
      const triggerButton = this._getTriggerButton(`set-${name}-trigger`, {
        onClick: () => {
          const value = this._promptPercentage(
            this._host.i18n("ui.trigger.set", [label]),
            this._renderPercentage(mustExist(option.trigger))
          );

          if (value !== null) {
            option.trigger = value;
            this._host.updateOptions();
            triggerButton[0].title = this._renderPercentage(option.trigger);
          }
        },
      });
      option.$trigger = triggerButton;

      element.append(triggerButton);
    }

    return element;
  }

  protected _getBuildOption(
    name: string,
    option: BonfireSettingsItem | ReligionSettingsItem | SettingMax,
    label: string,
    delimiter = false,
    upgradeIndicator = false
  ): JQuery<HTMLElement> {
    return this._getOptionWithMax(name, option, label, delimiter, upgradeIndicator, {
      onCheck: () => {
        this._host.updateOptions(() => (option.enabled = true));
        this._host.imessage("status.auto.enable", [label]);
      },
      onUnCheck: () => {
        this._host.updateOptions(() => (option.enabled = false));
        this._host.imessage("status.auto.disable", [label]);
      },
    });
  }

  /**
   * Create a list of option elements that represent every single resource
   * available in the game. This allows users to pick certain resources for
   * other operations.
   *
   * @param forReset Is this a list that will be used to control resources
   * for reset automation?
   * @param onAddHandler Call this method when the user clicks on one of the
   * resources to add them.
   * @returns A list of option elements.
   */
  protected _getAllAvailableResourceOptions(
    forReset: boolean,
    onAddHandler: (res: {
      craftable: boolean;
      maxValue: number;
      name: Resource;
      title: string;
      type: "common" | "uncommon";
      value: number;
      visible: boolean;
    }) => void
  ): Array<JQuery<HTMLElement>> {
    const items = [];
    const idPrefix = forReset ? "#resource-reset-" : "#resource-";

    for (const resource of this._host.gamePage.resPool.resources) {
      // Show only new resources that we don't have in the list and that are
      // visible. This helps cut down on total size.
      if (resource.name && $(idPrefix + resource.name).length === 0) {
        const item = $("<div/>", {
          id: `resource-add-${resource.name}`,
          text: ucfirst(resource.title ? resource.title : resource.name),
          css: { cursor: "pointer" },
        });

        item.on("click", () => {
          item.remove();
          onAddHandler(resource);
          this._host.updateOptions();
        });

        items.push(item);
      }
    }

    return items;
  }

  /**
   * Creates a UI element that reflects stock and consume values for a given resource.
   * This is currently only used for the craft section.
   *
   * @param name The resource.
   * @param title The title to apply to the option.
   * @param option The option that is being controlled.
   * @param onDelHandler Will be invoked when the user removes the resoruce from the list.
   * @returns A new option with stock and consume values.
   */
  protected _addNewResourceOption(
    name: Resource,
    title: string,
    option: ResourcesSettingsItem,
    onDelHandler: (name: Resource, option: ResourcesSettingsItem) => void
  ): JQuery<HTMLElement> {
    //title = title || this._host.gamePage.resPool.get(name)?.title || ucfirst(name);

    const stock = option.stock;

    // The overall container for this resource item.
    const container = $("<div/>", {
      id: `resource-${name}`,
      css: { display: "inline-block", width: "100%" },
    });

    // The label with the name of the resource.
    const label = $("<div/>", {
      id: `resource-label-${name}`,
      text: title,
      css: { display: "inline-block", width: "95px" },
    });

    // How many items to stock.
    const stockElement = $("<div/>", {
      id: `stock-value-${name}`,
      text: this._host.i18n("resources.stock", [this._renderLimit(stock)]),
      css: { cursor: "pointer", display: "inline-block", width: "80px" },
    });

    // The consume rate for the resource.
    const consumeElement = $("<div/>", {
      id: `consume-rate-${name}`,
      text: this._host.i18n("resources.consume", [this._renderConsumeRate(option.consume)]),
      css: { cursor: "pointer", display: "inline-block" },
    });

    // Delete the resource from the list.
    const del = $("<div/>", {
      id: `resource-delete-${name}`,
      text: this._host.i18n("resources.del"),
      css: {
        cursor: "pointer",
        display: "inline-block",
        float: "right",
        paddingRight: "5px",
      },
    });

    container.append(label, stockElement, consumeElement, del);

    // once created, set color if relevant
    if (option !== undefined && option.stock !== undefined) {
      this._setStockWarning(name, option.stock);
    }

    stockElement.on("click", () => {
      const value = this._promptLimit(
        this._host.i18n("resources.stock.set", [title]),
        option.stock.toFixed(0)
      );
      if (value !== null) {
        this._setStockValue(name, value, false);
        stockElement.text(this._host.i18n("resources.stock", [this._renderLimit(value)]));
        this._host.updateOptions();
      }
    });

    consumeElement.on("click", () => {
      const consumeValue = this._promptPercentage(
        this._host.i18n("resources.consume.set", [title]),
        this._renderConsumeRate(option.consume)
      );
      if (consumeValue !== null) {
        // Cap value between 0 and 1.
        this._host.updateOptions(() => (option.consume = consumeValue));
        consumeElement.text(
          this._host.i18n("resources.consume", [this._renderConsumeRate(consumeValue)])
        );
      }
    });

    del.on("click", () => {
      if (window.confirm(this._host.i18n("resources.del.confirm", [title]))) {
        container.remove();
        onDelHandler(name, option);
        this._host.updateOptions();
      }
    });

    option.$consume = consumeElement;
    option.$stock = stockElement;

    return container;
  }

  /**
   * Removes a previously created resource option.
   *
   * @param name The resource to remove.
   */
  protected _removeResourceOption(name: Resource): void {
    const container = $(`#resource-${name}`).remove();
    if (!container.length) {
      return;
    }

    container.remove();
  }

  /**
   * Creates a UI element that reflects stock values for a given resource.
   * This is currently only used for the time/reset section.
   *
   * @param name The resource.
   * @param title The title to apply to the option.
   * @param option The option that is being controlled.
   * @param onDelHandler Will be invoked when the user removes the resoruce from the list.
   * @returns A new option with stock value.
   */
  protected _addNewResourceOptionForReset(
    name: Resource,
    title: string,
    option: TimeControlResourcesSettingsItem,
    onDelHandler: (name: Resource, option: TimeControlResourcesSettingsItem) => void
  ): JQuery<HTMLElement> {
    //title = title || this._host.gamePage.resPool.get(name)?.title || ucfirst(name);

    const stock = option.stock;

    // The overall container for this resource item.
    const container = $("<div/>", {
      id: `resource-reset-${name}`,
      css: { display: "inline-block", width: "100%" },
    });

    // The label with the name of the resource.
    const label = $("<div/>", {
      id: `resource-label-${name}`,
      text: title,
      css: { display: "inline-block", width: "95px" },
    });

    // How many items to stock.
    const stockElement = $("<div/>", {
      id: `stock-value-${name}`,
      text: this._host.i18n("resources.stock", [this._renderLimit(stock)]),
      css: { cursor: "pointer", display: "inline-block", width: "80px" },
    });

    // Delete the resource from the list.
    const del = $("<div/>", {
      id: `resource-delete-${name}`,
      text: this._host.i18n("resources.del"),
      css: {
        cursor: "pointer",
        display: "inline-block",
        float: "right",
        paddingRight: "5px",
      },
    });

    container.append(label, stockElement, del);

    stockElement.on("click", () => {
      const value = this._promptLimit(
        this._host.i18n("resources.stock.set", [title]),
        option.stock.toFixed(0)
      );
      if (value !== null) {
        this._setStockValue(name, value, true);
      }
    });

    del.on("click", () => {
      if (window.confirm(this._host.i18n("resources.del.confirm", [title]))) {
        container.remove();
        onDelHandler(name, option);
        this._host.updateOptions();
      }
    });

    option.$stock = stockElement;

    return container;
  }

  /**
   * Removes a previously created resource option.
   *
   * @param name The resource to remove.
   */
  protected _removeResourceOptionForReset(name: Resource): void {
    const container = $(`#resource-reset-${name}`);
    if (!container) {
      return;
    }

    container.remove();
  }

  private _setStockWarning(name: Resource, value: number, forReset = false): void {
    // simplest way to ensure it doesn't stick around too often; always do
    // a remove first then re-add only if needed
    const path = forReset ? `#resource-reset-${name}` : `#resource-${name}`;
    $(path).removeClass("stockWarn");

    const maxValue = this._host.gamePage.resPool.resources.filter(i => i.name === name)[0].maxValue;
    if ((value > maxValue && !(maxValue === 0)) || value === Infinity) {
      $(path).addClass("stockWarn");
    }
  }

  protected _setStockValue(name: Resource, value: number, forReset = false): void {
    if (value < 0) {
      this._host.warning(`ignoring non-numeric or invalid stock value '${value}'`);
      return;
    }

    if (forReset) {
      value = value < 0 ? Infinity : value;
      mustExist(this._host.engine.timeControlManager.settings.resources[name]).enabled = true;
      mustExist(this._host.engine.timeControlManager.settings.resources[name]).stock = value;
    } else {
      mustExist(this._host.engine.workshopManager.settings.resources[name]).enabled = true;
      mustExist(this._host.engine.workshopManager.settings.resources[name]).stock = value;
    }
  }

  setConsumeRate(name: Resource, value: number): void {
    if (value < 0.0 || 1.0 < value) {
      this._host.warning(`ignoring non-numeric or invalid consume rate ${value}`);
      return;
    }

    mustExist(this._host.engine.workshopManager.settings.resources[name]).consume = value;
  }

  protected _promptLimit(text: string, defaultValue: string): number | null {
    const value = window.prompt(text, defaultValue);
    if (value === null) {
      return null;
    }

    const hasSuffix = /[KMGT]$/.test(value);
    const baseValue = value.substring(0, value.length - (hasSuffix ? 1 : 0));

    let numericValue =
      value.includes("e") || hasSuffix ? parseFloat(baseValue) : parseInt(baseValue);
    if (hasSuffix) {
      const suffix = value.substring(value.length - 1);
      numericValue = numericValue * Math.pow(1000, ["", "K", "M", "G", "T"].indexOf(suffix));
    }
    if (numericValue === Number.POSITIVE_INFINITY || numericValue < 0) {
      numericValue = -1;
    }

    return numericValue;
  }

  protected _promptPercentage(text: string, defaultValue: string): number | null {
    const value = window.prompt(text, defaultValue);
    if (value === null) {
      return null;
    }

    // Cap value between 0 and 1.
    return Math.max(0, Math.min(1, parseFloat(value)));
  }

  protected _renderLimit(value: number): string {
    if (value < 0 || value === Number.POSITIVE_INFINITY) {
      return "∞";
    }

    return this._host.gamePage.getDisplayValueExt(value);
  }

  protected _renderPercentage(value: number): string {
    return value.toFixed(3);
  }

  protected _renderConsumeRate(consume: number | undefined): string {
    return this._renderPercentage(consume ?? WorkshopManager.DEFAULT_CONSUME_RATE);
  }
}
