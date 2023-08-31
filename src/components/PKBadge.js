const React = BdApi.React;
const { ThreeDots } = require('svg-loaders-react');
const { ProfileStatus } = require('../profiles.js');

class PKBadge extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    var linkStyle = {
      color: '#ffffff',
    };
    let content = "PK";
    if (this.props.status === ProfileStatus.Updating || this.props.status === ProfileStatus.Requesting) {
      let dotstyle = {
        'height': '.4em',
        'width': '100%',
        'display': 'inline',
        'vertical-align': 'top',
        'padding-top': '0.55em'
      };
      content = <ThreeDots style={dotstyle} />;
    }
    return (
      <span className='botTagCozy-3NTBvK botTag-1NoD0B botTagRegular-kpctgU botTag-7aX5WZ rem-3kT9wc'>
        <div className='botText-1fD6Qk'>
          <a style={linkStyle} onClick={() => this.props.onClick()}>
            {content}
          </a>
        </div>
      </span>
    );
  }
}

module.exports = PKBadge;
