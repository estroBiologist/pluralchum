const React = BdApi.React;
import { ThreeDots } from 'svg-loaders-react';
import { ProfileStatus } from '../profiles.js';

export default function PopoutPKBadge({ profileMap, userHash, profile }) {
  const status = profile.status;

  let onClick = function () {
    profileMap.update(userHash, function (profile) {
      profile.status = ProfileStatus.Stale;
      return profile;
    });
  };

  const linkStyle = {
    color: '#ffffff',
  };
  let content = 'PK';
  if ([ProfileStatus.Updating, ProfileStatus.Requesting, ProfileStatus.Stale].includes(status)) {
    let dotstyle = {
      height: '.4em',
      width: '100%',
      display: 'inline',
      'vertical-align': 'top',
      'padding-top': '0.55em',
    };
    content = <ThreeDots style={dotstyle} />;
  }

  return (
    <span className='c19a557985eb7793-botTagCozy c19a557985eb7793-botTag _82f0793afa59e5dc-botTagRegular _82f0793afa59e5dc-botTag _82f0793afa59e5dc-rem'>
      <div className='_82f0793afa59e5dc-botText'>
        <a style={linkStyle} onClick={onClick}>
          {content}
        </a>
      </div>
    </span>
  );
}
