const { sleep, isProxiedMessage } = require('./utility');

const ProfileStatus = {
  Done: 'DONE',
  Updating: 'UPDATING',
  Requesting: 'REQUESTING',
  NotPK: 'NOT_PK',
  Reset: 'RESET',
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
    name: data.member.name,
    color: '#' + data.member.color,
    tag: data.system.tag,
    id: data.member.id,
    system: data.system.id,
    status: ProfileStatus.Done,
    system_color: '#' + data.system.color,
  };

  if (data.member.color === null) profile.color = '';

  if (data.system.color === null) profile.system_color = '';

  if (data.member.display_name) {
    profile.name = data.member.display_name;
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

async function updateMemberByMessage(message, hash, profileMap) {
  profileMap.update(hash, function (profile) {
    if (profile !== null && profile.status !== ProfileStatus.Reset) {
      profile.status = ProfileStatus.Updating;
      return profile;
    } else {
      return { status: ProfileStatus.Requesting };
    }
  });

  let profileResponse = await httpGetAsync(`${baseEndpoint}/messages/${message.id}`);
  let profile = await pkResponseToProfile(profileResponse);

  profileMap.set(hash, profile);

  return profile;
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
  return !profile || profile.status === ProfileStatus.Reset;
}

async function updateProfile(message, profileMap) {
  if (!isProxiedMessage(message)) return null;

  let username = message.author.username;
  if (Object.hasOwn(message.author, 'username_real')) username = message.author.username_real;

  let userHash = getUserHash(message.author);

  let profile = profileMap.get(userHash);

  if (shouldUpdate(profile)) {
    console.log('Requesting data for member ' + username + ' (' + userHash + ')');
    return await updateMemberByMessage(message, userHash, profileMap);
  } else {
    return profile;
  }
}

module.exports = { ProfileStatus, updateProfile };
