const React = BdApi.React;

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

function XIcon() {
  return (
    <div className='iconContainer__235ca'>
      <svg aria-hidden='true' role='img' className='blockedIcon__7a70a' width='24' height='24' viewBox='0 0 24 24'>
        <path
          fill='currentColor'
          d='M18.4 4L12 10.4L5.6 4L4 5.6L10.4 12L4 18.4L5.6 20L12 13.6L18.4 20L20 18.4L13.6 12L20 5.6L18.4 4Z'
        ></path>
      </svg>
    </div>
  );
}

export default function BlockedMessage({ unblockedMap, message, messageNode, groupId }) {
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
            <XIcon />
            <div className='content__235ca'>
              <div className='blockedMessageText__7a70a'>
                {unblocked.length} blocked {unblocked.length === 1 ? 'message' : 'messages'} —{' '}
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
