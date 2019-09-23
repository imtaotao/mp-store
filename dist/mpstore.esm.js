const warn = message => {
  throw new Error(`\n[MpStore warn]: ${message}\n\n`);
};
const assert = (condition, message) => {
  if (condition) warn(message);
};
const mergeState = (oldState, newState) => {
  return Object.freeze({ ...oldState,
    ...newState
  });
};
const isEmptyObject = obj => {
  for (const key in obj) return false;

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
      assert(typeof name !== 'string' || typeof fn !== 'functin', `Mixed callback parameters are illegal.`);
      assert(name in expandMethods, `The "${name}" is exist,`);
      expandMethods.name = fn;
    };

    inject(callback);
  }

  return expandMethods;
}

const ADD = 1;
const REMOVE = 2;
const REPLACE = 3;

function Patch(type, path, value) {
  this.type = type;
  this.path = path;
  this.value = value;
}

function diffValues(left, right, path, patchs) {
  if (typeof left === 'function' || left === null) {
    patchs.push(new Patch(REPLACE, path, right));
  } else if (Array.isArray(left)) {
    if (Array.isArray(right)) {
      walkArray(left, right, path, patchs);
    } else {
      patchs.push(new Patch(REPLACE, path, right));
    }
  } else if (typeof left === 'object') {
    if (right !== null && typeof right === 'object') {
      if (left instanceof Date || right instanceof Date) {
        patchs.push(new Patch(REPLACE, path, right));
      } else {
        walkObject(left, right, path, patchs);
      }
    } else {
      patchs.push(new Patch(REPLACE, path, right));
    }
  } else {
    patchs.push(new Patch(REPLACE, path, right));
  }
}

function walkArray(a, b, base, patchs) {
  let len = a.length;

  while (--len >= 0) {
    const path = `${base}[${len}]`;

    if (len > b.length - 1) {
      patchs.push(new Patch(REMOVE, path, null));
    } else if (a[len] !== b[len]) {
      diffValues(a[len], b[len], path, patchs);
    }
  }

  if (b.length > a.length) {
    len = b.length;

    while (--len >= a.length) {
      const path = `${base}[${len}]`;
      patchs.push(new Patch(ADD, path, b[len]));
    }
  }
}

function walkObject(a, b, base, patchs) {
  for (const key in a) {
    const path = `${base}.${key}`;

    if (!(key in b)) {
      patchs.push(new Patch(REMOVE, path, null));
    } else if (a[key] !== b[key]) {
      diffValues(a[key], b[key], path, patchs);
    }
  }

  for (const key in b) {
    if (!(key in a)) {
      const path = `${base}.${key}`;
      patchs.push(new Patch(ADD, path, b[key]));
    }
  }
}

function diff (a, b, basePath) {
  const patchs = [];
  walkObject(a, b, basePath, patchs);
  return patchs;
}

function applyPatchs(component, patchs) {
  const desObject = {};

  for (let i = 0, len = patchs.length; i < len; i++) {
    const {
      type,
      value,
      path
    } = patchs[i];
    desObject[path] = value;
  }

  component.setData(desObject);
}

function updateComponent(deps, hooks) {
  for (let i = 0, len = deps.length; i < len; i++) {
    const {
      component,
      didUpdate,
      willUpdate,
      createState
    } = deps[i];

    if (component.data.global) {
      const newPartialState = createState();

      if (typeof willUpdate === 'function') {
        if (willUpdate(newPartialState) === false) {
          continue;
        }
      }

      const patch = diff(component.data.global, newPartialState, GLOBALWORD);

      if (patch.length > 0) {
        if (callHook(hooks, 'willUpdate', [component, newPartialState, patch]) === false) {
          continue;
        }

        applyPatchs(component, patch);

        if (typeof didUpdate === 'function') {
          didUpdate(newPartialState);
        }

        callHook(hooks, 'didUpdate', [component, newPartialState]);
      }
    }
  }
}

const COMMONACTION = '*';

const match$1 = (layer, action) => {
  if (action === COMMONACTION) return true;
  return action === layer.action;
};

function Layer(action, fn) {
  this.fn = fn;
  this.action = action;
}

class Router {
  constructor(store) {
    this.stack = [];
    this.store = store;
  }

  use(action, fn) {
    this.stack.push(new Layer(action, fn));
  }

  remove(action, fn) {
    const index = this.stack.findIndex(layer => {
      return layer.fn === fn && layer.action === action;
    });

    if (index > -1) {
      this.stack.splice(index, 1);
    }
  }

  handle(action, payload) {
    const len = this.stack.length;

    if (len > 0) {
      let idx = 0;

      const next = prevPayload => {
        let layer = this.stack[idx];

        while (layer && !match$1(layer, action)) {
          layer = this.stack[++idx];
        }

        if (layer) {
          layer.fn.call(this.store, prevPayload, next);
        }
      };

      next(payload);
    }
  }

}

let GLOBALWORD = 'global';

