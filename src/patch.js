import { dummy, ValueCell, hookupValueCell } from './utility';

const Patcher = BdApi.Patcher;

let unpatches = [];

function no_op() {
  return;
}

export class AfterPatcher {
  #repatchCount;
  #hookCount;
  #callback;
  #hookArgs;

  constructor(caller, moduleToPatch, functionName, hooks = []) {
    this.#repatchCount = new ValueCell(0);
    this.#hookCount = hooks.length;
    this.unpatch();

    Patcher.after(
      caller,
      moduleToPatch,
      functionName,
      function (ctx, args, ret) {
        hookupValueCell(this.#repatchCount);
        let hookValues = [];

        for (let i = 0; i < this.#hookCount; i++) {
          let [value, _setValue] = hooks[i](this.#hookArgs[i], ctx, args, ret);
          hookValues.push(value);
        }
        this.#callback(ctx, args, ret, hookValues);
      }.bind(this),
    );

    unpatches.push(this.unpatch.bind(this));
  }

  unpatch() {
    this.setPatch(no_op);
  }

  setPatch(callback, hookArgs = []) {
    while (hookArgs.length < this.#hookCount) {
      hookArgs.push(dummy());
    }

    this.#callback = callback;
    this.#hookArgs = hookArgs;

    this.#repatchCount.update(function (count) {
      return count + 1;
    });
  }
}

export function after(caller, moduleToPatch, functionName, callback) {
  let patcher = new AfterPatcher(caller, moduleToPatch, functionName);
  patcher.setPatch(callback);
}

export class InsteadPatcher {
  #repatchCount;
  #hookCount;
  #callback;
  #hookArgs;

  constructor(caller, moduleToPatch, functionName, hooks = []) {
    this.#repatchCount = new ValueCell(0);
    this.#hookCount = hooks.length;
    this.unpatch();

    Patcher.instead(
      caller,
      moduleToPatch,
      functionName,
      function (ctx, args, f) {
        let hookValues = [];

        for (let i = 0; i < this.#hookCount; i++) {
          let [value, _setValue] = hooks[i](this.#hookArgs[i], ctx, args, f);
          hookValues.push(value);
        }
        this.#callback(ctx, args, f, hookValues);
      }.bind(this),
    );

    unpatches.push(this.unpatch.bind(this));
  }

  unpatch() {
    this.setPatch(no_op);
  }

  setPatch(callback, hookArgs = []) {
    while (hookArgs.length < this.#hookCount) {
      hookArgs.push(dummy());
    }

    this.#callback = callback;
    this.#hookArgs = hookArgs;

    this.#repatchCount.update(function (count) {
      return count + 1;
    });
  }
}

export function instead(caller, moduleToPatch, functionName, callback) {
  let patcher = new InsteadPatcher(caller, moduleToPatch, functionName);
  patcher.setPatch(callback);
}

export function unpatchAll() {
  unpatches.forEach(function (unpatch) {
    unpatch();
  });
}
