const React = BdApi.React;

import { sleep, isProxiedMessage } from './utility';

export const ProfileStatus = {
  Done: 'DONE',
  Updating: 'UPDATING',
  Requesting: 'REQUESTING',
  NotPK: 'NOT_PK',
  Stale: 'STALE',
  Deleted: 'DELETED',
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
  let systemProfile = {
    id: data.system.id,
    name: data.system.name,
    description: data.system.description ?? '',
    tag: data.system.tag,
    pronouns: data.system.pronouns,
    avatar: data.system.avatar_url,
    banner: data.system.banner,
    color: '#' + data.system.color,

    status: ProfileStatus.Done,
    sender: data.sender,
  };
  let memberProfile = {
    id: data.member.id,
    system: data.system.id,
    name: data.member.display_name ?? data.member.name,
    color: '#' + data.member.color,
    pronouns: data.member.pronouns,
    avatar: data.member.avatar_url ?? data.system.avatar_url,
    banner: data.member.banner,
    description: data.member.description ?? '',

    status: ProfileStatus.Done,
    sender: data.sender,
  };
  if (data.system.color === null) systemProfile.color = '';
  if (data.member.color === null) memberProfile.color = '';

  return { systemProfile, memberProfile, status: ProfileStatus.Done };
}

async function pkResponseToProfile(response) {
  if (response.status == 200) {
    console.debug('RESPONSE');
    let data = await response.json();
    console.debug(data);
    if (data.system == null && data.member == null) return { status: ProfileStatus.Deleted };
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
  let updateFunction = function (profile) {
    if (profile !== null) {
      profile.status = ProfileStatus.Updating;
      return profile;
    } else {
      return { status: ProfileStatus.Requesting };
    }
  };
  profileMap.members.update(hash, updateFunction);

  let profiles = await getFreshProfile(message);

  if (profiles.status === ProfileStatus.Done) {
    profileMap.systems.set(profiles.systemProfile.id, profiles.systemProfile);
    profileMap.members.set(hash, profiles.memberProfile);
  } else {
    profileMap.members.set(hash, profiles);
  }
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

  let memberProfile = profileMap.members.get(userHash);

  if (shouldUpdate(memberProfile)) {
    console.log(`[PLURALCHUM] Requesting data for ${username} (${userHash})`);
    try {
      await updateFreshProfile(message, userHash, profileMap);
    } catch (e) {
      console.error(`[PLURALCHUM] Error while requesting data for ${username} (${userHash}): ${e}`);
    }
  }
}

export function hookupProfile(profileMap, author) {
  let userHash = getUserHash(author);
  const [profile, setProfile] = React.useState(profileMap.members.get(userHash));
  React.useEffect(function () {
    return profileMap.members.addListener(function (key, value) {
      if (key === userHash) {
        setProfile(value);
      }
    });
  });

  return [profile, setProfile];
}
