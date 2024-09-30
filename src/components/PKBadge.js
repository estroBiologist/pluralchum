const React = BdApi.React;
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
    <span className='botTagCozy_f9f2ca botTag_f9f2ca botTagRegular_a9e77f botTag_a9e77f rem_a9e77f'>
      <div className='botText_a9e77f'>
        <a style={linkStyle} onClick={onClick}>
          {content}
        </a>
      </div>
    </span>
  );
}
