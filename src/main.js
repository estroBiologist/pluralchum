import ZLibrary from './external/ZLibrary.js';
import './styles.js';
import { initializeSettings, initializeProfileMap, purgeOldProfiles } from './data.js';
import { requireEula } from './eula.js';
import { patchMessageContent, patchMessageHeader, patchMessage } from './messages.js';
import { patchEditMenuItem, patchEditAction } from './edit.js';
import { settingsPanel } from './settingsPanel.js';
import { ValueCell, pluginName, sleep } from './utility.js';
import { checkForUpdates, upgradeCache } from './update.js';

const version = '2.2.0';

export class Pluralchum {
  patches = [];

  start() {
    this.settings = initializeSettings();

    console.log('[PLURALCHUM] Loaded settings');

    this.profileMap = initializeProfileMap();

    console.log('[PLURALCHUM] Loaded PK data');

    upgradeCache(this.settings, this.profileMap, version);

    requireEula(this.settings);

    this.enabled = new ValueCell(true);

    patchMessageContent(this.settings, this.profileMap, this.enabled);
    patchMessageHeader(this.settings, this.profileMap, this.enabled);
    patchMessage(this.profileMap, this.enabled);
    this.patches.push(patchEditMenuItem());
    patchEditAction();

    softReload();

    checkForUpdates(version);
  }

  stop() {
    this.enabled.set(false);

    for (let i = this.patches.length - 1; i >= 0; i--) this.patches[i]();

    purgeOldProfiles(this.profileMap);

    BdApi.Patcher.unpatchAll(pluginName);

    ZLibrary.DOMTools.removeStyle(pluginName);
  }

  getSettingsPanel() {
    return settingsPanel(this.settings, this.profileMap);
  }

  getName() {
    return pluginName;
  }
}

async function softReload() {
  let channel = ZLibrary.DiscordModules.SelectedChannelStore.getChannelId();
  let guild = ZLibrary.DiscordModules.SelectedGuildStore.getGuildId();

  await ZLibrary.DiscordModules.NavigationUtils.transitionTo(ZLibrary.DiscordModules.DiscordConstants.Routes.INDEX);
  await sleep(100);
  await ZLibrary.DiscordModules.NavigationUtils.transitionTo(
    ZLibrary.DiscordModules.DiscordConstants.Routes.CHANNEL(guild, channel),
  );
}
