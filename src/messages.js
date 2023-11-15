const MessageContent = BdApi.Webpack.getModule(m => {
  let s = m?.type?.toString();
  return s && s.includes('messageContent') && s.includes('MESSAGE_EDITED');
});
const MessageHeader = BdApi.Webpack.getModule(BdApi.Webpack.Filters.byStrings('showTimestampOnHover'), {
  defaultExport: false,
});
import ZLibrary from './external/ZLibrary.js';
const ChannelStore = ZLibrary.DiscordModules.ChannelStore;
const GuildMemberStore = ZLibrary.DiscordModules.GuildMemberStore;
const React = BdApi.React;
import PKBadge from './components/PKBadge.js';
import { ColourPreference } from './data.js';
import { updateProfile, ProfileStatus } from './profiles.js';
import { ValueCell, isProxiedMessage, pluginName, hookupValueCell } from './utility.js';
import * as Patch from './patch.js';
import { fix } from '@ariagivens/discord-unicode-fix-js';

function hashCode(text) {
  var hash = 0;
  for (var i = 0; i < text.length; i++) {
    var char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

function getUserHash(author) {
  let username = author.username;
  if (Object.hasOwn(author, 'username_real')) username = author.username_real;

  return hashCode(username + author.avatar);
}

function hookupProfile(profileMap, _ctx, [props], _ret) {
  let userHash = getUserHash(props.message.author);
  const [profile, setProfile] = React.useState(profileMap.get(userHash));
  React.useEffect(function () {
    return profileMap.addListener(function (key, value) {
      if (key === userHash) {
        setProfile(value);
      }
    });
  });

  return [profile, setProfile];
}

function luminance(r, g, b) {
  var a = [r, g, b].map(function (v) {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function contrast(rgb1, rgb2) {
  var lum1 = luminance(rgb1.r, rgb1.g, rgb1.b);
  var lum2 = luminance(rgb2.r, rgb2.g, rgb2.b);
  var brightest = Math.max(lum1, lum2);
  var darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

function hexToRgb(hex) {
  // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF"	)
  var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, function (m, r, g, b) {
    return r + r + g + g + b + b;
  });

  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function acceptableContrast(colour, doContrastTest, contrastTestColour, contrastThreshold) {
  let textContrast = contrast(hexToRgb(colour), hexToRgb(contrastTestColour));
  return !doContrastTest || textContrast >= contrastThreshold;
}

function setMessageTextColour(component, settings, member) {
  let { doContrastTest, contrastTestColour, contrastThreshold } = settings;
  if (member.color && acceptableContrast(member.color, doContrastTest, contrastTestColour, contrastThreshold)) {
    const MessageElements = component.props.children[0];
    // se: Each formatted element gets a separate entry in the array ret.props.children[0].
    // Some of the new elements (specifically headers) have a .markup-XXXXXX h<x> class defined.
    // These classes have a set color, and this overrides the element style on the top level message content element.
    // So, we iterate over message elements that have their own props field, and add the color, item by item.
    // But also plain text in a message *doesn't* have props, so we still have to set ret.props.style for that.
    // Waugh.
    // Making a list of the specific markup types that don't format correctly,
    // Because if we just do this to all formatting, that overrides the URL color too.
    const MarkupTypes = ['h1', 'h2', 'h3'];
    for (const Element of MessageElements) {
      if (MarkupTypes.includes(Element.type)) {
        Element.props.style = {
          color: member.color,
        };
      }
    }
    component.props.style = {
      color: member.color,
    };
  }
}

function handleMessageContent(ctx, [props], component, [settings, profile, profileMap]) {
  const channel = ChannelStore.getChannel(props.message.channel_id);

  if (!channel || !channel.guild_id) return; //No webhooks here lol

  if (
    settings.doColourText &&
    profile &&
    (profile.status === ProfileStatus.Done || profile.status === ProfileStatus.Updating)
  ) {
    updateProfile(props.message, profileMap);
    setMessageTextColour(component, settings, profile);
  }
}

const messageContentPatcher = new Patch.AfterPatcher(pluginName, MessageContent, 'type', [
  hookupValueCell,
  hookupProfile,
  hookupValueCell,
]);

export function patchMessageContent(settings, profileMap) {
  messageContentPatcher.setPatch(handleMessageContent, [settings, profileMap, new ValueCell(profileMap)]);
}

function normalize(str) {
  return fix(str).normalize('NFD');
}

function getServername(username, tag) {
  if (!tag || tag.length === 0) {
    return null;
  }

  username = fix(username).normalize('NFD');
  tag = fix(tag).normalize('NFD');

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

function createPKBadge(profileMap, userHash, profile) {
  // lol
  let onClick = function () {
    profileMap.update(userHash, function (profile) {
      profile.status = ProfileStatus.Stale;
      return profile;
    });
  };

  return <PKBadge status={profile.status} onClick={onClick} />;
}

function nameProps(author, type, settings, colour) {
  let { doContrastTest, contrastTestColour, contrastThreshold } = settings;

  let props = {
    user: author,
    className: 'username_d30d99',
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

function createHeaderChildren(props, settings, profileMap, profile, userHash) {
  let { memberColourPref, tagColourPref } = settings;

  let { username, member_tag } = getUsername(settings.useServerNames, props.message.author, profile);

  let tree = [];

  let pkBadge = createPKBadge(profileMap, userHash, profile);

  let member_colour = memberColour(memberColourPref, profile, props.guildId);
  let userProps = nameProps(props.message.author, 'member_name', settings, member_colour);

  let tag_colour = tagColour(tagColourPref, profile, props.guildId);
  let tagProps = nameProps(props.message.author, 'system_tag', settings, tag_colour);

  if (!member_tag || typeof member_tag !== 'string') member_tag = '';

  if (props.compact) {
    tree.push(pkBadge);
    tree.push(React.createElement('span', userProps, ' ' + username));
    if (member_tag && member_tag.length > 0) {
      tree.push(React.createElement('span', tagProps, ' ' + member_tag.toString() + ' '));
    }
  } else {
    tree.push(React.createElement('span', userProps, username));
    if (member_tag && member_tag.length > 0) {
      tree.push(React.createElement('span', tagProps, ' ' + member_tag.toString()));
    }
    tree.push(pkBadge);
  }

  return tree;
}

function replaceBotWithPK(component, profile, profileMap, userHash) {
  if (component?.props?.username?.props?.children?.[1]?.props?.children[0]?.props?.decorations) {
    component.props.username.props.children[1].props.children[0].props.decorations = [
      createPKBadge(profileMap, userHash, profile),
    ];
  }
}

function handleMessageHeader(ctx, [props], component, [settings, profile, profileMap]) {
  let userHash = getUserHash(props.message.author);

  if (!isProxiedMessage(props.message)) {
    return;
  }

  updateProfile(props.message, profileMap);

  if (profile && (profile.status === ProfileStatus.Done || profile.status === ProfileStatus.Updating)) {
    if (component?.props?.username?.props) {
      component.props.username.props.children = createHeaderChildren(props, settings, profileMap, profile, userHash);
    }
  } else if (!profile || profile.status === ProfileStatus.Requesting) {
    replaceBotWithPK(component, { status: ProfileStatus.Requesting }, profileMap, userHash);
  }
}

// This could break with any Discord update but oh well
// We look up the message header module, which has two functions; The mangled `default` fn, and the one we get
// So we just sort of patch all the member functions in the module and hope for the best
//
// i am sorry
//
const messagerHeaderPatchers = Object.keys(MessageHeader).map(
  member =>
    new Patch.AfterPatcher(pluginName, MessageHeader, member, [hookupValueCell, hookupProfile, hookupValueCell]),
);

export function patchMessageHeader(settings, profileMap) {
  messagerHeaderPatchers.forEach(patcher =>
    patcher.setPatch(handleMessageHeader, [settings, profileMap, new ValueCell(profileMap)]),
  );
}
