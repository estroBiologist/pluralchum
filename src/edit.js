const React = BdApi.React;
const Webpack = BdApi.Webpack;
const MessageActions = Webpack.getByKeys('jumpToMessage', '_sendMessage');
const MessageStore = Webpack.getStore('MessageStore');
const ChannelStore = Webpack.getStore('ChannelStore');
const UserStore = BdApi.Webpack.getModule(BdApi.Webpack.Filters.byStoreName('UserStore'));

import { isProxiedMessage, pluginName } from './utility.js';
import PKEditIcon from './components/PKEditIcon.js';
import { getUserHash } from './profiles.js';

const currentUserId = UserStore.getCurrentUser().id;

function isEditable(profileMap, message) {
  if (message.author?.id === currentUserId) {
    return true;
  }
  const sender = profileMap.get(getUserHash(message.author))?.sender;
  return isProxiedMessage(message) && sender === currentUserId;
}

// Add 'Edit Proxied Message' item to the context menu. This parallels the existing
// 'Edit' item for regular messages.
export function patchEditMenuItem(profileMap) {
  return BdApi.ContextMenu.patch('message', (res, props) => {
    const { message } = props;

    if (!isProxiedMessage(message) || !isEditable(profileMap, message)) {
      return res;
    }

    // This part is fragile. If the 'Edit Proxied Message' button disappears its likely
    // the context menu structure changed again.
    let children = res?.props?.children?.props?.children?.[3]?.props?.children;
    children?.splice(
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

// Includes proxied messages sent by the current user in the getLastEditableMessage query.
// This lets the edit shortcut (Up arrow while in the chat box by default) to include
// proxied messages.
export function patchLastEditableMessage(profileMap) {
  BdApi.Patcher.instead(pluginName, MessageStore, 'getLastEditableMessage', function (ctx, [channelId], _original) {
    // This is basically the same code as the original function except with our expanded definition of 'editable'.
    return MessageStore.getMessages(channelId)
      .toArray()
      .reverse()
      .find(m => isEditable(profileMap, m));
  });
}

// Patch edit actions on proxied messages to send the pluralkit edit message command.
export function patchEditAction() {
  BdApi.Patcher.instead(
    pluginName,
    MessageActions,
    'editMessage',
    // Debounce is used to avoid sending repeated messages in quick succession which is a big no-no.
    BdApi.Utils.debounce(function (ctx, [channel_id, message_id, message], original) {
      if (isProxiedMessage(MessageStore.getMessage(channel_id, message_id))) {
        let { content } = message;
        let channel = ChannelStore.getChannel(channel_id);
        let guild_id = channel.guild_id;
        let str = 'pk;e https://discord.com/channels/' + guild_id + '/' + channel_id + '/' + message_id + ' ' + content;
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
