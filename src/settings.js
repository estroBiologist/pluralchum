const { ValueCell } = require("./utility");

function defaultSettings() {
  return {
    profileMap: {},
    idMap: {},
    eula: false,
    doColourText: true,
    contrastTestColour: "#000000",
    doContrastTest: true,
    contrastThreshold: 3,
    memberColourPref: 0,
    tagColourPref: 1,
    useServerNames: false,
  };
}

function initializeSettings(pluginName) {
  let settings = new ValueCell(
    ZLibrary.Utilities.loadSettings(pluginName, defaultSettings())
  );
  settings.addListener(function (s) {
    ZLibrary.Utilities.saveSettings(pluginName, s);
  });
  return settings;
}

module.exports = { initializeSettings }