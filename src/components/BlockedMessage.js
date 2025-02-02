const React = BdApi.React;

function getHeaderId(label) {
  return /message-username-(?<headerId>\d+)/.exec(label)?.groups?.headerId;
}

export function hookupUnblocked(unblockedMap, author) {
  let header = getHeaderId(author);
  const [unblocked, setUnblocked] = React.useState(unblockedMap.get(header) ?? []);

  unblockedMap.addListener(function (key, value) {
    if (key === header) {
      setUnblocked(value);
    }
  });

  return [[...unblocked], setUnblocked];
}

function getUnblocked(unblockedMap, message, messageNode, label) {
  const [unblocked] = hookupUnblocked(unblockedMap, label);

  if (!unblocked.find(({ id }) => id === message.id)) {
    unblocked.push({ id: message.id, node: messageNode, timestamp: message.timestamp });
    unblocked.sort((a, b) => (a.timestamp < b.timestamp ? -1 : a.timestamp > b.timestamp ? 1 : 0));
    unblockedMap.set(getHeaderId(label), unblocked);
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

export default function BlockedMessage({ unblockedMap, message, messageNode, label, compact }) {
  const [expanded, setExpanded] = React.useState(false);
  const unblocked = getUnblocked(unblockedMap, message, messageNode, label);

  if (compact) {
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
                  {expanded ? 'Collapse' : 'Show'} {unblocked.length === 1 ? 'message' : 'messages'}
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
