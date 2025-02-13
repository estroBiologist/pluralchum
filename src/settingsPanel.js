const React = BdApi.React;
import { ColourPreference } from './data.js';
import logo_png from '../images/logo.png';

function title() {
  let logo = <img src={logo_png} style={{ maxWidth: '100%', height: 'auto' }} />;

  let subtitle = (
    <p style={{ textAlign: 'center', color: 'var(--header-primary)', width: '100%' }}>
      PluralKit integration for BetterDiscord
      <br />- by{' '}
      <b>
        <span style={{ color: '#ff002a' }}>ash taylor</span>
      </b>{' '}
      -
    </p>
  );

  return {
    type: 'custom',
    id: 'logo',
    name: '',
    note: '',
    value: null,
    children: (
      <div>
        {logo}
        {subtitle}
      </div>
    ),
  };
}

function doColourText(settings) {
  return {
    type: 'switch',
    id: 'doColourText',
    name: 'Colored proxy text',
    note: '',
    value: settings.get().doColourText,
  };
}

function memberColourPref(settings) {
  return {
    type: 'dropdown',
    id: 'memberColourPref',
    name: 'Default member name color',
    note: '',
    value: settings.get().memberColourPref,
    options: [
      { label: 'Member', value: ColourPreference.Member },
      { label: 'System', value: ColourPreference.System },
      { label: 'Role', value: ColourPreference.Role },
      { label: 'Theme', value: ColourPreference.Theme },
    ],
  };
}

function tagColourPref(settings) {
  return {
    type: 'dropdown',
    id: 'tagColourPref',
    name: 'Default system tag color',
    note: '',
    value: settings.get().tagColourPref,
    options: [
      { label: 'Member', value: ColourPreference.Member },
      { label: 'System', value: ColourPreference.System },
      { label: 'Role', value: ColourPreference.Role },
      { label: 'Theme', value: ColourPreference.Theme },
    ],
  };
}

function useServerNames(settings) {
  return {
    type: 'switch',
    id: 'useServerNames',
    name: 'Use servernames',
    note: '',
    value: settings.get().useServerNames,
  };
}

function preferencesPanel(settings) {
  return {
    type: 'category',
    id: 'preferencesPanel',
    name: 'Preferences',
    collapsible: true,
    shown: false,
    settings: [doColourText(settings), useServerNames(settings), memberColourPref(settings), tagColourPref(settings)],
  };
}

function doContrastTest(settings) {
  return {
    type: 'switch',
    id: 'doContrastTest',
    name: 'Enable text constrast test',
    note: "Uses the theme's default color if the proxy's contrast is too low",
    value: settings.get().doContrastTest,
  };
}

function contrastTestColour(settings) {
  return {
    type: 'color',
    id: 'contrastTestColour',
    name: 'Contrast test color',
    note: 'The background color that proxy text will be tested against (black for dark themes, white for light themes)',
    value: settings.get().contrastTestColour,
  };
}

function contrastThreshold(settings) {
  return {
    type: 'slider',
    id: 'contrastThreshold',
    name: 'Contrast ratio threshold',
    note: 'Minimum contrast ratio for proxy colors (default: 3)',
    value: settings.get().contrastThreshold,
    min: 1,
    max: 21,
    markers: [1, 2, 3, 4.5, 7, 14, 21],
  };
}

function accessibilityPanel(settings) {
  return {
    type: 'category',
    id: 'accessibilityPanel',
    name: 'Accessibility',
    collapsible: true,
    shown: false,
    settings: [doContrastTest(settings), contrastTestColour(settings), contrastThreshold(settings)],
  };
}

function cachePanel(profileMap) {
  let resetCacheBtn = (
    <button
      className='button_dd4f85 lookFilled_dd4f85 colorBrand_dd4f85 sizeSmall_dd4f85 grow_dd4f85'
      style={{ textAlign: 'center', width: '100%' }}
      onClick={() => profileMap.clear()}
    >
      Delete Cache
    </button>
  );

  return {
    type: 'category',
    id: 'cachePanel',
    name: 'Cache',
    collapsible: true,
    shown: false,
    settings: [
      {
        type: 'custom',
        id: 'logo',
        name: '',
        note: '',
        value: null,
        children: resetCacheBtn,
      },
    ],
  };
}

export function settingsPanel(settings, profileMap) {
  return BdApi.UI.buildSettingsPanel({
    settings: [title(), preferencesPanel(settings), accessibilityPanel(settings), cachePanel(profileMap)],
    onChange: (_category, id, value) => settings.update(s => Object.assign({}, s, { [id]: value })),
  });
}
