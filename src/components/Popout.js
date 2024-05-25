import { React, FluxDispatcher } from '../common.js';

import { hookupProfile } from '../profiles.js';
import { useAsyncEffect } from '../utility.js';

export default function Popout({ props, message, renderPopout, profileMap }) {
  let [profile] = hookupProfile(profileMap, message.author);
  
  useAsyncEffect(async () => {
    FluxDispatcher.dispatch({
      type: 'PLURALCHUM_UPDATE_CURRENT',
      webhookId: message.webhookId,
      message,
    });

    if (profile.status == 'DONE' || profile.status == 'NOT_PK') {
        FluxDispatcher.dispatch({
            type: 'PLURALCHUM_UPDATE_CURRENT',
            profile,
        });
    }
  }, [profile]);

  return <React.Fragment>
    {renderPopout(props, message)}
  </React.Fragment>;
}
