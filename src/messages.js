import { React, Components } from './common.js';

import { MapCell, patchComponent } from './utility.js';
import MessageContentProxy from './components/MessageContentProxy.js';
import MessageHeaderProxy from './components/MessageHeaderProxy.js';
import MessageProxy from './components/MessageProxy.js';
import Popout from "./components/Popout.js"

export function patchMessageContent(settings, profileMap, enabled) {
  patchComponent(Components.MessageContent, (ctx, [props], f) => {
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
  patchComponent(Components.MessageHeader, (ctx, [props], f) => {
    const ret = f.call(ctx, {
      ...props,
      renderPopout: (_props, message) => {
        return (
          <Popout
            props={_props}
            message={message}
            renderPopout={props.renderPopout}
            profileMap={profileMap}
          />
        );
      },
    });

    return (
      <MessageHeaderProxy
        settingsCell={settings}
        profileMap={profileMap}
        enabledCell={enabled}
        messageHeader={ret}
        message={props.message}
        guildId={props.guildId}
        onClickAvatar={props.onClickAvatar}
      />
    );
  });
}

export function patchMessage(profileMap, enabled) {
  let unblockedMap = new MapCell({});

  patchComponent(Components.Message, (ctx, [props], f) => {
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
