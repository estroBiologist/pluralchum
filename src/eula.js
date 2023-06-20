const React = BdApi.React;

function headsUp(onConfirm, onCancel) {
  BdApi.UI.showConfirmationModal(
    'Heads up!',
    <div style={{ color: '#eeeeee', 'text-align': 'center' }}>
      This plugin uses the PluralKit API to fetch system and member data. <br />
      <br />
      Because of technical limitations, this data is cached on your computer between sessions. None of this data is ever
      shared, collected or uploaded, but you still ought to know.
      <br />
      <br />
      <b>You can clear this cache at any time in the plugin settings</b>, and unused cache data is automatically deleted
      after 30 days.
    </div>,
    {
      confirmText: 'Gotcha',
      cancelText: 'No thanks',
      onConfirm,
      onCancel,
    },
  );
}

function requireEula(settings, pluginName) {
  if (!settings.get().eula) {
    let onConfirm = function () {
      settings.update(function (s) {
        return { ...s, eula: true };
      });
    };

    let onCancel = function () {
      BdApi.Plugins.disable(pluginName);
    };

    headsUp(onConfirm, onCancel);
  }
}

module.exports = { requireEula };
