export const Filters = {
  ...BdApi.Webpack.Filters,
  byCode: (...find) => {
    return m => {
      let code = m?.type?.toString();
      if (!code) return false;

      for (const f of find) {
        if (!code.includes(f)) return false;
      }
      return true;
    };
  },
};

export const React = BdApi.React;
export const ReactDOM = BdApi.ReactDOM;

const _Flux = BdApi.Webpack.getModule(Filters.byProps('Store', 'Dispatcher', 'BatchedStoreListener'));
export const Flux = Object.assign(_Flux, _Flux.default);

export const FluxDispatcher = BdApi.Webpack.getModule(Filters.byProps('DispatchBand')).default;

export const Stores = new Proxy(
  {},
  {
    get(_, prop) {
      return Flux.Store.getAll().find(store => store.getName() == prop);
    },
  },
);

export const MessageUtils = BdApi.Webpack.getByKeys('isBlocked');
export const TimestampUtils = BdApi.Webpack.getModule(m => m.default.extractTimestamp).default;

export const UserProfileUtils = BdApi.Webpack.getModule(Filters.byPrototypeFields('getBannerURL'));
export const UserActionCreators = BdApi.Webpack.getModule(Filters.byProps('getUser', 'fetchProfile'));

export const MessageActions = BdApi.Webpack.getModule(Filters.byProps("jumpToMessage", "_sendMessage"));

const MessageContent = BdApi.Webpack.getModule(Filters.byCode('messageContent', 'MESSAGE_EDITED')); // memo
const MessageHeader = BdApi.Webpack.getModule(Filters.byStrings('showTimestampOnHover'), { defaultExport: false });
const Message = BdApi.Webpack.getModule(Filters.byStrings('.cozy', '.hasReply', '.hasThread', '.isSystemMessage'), {
  defaultExport: false,
});

const UserProfile = BdApi.Webpack.getModule(
  BdApi.Webpack.Filters.byStrings('.useIsUserRecentGamesEnabled', '.usernameSection', '.USER_POPOUT'),
  { defaultExport: false },
);

const UserProfileTag = BdApi.Webpack.getModule(
  Filters.byStrings('.PROFILE_POPOUT', 'shouldCopyOnClick', '.getUserTag'),
  { defaultExport: false },
);

const _Components = BdApi.Webpack.getModule(Filters.byProps('Avatar', 'Popout'));
export const Components = Object.assign(_Components, {
  MessageContent: Object.assign(MessageContent.type, { module: MessageContent }), // memo
  MessageHeader: Object.assign(MessageHeader.default, { module: MessageHeader }),
  Message: Object.assign(Message.default, { module: Message }),
  UserProfile: Object.assign(UserProfile.default, { module: UserProfile }),
  UserProfileTag: Object.assign(UserProfileTag.default, { module: UserProfileTag }),
});

globalThis.Common = {
  Filters,
  Flux,
  FluxDispatcher,
  Stores,
  Components,
  React,
  ReactDOM,
  MessageUtils,
  TimestampUtils,
  UserProfileUtils,
  UserActionCreators,
  MessageActions
};
