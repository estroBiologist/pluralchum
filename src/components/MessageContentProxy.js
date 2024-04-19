const React = BdApi.React;

import { hookupValueCell, isProxiedMessage } from '../utility';
import { ProfileStatus, updateProfile, hookupProfile } from '../profiles';
import { acceptableContrast } from '../contrast';
import ColorMessageContent from './ColorMessageContent';

function shouldColor(settings, profile) {
  let { doContrastTest, contrastTestColour, contrastThreshold } = settings;

  return (
    settings.doColourText &&
    profile &&
    (profile.status === ProfileStatus.Done || profile.status === ProfileStatus.Updating) &&
    profile.color &&
    acceptableContrast(profile.color, doContrastTest, contrastTestColour, contrastThreshold)
  );
}

export default function MessageContentProxy({ settingsCell, profileMap, enabledCell, messageContent, message }) {
  let [settings] = hookupValueCell(settingsCell);
  let [profile] = hookupProfile(profileMap, message.author);
  let [enabled] = hookupValueCell(enabledCell);

  if (!enabled || !isProxiedMessage(message)) {
    return messageContent;
  }

  updateProfile(message, profileMap);

  if (shouldColor(settings, profile)) {
    return <ColorMessageContent color={profile.color} messageContent={messageContent} />;
  } else {
    return messageContent;
  }
}
