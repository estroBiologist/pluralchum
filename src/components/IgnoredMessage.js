const React = BdApi.React;

function getHeaderId(label) {
  return /message-username-(?<headerId>\d+)/.exec(label)?.groups?.headerId;
}

export function hookupUnignored(unignoredMap, author) {
  let header = getHeaderId(author);
  const [unignored, setUnignored] = React.useState(unignoredMap.get(header) ?? []);

  unignoredMap.addListener(function (key, value) {
    if (key === header) {
      setUnignored(value);
    }
  });

  return [[...unignored], setUnignored];
}

function getUnignored(unignoredMap, message, messageNode, label) {
  const [unignored] = hookupUnignored(unignoredMap, label);

  if (!unignored.find(({ id }) => id === message.id)) {
    unignored.push({ id: message.id, node: messageNode, timestamp: message.timestamp });
    unignored.sort((a, b) => (a.timestamp < b.timestamp ? -1 : a.timestamp > b.timestamp ? 1 : 0));
    unignoredMap.set(getHeaderId(label), unignored);
  }

  return unignored.map(({ node }) => node);
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

export default function IgnoredMessage({ unignoredMap, message, messageNode, label, compact }) {
  const [expanded, setExpanded] = React.useState(false);
  const unignored = getUnignored(unignoredMap, message, messageNode, label);

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
                {unignored.length} ignored {unignored.length === 1 ? 'message' : 'messages'} —{' '}
                <span
                  className='blockedAction__7a70a'
                  role='button'
                  tabIndex='0'
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? 'Collapse' : 'Show'} {unignored.length === 1 ? 'message' : 'messages'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {expanded ? unignored : null}
    </div>
  );
}
