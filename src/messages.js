const MessageContent = BdApi.Webpack.getModule(m => {
  let s = m?.type?.toString();
  return s && s.includes('messageContent') && s.includes('MESSAGE_EDITED');
});
const MessageHeader = BdApi.Webpack.getModule(BdApi.Webpack.Filters.byStrings('showTimestampOnHover'), {
  defaultExport: false,
});
const [Message, blocker] = BdApi.Webpack.getWithKey(
  BdApi.Webpack.Filters.byStrings('.cozy', '.hasReply', '.hasThread', '.isSystemMessage'),
);
const React = BdApi.React;

import { MapCell, pluginName } from './utility.js';
import MessageContentProxy from './components/MessageContentProxy.js';
import MessageHeaderProxy from './components/MessageHeaderProxy.js';
import MessageProxy from './components/MessageProxy.js';

export function patchMessageContent(settings, profileMap, enabled) {
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

// This could break with any Discord update but oh well
// We look up the message header module, which has two functions; The mangled `default` fn, and the one we get
// So we just sort of patch all the member functions in the module and hope for the best
//
// i am sorry
//
export function patchMessageHeader(settings, profileMap, enabled) {
  BdApi.Patcher.instead(pluginName, MessageHeader, "default", function (ctx, [props], f) {
    return (
      <MessageHeaderProxy
        settingsCell={settings}
        profileMap={profileMap}
        enabledCell={enabled}
        messageHeader={f.call(ctx, props)}
        message={props.message}
        guildId={props.guildId}
        onClickAvatar={props.onClickAvatar}
      />
    );
  });
}

export function patchMessage(profileMap, enabled) {
  let unblockedMap = new MapCell({});

  BdApi.Patcher.instead(pluginName, Message, blocker, function (ctx, [props], f) {
    return (
      <MessageProxy
        profileMap={profileMap}
        enabledCell={enabled}
        unblockedMap={unblockedMap}
        messageNode={f.call(ctx, props)}
        message={props.childrenMessageContent?.props?.message}
        label={props['aria-labelledby']}
        compact={props?.childrenHeader?.props?.compact}
      />
    );
  });
}
