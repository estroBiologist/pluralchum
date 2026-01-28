import Blocked from './blocked.svg';
import Ignored from './ignored.svg';

const React = BdApi.React;

export const Reason = {
  Blocked: 'BLOCKED',
  Ignored: 'IGNORED',
};

export function hookupUnblocked(unblockedMap, groupId) {
  const [unblocked, setUnblocked] = React.useState(unblockedMap.get(groupId) ?? []);

  unblockedMap.addListener(function (key, value) {
    if (key === groupId) {
      setUnblocked(value);
    }
  });

  return [[...unblocked], setUnblocked];
}

function getUnblocked(unblockedMap, message, messageNode, groupId) {
  const [unblocked] = hookupUnblocked(unblockedMap, groupId);

  if (!unblocked.find(({ id }) => id === message.id)) {
    unblocked.push({ id: message.id, node: messageNode, timestamp: message.timestamp });
    unblocked.sort((a, b) => (a.timestamp < b.timestamp ? -1 : a.timestamp > b.timestamp ? 1 : 0));
    unblockedMap.set(groupId, unblocked);
  }

  return unblocked.map(({ node }) => node);
}

function HiddenIcon({ reason }) {
  return (
    <div className='iconContainer__235ca'>
      {reason === Reason.Blocked ? (
        <Blocked aria-hidden='true' role='img' className='blockedIcon__7a70a' />
      ) : reason === Reason.Ignored ? (
        <Ignored aria-hidden='true' role='img' className='blockedIcon__7a70a' />
      ) : null}
    </div>
  );
}

export function HiddenMessage({ unblockedMap, message, messageNode, groupId, reason }) {
  const [expanded, setExpanded] = React.useState(false);
  const unblocked = getUnblocked(unblockedMap, message, messageNode, groupId);

  if (message.id !== groupId) {
    return null;
  }

  return (
    <div className='groupStart__5126c'>
      <div className='wrapper_c19a55 cozy_c19a55 zalgo_c19a55' role='article'>
        <div className='contents_c19a55'>
          <div className='blockedSystemMessage__7a70a container__235ca cozy__235ca'>
            <HiddenIcon reason={reason} />
            <div className='content__235ca'>
              <div className='blockedMessageText__7a70a'>
                {unblocked.length} {reason === Reason.Blocked ? 'blocked' : 'ignored'}{' '}
                {unblocked.length === 1 ? 'message' : 'messages'} —{' '}
                <span
                  className='blockedAction__7a70a'
                  role='button'
                  tabIndex='0'
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? 'Hide' : 'Show'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {expanded ? unblocked : null}
    </div>
  );
}
