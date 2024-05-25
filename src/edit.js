import { MessageActions, Stores } from './common.js';
import { isProxiedMessage, pluginName } from './utility.js';

export function patchEditMenuItem() {
  // Add edit menu item to proxied messages.
  return BdApi.ContextMenu.patch('message', (res, props) => {
    const { message } = props;
    if (!message || !isProxiedMessage(message) || !Array.isArray(res?.props?.children)) {
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
            MessageActions.startEditMessage(message.channel_id, message.id, message.content);
          },
        },
      ]),
    );
  });
}

export function patchEditAction() {
  // Patch edit actions on proxied messages to send a pluralkit command.
  BdApi.Patcher.instead(
    pluginName,
    MessageActions,
    'editMessage',
    BdApi.Utils.debounce(function (ctx, [channel_id, message_id, message], original) {
      if (isProxiedMessage(Stores.MessageStore.getMessage(channel_id, message_id))) {
        let { content } = message;
        let channel = Stores.ChannelStore.getChannel(channel_id);
        let guild_id = channel.guild_id;
        let str = 'pk;e https://discord.com/channels/' + guild_id + '/' + channel_id + '/' + message_id + ' ' + content;
        MessageActions.sendMessage(channel_id, {
          reaction: false,
          content: str,
        });
      } else {
        return original(channel_id, message_id, message);
      }
    }, 100),
  );
}
