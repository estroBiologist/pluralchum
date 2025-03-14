const React = BdApi.React;

import HeaderPKBadge from './HeaderPKBadge.js';

export default function LoadingMessageHeader({ messageHeader, profile, profileMap, userHash }) {
  return {
    ...messageHeader,
    props: {
      ...messageHeader.props,
      username: {
        ...messageHeader.props.username,
        props: {
          ...messageHeader.props.username.props,
          children: messageHeader.props.username.props.children.with(1, {
            ...messageHeader.props.username.props.children[1],
            props: {
              ...messageHeader.props.username.props.children[1].props,
              children: messageHeader.props.username.props.children[1].props.children.with(0, {
                ...messageHeader.props.username.props.children[1].props.children[0],
                props: {
                  ...messageHeader.props.username.props.children[1].props.children[0].props,
                  decorations: [<HeaderPKBadge profileMap={profileMap} userHash={userHash} profile={profile} />],
                },
              }),
            },
          }),
        },
      },
    },
  };
}
