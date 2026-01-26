const Webpack = BdApi.Webpack;
const GuildMemberStore = Webpack.getStore('GuildMemberStore');
const React = BdApi.React;

import { fix } from '@ariagivens/discord-unicode-fix-js';
import { acceptableContrast } from '../contrast.js';
import { ColourPreference } from '../data.js';
import HeaderPKBadge from './HeaderPKBadge.js';

function normalize(str) {
  return fix(str).normalize('NFD');
}

function getServername(username, tag) {
  if (!tag || tag.length === 0) {
    return null;
  }

  username = normalize(username);
  tag = normalize(tag);

  let username_len = username.length;
  let tag_len = tag.length + 1; // include the space as part of the tag

  if (username.endsWith(tag)) {
    return username.slice(0, username_len - tag_len);
  } else {
    return null;
  }
}

function getUsername(useServerNames, author, profile) {
  let username = normalize(author.username_real ?? author.username.slice());
  let tag = normalize(profile.tag ?? '');
  if (useServerNames) {
    let servername = getServername(username, tag);
    if (servername) {
      // we can seperate servername and tag
      return { username: servername, memberTag: tag };
    } else {
      // most likely using a servertag, treat the whole thing as the username
      return { username, memberTag: '' };
    }
  } else {
    return { username: normalize(profile.name), memberTag: tag };
  }
}

function NameSegment({ colour, name }) {
  return (
    <span className='username_c19a55 pk-name-segment' style={{ color: colour }}>
      {name}
    </span>
  );
}

function getColour(colourPref, member, guildId, settings, defaultSystemColourToMemberColour) {
  let colour;

  switch (colourPref) {
    case ColourPreference.Member:
      colour = member.color ?? member.system_color;
      break;
    case ColourPreference.System:
      if (defaultSystemColourToMemberColour) {
        colour = member.system_color ?? member.color;
      } else {
        colour = member.system_color;
      }
      break;
    case ColourPreference.Role:
      colour = GuildMemberStore.getMember(guildId, member.sender)?.colorString;
      break;
    default:
      colour = null;
      break;
  }

  let { doContrastTest, contrastTestColour, contrastThreshold } = settings;
  if (colour && acceptableContrast(colour, doContrastTest, contrastTestColour, contrastThreshold)) {
    return colour;
  } else {
    return null;
  }
}

function createHeaderChildren(message, guildId, settings, profileMap, profile, userHash, onClickUsername) {
  let { memberColourPref, tagColourPref } = settings;

  let { username, memberTag } = getUsername(settings.useServerNames, message.author, profile);

  let memberColour = getColour(memberColourPref, profile, guildId, settings, true);
  let tagColour = getColour(tagColourPref, profile, guildId, settings, false);

  let doSysTag = memberTag && memberTag.length > 0;

  return [
    <span className='username_c19a55 pk-name' onClick={onClickUsername}>
      <NameSegment colour={memberColour} name={username} />
      {doSysTag ? ' ' : null}
      {doSysTag ? <NameSegment colour={tagColour} name={memberTag} /> : null}
    </span>,
    <HeaderPKBadge profileMap={profileMap} userHash={userHash} profile={profile} />,
  ];
}

export default function ColorMessageHeader({
  settings,
  profileMap,
  profile,
  userHash,
  messageHeader,
  message,
  guildId,
  onClickUsername,
}) {
  return {
    ...messageHeader,
    props: {
      ...messageHeader.props,
      children: [
        createHeaderChildren(message, guildId, settings, profileMap, profile, userHash, onClickUsername),
        // Triggering the popout with correct position is hard, so we just leave the original
        // header here (but hide it using CSS) so the popout can take its position.
        <div className='pk-hidden'>{messageHeader.props.children}</div>,
      ],
    },
  };
}
