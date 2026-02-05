import UserModalBio from './components/UserModalBio.js';
import UserModalInner from './components/UserModalInner.js';
import { pluginName } from './utility.js';

const React = BdApi.React;

async function patchBotUserProfileModal() {
  await BdApi.Webpack.waitForModule(BdApi.Webpack.Filters.byStrings('PRESS_SECTION', 'hidePersonalInformation'));

  const [BotUserProfileModalInner, botUserProfileModalInner] = BdApi.Webpack.getWithKey(
    BdApi.Webpack.Filters.byStrings('PRESS_SECTION', 'hidePersonalInformation'),
  );

  BdApi.Patcher.instead(pluginName, BotUserProfileModalInner, botUserProfileModalInner, (ctx, [args], f) => {
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
}

export function patchUserProfileModal() {
  patchBotUserProfileModal();
}
