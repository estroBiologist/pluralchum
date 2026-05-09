import { MapCell, pluginName, waitForWithKey } from './utility.js';
import MessageContentProxy from './components/MessageContentProxy.js';
import MessageHeaderProxy from './components/MessageHeaderProxy.js';
import MessageProxy from './components/MessageProxy.js';

export async function patchMessageContent(settings, profileMap, enabled) {
  const MessageContent = await BdApi.Webpack.waitForModule(m => {
    let s = m?.type?.toString();
    return s && s.includes('SENDING') && s.includes('SEND_FAILED');
  });

  BdApi.Patcher.instead(pluginName, MessageContent, 'type', function (ctx, [props], f) {
    return (
      <MessageContentProxy
        settingsCell={settings}
        profileMap={profileMap}
        enabledCell={enabled}
        messageContent={f.call(ctx, props)}
        message={props.message}
      />
    );
  });
}

export async function patchMessageHeader(settings, profileMap, enabled) {
  const MessageHeader = await BdApi.Webpack.waitForModule(
    BdApi.Webpack.Filters.byStrings('includeConvenienceGlow', 'shouldUnderlineOnHover'),
    {
      defaultExport: false,
    },
  );

  BdApi.Patcher.instead(pluginName, MessageHeader, 'A', function (ctx, [props], f) {
    if (!props) {
      return;
    }

    return (
      <MessageHeaderProxy
        settingsCell={settings}
        profileMap={profileMap}
        enabledCell={enabled}
        messageHeader={f.call(ctx, props)}
        message={props.message}
        guildId={props.channel.guild_id}
        onClickUsername={props.onClick}
      />
    );
  });
}

const messageIdRegex = /message-content-(?<id>\d+)/;
export async function patchMessage(profileMap, enabled) {
  const unblockedMap = new MapCell({});
  const [Message, msg] = await waitForWithKey(BdApi.Webpack.Filters.byStrings('childrenSystemMessage'));

  BdApi.Patcher.instead(pluginName, Message, msg, function (ctx, [props], f) {
    // We need to commit some crimes since the actual component we want to patch is now private :(
    const messageId = messageIdRegex.exec(props['aria-labelledby'])?.groups?.id ?? false;

    return (
      <MessageProxy
        profileMap={profileMap}
        enabledCell={enabled}
        unblockedMap={unblockedMap}
        messageNode={f.call(ctx, props)}
        messageId={messageId}
      />
    );
  });
}
