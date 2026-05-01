const React = BdApi.React;

import { MapCell, pluginName } from './utility.js';
import MessageContentProxy from './components/MessageContentProxy.js';
import MessageHeaderProxy from './components/MessageHeaderProxy.js';
import MessageProxy from './components/MessageProxy.js';

export function patchMessageContent(settings, profileMap, enabled) {
  BdApi.Webpack.waitForModule(m => {
    let s = m?.type?.toString();
    return s && s.includes('SENDING') && s.includes('SEND_FAILED');
  }).then(function (MessageContent) {
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
})
}

export function patchMessageHeader(settings, profileMap, enabled) {
  BdApi.Webpack.waitForModule(BdApi.Webpack.Filters.byStrings('includeConvenienceGlow', 'shouldUnderlineOnHover'), {
    defaultExport: false
  }).then(function (MessageHeader) {
    BdApi.Patcher.instead(pluginName, MessageHeader, 'A', function (ctx, [props], f) {
      if (!props) {
        return;
      }

      return (
        <MessageHeaderProxy
          settingsCell={settings}
          profileMap={profileMap}
          enabledCell={enabled}
          messageHeader={f(props)}
          message={props.message}
          guildId={props.channel.guild_id}
          onClickUsername={props.onClick}
        />
      ); BdApi.Webpack.waitForModule(BdApi.Webpack.Filters.byStrings('zalgo', 'childrenRepliedMessage'), {
    defaultExport: false
  })
    });
  })
}

export function patchMessage(profileMap, enabled) {
  let unblockedMap = new MapCell({});

  BdApi.Webpack.waitForModule(BdApi.Webpack.Filters.byStrings('zalgo', 'childrenRepliedMessage'), {
    defaultExport: false
  }).then(function (Message) {
    BdApi.Patcher.instead(pluginName, Message, 'A', function (ctx, [props], f) {
    return (
      <MessageProxy
        profileMap={profileMap}
        enabledCell={enabled}
        unblockedMap={unblockedMap}
        messageNode={f.call(ctx, props)}
        message={props.message}
        groupId={props.groupId}
      />
    );
  });
})}
