// se: Each formatted element gets a separate entry in the array ret.props.children[0].
// Some of the new elements (specifically headers) have a .markup-XXXXXX h<x> class defined.
// These classes have a set color, and this overrides the element style on the top level message content element.
// So, we iterate over message elements that have their own props field, and add the color, item by item.
// But also plain text in a message *doesn't* have props, so we still have to set ret.props.style for that.
// Waugh.
// Making a list of the specific markup types that don't format correctly,
// Because if we just do this to all formatting, that overrides the URL color too.
function colorMarkupElements(originalMessageElements, color) {
  let messageElements = [];

  const MarkupTypes = ['h1', 'h2', 'h3'];
  for (const element of originalMessageElements) {
    if (MarkupTypes.includes(element.type)) {
      messageElements.push({ ...element, props: { ...element.props, style: { color } } });
    } else {
      messageElements.push(element);
    }
  }

  return messageElements;
}

export default function ColorMessageContent({ messageContent, color }) {
  let elements = colorMarkupElements(messageContent.props.children[0], color);
  return { ...messageContent, props: { ...messageContent.props, style: { color }, children: [elements] } };
}
