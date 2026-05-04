import { hookupProfile } from '../profiles';
import { useValueCell } from '../utility';
import { HiddenMessage, Reason } from './HiddenMessage';
const RelationshipStore = BdApi.Webpack.Stores.RelationshipStore;

function checkHidden(profile) {
  if (profile?.sender && RelationshipStore.isBlocked(profile.sender)) {
    return Reason.Blocked;
  } else if (profile?.sender && RelationshipStore.isIgnored(profile.sender)) {
    return Reason.Ignored;
  } else {
    return null;
  }
}

function MessageProxyInner({ profileMap, unblockedMap, messageNode, message, groupId }) {
  let [profile] = hookupProfile(profileMap, message);

  let reason = checkHidden(profile);
  if (reason) {
    return (
      <HiddenMessage
        unblockedMap={unblockedMap}
        message={message}
        messageNode={messageNode}
        groupId={groupId}
        reason={reason}
      />
    );
  } else {
    return messageNode;
  }
}

export default function MessageProxy({ profileMap, enabledCell, unblockedMap, messageNode, message, groupId }) {
  let [enabled] = useValueCell(enabledCell);

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
