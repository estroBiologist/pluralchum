import UserModalTablist from './UserModalTablist';

const React = BdApi.React;

export default function UserModalInner({ initialSection, sections, sectionContents }) {
  const [selectedItem, setSelectedItem] = React.useState(initialSection);

  return [
    <UserModalTablist sections={sections} selectedItem={selectedItem} setSelectedItem={setSelectedItem} />,
    sectionContents[selectedItem],
  ];
}
