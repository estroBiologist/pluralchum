import ZLibrary from './external/ZLibrary.js';
import { ValueCell, MapCell, pluginName } from './utility.js';
import { ProfileStatus } from './profiles.js';

export const ColourPreference = {
  Member: 0,
  System: 1,
  Theme: 2, // (do nothing)
  Role: 3,
};

function defaultSettings() {
  return {
    eula: false,
    doColourText: true,
    contrastTestColour: '#000000',
    doContrastTest: true,
    contrastThreshold: 3,
    memberColourPref: ColourPreference.Member,
    tagColourPref: ColourPreference.System,
    useServerNames: false,
    version: null,
  };
}

function loadSettings() {
  let settings = ZLibrary.Utilities.loadSettings(pluginName, defaultSettings());

  // Clear out old cache from previous versions
  delete settings.profileMap;
  delete settings.idMap;
  ZLibrary.Utilities.saveSettings(pluginName, settings);

  return settings;
}

export function initializeSettings() {
  let settings = new ValueCell(loadSettings());
  settings.addListener(function (s) {
    ZLibrary.Utilities.saveSettings(pluginName, s);
  });
  return settings;
}

function filterDoneProfiles(entries) {
  const filtered = entries.filter(([_, profile]) => profile.status === ProfileStatus.Done);
  return Object.fromEntries(filtered);
}

export function initializeProfileMap() {
  const key = 'profileMap';
  let map = new MapCell(BdApi.Data.load(pluginName, key) ?? {});
  map.addListener(function () {
    BdApi.Data.save(pluginName, key, filterDoneProfiles(map.entries()));
  });
  return map;
}

function tooOld(lastUsed) {
  const expirationTime = 1000 * 60 * 60 * 24 * 30;
  return Date.now() - lastUsed > expirationTime;
}

export function purgeOldProfiles(profileMap) {
  if (!profileMap) return;

  for (const [id, profile] of profileMap.entries()) {
    if (Object.hasOwn(profile, 'lastUsed')) {
      if (tooOld(profile.lastUsed)) {
        profileMap.delete(id);
      }
    } else {
      profileMap.update(id, function () {
        return { ...profile, lastUsed: Date.now() };
      });
    }
  }
}
