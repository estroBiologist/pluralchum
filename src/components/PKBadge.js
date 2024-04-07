const React = BdApi.React;
import { ThreeDots } from 'svg-loaders-react';
import { ProfileStatus } from '../profiles.js';

export default class PKBadge extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    var linkStyle = {
      color: '#ffffff',
    };
    let content = 'PK';
    if ([ProfileStatus.Updating, ProfileStatus.Requesting, ProfileStatus.Stale].includes(this.props.status)) {
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
          <a style={linkStyle} onClick={() => this.props.onClick()}>
            {content}
          </a>
        </div>
      </span>
    );
  }
}
