const React = BdApi.React;

import { pluginName } from './utility.js';

const [WebhookPopout, viewWebhookPopout] = BdApi.Webpack.getWithKey(
  BdApi.Webpack.Filters.byStrings('messageId', 'user', 'openUserProfileModal', 'setPopoutRef', 'isClyde'),
);

const viewBotPopout = BdApi.Webpack.getByStrings(
  'messageId',
  'user',
  'openUserProfileModal',
  'setPopoutRef',
  'BotUserProfilePopout',
);

const [Avatar, avatar] = BdApi.Webpack.getWithKey(
  BdApi.Webpack.Filters.byStrings('avatarSrc', 'avatarDecorationSrc', 'eventHandlers', 'avatarOverride'),
);

const [Banner, banner] = BdApi.Webpack.getWithKey(BdApi.Webpack.Filters.byStrings('bannerSrc'));

const [UsernameRow, usernameRow] = BdApi.Webpack.getWithKey(BdApi.Webpack.Filters.byStrings('_.clanTagContainer'));

const UserProfileStore = BdApi.Webpack.getModule(BdApi.Webpack.Filters.byStoreName('UserProfileStore'));
const UserStore = BdApi.Webpack.getModule(BdApi.Webpack.Filters.byStoreName('UserStore'));
const User = BdApi.Webpack.getByPrototypeKeys('addGuildAvatarHash', 'isLocalBot');
const MessageStore = BdApi.Webpack.getModule(BdApi.Webpack.Filters.byStoreName('MessageStore'));
import { getUserHash, ProfileStatus } from './profiles.js';
import PopoutPKBadge from './components/PopoutPKBadge.js';
import UserModalInner from './components/UserModalInner.js';
import UserModalBio from './components/UserModalBio.js';
import PopoutBio from './components/PopoutBio.js';

function isValidHttpUrl(string) {
  let url;

  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }

  return url.protocol === 'http:' || url.protocol === 'https:';
}

