const Webpack = BdApi.Webpack;
const GuildMemberStore = Webpack.getStore('GuildMemberStore');
const React = BdApi.React;

import { fix } from '@ariagivens/discord-unicode-fix-js';
import { acceptableContrast } from '../contrast.js';
import { ColourPreference } from '../data.js';
import PKBadge from './PKBadge.js';

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
      return { username: servername, member_tag: tag };
    } else {
      // most likely using a servertag, treat the whole thing as the username
      return { username, member_tag: '' };
    }
  } else {
    return { username: normalize(profile.name), member_tag: tag };
  }
}

function nameProps(author, type, settings, colour) {
  let { doContrastTest, contrastTestColour, contrastThreshold } = settings;

  let props = {
    user: author,
    className: 'username__0b0e7',
    type: type,
  };

  if (colour && acceptableContrast(colour, doContrastTest, contrastTestColour, contrastThreshold)) {
    props.style = { color: colour };
  }

  return props;
}

function memberColour(colourPref, member, guildId) {
  switch (colourPref) {
    case ColourPreference.Member:
      return member.color ?? member.system_color;
    case ColourPreference.System:
      return member.system_color ?? member.color;
    case ColourPreference.Role:
      return GuildMemberStore.getMember(guildId, member.sender)?.colorString;
    default:
      return null;
  }
}

function tagColour(colourPref, member, guildId) {
  switch (colourPref) {
    case ColourPreference.Member:
      return member.color ?? member.system_color;
    case ColourPreference.System:
      return member.system_color;
    case ColourPreference.Role:
      return GuildMemberStore.getMember(guildId, member.sender)?.colorString;
    default:
      return null;
  }
}

function createHeaderChildren(message, guildId, settings, profileMap, profile, userHash) {
  let { memberColourPref, tagColourPref } = settings;

  let { username, member_tag } = getUsername(settings.useServerNames, message.author, profile);

  let pkBadge = <PKBadge profileMap={profileMap} userHash={userHash} profile={profile} />;

  let member_colour = memberColour(memberColourPref, profile, guildId);
  let userProps = nameProps(message.author, 'member_name', settings, member_colour);

  let tag_colour = tagColour(tagColourPref, profile, guildId);
  let tagProps = nameProps(message.author, 'system_tag', settings, tag_colour);

  if (!member_tag || typeof member_tag !== 'string') member_tag = '';

  let elements = [];

  elements.push(React.createElement('span', userProps, username));
  if (member_tag && member_tag.length > 0) {
    elements.push(React.createElement('span', tagProps, ' ' + member_tag.toString()));
  }
  elements.push(pkBadge);

  return elements;
}

export default function ColorMessageHeader({
  settings,
  profileMap,
  profile,
  userHash,
  messageHeader,
  message,
  guildId,
}) {
  return {
    ...messageHeader,
    props: {
      ...messageHeader.props,
      username: {
        ...messageHeader.props.username,
        props: {
          ...messageHeader.props.username.props,
          children: createHeaderChildren(message, guildId, settings, profileMap, profile, userHash),
        },
      },
    },
  };
}
