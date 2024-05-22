/* eslint-disable no-unused-vars */
const React = BdApi.React;

import ZLibrary from './external/ZLibrary.js';
import { pluginName, sleep, isProxiedMessage } from './utility';

export const ProfileStatus = {
  Done: 'DONE',
  Updating: 'UPDATING',
  Requesting: 'REQUESTING',
  NotPK: 'NOT_PK',
  Stale: 'STALE',
};

const baseEndpoint = 'https://api.pluralkit.me/v2';
const userAgent = 'PLURALCHUM (github.com/estroBiologist/pluralchum)';
const delayPerRequest = 600;

let currentRequests = -1;
async function httpGetAsync(url) {
  currentRequests += 1;
  await sleep(currentRequests * delayPerRequest);
  let headers = new Headers({ 'User-Agent': userAgent });
  let response = await fetch(url, { headers });
  currentRequests -= 1;
  return response;
}

function pkDataToProfile(data) {
  let profile = {
    name: data.member.display_name || data.member.name,
    color: '#' + (data.member.color || 'ffffff'),
    tag: data.system.tag || '',
    id: data.member.id,
    system: data.system.id,
    status: ProfileStatus.Done,
    system_color: '#' + (data.system.color || 'ffffff'),
    sender: data.sender,
    raw: data,
    banner: data.member.banner,
    pronouns: data.member.pronouns,
    description: data.member.description,
  };

  return profile;
}

async function pkResponseToProfile(response) {
  if (response.status == 200) {
    console.log('RESPONSE');
    let data = await response.json();
    console.log(data);
    return pkDataToProfile(data);
  } else if (response.status == 404) {
    return { status: ProfileStatus.NotPK };
  }
}

async function getFreshProfile(message) {
  let profileResponse = await httpGetAsync(`${baseEndpoint}/messages/${message.id}`);
  return await pkResponseToProfile(profileResponse);
}

