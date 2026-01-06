const React = BdApi.React;
const Webpack = BdApi.Webpack;
const MessageActions = Webpack.getByKeys('jumpToMessage', '_sendMessage');
const MessageStore = Webpack.getStore('MessageStore');
const ChannelStore = Webpack.getStore('ChannelStore');
import { isProxiedMessage, pluginName } from './utility.js';
import PKEditIcon from './components/PKEditIcon.js';

export function patchEditMenuItem() {
  // Add edit menu item to proxied messages.
  return BdApi.ContextMenu.patch('message', (res, props) => {
    const { message } = props;

    if (!message || !isProxiedMessage(message)) {
      return res;
    }

    let children = res?.props?.children?.props?.children?.[3]?.props?.children;
    children.splice(
      0,
      0,
      BdApi.ContextMenu.buildMenuChildren([
        {
          id: 'pk-edit',
          label: 'Edit Proxied Message',
          icon: <PKEditIcon />,
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
  console.log(MessageActions);
  BdApi.Patcher.instead(
    pluginName,
    MessageActions,
    'editMessage',
    BdApi.Utils.debounce(function (ctx, [channel_id, message_id, message], original) {
      console.log('loggy');
      if (isProxiedMessage(MessageStore.getMessage(channel_id, message_id))) {
        let { content } = message;
        let channel = ChannelStore.getChannel(channel_id);
        let guild_id = channel.guild_id;
        let str = 'pk;e https://discord.com/channels/' + guild_id + '/' + channel_id + '/' + message_id + ' ' + content;
        console.log(channel_id);
        MessageActions.sendMessage(
          channel_id,
          {
            reaction: false,
            content: str,
            tts: false,
            invalidEmojis: [],
            validNonShortcutEmojis: [],
          },
          false,
          {},
        );
      } else {
        return original(channel_id, message_id, message);
      }
    }, 100),
  );
}
