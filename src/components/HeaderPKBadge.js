const React = BdApi.React;
import { ProfileStatus } from '../profiles.js';
import Loader from './Loader.js';

export default function PopoutPKBadge({ profileMap, userHash, profile}) {
  const status = profile.status;

  let onClick = function () {
    let updateFunction = function (profile) {
      profile.status = ProfileStatus.Stale;
      return profile;
    };
    profileMap.members.update(userHash, updateFunction);
    profileMap.systems.update(profile.system, updateFunction);
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
    content = <Loader style={dotstyle} />;
  }

  return (
    <span className='botTagCozy_c19a55 botTag_c19a55 botTagRegular__82f07 botTag__82f07 rem__82f07'>
      <div className='botText__82f07'>
        <a style={linkStyle} onClick={onClick}>
          {content}
        </a>
      </div>
    </span>
  );
}
