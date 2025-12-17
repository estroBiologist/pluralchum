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
    <div className='_235ca3770d90ab7c-iconContainer'>
      <svg aria-hidden='true' role='img' className='_7a70a677dab584df-blockedIcon' width='24' height='24' viewBox='0 0 24 24'>
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
    <div className='_5126c0cd07f243a0-groupStart'>
      <div className='c19a557985eb7793-wrapper c19a557985eb7793-cozy c19a557985eb7793-zalgo' role='article'>
        <div className='c19a557985eb7793-contents'>
          <div className='_7a70a677dab584df-blockedSystemMessage _235ca3770d90ab7c-container _235ca3770d90ab7c-cozy'>
            <XIcon />
            <div className='_235ca3770d90ab7c-content'>
              <div className='_7a70a677dab584df-blockedMessageText'>
                {unblocked.length} blocked {unblocked.length === 1 ? 'message' : 'messages'} —{' '}
                <span
                  className='_7a70a677dab584df-blockedAction'
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
