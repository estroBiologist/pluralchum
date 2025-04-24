const { semverCompare } = BdApi.Utils;
import { ProfileStatus } from './profiles';

export async function showUpdateNotice(url) {
  let button = document.createElement('button');
  button.label = 'Check it out!';
  button.onClick = function () {
    require('electron').shell.openExternal(url);
  };
  BdApi.UI.showNotice('Pluralchum has a new update!', { type: 'info', buttons: [button] });
}

export async function checkForUpdates(currentVersion) {
  let data = await fetch('https://api.github.com/repos/estroBiologist/pluralchum/releases/latest');
  if (data.ok) {
    let latestRelease = await data.json();
    let latestVersion = latestRelease.tag_name;

    if (semverCompare(currentVersion, latestVersion) > 0) {
      showUpdateNotice(latestRelease.html_url);
    }
  }
}

export function upgradeCache(settings, profileMap, currentVersion) {
  let cacheVersion = settings.get().version;
  if (!cacheVersion || semverCompare(cacheVersion, currentVersion) > 0) {
    settings.update(function (s) {
      return { ...s, version: currentVersion };
    });

    for (const [key, value] of profileMap.systems.entries()) {
      profileMap.systems.set(key, { ...value, status: ProfileStatus.Stale });
    }
    for (const [key, value] of profileMap.members.entries()) {
      profileMap.members.set(key, { ...value, status: ProfileStatus.Stale });
    }
  }
}
