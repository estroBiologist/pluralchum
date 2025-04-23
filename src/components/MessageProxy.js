import { hookupProfile } from '../profiles';
import { hookupValueCell } from '../utility';
import BlockedMessage from './BlockedMessage';
import IgnoredMessage from './IgnoredMessage';
let isBlocked = BdApi.Webpack.getByKeys('isBlocked').isBlocked;
let isIgnored = BdApi.Webpack.getByKeys('isIgnored').isIgnored;

const React = BdApi.React;

function isBlockedProfile(profile) {
  return profile?.sender && isBlocked(profile.sender);
}
function isIgnoredProfile(profile) {
  return profile?.sender && isIgnored(profile.sender);
}

function MessageProxyInner({ profileMap, unblockedMap, unignoredMap, messageNode, message, label, compact }) {
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
  } else if (isIgnoredProfile(profile)) {
    return (
      <IgnoredMessage
        unignoredMap={unignoredMap}
        message={message}
        messageNode={messageNode}
        label={label}
        compact={compact}
      />
    );
  } else{
    return messageNode;
  }
}

export default function MessageProxy({ profileMap, enabledCell, unblockedMap, unignoredMap, messageNode, message, label, compact }) {
  let [enabled] = hookupValueCell(enabledCell);

  if (enabled && message) {
    return (
      <MessageProxyInner
        profileMap={profileMap}
        unblockedMap={unblockedMap}
        unignoredMap={unignoredMap}
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
