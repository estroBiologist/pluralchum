const MessageContent = BdApi.Webpack.getModule(m => m?.type?.toString().includes('messageContent'));
const MessageHeader = BdApi.Webpack.getModule(BdApi.Webpack.Filters.byStrings('showTimestampOnHover'), {
  defaultExport: false,
});
const ChannelStore = ZLibrary.DiscordModules.ChannelStore;
const React = BdApi.React;
const PKBadge = require('./components/PKBadge');

const baseEndpoint = 'https://api.pluralkit.me/v2';

let currentRequests = 0;

function httpGetAsync(theUrl, callback) {
  var xmlHttp = new XMLHttpRequest();

  xmlHttp.onreadystatechange = function () {
    if (xmlHttp.readyState == 4) {
      callback(xmlHttp.responseText, xmlHttp.status);
      currentRequests -= 1;
    }
  };

  currentRequests += 1;
  console.log('Sending request with delay ', currentRequests * 600);
  setTimeout(function () {
    xmlHttp.open('GET', baseEndpoint + theUrl, true); // true for asynchronous
    xmlHttp.send(null);
  }, currentRequests * 600);
}

function pkDataToProfile(data) {
  let profile = {
    name: data.member.name,
    color: '#' + data.member.color,
    tag: data.system.tag,
    id: data.member.id,
    system: data.system.id,
    status: 'DONE',
    system_color: '#' + data.system.color,
  };

  if (data.member.color === null) profile.color = '';

  if (data.system.color === null) profile.system_color = '';

  if (data.member.display_name) {
    profile.name = data.member.display_name;
  }

  return profile;
}

function pkResponseToProfile(response, status) {
  if (status == 200) {
    console.log('RESPONSE');
    let data = JSON.parse(response);
    console.log(data);

    return pkDataToProfile(data);
  } else if (status == 404) {
    return { status: 'NOT_PK' };
  }
}

function createPKCallback(hash, profileMap) {
  return function (response, status) {
    profileMap.update(hash, function () {
      return pkResponseToProfile(response, status);
    });
  };
}

function updateMemberByMsg(msg, hash, profileMap) {
  profileMap.update(hash, function (profile) {
    if (profile !== null) {
      profile.status = 'UPDATING';
      return profile;
    } else {
      return { status: 'REQUESTING' };
    }
  });

  httpGetAsync('/messages/' + msg, createPKCallback(hash, profileMap));
}

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

function isProxiedMessage(message) {
  return message.author.discriminator === '0000';
}

function callbackIfMemberReady(props, profileMap, callback) {
  if (!Object.hasOwn(props, 'message')) {
    return;
  }

  let message = props.message;

  if (!isProxiedMessage(message)) return;

  let username = message.author.username;
  if (Object.hasOwn(message.author, 'username_real')) username = message.author.username_real;

  let userHash = getUserHash(message.author);

  let profile = profileMap.get(userHash);

  if (profile) {
    if (profile.status === 'DONE' || profile.status === 'UPDATING') {
      callback(profile);
    }
  } else {
    console.log('Requesting data for member ' + username + ' (' + userHash + ')');
    updateMemberByMsg(message.id, userHash, profileMap);
  }
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
  let { doContrastTest, contrastTestColour, contrastThreshold } = settings.get();
  if (member.color && acceptableContrast(member.color, doContrastTest, contrastTestColour, contrastThreshold)) {
    component.props.style = { color: member.color };
  }
}

function handleMessageContent(props, component, settings, profileMap) {
  const channel = ChannelStore.getChannel(props.message.channel_id);

  if (!channel || !channel.guild_id) return; //No webhooks here lol

  if (settings.get().doColourText) {
    callbackIfMemberReady(props, profileMap, function (member) {
      setMessageTextColour(component, settings, member);
    });
  }
}

function patchMessageContent(pluginName, settings, profileMap) {
  BdApi.Patcher.after(pluginName, MessageContent, 'type', function (_, [props], ret) {
    handleMessageContent(props, ret, settings, profileMap);
  });
}

function handleMessageHeader(props, component, settings, profileMap) {
  const tree = ZLibrary.Utilities.getNestedProp(component, 'props.username.props.children');

  if (!Array.isArray(tree)) {
    return;
  }

  callbackIfMemberReady(props, profileMap, function (member) {
    let { useServerNames, memberColourPref, tagColourPref, doContrastTest, contrastTestColour, contrastThreshold } =
      settings.get();

    if (!Object.hasOwn(props.message.author, 'username_real')) {
      props.message.author.username_real = props.message.author.username.slice();

      if (useServerNames) {
        // most batshit string length function on earth
        const count = str => {
          const regex = /\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji_Presentation}|\p{Emoji}\uFE0F|./gu;
          return ((str || '').match(regex) || []).length;
        };

        let username_len = count(props.message.author.username_real);
        let tag_len = count(member.tag);

        props.message.author.username = props.message.author.username_real.slice(0, username_len - tag_len);
      } else {
        props.message.author.username = member.name + ' ';
      }
    }
    tree.length = 0; //loser

    let member_tag = member.tag;

    let userProps = {
      user: props.message.author,
      className: 'username-h_Y3Us',
      type: 'member_name',
    };

    let tagProps = {
      user: props.message.author,
      className: 'username-h_Y3Us',
      type: 'system_tag',
    };

    // lol
    let pkBadge = (
      <span className='botTagCozy-3NTBvK botTag-1NoD0B botTagRegular-kpctgU botTag-7aX5WZ rem-3kT9wc'>
        <PKBadge
          pk_id={props.message.id}
          onClick={id => updateMemberByMsg(id, getUserHash(props.message.author))}
          className='botText-1fD6Qk'
        />
      </span>
    );
    // Preferences

    // 0 - Member
    // 1 - System
    // 2 - Theme (do nothing)
    let member_colour;
    let tag_colour;

    if (memberColourPref === 0) {
      member_colour = member.color;

      if (!member_colour) member_colour = member.system_color; // Fallback
    } else if (memberColourPref === 1) {
      member_colour = member.system_color;

      if (!member_colour) member_colour = member.color; // Fallback
    }

    if (tagColourPref === 0) {
      tag_colour = member.color;

      if (!tag_colour) tag_colour = member.system_color; // Fallback
    } else if (tagColourPref === 1) {
      tag_colour = member.system_color;
    }

    // Color testing and stuff
    if (member_colour) {
      if (acceptableContrast(member_colour, doContrastTest, contrastTestColour, contrastThreshold)) {
        userProps.style = { color: member_colour };
      }
    }

    if (tag_colour) {
      if (acceptableContrast(tag_colour, doContrastTest, contrastTestColour, contrastThreshold)) {
        tagProps.style = { color: tag_colour };
      }
    }

    if (!member_tag || typeof member_tag !== 'string') member_tag = '';

    if (props.compact) {
      tree.push(pkBadge);
      tree.push(React.createElement('span', userProps, ' ' + props.message.author.username.toString()));
      tree.push(React.createElement('span', tagProps, member_tag.toString() + ' '));
    } else {
      tree.push(React.createElement('span', userProps, props.message.author.username.toString()));
      tree.push(React.createElement('span', tagProps, member_tag.toString()));
      tree.push(pkBadge);
    }
  });
}

function patchMessageHeader(pluginName, settings, profileMap) {
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

module.exports = { patchMessageContent, patchMessageHeader };
