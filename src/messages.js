const MessageContent = BdApi.Webpack.getModule(m => m?.type?.toString().includes('messageContent'));
const MessageHeader = BdApi.Webpack.getModule(BdApi.Webpack.Filters.byStrings('showTimestampOnHover'), {
  defaultExport: false,
});
const ChannelStore = ZLibrary.DiscordModules.ChannelStore;
const React = BdApi.React;
import PKBadge from './components/PKBadge.js';
import { ColourPreference } from './data.js';
import { updateProfile, ProfileStatus } from './profiles.js';
import { isProxiedMessage } from './utility.js';

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

function hookupProfile(profileMap, userHash) {
  // By accessing the profile and settings through react hooks, react will know
  // to redraw the component when some data gets updated.
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

function hookupValueCell(cell) {
  const [value, setValue] = React.useState(cell.get());
  React.useEffect(function () {
    return cell.addListener(setValue);
  });

  return [value, setValue];
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

function handleMessageContent(props, component, settingsCell, profileMap) {
  let userHash = getUserHash(props.message.author);
  const [profile] = hookupProfile(profileMap, userHash);
  const [settings] = hookupValueCell(settingsCell);

  const channel = ChannelStore.getChannel(props.message.channel_id);

  if (!channel || !channel.guild_id) return; //No webhooks here lol

  if (settings.doColourText && profile) {
    updateProfile(props.message, profileMap, channel.guild_id);
    setMessageTextColour(component, settings, profile);
  }
}

export function patchMessageContent(pluginName, settings, profileMap) {
  BdApi.Patcher.after(pluginName, MessageContent, 'type', function (_, [props], ret) {
    handleMessageContent(props, ret, settings, profileMap);
  });
}

function servername(props, profile) {
  if (!Object.hasOwn(props.message.author, 'username_real')) {
    props.message.author.username_real = props.message.author.username.slice();
  }

  // most batshit string length function on earth
  const count = str => {
    const regex = /\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji_Presentation}|\p{Emoji}\uFE0F|./gu;
    return ((str || '').match(regex) || []).length;
  };

  let username_len = count(props.message.author.username_real);
  let tag_len = count(profile.tag) + 1;

  return props.message.author.username_real.slice(0, username_len - tag_len);
}

function getUsername(settings, username, servername) {
  if (settings.useServerNames && servername) {
    return servername;
  } else {
    return username;
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
    className: 'username-h_Y3Us',
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
      return member.server_settings?.[guildId]?.role_color;
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
      return member.server_settings?.[guildId]?.role_color;
    default:
      return null;
  }
}

function createHeaderChildren(props, settings, profileMap, profile, userHash) {
  let { memberColourPref, tagColourPref } = settings;

  let username = getUsername(settings, profile.name, servername(props, profile));
  let member_tag = profile.tag;

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
    tree.push(React.createElement('span', tagProps, ' ' + member_tag.toString() + ' '));
  } else {
    tree.push(React.createElement('span', userProps, username));
    tree.push(React.createElement('span', tagProps, ' ' + member_tag.toString()));
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

function handleMessageHeader(props, component, settingsCell, profileMap) {
  let userHash = getUserHash(props.message.author);
  const [profile] = hookupProfile(profileMap, userHash);
  const [settings] = hookupValueCell(settingsCell);

  if (!isProxiedMessage(props.message)) {
    return;
  }

  updateProfile(props.message, profileMap, props.guildId);

  if (profile && (profile.status === ProfileStatus.Done || profile.status === ProfileStatus.Updating)) {
    if (component?.props?.username?.props) {
      component.props.username.props.children = createHeaderChildren(props, settings, profileMap, profile, userHash);
    }
  } else if (!profile || profile.status === ProfileStatus.Requesting) {
    replaceBotWithPK(component, { status: ProfileStatus.Requesting }, profileMap, userHash);
  }
}

export function patchMessageHeader(pluginName, settings, profileMap) {
  // This could break with any Discord update but oh well
  // We look up the message header module, which has two functions; The mangled `default` fn, and the one we get
  // So we just sort of patch all the member functions in the module and hope for the best
  //
  // i am sorry
  //
  for (const member in MessageHeader) {
    BdApi.Patcher.after(pluginName, MessageHeader, member, function (_, [props], ret) {
      handleMessageHeader(props, ret, settings, profileMap);
    });
  }
}
