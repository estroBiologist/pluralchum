const React = BdApi.React;

export class ValueCell {
  #val;
  #listeners = [];

  constructor(val) {
    this.#val = val;
  }

  get() {
    return this.#val;
  }

  set(x) {
    this.update(function () {
      return x;
    });
  }

  update(f) {
    let old = this.#val;
    let current = f(old);
    this.#val = current;
    if (old !== current) {
      this.#listeners.forEach(function (listener) {
        listener(current);
      });
    }
  }

  addListener(f) {
    this.#listeners.push(f);

    // removeListener function
    return function () {
      let index = this.#listeners.indexOf(f);
      this.#listeners.splice(index, 1);
    }.bind(this);
  }
}

export class MapCell {
  #map;
  #listeners = [];

  constructor(map) {
    this.#map = map;
  }

  get(key) {
    if (Object.hasOwn(this.#map, key)) {
      return this.#map[key];
    } else {
      return null;
    }
  }

  set(key, value) {
    this.update(key, function () {
      return value;
    });
  }

  entries() {
    return Object.entries(this.#map);
  }

  update(key, f) {
    let old = this.get(key);
    let current = f(old);
    this.#map[key] = current;
    if (old !== current) {
      this.#listeners.forEach(function (listener) {
        listener(key, current);
      });
    }
  }

  addListener(f) {
    this.#listeners.push(f);

    // removeListener function
    return function () {
      let index = this.#listeners.indexOf(f);
      this.#listeners.splice(index, 1);
    }.bind(this);
  }

  delete(key) {
    delete this.#map[key];
    this.#listeners.forEach(function (listener) {
      listener(key, null);
    });
  }

  clear() {
    this.#map = {};
    this.#listeners.forEach(function (listener) {
      listener(null, null);
    });
  }
}

export function hookupValueCell(cell) {
  const [value, setValue] = React.useState(cell.get());
  React.useEffect(function () {
    return cell.addListener(setValue);
  });

  return [value, setValue];
}

export function isProxiedMessage(message) {
  return message.webhookId !== null;
}

export async function sleep(timeout) {
  return new Promise(resolve => setTimeout(resolve, timeout));
}

export function dummy() {
  return new Proxy(dummy, {
    apply: dummy,
    get: dummy,
  });
}

const parseBio = BdApi.Webpack.getByKeys("parseBioReact");
export function bioToReact(bio){
  try {
    const parserHelper = BdApi.Webpack.getByKeys("reactParserFor", "createReactRules");
    let newRules = parserHelper.defaultRules;

    //modified regex matcher, and link match regex from simple-markdown, replaces link match function to override Discord's 'allowLinks' check
    // Creates a match function for an inline scoped element from a regex
    var inlineRegex = function(regex) {
      var match = function(source, state) {
          if (state.inline) {
              return regex.exec(source);
          } else {
              return null;
          }
      };
      match.regex = regex;
      return match;
    };
    var LINK_INSIDE = "(?:\\[[^\\]]*\\]|[^\\[\\]]|\\](?=[^\\[]*\\]))*";
    var LINK_HREF_AND_TITLE = "\\s*<?((?:\\([^)]*\\)|[^\\s\\\\]|\\\\.)*?)>?(?:\\s+['\"]([\\s\\S]*?)['\"])?\\s*";
    newRules.link.match = inlineRegex(new RegExp("^\\[(" + LINK_INSIDE + ")\\]\\(" + LINK_HREF_AND_TITLE + "\\)"));

    let customParser = parserHelper.reactParserFor(newRules);
    const finalOutput = customParser(bio);
    return finalOutput;
  } catch (error) {
    console.warn("[PLURALCHUM] error while generating bio, falling back to default function!");
    try {
      const defaultParse = parseBio.parseBioReact(bio);
      return defaultParse;
    } catch (error) {
      console.error("[PLURALCHUM] error while generating bio!", error);
      return "Error while generating bio!";
    }
  }
}

export function generateBioComponents(bio){
  const markupClass = BdApi.Webpack.getByKeys("markup")?.markup;
  const textClass = BdApi.Webpack.getByKeys("text-sm/normal")['text-sm/normal'];
  const scrollerClass = BdApi.Webpack.getByKeys("scroller", "note")?.scroller;
  const thinClass = BdApi.Webpack.getByKeys("scrollerBase", "thin")?.thin;
  
  const memberBio = bioToReact(bio);
  const bioContainer = BdApi.React.createElement("div", {className: textClass}, memberBio);
  const markupContainer = BdApi.React.createElement("div", {className: markupClass}, bioContainer);
  const scrollerContainer = BdApi.React.createElement("div", {className: (scrollerClass + " " + thinClass), style:{overflow: 'hidden scroll', paddingRight: '8px'}}, markupContainer);
  return scrollerContainer;
}
export function generatePopoutBioComponents(bio){
  const markupClass = BdApi.Webpack.getByKeys("markup")?.markup;
  const textClass = BdApi.Webpack.getByKeys("text-sm/normal")['text-sm/normal'];
  const thinClass = BdApi.Webpack.getByKeys("scrollerBase", "thin")?.thin;
  
  const memberBio = bioToReact(bio);
  const bioContainer = BdApi.React.createElement("div", {className: textClass}, memberBio);
  const markupContainer = BdApi.React.createElement("div", {className: markupClass}, bioContainer);
  const scrollerContainer = BdApi.React.createElement("div", {className: thinClass, style:{overflow: 'hidden scroll', "max-height": '30vh'}}, markupContainer);
  return scrollerContainer;
}

export const pluginName = 'Pluralchum';