const assertReducer = (state, action, reducer) => {
  const {
    setter,
    partialState
  } = reducer;
  assert(!('partialState' in reducer), `You must defined "partialState" of "${action}".`);
  assert(!partialState || typeof partialState !== 'object', `The partialState of "${action}" must be an object.`);

  for (const key in partialState) {
    assert(state.hasOwnProperty(key), `The "${key}" already exists in global state,` + 'Please don\'t repeat defined.');
  }

  if (typeof setter !== 'function') {
    reducer.setter = () => {
      warn(`Can\'t set "${action}" value. ` + 'Have you defined a setter?');
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
    this.router = new Router(this);
  }

  add(action, reducer) {
    const {
      partialState
    } = assertReducer(this.state, action, reducer);
    reducer.action = action;
    this.reducers.push(reducer);
    this.state = mergeState(this.state, partialState);
  }

  dispatch(action, payload) {
    const {
      reducers,
      isDispatching
    } = this;
    assert(isDispatching, 'It is not allowed to call "dispatch" during dispatch execution.' + `\n\n   --- from [${action}] action.`);
    const reducer = reducers.find(v => v.action === action);
    assert(!reducer, `The "${action}" does not exist. ` + 'Maybe you have not defined.');
    const removeMiddleware = this.use(action, prevPayload => {
      removeMiddleware();
      const newPartialState = reducer.setter(this.state, prevPayload);
      this.state = mergeState(this.state, newPartialState);
      updateComponent(this.depComponents, this.hooks);
    });
    this.router.handle(action, payload);
  }

  use(action, fn) {
    if (typeof action !== 'string') {
      fn = action;
      action = COMMONACTION;
    }

    const wrapfn = (payload, next) => {
      this.isDispatching = true;

      try {
        fn(payload, next);
      } catch (err) {
        this.isDispatching = false;

        if (this.hooks && typeof this.hooks[middlewareError] === 'function') {
          this.hooks[middlewareError](action, payload, err);
        } else {
          warn(`${err}\n\n   --- from [${action}] action.`);
        }
      }

      this.isDispatching = false;
    };

    this.router.use(match, wrapfn);
    return () => this.router.remove(action, wrapfn);
  }

  setNamespace(key) {
    if (typeof key === 'string') {
      GLOBALWORD = key;
    }
  }

  _rewirteCfgAndAddDep(config, isPage) {
    const store = this;
    const {
      data,
      storeConfig = {}
    } = config;
    const {
      didUpdate,
      willUpdate,
      defineReducer,
      defineGlobalState
    } = storeConfig;
    data ? data[GLOBALWORD] = {} : config.data = {
      [GLOBALWORD]: {}
    };

    if (typeof defineReducer === 'function') {
      defineReducer.call(store, store);
      delete config.storeConfig;
    }

    const addDep = component => {
      callHook(this.hooks, 'addDep', [component, isPage]);

      if (typeof defineGlobalState === 'function') {
        const defineObject = defineGlobalState.call(store, store);

        const createState = () => mapObject(defineObject, fn => fn(this.state));

        const usedState = createState();

        if (isPlainObject(usedState)) {
          this.depComponents.push({
            isPage,
            component,
            didUpdate,
            willUpdate,
            createState
          });
          component.setData({
            [GLOBALWORD]: usedState
          });
        }
      }
    };

    if (isPage) {
      const nativeLoad = config.onLoad;
      const nativeUnload = config.onUnload;

      config.onLoad = function (opts) {
        addDep(this);
        this.store = store;

        if (typeof nativeLoad === 'function') {
          nativeLoad.call(this, opts);
        }
      };

      config.onUnload = function (opts) {
        if (typeof nativeUnload === 'function') {
          nativeUnload.call(this, opts);
        }

        this.store = null;
        remove(store.depComponents, this);
      };
    } else {
      config.lifetimes = config.lifetimes || {};
      const nativeAttached = config.attached || config.lifetimes.attached;
      const nativeDetached = config.detached || config.lifetimes.detached;

      config.attached = config.lifetimes.attached = function (opts) {
        addDep(this);
        this.store = store;

        if (typeof nativeAttached === 'function') {
          nativeAttached.call(this, opts);
        }
      };

      config.detached = config.lifetimes.detached = function (opts) {
        if (typeof nativeDetached === 'function') {
          nativeDetached.call(this, opts);
        }

        this.store = null;
        remove(store.depComponents, this);
      };
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
      if (config.methods) {
        Object.assign(config.methods, expandMethods);
      } else {
        config.methods = { ...expandMethods
        };
      }
    }
  }
};

function index (mixinInject, hooks) {
  const store = new Store(hooks);
  const expandMethods = mixin(mixinInject);

  function createPage(config) {
    expandConfig(config, expandMethods, true);

    store._rewirteCfgAndAddDep(config, true);

    callHook(hooks, 'createBefore', [true, config]);
    nativePage.call(this, config);
    callHook(hooks, 'created', [true]);
  }

  function createComponent(config) {
    expandConfig(config, expandMethods, false);

    store._rewirteCfgAndAddDep(config, false);

    callHook(hooks, 'createBefore', [false, config]);
    nativeComponent.call(this, config);
    callHook(hooks, 'created', [true]);
  }

  return {
    createPage,
    createComponent,
    store
  };
}

export default index;
