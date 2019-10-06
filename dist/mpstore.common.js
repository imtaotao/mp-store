'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const warn = message => {
  throw new Error(`\n\n[MpStore warn]: ${message}\n\n`);
};
const assert = (condition, message) => {
  if (!condition) warn(message);
};
const mergeState = (oldState, newState) => {
  return Object.freeze(Object.assign({}, oldState, newState));
};
const isEmptyObject = obj => {
  for (const key in obj) {
    return false;
  }

  return true;
};
const remove = (list, item) => {
  const index = list.indexOf(item);

  if (index > -1) {
    list.splice(index, 1);
  }
};
const callHook = (hooks, name, args) => {
  if (hooks && typeof hooks[name] === 'function') {
    return hooks[name].apply(hooks, args);
  }
};
const createWraper = (target, before, after) => {
  return function (...args) {
    let result;

    if (typeof before === 'function') {
      before.apply(this, args);
    }

    if (typeof target === 'function') {
      result = target.apply(this, args);
    }

    if (typeof after === 'function') {
      after.apply(this, args);
    }

    return result;
  };
};
const mapObject = (obj, fn) => {
  const desObject = {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      desObject[key] = fn(obj[key]);
    }
  }

  return desObject;
};
const isPlainObject = obj => {
  if (typeof obj !== 'object' || obj === null) return false;
  const proto = Object.getPrototypeOf(obj);
  if (proto === null) return true;
  let baseProto = proto;

  while (Object.getPrototypeOf(baseProto) !== null) {
    baseProto = Object.getPrototypeOf(baseProto);
  }

  return proto === baseProto;
};

function mixin (inject) {
  const expandMethods = Object.create(null);

  if (typeof inject === 'function') {
    const callback = (name, fn) => {
      assert(typeof name === 'string' && typeof fn === 'functin', `Mixed callback parameters are illegal.`);
      assert(!(name in expandMethods), `The "${name}" is exist,`);
      expandMethods.name = fn;
    };

    inject(callback);
  }

  return expandMethods;
}

const ADD = 1;
const REMOVE = 2;
const REPLACE = 3;

function Patch(type, path, value, leftValue) {
  this.type = type;
  this.path = path;
  this.value = value;
  this.leftValue = leftValue;
}

function diffValues(left, right, path, patchs) {
  if (typeof left === 'function' || left === null) {
    patchs.push(new Patch(REPLACE, path, right, left));
  } else if (Array.isArray(left)) {
    if (Array.isArray(right)) {
      walkArray(left, right, path, patchs);
    } else {
      patchs.push(new Patch(REPLACE, path, right, left));
    }
  } else if (typeof left === 'object') {
    if (right !== null && typeof right === 'object' && !Array.isArray(right)) {
      if (left instanceof Date || right instanceof Date) {
        patchs.push(new Patch(REPLACE, path, right, left));
      } else {
        walkObject(left, right, path, patchs);
      }
    } else {
      patchs.push(new Patch(REPLACE, path, right, left));
    }
  } else {
    patchs.push(new Patch(REPLACE, path, right, left));
  }
}

function walkArray(a, b, base, patchs) {
  if (a.length <= b.length) {
    let len = a.length;

    while (--len >= 0) {
      if (a[len] !== b[len]) {
        const path = `${base}[${len}]`;
        diffValues(a[len], b[len], path, patchs);
      }
    }

    if (b.length > a.length) {
      len = b.length;

      while (--len >= a.length) {
        const path = `${base}[${len}]`;
        patchs.push(new Patch(ADD, path, b[len], a[len]));
      }
    }
  } else {
    patchs.push(new Patch(REPLACE, base, b, a));
  }
}

function walkObject(a, b, base, patchs) {
  for (const key in a) {
    const path = `${base}.${key}`;

    if (!(key in b)) {
      patchs.push(new Patch(REMOVE, path, null, a[key]));
    } else if (a[key] !== b[key]) {
      diffValues(a[key], b[key], path, patchs);
    }
  }

  for (const key in b) {
    if (!(key in a)) {
      const path = `${base}.${key}`;
      patchs.push(new Patch(ADD, path, b[key], null));
    }
  }
}

const diff = (a, b, basePath) => {
  const patchs = [];
  walkObject(a, b, basePath, patchs);
  return patchs;
};
const REG = /(?<=[\[\].])[^\[\].]+/g;

const separatePath = (obj, path) => {
  const keys = path.match(REG);

  if (keys) {
    let i = -1;
    let key = null;
    let target = obj;
    let prevTarget = null;

    while (i++ < keys.length - 2) {
      prevTarget = target;
      key = keys[i];
      target = target[key];
    }

    return [target, key, prevTarget, keys[keys.length - 1]];
  }
};

