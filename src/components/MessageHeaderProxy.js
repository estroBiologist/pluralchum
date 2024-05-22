const React = BdApi.React;

import { pluginName, hookupValueCell, isProxiedMessage } from '../utility.js';
import { hookupProfile, updateProfile, ProfileStatus, getUserHash } from '../profiles.js';
import ColoredMessageHeader from './ColorMessageHeader.js';
import LoadingMessageHeader from './LoadingMessageHeader.js';

const Components = BdApi.Webpack.getModule(BdApi.Webpack.Filters.byProps("Avatar", "Popout"));

export default function MessageHeaderProxy({
  settingsCell,
  profileMap,
  enabledCell,
  messageHeader,
  message,
  guildId,
  onClickAvatar,
}) {
  let [settings] = hookupValueCell(settingsCell);
  let [profile] = hookupProfile(profileMap, message.author);
  let [enabled] = hookupValueCell(enabledCell);

  if (!enabled || !isProxiedMessage(message)) {
    return messageHeader;
  }

  updateProfile(message, profileMap);

  BdApi.Patcher.instead(pluginName, Components.Popout.prototype, 'render', function (ctx, [props], f) {
    ctx.props.preload = () => {
      BdApi.Data.save(pluginName, "currentWebhookId", message.webhookId);
      BdApi.Data.save(pluginName, "currentMessage", message);
      const _ = () => {
        if (profile.status == "DONE" || profile.status == "NOT_PK") {
          BdApi.Data.save(pluginName, "currentProfile", profile);
        } else {
          setTimeout(_, 100);
        }
      }
      _();
    }
    return f.call(ctx, props);
  })

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
        onClickAvatar={onClickAvatar}
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
