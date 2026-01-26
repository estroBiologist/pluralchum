import { hookupProfile } from '../profiles';
import { hookupValueCell } from '../utility';
import BlockedMessage from './BlockedMessage';
let isBlocked = BdApi.Webpack.getByKeys('isBlocked').isBlocked;

const React = BdApi.React;

function isBlockedProfile(profile) {
  return profile?.sender && isBlocked(profile.sender);
}

function MessageProxyInner({ profileMap, unblockedMap, messageNode, message, groupId }) {
  let [profile] = hookupProfile(profileMap, message.author);

  if (isBlockedProfile(profile)) {
    return <BlockedMessage unblockedMap={unblockedMap} message={message} messageNode={messageNode} groupId={groupId} />;
  } else {
    return messageNode;
  }
}

export default function MessageProxy({ profileMap, enabledCell, unblockedMap, messageNode, message, groupId }) {
  let [enabled] = hookupValueCell(enabledCell);

  if (enabled && message) {
    return (
      <MessageProxyInner
        profileMap={profileMap}
        unblockedMap={unblockedMap}
        messageNode={messageNode}
        message={message}
        groupId={groupId}
      />
    );
  } else {
    return messageNode;
  }
}
