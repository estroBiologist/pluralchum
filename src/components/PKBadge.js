import { React } from '../common.js';
import { ThreeDots } from 'svg-loaders-react';
import { ProfileStatus } from '../profiles.js';

export default function PKBadge({ profileMap, userHash, profile }) {
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
    <span className='botTagCozy__85d43 botTag__11e95 botTagRegular_fc4b4a botTag__4211a rem_be1e7a'>
      <div className='botText_daff56'>
        <a style={linkStyle} onClick={onClick}>
          {content}
        </a>
      </div>
    </span>
  );
}
