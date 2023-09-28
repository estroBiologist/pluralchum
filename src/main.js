import ZLibrary from './external/ZLibrary.js';
import './styles.js';
import { initializeSettings, initializeProfileMap, purgeOldProfiles } from './data.js';
import { requireEula } from './eula.js';
import { patchMessageContent, patchMessageHeader } from './messages.js';
import { patchEditMenuItem, patchEditAction } from './edit.js';
import { settingsPanel } from './settingsPanel.js';
import * as Patch from './patch.js';
import { pluginName } from './utility.js';
import { checkForUpdates } from './update.js';

const version = '2.1.2';

export class Pluralchum {
  patches = [];

  start() {
    this.settings = initializeSettings();

    console.log('[PLURALCHUM] Loaded settings');

    this.profileMap = initializeProfileMap();

    console.log('[PLURALCHUM] Loaded PK data');

    requireEula(this.settings);

    patchMessageContent(this.settings, this.profileMap);
    patchMessageHeader(this.settings, this.profileMap);
    this.patches.push(patchEditMenuItem());
    patchEditAction();

    checkForUpdates(version);
  }

  stop() {
    for (let i = this.patches.length - 1; i >= 0; i--) this.patches[i]();

    purgeOldProfiles(this.profileMap);

    Patch.unpatchAll();

    ZLibrary.DOMTools.removeStyle(pluginName);
  }

  getSettingsPanel() {
    return settingsPanel(this.settings, this.profileMap);
  }

  getName() {
    return pluginName;
  }
}
