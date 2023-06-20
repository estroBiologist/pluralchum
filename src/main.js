const { initializeSettings, initializeProfileMap, purgeOldProfiles } = require('./data');
const { requireEula } = require('./eula');
const { patchMessageContent, patchMessageHeader } = require('./messages');
const { settingsPanel } = require('./settingsPanel');

module.exports = class Pluralchum {
  getSettingsPanel() {
    return settingsPanel(this.settings, this.profileMap);
  }

  stop() {
    for (let i = this.patches.length - 1; i >= 0; i--) this.patches[i]();

    purgeOldProfiles(this.profileMap);

    BdApi.Patcher.unpatchAll(this.getName());
    ZLibrary.DOMTools.removeStyle(this.getName());
  }

  start() {
    if (!global.ZeresPluginLibrary)
      return window.BdApi.alert(
        'Library Missing',
        `The library plugin needed for ${this.getName()} is missing.<br /><br /> <a href="https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js" target="_blank">Click here to download the library!</a>`,
      );

    this.settings = initializeSettings(this.getName());

    console.log('[PLURALCHUM] Loaded settings');

    this.profileMap = initializeProfileMap(this.getName());

    console.log('[PLURALCHUM] Loaded PK data');

    requireEula(this.settings, this.getName());

    patchMessageContent(this.getName(), this.settings, this.profileMap);
    patchMessageHeader(this.getName(), this.settings, this.profileMap);

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

  getName() {
    return 'Pluralchum';
  }

  isProxiedMessage(message) {
    return message.author.discriminator === '0000';
  }
};
