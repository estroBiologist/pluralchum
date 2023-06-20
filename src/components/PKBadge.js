const React = BdApi.React;

class PKBadge extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    var linkStyle = {
      color: '#ffffff',
    };
    return (
      <div>
        <a style={linkStyle} onClick={() => this.props.onClick(this.props.pk_id)}>
          PK
        </a>
      </div>
    );
  }
}

module.exports = PKBadge;