const restore = (obj, patchs) => {
  let len = patchs.length;
  const delEmptys = new Map();

  while (--len >= 0) {
    const {
      type,
      path,
      leftValue
    } = patchs[len];
    const parseItem = separatePath(obj, path);

    if (parseItem) {
      const [target, key, prevTarget, lastKey] = parseItem;

      switch (type) {
        case REMOVE:
          target[lastKey] = leftValue;
          break;

        case REPLACE:
          target[lastKey] = leftValue;
          break;

        case ADD:
          if (Array.isArray(target) && target === prevTarget[key]) {
            delEmptys.set(target, {
              key,
              prevTarget
            });
          }

          delete target[lastKey];
          break;
      }
    }
  }

  delEmptys.forEach(({
    key,
    prevTarget
  }, target) => {
    const clone = new target.constructor();
    target.forEach(item => clone.push(item));
    prevTarget[key] = clone;
  });
  return obj;
};

const COMMONACTION = '*';

const match = (layer, action) => {
  if (action === COMMONACTION) return true;
  return action === layer.action;
};

const handleLayer = (fn, action, store, payload, next) => {
  try {
    fn.call(store, payload, next);
  } catch (err) {
    const hooks = store.hooks;

    if (hooks && typeof hooks['middlewareError'] === 'function') {
      hooks['middlewareError'](action, payload, err);
    } else {
      warn(`${err}\n\n   --- from [${action}] action.`);
    }
  }
};

class Middleware {
  constructor(store) {
    this.stack = [];
    this.store = store;
  }

  use(action, fn) {
    this.stack.push({
      fn,
      action
    });
  }

  remove(action, fn) {
    const idx = this.stack.findIndex(layer => {
      return layer.fn === fn && layer.action === action;
    });

    if (idx > -1) {
      this.stack.splice(idx, 1);
    }
  }

  process(action, payload) {
    if (this.stack.length > 0) {
      let idx = 0;

      const next = prevPayload => {
        let layer = this.stack[idx];

        while (layer && !match(layer, action)) {
          layer = this.stack[++idx];
        }

        if (layer) {
          handleLayer(layer.fn, action, this.store, prevPayload, next);
        }

        idx++;
      };

      next(payload);
    }
  }

}

const applyPatchs = (component, patchs) => {
  const desObject = {};

  for (let i = 0, len = patchs.length; i < len; i++) {
    const {
      value,
      path
    } = patchs[i];
    desObject[path] = value;
  }

  component.setData(desObject);
};
const updateComponents = (deps, hooks) => {
  const len = deps.length;
  if (len <= 0) return;

  for (let i = 0; i < len; i++) {
    const {
      isPage,
      component,
      didUpdate,
      willUpdate,
      createState
    } = deps[i];

    if (component.data[GLOBALWORD]) {
      const newPartialState = createState();

      if (typeof willUpdate === 'function') {
        if (willUpdate(newPartialState) === false) {
          continue;
        }
      }

      const patchs = diff(component.data[GLOBALWORD], newPartialState, GLOBALWORD);

      if (patchs.length > 0) {
        const params = [component, newPartialState, patchs, isPage];

        if (callHook(hooks, 'willUpdate', params) === false) {
          continue;
        }

        applyPatchs(component, patchs);

        if (typeof didUpdate === 'function') {
          didUpdate(newPartialState, patchs);
        }

        callHook(hooks, 'didUpdate', [component, newPartialState, isPage]);
      }
    }
  }
};

let GLOBALWORD = 'global';

const assertReducer = (state, action, reducer) => {
  const {
    setter,
    partialState
  } = reducer;
  assert('partialState' in reducer, `You must defined [partialState].` + `\n\n --- from [${action}] action.`);
  assert(isPlainObject(partialState), `The [partialState] must be an object.` + `\n\n --- from [${action}] action.`);

  for (const key in partialState) {
    assert(!state.hasOwnProperty(key), `The [${key}] already exists in global state, ` + `Please don't repeat defined. \n\n --- from [${action}] action.`);
  }

  if (typeof setter !== 'function') {
    reducer.setter = () => {
      throw `Can\'t changed [${action}] action value. Have you defined a setter?`;
    };
  }

  return reducer;
};

class Store {
  constructor(hooks) {
    this.state = {};
    this.hooks = hooks;
    this.reducers = [];
    this.depComponents = [];
    this.isDispatching = false;
    this.middleware = new Middleware(this);
  }

