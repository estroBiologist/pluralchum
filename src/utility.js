class ValueCell {
  #val;
  #listeners = [];

  constructor(val) {
    this.#val = val;
  }

  get() {
    return structuredClone(this.#val);
  }

  update(f) {
    let old = this.#val;
    let current = f(structuredClone(old));
    this.#val = current;
    if (old !== current) {
      this.#listeners.forEach(function (listener) {
        listener(structuredClone(current));
      });
    }
  }

  addListener(f) {
    this.#listeners.push(f);
  }
}

class MapCell {
  #map;
  #listeners = [];

  constructor(map) {
    this.#map = map;
  }

  get(key) {
    if (Object.hasOwn(this.#map, key)) {
      return structuredClone(this.#map[key]);
    } else {
      return null;
    }
  }

  entries() {
    return Object.entries(structuredClone(this.#map));
  }

  update(key, f) {
    let old = this.get(key);
    let current = f(structuredClone(old));
    this.#map[key] = current;
    if (old !== current) {
      this.#listeners.forEach(function (listener) {
        listener(key, structuredClone(current));
      });
    }
  }

  addListener(f) {
    this.#listeners.push(f);
  }
}

module.exports = {
  ValueCell,
  MapCell,
};