async function updateFreshProfile(message, hash, profileMap) {
  profileMap.update(hash, function (profile) {
    if (profile !== null) {
      profile.status = ProfileStatus.Updating;
      return profile;
    } else {
      return { status: ProfileStatus.Requesting };
    }
  });

  let profile = await getFreshProfile(message);

  profileMap.set(hash, profile);
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

export function getUserHash(author) {
  let username = author.username;
  if (Object.hasOwn(author, 'username_real')) username = author.username_real;

  return hashCode(username + author.avatar);
}

function shouldUpdate(profile) {
  return !profile || profile.status === ProfileStatus.Stale;
}

export async function updateProfile(message, profileMap) {
  if (!isProxiedMessage(message)) return null;

  let username = message.author.username;
  if (Object.hasOwn(message.author, 'username_real')) username = message.author.username_real;

  let userHash = getUserHash(message.author);

  let profile = profileMap.get(userHash);

  if (shouldUpdate(profile)) {
    console.log(`[PLURALCHUM] Requesting data for ${username} (${userHash})`);
    try {
      await updateFreshProfile(message, userHash, profileMap);
    } catch (e) {
      console.log(`[PLURALCHUM] Error while requesting data for ${username} (${userHash}): ${e}`);
    }
  }
}

export function hookupProfile(profileMap, author) {
  let userHash = getUserHash(author);
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

export function patchProfileBanners() {
  const ProfileUtils = BdApi.Webpack.getModule(BdApi.Webpack.Filters.byPrototypeFields('getBannerURL'), {
    searchExports: true,
  });

  BdApi.Patcher.instead(pluginName, ProfileUtils.prototype, 'getBannerURL', function (ctx, [props], f) {
    const ret = f.call(ctx, props);
    if (!ctx.banner || (ctx.banner && !ctx.banner.includes('https://'))) return ret;
    return ctx.banner;
  });
}

export function patchProfiles() {
  const getCurrentProfile = () => BdApi.Data.load(pluginName, 'currentProfile');
  const getCurrentWebhookId = () => BdApi.Data.load(pluginName, 'currentWebhookId');

  const UserProfileStore = BdApi.Webpack.getModule(BdApi.Webpack.Filters.byStoreName('UserProfileStore'), {
    searchExports: true,
  });

  const UserStore = BdApi.Webpack.getModule(BdApi.Webpack.Filters.byStoreName('UserStore'), {
    searchExports: true,
  });

  const [UserProfile, blocker] = BdApi.Webpack.getWithKey(
    BdApi.Webpack.Filters.byStrings('.useIsUserRecentGamesEnabled', '.usernameSection', '.USER_POPOUT'),
  );

  const TimestampUtils = BdApi.Webpack.getModule(m => m.default.extractTimestamp);

  var userProfileArticialProps = {};
  const currentUser = UserStore.getCurrentUser();
  const currentUserProfile = UserProfileStore.getUserProfile(currentUser.id);

  BdApi.Patcher.instead(pluginName, UserProfile, blocker, function (ctx, [props], f) {
    userProfileArticialProps = props;
    return f.call(ctx, { ...props, user: patchProfileUser(props.user) });
  });

  const makeArtificialProps = userId => {
    const props = userProfileArticialProps;
    const user = UserStore.getUser(userId);
    return { ...props, user };
  };

  const patchProfileUser = ret => {
    const user = Object.assign(Object.create(Object.getPrototypeOf(ret)), ret);
    if (user.id == getCurrentWebhookId()) {
      const profile = getCurrentProfile();
      const author = UserStore.getUser(profile.sender);

      user.bot = false;
      user.isNonUserBot = () => false;
      user.discriminator = '0';
      user.username = `${profile.name} ${profile.tag || ''}`;
      user.globalName = profile.name;
      user.avatarDecorationData = author.avatarDecorationData;
    }

    return user;
  };

  BdApi.Patcher.instead(pluginName, TimestampUtils.default, 'extractTimestamp', function (ctx, [snowflake], f) {
    var ret = f.call(ctx, snowflake);
    if (snowflake !== getCurrentWebhookId()) return ret;

    const profile = getCurrentProfile();
    return new Date(profile.raw.member.created || new Date(ret).getTime());
  });

  BdApi.Patcher.instead(pluginName, UserStore, 'getUser', function (ctx, [id], f) {
    var ret = f.call(ctx, id);
    if (id !== getCurrentWebhookId()) return ret;
    return patchProfileUser(ret);
  });

  BdApi.Patcher.instead(pluginName, UserProfileStore, 'getUserProfile', function (ctx, [id], f) {
    const white = ZLibrary.ColorConverter.hex2int('#FFFFFF');
    if (id !== getCurrentWebhookId()) return f.call(ctx, id);

    const profile = getCurrentProfile();
    const userProfile = { ...currentUserProfile };

    userProfile.premiumSince = new Date().toISOString();
    userProfile.premiumType = 2;
    userProfile.banner = profile.banner;
    
    userProfile.accentColor =
      ZLibrary.ColorConverter.hex2int(profile.color) != white
        ? ZLibrary.ColorConverter.hex2int(profile.color)
        : ZLibrary.ColorConverter.hex2int(profile.system_color) != white
        ? ZLibrary.ColorConverter.hex2int(profile.system_color)
        : null;

    userProfile.primaryColor =
      ZLibrary.ColorConverter.hex2int(profile.color) != white
        ? ZLibrary.ColorConverter.hex2int(profile.color)
        : ZLibrary.ColorConverter.hex2int(profile.system_color) != white
        ? ZLibrary.ColorConverter.hex2int(profile.system_color)
        : null;

    userProfile.themeColors = profile.banner
      ? null
      : ZLibrary.ColorConverter.hex2int(profile.color) != white
      ? [ZLibrary.ColorConverter.hex2int(profile.color), white]
      : ZLibrary.ColorConverter.hex2int(profile.system_color) != white
      ? [ZLibrary.ColorConverter.hex2int(profile.system_color), white]
      : null;

    userProfile.pronouns = profile.pronouns;
    userProfile.profileFetchFailed = false;
    userProfile.bio = profile.description;
    userProfile.badges = [];
    userProfile.connectedAccounts = [];
    userProfile.applicationRoleConnections = [];

    return userProfile;
  });
}
