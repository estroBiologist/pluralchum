import UserModalTablist from './UserModalTablist';

export default function UserModalInner({ initialSection, sections, sectionContents }) {
  const [selectedItem, setSelectedItem] = React.useState(initialSection);

  return [
    <UserModalTablist
      sections={sections}
      selectedItem={selectedItem}
      setSelectedItem={setSelectedItem}
      key='UserModalTablist'
    />,
    sectionContents[selectedItem],
  ];
}
