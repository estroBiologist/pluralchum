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

function XEyeIcon() {
  return (
    <div className='iconContainer__235ca'>
      <svg
        class='blockedIcon__7a70a'
        aria-hidden='true'
        role='img'
        xmlns='http://www.w3.org/2000/svg'
        width='24'
        height='24'
        fill='none'
        viewBox='0 0 24 24'
      >
        <path
          fill='currentColor'
          d='M1.3 21.3a1 1 0 1 0 1.4 1.4l20-20a1 1 0 0 0-1.4-1.4l-20 20ZM3.16 16.05c.18.24.53.26.74.05l.72-.72c.18-.18.2-.45.05-.66a15.7 15.7 0 0 1-1.43-2.52.48.48 0 0 1 0-.4c.4-.9 1.18-2.37 2.37-3.72C7.13 6.38 9.2 5 12 5c.82 0 1.58.12 2.28.33.18.05.38 0 .52-.13l.8-.8c.25-.25.18-.67-.15-.79A9.79 9.79 0 0 0 12 3C4.89 3 1.73 10.11 1.11 11.7a.83.83 0 0 0 0 .6c.25.64.9 2.15 2.05 3.75Z'
          class=''
        ></path>
        <path
          fill='currentColor'
          d='M8.18 10.81c-.13.43.36.65.67.34l2.3-2.3c.31-.31.09-.8-.34-.67a4 4 0 0 0-2.63 2.63ZM12.85 15.15c-.31.31-.09.8.34.67a4.01 4.01 0 0 0 2.63-2.63c.13-.43-.36-.65-.67-.34l-2.3 2.3Z'
          class=''
        ></path>
        <path
          fill='currentColor'
          d='M9.72 18.67a.52.52 0 0 0-.52.13l-.8.8c-.25.25-.18.67.15.79 1.03.38 2.18.61 3.45.61 7.11 0 10.27-7.11 10.89-8.7a.83.83 0 0 0 0-.6c-.25-.64-.9-2.15-2.05-3.75a.49.49 0 0 0-.74-.05l-.72.72a.51.51 0 0 0-.05.66 15.7 15.7 0 0 1 1.43 2.52c.06.13.06.27 0 .4-.4.9-1.18 2.37-2.37 3.72C16.87 17.62 14.8 19 12 19c-.82 0-1.58-.12-2.28-.33Z'
          class=''
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
            <XEyeIcon />
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