export function patchBotPopout(settings, profileMap) {
  BdApi.Patcher.instead(pluginName, UserProfileStore, 'getGuildMemberProfile', function (ctx, [userId, guildId], f) {
    if (userId && typeof userId !== 'string' && userId.userProfile) {
      return userId.userProfile;
    } else {
      return f(userId, guildId);
    }
  });

  BdApi.Patcher.instead(pluginName, UserProfileStore, 'getUserProfile', function (ctx, [userId, guildId], f) {
    if (userId && typeof userId !== 'string' && userId.userProfile) {
      return userId.userProfile;
    } else {
      return f(userId, guildId);
    }
  });

  BdApi.Patcher.instead(pluginName, UserStore, 'getUser', function (ctx, [userId, guildId], f) {
    if (userId && typeof userId !== 'string' && userId.user) {
      return userId.user;
    } else {
      return f(userId, guildId);
    }
  });

  BdApi.Patcher.after(pluginName, Avatar, avatar, function (_, [{ user }], ret) {
    if (user && isValidHttpUrl(user.avatar)) {
      ret.avatarSrc = user.avatar;
      ret.avatarPlaceholder = user.avatar;
    }
    return ret;
  });

  BdApi.Patcher.after(pluginName, Banner, banner, function (_, [{ displayProfile }], ret) {
    if (displayProfile && isValidHttpUrl(displayProfile.banner)) {
      if (settings.get()?.doDisableBanners) {
        ret.bannerSrc = undefined;
        ret.status = 'COMPLETE';
      } else {
        ret.bannerSrc = displayProfile.banner;
      }
    }
    return ret;
  });

  BdApi.Patcher.instead(pluginName, WebhookPopout, viewWebhookPopout, function (_, [args], f) {
    let message = MessageStore.getMessage(args.channelId, args.messageId);

    if (!message) {
      return f(args);
    }

    let userHash = getUserHash(message.author);
    let memberProfile = profileMap.members.get(userHash);

    if (!memberProfile || memberProfile?.status === ProfileStatus.NotPK) {
      return f(args);
    } else if (memberProfile.status === ProfileStatus.Deleted) {
      return f(args); //for now, just return?
    }

    let systemProfile = profileMap.systems.get(memberProfile.system);

    let userProfile = {
      bio: memberProfile.description ?? '',
      system_bio: systemProfile.description ?? '',
      userId: args.user.id,
      guildId: args.guildId,
      pronouns: memberProfile.pronouns,
    };

    if (memberProfile.color) {
      userProfile.accentColor = Number('0x' + memberProfile.color.substring(1));
    } else {
      userProfile.accentColor = Number('0x5b63f4');
    }

    if (memberProfile.banner) {
      userProfile.banner = memberProfile.banner;
    }

    let user = new User({
      username: systemProfile.name ?? systemProfile.id,
      globalName: memberProfile.name,
      bot: true,
      discriminator: systemProfile.id,
    });

    user.id = { userProfile, user, isPK: true };

    if (args.user.avatar) {
      user.avatar = 'https://cdn.discordapp.com/avatars/' + args.user.id + '/' + args.user.avatar + '.webp';
    } else {
      //fallback to default avatar
      user.avatar = 'https://cdn.discordapp.com/embed/avatars/0.png';
    }

    if (viewBotPopout) return viewBotPopout({ ...args, user });
    else {
      console.error('[PLURALCHUM] Error, bot popout function is undefined! Falling back to webhook function...');
      return f({ ...args, user });
    }
  });

  BdApi.Patcher.after(pluginName, UsernameRow, usernameRow, function (ctx, [args], ret) {
    if (args.user?.id?.isPK) {
      ret.props.children[0].props.children[1] = <PopoutPKBadge />;
    }

    return ret;
  });

  BdApi.Webpack.waitForModule(BdApi.Webpack.Filters.byKeys('openUserProfileModal')).then(function (userProfile) {
    if (userProfile === undefined) {
      console.error('[PLURALCHUM] Error while patching the user profile modal!');
      return;
    }
    const Dispatcher = BdApi.Webpack.getByKeys('dispatch', 'subscribe');
    BdApi.Patcher.instead(pluginName, userProfile, 'openUserProfileModal', (ctx, [args], f) => {
      if (typeof args.userId !== 'string' && args.userId?.isPK) {
        Dispatcher.dispatch({
          type: 'USER_PROFILE_MODAL_OPEN',
          userId: args.userId,
          appContext: args.appContext,
        });

        return;
      }
      return f(args);
    });
  });

  BdApi.Webpack.waitForModule(BdApi.Webpack.Filters.byStrings('user-bot-profile-overflow-menu', 'BLOCK'), {
    defaultExport: false,
  }).then(function (OverflowMenu) {
    if (OverflowMenu === undefined) {
      console.error('[PLURALCHUM] Error while patching OverflowMenu!');
      return;
    }
    BdApi.Patcher.instead(pluginName, OverflowMenu, 'Z', (ctx, [args], f) => {
      if (args.user?.id?.isPK) return;
      return f(args);
    });
  });

  //this could potentially be changed to message the system user?
  const MessageButton = BdApi.Webpack.getByKeys('openPrivateChannel');
  BdApi.Patcher.instead(pluginName, MessageButton, 'openPrivateChannel', function (ctx, args, f) {
    if (args[0]?.isPK) {
      return;
    }
    return f(...args);
  });

  const [PopoutBioPatch, popoutBioPatch] = BdApi.Webpack.getWithKey(
    BdApi.Webpack.Filters.byStrings('viewFullBioDisabled', 'hidePersonalInformation'),
  );
  BdApi.Patcher.instead(pluginName, PopoutBioPatch, popoutBioPatch, function (_, [args], f) {
    if (!args?.user?.id?.isPK) {
      return f(args);
    }
    return <PopoutBio content={args.bio} />;
  });

  BdApi.Webpack.waitForModule(
    BdApi.Webpack.Filters.byStrings('section', 'subsection', 'displayProfile', 'initialSection'),{
      defaultExport: false,
    },).then(function (UserModal) {
    if (UserModal === undefined) {
      console.error('[PLURALCHUM] Error while patching UserModal!');
      return;
    }
    BdApi.Patcher.instead(pluginName, UserModal, 'Z', (ctx, [args], f) => {
      if (!args?.user?.id?.isPK) {
        return f(args);
      }
      return (
        <UserModalInner
          initialSection={'PLURALCHUM_MEMBER_INFO'}
          sections={[
            { section: 'PLURALCHUM_MEMBER_INFO', text: 'Member Info' },
            { section: 'PLURALCHUM_SYSTEM_INFO', text: 'System Info' },
          ]}
          sectionContents={{
            PLURALCHUM_MEMBER_INFO: <UserModalBio content={args.user.id.userProfile.bio} />,
            PLURALCHUM_SYSTEM_INFO: <UserModalBio content={args.user.id.userProfile.system_bio} />,
          }}
        />
      );
    });
  });
}
