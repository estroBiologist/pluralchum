import { React, MessageUtils } from '../common.js';
import { hookupProfile } from '../profiles';
import { hookupValueCell } from '../utility';
import BlockedMessage from './BlockedMessage';

function isBlockedProfile(profile) {
  return profile?.sender && MessageUtils.isBlocked(profile.sender);
}

function MessageProxyInner({ profileMap, unblockedMap, messageNode, message, label, compact }) {
  let [profile] = hookupProfile(profileMap, message.author);

  if (isBlockedProfile(profile)) {
    return (
      <BlockedMessage
        unblockedMap={unblockedMap}
        message={message}
        messageNode={messageNode}
        label={label}
        compact={compact}
      />
    );
    // return messageNode;
  } else {
    return messageNode;
  }
}

export default function MessageProxy({ profileMap, enabledCell, unblockedMap, messageNode, message, label, compact }) {
  let [enabled] = hookupValueCell(enabledCell);

  if (enabled && message) {
    return (
      <MessageProxyInner
        profileMap={profileMap}
        unblockedMap={unblockedMap}
        messageNode={messageNode}
        message={message}
        label={label}
        compact={compact}
      />
    );
  } else {
    return messageNode;
  }
}