  add(action, reducer) {
    assert(!this.reducers.find(v => v.action === action), `Can't repeat defined [${action}] action.`);
    const {
      partialState
    } = assertReducer(this.state, action, reducer);
    reducer.action = action;
    this.reducers.push(reducer);
    this.state = mergeState(this.state, partialState);
  }

  dispatch(action, payload, callback) {
    const {
      reducers,
      isDispatching
    } = this;
    assert(!isDispatching, 'It is not allowed to call "dispatch" during dispatch execution.' + `\n\n   --- from [${action}] action.`);
    const reducer = reducers.find(v => v.action === action);
    assert(reducer, `The "${action}" does not exist. ` + 'Maybe you have not defined.');

    const fn = prevPayload => {
      this.isDispatching = true;
      this.middleware.remove(action, fn);

      try {
        const newPartialState = reducer.setter(this.state, prevPayload);
        assert(isPlainObject(newPartialState), 'setter function should be return a plain object.');
        this.state = mergeState(this.state, newPartialState);
      } catch (error) {
        this.isDispatching = false;
        throw error;
      }

      updateComponents(this.depComponents, this.hooks);
      this.isDispatching = false;

      if (typeof callback === 'function') {
        callback();
      }
    };

    this.middleware.use(action, fn);
    this.middleware.process(action, payload);
  }

  use(action, fn) {
    if (typeof action !== 'string') {
      fn = action;
      action = COMMONACTION;
    }

    this.middleware.use(action, fn);
    return () => this.middleware.remove(action, fn);
  }

  setNamespace(key) {
    assert(key && typeof key === 'string', 'The [namespace] must be a string');
    GLOBALWORD = key;
  }

  _rewirteCfgAndAddDep(config, isPage) {
    let createState = null;
    const store = this;
    const {
      data,
      storeConfig = {}
    } = config;
    const {
      didUpdate,
      willUpdate,
      defineReducer,
      usedGlobalState
    } = storeConfig;
    delete config.storeConfig;

    if (typeof defineReducer === 'function') {
      defineReducer.call(store, store);
    }

    if (typeof usedGlobalState === 'function') {
      const defineObject = usedGlobalState.call(store, store);
      assert(isPlainObject(defineObject), '[usedGlobalState] must return a plain object,' + `but now is return a [${typeof defineObject}]`);

      createState = () => mapObject(defineObject, fn => fn(this.state));
    }

    if (createState !== null) {
      const usedState = createState();

      if (isPlainObject(usedState)) {
        data ? data[GLOBALWORD] = usedState : config.data = {
          [GLOBALWORD]: usedState
        };
      }
    }

    const addDep = component => {
      const shouldAdd = callHook(this.hooks, 'addDep', [component, isPage]);

      if (shouldAdd !== false && createState !== null) {
        if (isPlainObject(component.data[GLOBALWORD])) {
          this.depComponents.push({
            isPage,
            component,
            didUpdate,
            willUpdate,
            createState
          });
          const patchs = diff(component.data[GLOBALWORD], createState());

          if (patchs.length > 0) {
            applyPatchs(component, patchs);
          }
        }
      }
    };

    if (isPage) {
      config.onLoad = createWraper(config.onLoad, function () {
        addDep(this);
        this.store = store;
      });
      config.onUnload = createWraper(config.onLoad, null, function () {
        this.store = null;
        remove(store.depComponents, this);
      });
    } else {
      config.lifetimes = config.lifetimes || {};

      const get = name => config[name] || config.lifetimes[name];

      const set = (name, fn) => config[name] = config.lifetimes[name] = fn;

      set('attached', createWraper(get('attached'), function () {
        addDep(this);
        this.store = store;
      }));
      set('detached', createWraper(get('detached'), null, function () {
        this.store = null;
        remove(store.depComponents, this);
      }));
    }
  }

}

const nativePage = Page;
const nativeComponent = Component;

const expandConfig = (config, expandMethods, isPage) => {
  if (!isEmptyObject(expandMethods)) {
    if (isPage) {
      Object.assign(config, expandMethods);
    } else {
      config.methods = config.methods || {};
      Object.assign(config.methods, expandMethods);
    }
  }
};

function index (mixinInject, hooks) {
  const store = new Store(hooks);
  const expandMethods = mixin(mixinInject);
  Page = createWraper(nativePage, function (config) {
    callHook(hooks, 'createBefore', [config, true]);
    expandConfig(config, expandMethods, true);

    store._rewirteCfgAndAddDep(config, true);
  });
  Component = createWraper(nativeComponent, function (config) {
    callHook(hooks, 'createBefore', [config, false]);
    expandConfig(config, expandMethods, false);

    store._rewirteCfgAndAddDep(config, false);
  });
  return store;
}

exports.default = index;
exports.restore = restore;
