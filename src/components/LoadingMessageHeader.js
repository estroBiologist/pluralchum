const React = BdApi.React;

import HeaderPKBadge from './HeaderPKBadge.js';

export default function LoadingMessageHeader({ messageHeader, profile, profileMap, userHash }) {
  return {
    ...messageHeader,
    props: {
      ...messageHeader.props,
      children: [
        messageHeader.props.children[4],
        <HeaderPKBadge profileMap={profileMap} userHash={userHash} profile={profile} />,
      ],
    },
  };
}
