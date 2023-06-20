const { ValueCell, MapCell } = require('./utility');

function defaultSettings() {
  return {
    eula: false,
    doColourText: true,
    contrastTestColour: '#000000',
    doContrastTest: true,
    contrastThreshold: 3,
    memberColourPref: 0,
    tagColourPref: 1,
    useServerNames: false,
  };
}

function loadSettings(pluginName) {
  let settings = ZLibrary.Utilities.loadSettings(pluginName, defaultSettings());

  // Clear out old cache from previous versions
  delete settings.profileMap;
  delete settings.idMap;
  ZLibrary.Utilities.saveSettings(pluginName, settings);

  return settings;
}

function initializeSettings(pluginName) {
  let settings = new ValueCell(loadSettings(pluginName));
  settings.addListener(function (s) {
    ZLibrary.Utilities.saveSettings(pluginName, s);
  });
  return settings;
}

function filterDoneProfiles(entries) {
  const filtered = entries.filter(([_, profile]) => profile.status === 'DONE');
  return Object.fromEntries(filtered);
}

function initializeProfileMap(pluginName) {
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

function purgeOldProfiles(profileMap) {
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

module.exports = { initializeSettings, initializeProfileMap, purgeOldProfiles };
