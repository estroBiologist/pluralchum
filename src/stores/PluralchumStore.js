import { Flux, FluxDispatcher, Stores } from '../common';

class PluralchumStore extends Flux.Store {
  initialize() {
    this.waitFor(Stores.UserStore, Stores.UserProfileStore, Stores.GuildMemberStore, Stores.SelectedGuildStore);
    this.currentState = {};
  }

  getCurrentMessage() {
    return this.currentState.message;
  }

  getCurrentWebhookId() {
    return this.currentState.webhookId;
  }

  getCurrentProfile() {
    return this.currentState.profile;
  }
}
PluralchumStore.displayName = 'PluralchumStore';

const store = new PluralchumStore(FluxDispatcher, {
  PLURALCHUM_UPDATE_CURRENT(event) {
    const { type: _, ...payload } = event;
    for (const [k, v] of Object.entries(payload)) {
      store.currentState[k] = v;
    }
  },
});

export default store;
