/* eslint-disable react/no-children-prop */
import { React, Components, UserActionCreators } from '../common.js';
import { updateProfile } from '../profiles.js';

export default function PopoutContainer({ message, profileMap, profile, originalProps, tagProps, children }) {
  const [shouldShowPopout, setShowPopout] = React.useState(false);
  return (
    <Components.Popout
      preload={async () => {
        updateProfile(message, profileMap);
        await UserActionCreators.getUser(profile.sender);
      }}
      renderPopout={originalProps.renderPopout}
      shouldShow={shouldShowPopout}
      position='right'
      onRequestClose={() => {
        setShowPopout(false);
        originalProps.onPopoutRequestClose();
      }}
      children={_props => {
        const { onClick: _, ...props } = _props;
        return (
          <Components.Clickable
            className='username__0b0e7 clickable__09456'
            onClick={args => {
              setShowPopout(shouldShowPopout => !shouldShowPopout);
              originalProps.onClick(args);
            }}
            onContextMenu={originalProps.onContextMenu}
            tag='span'
            {...tagProps}
            {...props}
          >
            {children}
          </Components.Clickable>
        );
      }}
    />
  );
}
