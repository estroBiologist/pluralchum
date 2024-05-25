import { React } from '../common.js';
import PKBadge from './PKBadge.js';

// function replaceBotWithPK(component, profile, profileMap, userHash) {
//   if (component?.props?.username?.props?.children?.[1]?.props?.children[0]?.props?.decorations) {
//     component.props.username.props.children[1].props.children[0].props.decorations = [
//       <PKBadge profileMap={profileMap} userHash={userHash} profile={profile} />,
//     ];
//   }
// }

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
                  decorations: [<PKBadge profileMap={profileMap} userHash={userHash} profile={profile} />],
                },
              }),
            },
          }),
        },
      },
    },
  };
}
