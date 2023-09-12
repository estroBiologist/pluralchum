import { initializeSettings, initializeProfileMap, purgeOldProfiles } from './data.js';
import { requireEula } from './eula.js';
import { patchMessageContent, patchMessageHeader } from './messages.js';
import { patchEditMenuItem, patchEditAction } from './edit.js';
import { settingsPanel } from './settingsPanel.js';

export class Pluralchum {
  patches = [];

  start() {
    if (!global.ZeresPluginLibrary)
      return window.BdApi.alert(
        'Library Missing',
        `The library plugin needed for ${this.getName()} is missing.<br /><br /> <a href="https://betterdiscord.app/plugin/ZeresPluginLibrary" target="_blank">Click here to download the library!</a>`,
      );

    this.settings = initializeSettings(this.getName());

    console.log('[PLURALCHUM] Loaded settings');

    this.profileMap = initializeProfileMap(this.getName());

    console.log('[PLURALCHUM] Loaded PK data');

    requireEula(this.settings, this.getName());

    patchMessageContent(this.getName(), this.settings, this.profileMap);
    patchMessageHeader(this.getName(), this.settings, this.profileMap);
    this.patches.push(patchEditMenuItem());
    patchEditAction(this.getName());
  }

  stop() {
    for (let i = this.patches.length - 1; i >= 0; i--) this.patches[i]();

    purgeOldProfiles(this.profileMap);

    BdApi.Patcher.unpatchAll(this.getName());
    ZLibrary.DOMTools.removeStyle(this.getName());
  }

  getSettingsPanel() {
    return settingsPanel(this.settings, this.profileMap);
  }

  getName() {
    return 'Pluralchum';
  }
}
