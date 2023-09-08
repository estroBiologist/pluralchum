const { GuildMemberStore } = ZLibrary.DiscordModules;
const { sleep, isProxiedMessage } = require('./utility');

const ProfileStatus = {
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

function pkDataToServerSetting(data) {
  let roleColour = GuildMemberStore.getMember(data.guild, data.sender)?.colorString;
  return { role_color: roleColour };
}

function pkDataToProfile(data) {
  let profile = {
    name: data.member.name,
    color: '#' + data.member.color,
    tag: data.system.tag,
    id: data.member.id,
    system: data.system.id,
    status: ProfileStatus.Done,
    system_color: '#' + data.system.color,
    server_settings: {},
  };

  if (data.member.color === null) profile.color = '';

  if (data.system.color === null) profile.system_color = '';

  if (data.member.display_name) {
    profile.name = data.member.display_name;
  }

  if (data.guild) {
    profile.server_settings[data.guild] = pkDataToServerSetting(data);
  }

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

async function getProfileWithUpdatedServerSettings(message, oldProfile) {
  let profile = await getFreshProfile(message);

  profile.server_settings = { ...oldProfile.server_settings, ...profile.server_settings };

  return profile;
}

async function updateServerSettings(message, hash, profileMap) {
  let oldProfile;

  profileMap.update(hash, function (profile) {
    oldProfile = profile;
    profile.status = ProfileStatus.Updating;
    return profile;
  });

  let profile = await getProfileWithUpdatedServerSettings(message, oldProfile);

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

function getUserHash(author) {
  let username = author.username;
  if (Object.hasOwn(author, 'username_real')) username = author.username_real;

  return hashCode(username + author.avatar);
}

function shouldUpdate(profile) {
  return !profile || profile.status === ProfileStatus.Stale;
}

function shouldUpdateServerSetting(profile, guildId) {
  return profile.status === ProfileStatus.Done && !profile.server_settings?.[guildId];
}

async function updateProfile(message, profileMap, guildId) {
  if (!isProxiedMessage(message)) return null;

  let username = message.author.username;
  if (Object.hasOwn(message.author, 'username_real')) username = message.author.username_real;

  let userHash = getUserHash(message.author);

  let profile = profileMap.get(userHash);

  if (shouldUpdate(profile)) {
    console.log('Requesting data for member ' + username + ' (' + userHash + ')');
    await updateFreshProfile(message, userHash, profileMap);
  } else if (shouldUpdateServerSetting(profile, guildId)) {
    console.log('Requesting data for member ' + username + ' (' + userHash + ')');
    await updateServerSettings(message, userHash, profileMap);
  }
}

module.exports = { ProfileStatus, updateProfile };
