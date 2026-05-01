const React = BdApi.React;

import { pluginName } from './utility.js';
import { getUserHash, ProfileStatus } from './profiles.js';
import PopoutPKBadge from './components/PopoutPKBadge.js';
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
  const UserProfileStore = BdApi.Webpack.getModule(BdApi.Webpack.Filters.byStoreName('UserProfileStore'));
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

  const GuildMemberStore = BdApi.Webpack.getModule(BdApi.Webpack.Filters.byStoreName('GuildMemberStore'));
  const GuildMemberRequesterStore = BdApi.Webpack.getModule(
    BdApi.Webpack.Filters.byStoreName('GuildMemberRequesterStore'),
  );

  BdApi.Patcher.instead(pluginName, GuildMemberStore, 'getMember', function (ctx, [guildId, userId], f) {
    if (userId && typeof userId !== 'string' && userId.user) {
      let sender = f.call(ctx, guildId, userId.userProfile.sender);
      if (!sender) {
        GuildMemberRequesterStore.requestMember(guildId, userId.userProfile.sender);
        return null;
      }
      return {
        guildId: sender.guildId,
        highestRoleId: sender.highestRoleId,
        isPending: sender.isPending,
        joinedAt: sender.joinedAt,
        roles: sender.roles,
        userId: sender.userId,
      };
    } else {
      return f(guildId, userId);
    }
  });

  const UserStore = BdApi.Webpack.getModule(BdApi.Webpack.Filters.byStoreName('UserStore'));

  BdApi.Patcher.instead(pluginName, UserStore, 'getUser', function (ctx, [userId, guildId], f) {
    if (userId && typeof userId !== 'string' && userId.user) {
      return userId.user;
    } else {
      return f(userId, guildId);
    }
  });

  BdApi.Webpack.waitForModule(
    BdApi.Webpack.Filters.byStrings('avatarSrc', 'avatarDecorationSrc', 'eventHandlers', 'avatarOverride'), 
    { defaultExport: false }
  ).then(function (Avatars) {
    BdApi.Patcher.after(pluginName, Avatars, 'A', function (_, [args], ret) {
      let user = args?.userId?.user;
      if (user) {
        ret.avatarSrc = user.avatar;
        ret.avatarPlaceholder = user.avatar;
      }
      return ret;
    });
  });  

  const [Banner, banner] = BdApi.Webpack.getWithKey(BdApi.Webpack.Filters.byStrings('displayProfile', 'SHOULD_LOAD'));

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

  BdApi.Webpack.waitForModule(BdApi.Webpack.Filters.combine(
    BdApi.Webpack.Filters.byStrings('messageId', 'user', 'openUserProfileModal', 'setPopoutRef'),
    BdApi.Webpack.Filters.byRegex('^((?!getGuild).)*$'),
  ), { defaultExport: false }
  ).then(function (WebhookPopout) {
    BdApi.Patcher.instead(pluginName, WebhookPopout, 'default', function (_, [args], f) {
      const MessageStore = BdApi.Webpack.getModule(BdApi.Webpack.Filters.byStoreName('MessageStore'));
      let message = MessageStore.getMessage(args.channelId, args.messageId);

      if (!message) {
        return f(args);
      }

      let userHash = getUserHash(message);
      let profile = profileMap.get(userHash);

      if (!profile || profile?.status === ProfileStatus.NotPK) {
        return f(args);
      }

      let userProfile = {
        bio: profile.description ?? '',
        system_bio: profile.system_description ?? '',
        userId: args.user.id,
        guildId: args.guildId,
        pronouns: profile.pronouns,
        sender: profile.sender,
      };

      if (profile.color) {
        userProfile.accentColor = Number('0x' + profile.color.substring(1));
      } else {
        userProfile.accentColor = Number('0x5b63f4');
      }

      if (profile.banner) {
        userProfile.banner = profile.banner;
      }

      const User = BdApi.Webpack.getByPrototypeKeys('addGuildAvatarHash', 'isLocalBot');

      let user = new User({
        username: profile.system_name ?? profile.system,
        globalName: profile.name,
        bot: true,
        discriminator: profile.system,
      });

      user.id = { userProfile, user, isPK: true };

      if (args.user.avatar) {
        user.avatar = 'https://cdn.discordapp.com/avatars/' + args.user.id + '/' + args.user.avatar + '.webp';
      } else {
        //fallback to default avatar
        user.avatar = 'https://cdn.discordapp.com/embed/avatars/0.png';
      }

      const BotPopout = BdApi.Webpack.getModule(
        BdApi.Webpack.Filters.combine(
          BdApi.Webpack.Filters.byStrings('messageId', 'user', 'setPopoutRef', 'currentUser'),
          BdApi.Webpack.Filters.byRegex('^((?!guild_id).)*$'),
        ),
      );

      if (BotPopout) return BotPopout({ ...args, user });
      else {
        console.error('[PLURALCHUM] Error, bot popout function is undefined! Falling back to webhook function...');
        return f({ ...args, user });
      }
    })
  });

  const [UsernameRow, usernameRow] = BdApi.Webpack.getWithKey(
    BdApi.Webpack.Filters.byStrings('displayNameStyles', 'isVerifiedBot'),
  );
  // BdApi.Patcher.after(pluginName, UsernameRow, usernameRow, function (ctx, [args], ret) {
  //   if (args.user?.id?.isPK) {
  //     let name = ret.props.children[0].props.children[0];
  //     if (Array.isArray(name.props.children)) {
  //       name.props.children[2] = <PopoutPKBadge />;
  //     } else {
  //       name.props.children.props.children[2] = <PopoutPKBadge />;
  //     }
  //   }

  //   return ret;
  // });

  const [Role, role] = BdApi.Webpack.getWithKey(BdApi.Webpack.Filters.byStrings('allowEditing', 'canAddRoles'));
  if (Role)
    BdApi.Patcher.before(pluginName, Role, role, function (ctx, args) {
      if (args[0].userId?.isPK) {
        args[0].allowEditing = false;
      }
    });

  BdApi.Webpack.waitForModule(BdApi.Webpack.Filters.byKeys('openUserProfileModal')).then(function (userProfile) {
    if (userProfile === undefined) {
      console.error('[PLURALCHUM] Error while patching the user profile modal!');
      return;
    }
    const Dispatcher = BdApi.Webpack.Stores.UserStore._dispatcher;

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

  const PopoutBioPatch = BdApi.Webpack.getModule(m => {
    let s = m?.type?.toString();
    return s && s.includes('viewFullBioDisabled');
  });
  BdApi.Patcher.instead(pluginName, PopoutBioPatch, 'type', function (_, [args], f) {
    if (!args?.user?.id?.isPK) {
      return f(args);
    }

    return <PopoutBio content={args.bio} />;
  });
}

