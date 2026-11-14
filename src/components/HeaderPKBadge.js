import { ThreeDots } from './ThreeDots.js';
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
    <span className='botTagCozy_2i8Bfm botTag_2i8Bfm botTagRegular_feVUtO botTag_feVUtO rem_feVUtO'>
      <div className='botText_feVUtO'>
        <a style={linkStyle} onClick={onClick}>
          {content}
        </a>
      </div>
    </span>
  );
}
