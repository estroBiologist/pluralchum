import { hookupProfile } from '../profiles';
import { useValueCell } from '../utility';
import { HiddenMessage, Reason } from './HiddenMessage';
const RelationshipStore = BdApi.Webpack.Stores.RelationshipStore;

function lookForMatch(messageId) {
  const node = document.querySelector('[data-list-id="chat-messages"]');
  const component = BdApi.ReactUtils.getInternalInstance(node)?.memoizedProps?.children?.[1]?.find(m => m.key === messageId);
  if (component) {
    const message = component.props?.message;
    const groupId = component.props?.groupId;
    if (message && groupId) {
      return { message, groupId };
    } else {
      return null;
    }
  }
}

function useMessage(messageId) {
  let [ret, setRet] = React.useState({ message: null, groupId: null });

  React.useEffect(function () {
    let mutationObserver;
    const r = lookForMatch(messageId);

    if (r && messageId) {
      setRet(r);
    } else if (messageId) {
      mutationObserver = new MutationObserver(function () {
        const r = lookForMatch(messageId);
        if (r) {
          setRet(r);
          mutationObserver.disconnect();
        }
      });
      const node = document.querySelector('[data-list-id="chat-messages"]');
      mutationObserver.observe(node, { childList: true });
    }
    return function () {
      mutationObserver?.disconnect();
    }
  }, [messageId])

  return ret;
}

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

export default function MessageProxy({ profileMap, enabledCell, unblockedMap, messageNode, messageId }) {
  const [enabled] = useValueCell(enabledCell);
  let { message, groupId } = useMessage(messageId);

  if (enabled && message && groupId) {
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
