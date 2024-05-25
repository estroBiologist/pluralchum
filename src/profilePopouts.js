/* eslint-disable no-unused-vars */
import { React, Components, Stores, TimestampUtils, UserProfileUtils } from './common.js';

import ZLibrary from './external/ZLibrary.js';
import { patchComponent, patchClass, patch, clone } from './utility';

export function patchProfilePopouts() {
    const PluralchumStore = Stores.PluralchumStore;
  
    const UserStore = Stores.UserStore;
    const UserProfileStore = Stores.UserProfileStore;
    const GuildMemberStore = Stores.GuildMemberStore;
    const SelectedGuildStore = Stores.SelectedGuildStore;
  
    const currentUser = UserStore.getCurrentUser();
    const currentUserProfile = UserProfileStore.getUserProfile(currentUser.id);
  
    const patchProfileUser = ret => {
      const user = clone(ret);
      if (user.id == PluralchumStore.getCurrentWebhookId()) {
        const profile = PluralchumStore.getCurrentProfile();
        const author = UserStore.getUser(profile.sender);
  
        user.bot = false;
        user.isNonUserBot = () => false;
        user.discriminator = '0';
        user.username = `${profile.name} ${profile.tag || ''}`;
        user.globalName = `${profile.name} ${profile.tag || ''}`;
        user.avatarDecorationData = null;
  
        if (author) {
          user.avatarDecorationData = author.avatarDecorationData;
        }
      }
  
      return user;
    };
  
    patchClass(UserProfileUtils, "getBannerURL", (ctx, [props], f) => {
      const ret = f.call(ctx, props);
      if (!ctx.banner || (ctx.banner && !ctx.banner.includes('https://'))) return ret;
      return ctx.banner;
    })
  
    patchComponent(Components.UserProfile, (ctx, [props], f) => {
      if (props.user.id !== PluralchumStore.getCurrentWebhookId()) return f.call(ctx, props);
  
      const profile = PluralchumStore.getCurrentProfile();
      const author = UserStore.getUser(profile.sender);
  
      props.id = 'UserProfile';
  
      const ret = f.call(ctx, {
        ...props,
        user: patchProfileUser(props.user),
        guildMember: author ? GuildMemberStore.getMember(SelectedGuildStore.getGuildId(), author.id) : null,
      });
  
      const children = ret.props.children.filter(child => child);
  
      const contextProvider = children[1];
      const contextProviderChildren = contextProvider.props.children.filter(child => child);
  
      const profileContent = contextProviderChildren[2];
      const profileChildren = profileContent.props.children.filter(child => child);
  
      const bio = profileChildren[1];
      const memberSince = profileChildren[3];
      const note = profileChildren[profileChildren.length - 1];
  
      const unfilteredChildren = ret.props.children[1].props.children[2].props.children;
      unfilteredChildren[unfilteredChildren.indexOf(note)] = <div style={{ paddingBottom: '16px' }} />;
  
      return ret;
    });
  
    patchComponent(Components.UserProfileTag, (ctx, [props], f) => {
      if (props.user.id !== PluralchumStore.getCurrentWebhookId()) return f.call(ctx, props);
      const profile = PluralchumStore.getCurrentProfile();
      const author = UserStore.getUser(profile.sender);
  
      props.user = clone(props.user);
      props.user.username = author
        ? profile.raw.system.name
          ? `${profile.raw.system.name} • ${author.username}`
          : author.username
        : profile.raw.system.name
        ? profile.raw.system.name
        : `System ID: ${profile.system}`;
      props.id = 'UserProfileTag';
  
      const ret = f.call(ctx, props);
      const children = ret.props.children.filter(child => child);
  
      return ret;
    });
  
    patch(TimestampUtils, 'extractTimestamp', (ctx, [snowflake], f) => {
      const ret = f.call(ctx, snowflake);
      if (snowflake !== PluralchumStore.getCurrentWebhookId()) return ret;
  
      const profile = PluralchumStore.getCurrentProfile();
      return new Date(profile.raw.member.created || new Date(ret).getTime());
    });
  
    patch(UserStore, 'getUser', (ctx, [id], f) => {
      const ret = f.call(ctx, id);
      if (id !== PluralchumStore.getCurrentWebhookId()) return ret;
  
      return patchProfileUser(ret || currentUser);
    });
  
    patch(UserProfileStore, 'getUserProfile', (ctx, [id], f) => {
      const ret = f.call(ctx, id);
      if (id !== PluralchumStore.getCurrentWebhookId()) return ret;
  
      const white = ZLibrary.ColorConverter.hex2int('#FFFFFF');
  
      const profile = PluralchumStore.getCurrentProfile();
      const userProfile = { ...currentUserProfile };
  
      userProfile.premiumSince = new Date().toISOString();
      userProfile.premiumType = 2;
      userProfile.banner = profile.banner;
  
      userProfile.accentColor =
        ZLibrary.ColorConverter.hex2int(profile.color) != white
          ? ZLibrary.ColorConverter.hex2int(profile.color)
          : ZLibrary.ColorConverter.hex2int(profile.system_color) != white
          ? ZLibrary.ColorConverter.hex2int(profile.system_color)
          : null;
  
      userProfile.primaryColor =
        ZLibrary.ColorConverter.hex2int(profile.color) != white
          ? ZLibrary.ColorConverter.hex2int(profile.color)
          : ZLibrary.ColorConverter.hex2int(profile.system_color) != white
          ? ZLibrary.ColorConverter.hex2int(profile.system_color)
          : null;
  
      userProfile.themeColors = profile.banner
        ? null
        : ZLibrary.ColorConverter.hex2int(profile.color) != white
        ? [ZLibrary.ColorConverter.hex2int(profile.color), white]
        : ZLibrary.ColorConverter.hex2int(profile.system_color) != white
        ? [ZLibrary.ColorConverter.hex2int(profile.system_color), white]
        : null;
  
      userProfile.pronouns = profile.pronouns;
      userProfile.profileFetchFailed = false;
      userProfile.bio = profile.description;
      userProfile.badges = [];
      userProfile.connectedAccounts = [];
      userProfile.applicationRoleConnections = [];
  
      return userProfile;
    });
  }
  