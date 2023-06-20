const { ValueCell, MapCell } = require('./utility');

function defaultSettings() {
  return {
    profileMap: {}, // deprecated
    idMap: {}, // depreacted
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

function initializeSettings(pluginName) {
  let settings = new ValueCell(ZLibrary.Utilities.loadSettings(pluginName, defaultSettings()));
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

module.exports = { initializeSettings, initializeProfileMap };
