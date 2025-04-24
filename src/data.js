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
    useServerNames: true,
    version: null,
    doDisableBanners: false,
  };
}

function loadSettings() {
  let settings = Object.assign(defaultSettings(), BdApi.Data.load(pluginName, 'settings'));
  BdApi.Data.save(pluginName, 'settings', settings);
  return settings;
}

export function initializeSettings() {
  let settings = new ValueCell(loadSettings());
  settings.addListener(function (s) {
    BdApi.Data.save(pluginName, 'settings', s);
  });
  return settings;
}

function filterDoneProfiles(entries) {
  const filtered = entries.filter(([_, profile]) => profile.status === ProfileStatus.Done);
  return Object.fromEntries(filtered);
}

export function initializeProfileMap() {
  let memberMap = new MapCell(BdApi.Data.load(pluginName, 'memberMap') ?? {});
  memberMap.addListener(function () {
    BdApi.Data.save(pluginName, 'memberMap', filterDoneProfiles(memberMap.entries()));
  });
  let systemMap = new MapCell(BdApi.Data.load(pluginName, 'systemMap') ?? {});
  systemMap.addListener(function () {
    BdApi.Data.save(pluginName, 'systemMap', filterDoneProfiles(systemMap.entries()));
  });
  return { systems: systemMap, members: memberMap };
}

function tooOld(lastUsed) {
  const expirationTime = 1000 * 60 * 60 * 24 * 30;
  return Date.now() - lastUsed > expirationTime;
}

export function purgeOldProfiles(map) {
  if (!map) return;

  for (const [id, profile] of map.entries()) {
    if (Object.hasOwn(profile, 'lastUsed')) {
      if (tooOld(profile.lastUsed)) {
        map.delete(id);
      }
    } else {
      map.update(id, function () {
        return { ...profile, lastUsed: Date.now() };
      });
    }
  }
}
