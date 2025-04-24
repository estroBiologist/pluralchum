const React = BdApi.React;

const tabBarClasses = BdApi.Webpack.getByKeys('container', 'tabBar', 'tabBarItem');
const otherTabBarClasses = BdApi.Webpack.getByKeys('top', 'item', 'selected', 'themed');
const classes = {
  tabBar: tabBarClasses?.tabBar ?? 'tabBar_d1d9f3',
  top: otherTabBarClasses?.top ?? 'top_b3f026',
  tabBarItem: tabBarClasses?.tabBarItem ?? 'tabBarItem_d1d9f3',
  item: otherTabBarClasses?.item ?? 'item_b3f026',
  themed: otherTabBarClasses?.themed ?? 'themed_b3f026',
  selected: otherTabBarClasses?.selected ?? 'selected_b3f026',
};

function Tab({ id, text, selectedItem, setSelectedItem }) {
  return (
    <div
      className={`${classes.tabBarItem} ${classes.item} ${classes.themed} ${
        selectedItem === id ? classes.selected : ''
      }`}
      role='tab'
      tabIndex={`${selectedItem === id ? 0 : -1}`}
      data-tab-id={id}
      onClick={() => setSelectedItem(id)}
    >
      {text}
    </div>
  );
}

export default function UserModalTablist({ sections, selectedItem, setSelectedItem }) {
  return (
    <div className={`${classes.tabBar} ${classes.top}`} role='tablist'>
      {sections.map(obj => (
        <Tab id={obj.section} text={obj.text} selectedItem={selectedItem} setSelectedItem={setSelectedItem} />
      ))}
    </div>
  );
}
