const { initializeSettings, initializeProfileMap } = require('./data');
const { requireEula } = require('./eula');
const { patchMessageContent, patchMessageHeader } = require('./messages');

module.exports = class Pluralchum {
  profileMap = {};
  currentRequests = 0;
  patches = [];
  eula = false; // "eula" aka tell people what this shit does
  doColourText = true;
  contrastTestColour = '#000000';
  doContrastTest = true;
  contrastThreshold = 3;
  useServerNames = false;

  memberColourPref = 0;
  tagColourPref = 1;

  getSettingsPanel() {
    const Settings = ZLibrary.Settings;
    let settingsPanel = new Settings.SettingPanel();
    let logo = document.createElement('img');

    logo.src = 'https://media.discordapp.net/attachments/846781793834106902/946425651634765824/overkill_logo_final.png';
    logo.style = 'max-width: 100%; height: auto;';

    let subtitle = document.createElement('p');

    subtitle.innerHTML =
      'PluralKit integration for BetterDiscord<br>- by <b><span style="color: #ff002a;">ash taylor</span></b> -';
    subtitle.style = 'text-align: center; color: var(--header-primary);';

    settingsPanel.append(logo);
    settingsPanel.append(subtitle);

    // Preferences
    let preferencesPanel = new Settings.SettingGroup('Preferences', {
      shown: false,
    });

    preferencesPanel.append(
      new Settings.Switch('Colored proxy text', '', this.doColourText, val => {
        this.doColourText = val;
        this.saveSettings();
      }),
    );

    preferencesPanel.append(
      new Settings.Dropdown(
        'Default member name color',
        '',
        this.memberColourPref,
        [
          { label: 'Member', value: 0 },
          { label: 'System', value: 1 },
          { label: 'Theme', value: 2 },
        ],
        val => {
          this.memberColourPref = val;
          this.saveSettings();
        },
      ),
    );

    preferencesPanel.append(
      new Settings.Dropdown(
        'Default system tag color',
        '',
        this.tagColourPref,
        [
          { label: 'Member', value: 0 },
          { label: 'System', value: 1 },
          { label: 'Theme', value: 2 },
        ],
        val => {
          this.saveSettings();
          this.tagColourPref = val;
        },
      ),
    );

    preferencesPanel.append(
      new Settings.Switch('Use servernames (experimental)', '', this.useServerNames, val => {
        this.useServerNames = val;
        this.saveSettings();
      }),
    );

    // Contrast test settings
    let accessibilityPanel = new Settings.SettingGroup('Accessibility', {
      shown: false,
    });

    accessibilityPanel.append(
      new Settings.Switch(
        'Enable text contrast test',
        "Uses the theme's default color if the proxy's contrast is too low",
        this.doContrastTest,
        val => {
          this.doContrastTest = val;
          this.saveSettings();
        },
      ),
    );

    accessibilityPanel.append(
      new Settings.ColorPicker(
        'Contrast test color',
        'The background color that proxy text will be tested against (black for dark themes, white for light themes)',
        this.contrastTestColour,
        hex => {
          this.contrastTestColour = hex;
          this.saveSettings();
        },
      ),
    );

    accessibilityPanel.append(
      new Settings.Slider(
        'Contrast ratio threshold',
        'Minimum contrast ratio for proxy colors (default: 3)',
        1,
        21,
        this.contrastThreshold,
        val => {
          this.contrastThreshold = val;
          this.saveSettings();
        },
        { markers: [1, 2, 3, 4.5, 7, 14, 21] },
      ),
    );

    // Cache
    let cachePanel = new Settings.SettingGroup('Cache', { shown: false });
    let resetCacheBtn = document.createElement('button');
    resetCacheBtn.className = 'button-f2h6uQ lookFilled-yCfaCM colorBrand-I6CyqQ sizeSmall-wU2dO- grow-2sR_-F';
    resetCacheBtn.innerHTML = 'Delete Cache';
    resetCacheBtn.onclick = () => {
      this.profileMap = {};
      this.saveSettings();
    };

    cachePanel.append(resetCacheBtn).class;

    settingsPanel.append(preferencesPanel);
    settingsPanel.append(accessibilityPanel);
    settingsPanel.append(cachePanel);

    return settingsPanel.getElement();
  }

  constructor() {}

  load() {}

  stop() {
    for (let i = this.patches.length - 1; i >= 0; i--) this.patches[i]();

    this.purgeOldCachedContent();
    ZLibrary.Utilities.saveSettings(this.getName(), this.getSettings());

    BdApi.Patcher.unpatchAll(this.getName());
    ZLibrary.DOMTools.removeStyle(this.getName());
  }

  purgeOldCachedContent() {
    if (!this.profileMap) return;
    const expirationTime = 1000 * 60 * 60 * 24 * 30;
    let now = Date.now();
    for (const id of Object.keys(this.profileMap)) {
      if (Object.hasOwn(this.profileMap[id], 'lastUsed')) {
        let lastUsed = this.profileMap[id].lastUsed;

        if (now - lastUsed > expirationTime) delete this.profileMap[id];
      } else {
        this.profileMap[id].lastUsed = now;
      }
    }
  }

  start() {
    if (!global.ZeresPluginLibrary)
      return window.BdApi.alert(
        'Library Missing',
        `The library plugin needed for ${this.getName()} is missing.<br /><br /> <a href="https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js" target="_blank">Click here to download the library!</a>`,
      );

    this.settings = initializeSettings(this.getName());
    let profileMap = initializeProfileMap(this.getName());

    console.log('[PLURALCHUM] Loaded settings');

    if (!this.profileMap) this.profileMap = {};

    console.log('[PLURALCHUM] Loaded PK data');

    requireEula(this.settings, this.getName());

    patchMessageContent(this.getName(), this.settings, profileMap);
    patchMessageHeader(this.getName(), this.settings, profileMap);

    // Add edit menu item to proxied messages.
    const messageActions = BdApi.Webpack.getModule(BdApi.Webpack.Filters.byProps('receiveMessage', 'editMessage'));

    BdApi.ContextMenu.patch('message', (res, props) => {
      const { message } = props;
      if (!message || !this.isProxiedMessage(message) || !Array.isArray(res?.props?.children)) {
        return res;
      }
      res.props.children[2].props.children.splice(
        4,
        0,
        BdApi.ContextMenu.buildMenuChildren([
          {
            id: 'pk-edit',
            label: 'Edit Proxied Message',
            action: () => {
              messageActions.startEditMessage(message.channel_id, message.id, message.content);
            },
          },
        ]),
      );

      // Patch edit actions on proxied messages to send a pluralkit command.
      const channelActions = BdApi.Webpack.getModule(BdApi.Webpack.Filters.byProps('getChannel', 'getDMFromUserId'));

      BdApi.Patcher.instead(
        this.getName(),
        messageActions,
        'editMessage',
        BdApi.Utils.debounce(function (ctx, [channel_id, message_id, message], original) {
          if (ZLibrary.DiscordModules.MessageStore.getMessage(channel_id, message_id).author.discriminator === '0000') {
            let { content } = message;
            let channel = channelActions.getChannel(channel_id);
            let guild_id = channel.guild_id;
            let str =
              'pk;e https://discord.com/channels/' + guild_id + '/' + channel_id + '/' + message_id + ' ' + content;
            ZLibrary.DiscordModules.MessageActions.sendMessage(channel_id, {
              reaction: false,
              content: str,
            });
          } else {
            return original(channel_id, message_id, message);
          }
        }, 100),
      );
    });
  }

  saveSettings() {
    ZLibrary.Utilities.saveSettings(this.getName(), this.getSettings());
  }

  getName() {
    return 'Pluralchum';
  }

  getDefaultSettings() {
    return {
      profileMap: {},
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

  getSettings() {
    return {
      profileMap: this.getFilteredProfileMap(),
      eula: this.eula,
      doColourText: this.doColourText,
      contrastTestColour: this.contrastTestColour,
      doContrastTest: this.doContrastTest,
      contrastThreshold: this.contrastThreshold,
      memberColourPref: this.memberColourPref,
      tagColourPref: this.tagColourPref,
      useServerNames: this.useServerNames,
    };
  }

  applySettings(settings) {
    this.profileMap = settings.profileMap;
    this.eula = settings.eula;
    this.doColourText = settings.doColourText;
    this.contrastTestColour = settings.contrastTestColour;
    this.doContrastTest = settings.doContrastTest;
    this.contrastThreshold = settings.contrastThreshold;
    this.memberColourPref = settings.memberColourPref;
    this.tagColourPref = settings.tagColourPref;
    this.useServerNames = settings.useServerNames;
  }

  getFilteredProfileMap() {
    const asArray = Object.entries(this.profileMap);
    const filtered = asArray.filter(([_, profile]) => profile.status === 'DONE');
    return Object.fromEntries(filtered);
  }

  isProxiedMessage(message) {
    return message.author.discriminator === '0000';
  }
};
