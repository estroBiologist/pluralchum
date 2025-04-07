const parseBio = BdApi.Webpack.getByKeys('parseBioReact');
export default function Bio({ content }) {
  try {
    const parserHelper = BdApi.Webpack.getByKeys('reactParserFor', 'createReactRules');
    let newRules = parserHelper.defaultRules;

    //modified regex matcher, and link match regex from simple-markdown, replaces link match function to override Discord's 'allowLinks' check
    // Creates a match function for an inline scoped element from a regex
    var inlineRegex = function (regex) {
      var match = function (source, state) {
        if (state.inline) {
          return regex.exec(source);
        } else {
          return null;
        }
      };
      match.regex = regex;
      return match;
    };
    var LINK_INSIDE = '(?:\\[[^\\]]*\\]|[^\\[\\]]|\\](?=[^\\[]*\\]))*';
    var LINK_HREF_AND_TITLE = '\\s*<?((?:\\([^)]*\\)|[^\\s\\\\]|\\\\.)*?)>?(?:\\s+[\'"]([\\s\\S]*?)[\'"])?\\s*';
    newRules.link.match = inlineRegex(new RegExp('^\\[(' + LINK_INSIDE + ')\\]\\(' + LINK_HREF_AND_TITLE + '\\)'));

    let customParser = parserHelper.reactParserFor(newRules);
    const finalOutput = customParser(content);
    return finalOutput;
  } catch (error) {
    console.warn('[PLURALCHUM] error while generating bio, falling back to default function!');
    try {
      const defaultParse = parseBio.parseBioReact(content);
      return defaultParse;
    } catch (error) {
      console.error('[PLURALCHUM] error while generating bio!', error);
      return 'Error while generating bio!';
    }
  }
}
