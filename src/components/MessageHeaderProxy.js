const React = BdApi.React;

import { hookupValueCell, isProxiedMessage } from '../utility.js';
import { hookupProfile, updateProfile, ProfileStatus, getUserHash } from '../profiles.js';
import ColoredMessageHeader from './ColorMessageHeader.js';
import LoadingMessageHeader from './LoadingMessageHeader.js';

export default function MessageHeaderProxy({
  settingsCell,
  profileMap,
  enabledCell,
  messageHeader,
  message,
  guildId,
  onClickUsername,
}) {
  let [settings] = hookupValueCell(settingsCell);
  let [profile] = hookupProfile(profileMap, message.author);
  let [enabled] = hookupValueCell(enabledCell);

  if (!enabled || !isProxiedMessage(message)) {
    return messageHeader;
  }

  updateProfile(message, profileMap);

  let userHash = getUserHash(message.author);

  if (profile && (profile.status === ProfileStatus.Done || profile.status === ProfileStatus.Updating)) {
    return (
      <ColoredMessageHeader
        settings={settings}
        profileMap={profileMap}
        profile={profile}
        userHash={userHash}
        messageHeader={messageHeader}
        message={message}
        guildId={guildId}
        onClickUsername={onClickUsername}
      />
    );
  } else if (!profile || profile.status === ProfileStatus.Requesting) {
    return (
      <LoadingMessageHeader
        messageHeader={messageHeader}
        profile={{ status: ProfileStatus.Requesting }}
        profileMap={profileMap}
        userHash={userHash}
      />
    );
  } else {
    return messageHeader;
  }
}
