class ValueCell {
  #val;
  #listeners = [];

  constructor(val) {
    this.#val = val;
  }

  get() {
    return this.#val;
  }

  update(f) {
    let old = this.#val;
    this.#val = f(old);
    if (old !== this.#val) {
      this.#listeners.forEach(function (listener) {
        listener(this.#val);
      });
    }
  }

  addListener(f) {
    this.#listeners.push(f);
  }
}

module.exports = {
  ValueCell,
};
