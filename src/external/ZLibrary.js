const React = BdApi.React;
import { dummy } from "../utility";

let warned = false;

const handler = {
  get: function (target, prop) {
    if (!global.ZLibrary) {
      if (!warned) {
        BdApi.UI.alert('Library Missing', [
          'A plugin library needed for Pluralchum is missing',
          <br />,
          <br />,
          <a href='https://betterdiscord.app/plugin/ZeresPluginLibrary' target='_blank'>
            Click here to download the library!
          </a>,
        ]);
        BdApi.Plugins.disable('Pluralchum');
        warned = true;
      }

      return dummy();
    } else {
      return global.ZLibrary[prop];
    }
  },
};

export default new Proxy({}, handler);
