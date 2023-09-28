import semver from 'semver';

export async function showUpdateNotice(url) {
  let button = document.createElement('button');
  button.label = 'Check it out!';
  button.onClick = function() {
    require('electron').shell.openExternal(url);
  }
  BdApi.UI.showNotice('Pluralchum has a new update!', { type: 'info', buttons: [ button ] });
}

export async function checkForUpdates(currentVersion) {
  let data = await fetch("https://api.github.com/repos/estroBiologist/pluralchum/releases/latest");
  if (data.ok) {
    let latestRelease = await data.json();
    let latestVersion = latestRelease.tag_name;

    if (semver.gt(latestVersion, currentVersion)) {
      showUpdateNotice(latestRelease.html_url);
    }
  }
}