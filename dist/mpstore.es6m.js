function warning (message, noError) {
  message = `\n\n[MpStore warning]: ${message}\n\n`;
  if (noError) {
    console.warn(message);
    return
  }
  throw new Error(message)
}
function assert (condition, message) {
  if (!condition) warning(message);
}
function isPrimitive (value) {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'symbol' ||
    typeof value === 'boolean'
  )
}
function deepFreeze (state) {
  const names = Object.getOwnPropertyNames(state);
  let len = names.length;
  while (~len--) {
    const value = state[names[len]];
    if (typeof value === 'object' && value !== null) {
      deepFreeze(value);
    }
  }
  return Object.freeze(state)
}
function mergeState (oldState, newState) {
  return deepFreeze(Object.assign({}, oldState, newState))
}
function mixinMethods (config, methods) {
  for (const key in methods) {
    if (!(key in config)) {
      config[key] = methods[key];
    }
  }
}
function inspectState(partialState, state, sendWarn) {
  for (const key in partialState) {
    assert(!state.hasOwnProperty(key), sendWarn(key));
  }
}
function remove (list, component) {
  const index = list.findIndex(item => item.component === component);
  if (index > -1) {
    list.splice(index, 1);
  }
}
function callHook (hooks, name, args) {
  if (hooks && typeof hooks[name] === 'function') {
    return hooks[name].apply(hooks, args)
  }
}
function isEmptyObject (obj) {
  for (const k in obj){
    return false
  }
  return true
}
function mapObject (obj, fn) {
  const destObject = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      destObject[key] = fn(obj[key]);
    }
  }
  return destObject
}
function createWraper (target, before, after) {
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
    return result
  }
}
function isPlainObject (obj) {
  if (typeof obj !== 'object' || obj === null) return false
  const proto = Object.getPrototypeOf(obj);
  if (proto === null) return true
  let baseProto = proto;
  while (Object.getPrototypeOf(baseProto) !== null) {
    baseProto = Object.getPrototypeOf(baseProto);
  }
  return proto === baseProto
}
function clone (value, record = new WeakMap) {
  if (
    value === null ||
    value === undefined ||
    isPrimitive(value) ||
    typeof value === 'function' ||
    value instanceof Date
  ) {
    return value
  }
  if (record.has(value)) return record.get(value)
  const result = typeof value.constructor !== 'function'
    ? Object.create(null)
    : new value.constructor();
  record.set(value, result);
  for (const key in value) {
    result[key] = clone(value[key], record);
  }
  return result
}
function parsePath (path) {
  const segments = path.split('.');
  return function (obj) {
    for (let i = 0, len = segments.length; i < len; i++) {
      if (!obj) return
      obj = obj[segments[i]];
    }
    return obj
  }
}

function mixin (inject) {
  const expandMethods = Object.create(null);
  if (typeof inject === 'function') {
    const callback = (name, fn) => {
      assert(
        typeof name === 'string',
        `The mixed method name must a string.`,
      );
      assert(
        typeof fn === 'function',
        'The mixed method is not a function.'
      );
      assert(
        !(name in expandMethods),
        `The "${name}" is exist,`);
      expandMethods[name] = fn;
    };
    inject(callback);
  }
  return expandMethods
}

const MODULE_FLAG = '__mpModule';
function isModule (m) {
  return isPlainObject(m) && m[MODULE_FLAG] === true
}
function getModule (state, namespace) {
  return namespace
    ? parsePath(namespace)(state)
    : state
}
function createModule (obj) {
  assert(
    isPlainObject(obj),
    'The base module object must be an plain object',
  );
  if (isModule(obj)) return obj
  assert(
    !(MODULE_FLAG in obj),
    `the [${MODULE_FLAG}] is the keyword of the mpStore module, you can't use it`,
  );
  obj[MODULE_FLAG] = true;
  return obj
}

const ADD = 1;
const REMOVE = 2;
const REPLACE = 3;
function Patch (type, path, value, leftValue) {
  this.type = type;
  this.path = path;
  this.value = value;
  this.leftValue = leftValue;
}
function diffValues (left, right, path, patchs) {
  if (typeof left === 'function' || left === null) {
    patchs.push(new Patch(REPLACE, path, right, left));
  } else if (Array.isArray(left)) {
    if (Array.isArray(right)) {
      walkArray(left, right, path, patchs);
    } else {
      patchs.push(new Patch(REPLACE, path, right, left));
    }
  } else if (typeof left === 'object') {
    if (
        right !== null &&
        typeof right === 'object' &&
        !Array.isArray(right)
    ) {
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
function walkArray (a, b, base, patchs) {
  if (a.length <= b.length) {
    let len = a.length;
    while (~--len) {
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
function walkObject (a, b, base, patchs) {
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
function diff (a, b, basePath) {
  const patchs = [];
  walkObject(a, b, basePath, patchs);
  return patchs
}
const REG = /[^\[\].]+(?=[\[\].])/g;
function separatePath (obj, path) {
  const keys = path.match(REG);
  if (keys && keys.shift() && keys.length > 0) {
    let i = -1;
    let key = null;
    let target = obj;
    let prevTarget = null;
    while (i++ < keys.length - 2) {
      prevTarget = target;
      key = keys[i];
      target = target[key];
    }
    return [target, key, prevTarget, keys[keys.length -1]]
  }
}
function restore (obj, patchs) {
  let len = patchs.length;
  const deleteEmptys = new Map();
  while (~--len) {
    const { type, path, leftValue } = patchs[len];
    const parseItem = separatePath(obj, path + '.');
    if (parseItem) {
      const [target, key, prevTarget, lastKey] = parseItem;
      switch (type) {
        case REMOVE :
          target[lastKey] = leftValue;
          break
        case REPLACE :
          target[lastKey] = leftValue;
          break
        case ADD :
          if (Array.isArray(target) && target === prevTarget[key]) {
            deleteEmptys.set(target, { key, prevTarget });
          }
          delete target[lastKey];
          break
      }
    }
  }
  deleteEmptys.forEach(({ key, prevTarget }, target) => {
    const clone = new target.constructor();
    target.forEach(item => clone.push(item));
    prevTarget[key] = clone;
  });
  return obj
}

function applyPatchs (component, patchs, callback) {
  const destObject = {};
  for (let i = 0, len = patchs.length; i < len; i++) {
    const { value, path } = patchs[i];
    destObject[path] = value;
  }
  component.setData(destObject, callback);
}
function updateComponents (store, callback) {
  let total = 0;
  const {
    hooks,
    GLOBALWORD,
    depComponents,
  } = store;
  const len = depComponents.length;
  if (len === 0) {
    if (typeof callback === 'function') {
      callback();
    }
    return
  }
  const renderedCallback = () => {
    if (++total === len) {
      if (typeof callback === 'function') {
        callback();
      }
    }
  };
  for (let i = 0; i < len; i++) {
    const {
      isPage,
      component,
      didUpdate,
      willUpdate,
      createState,
    } = depComponents[i];
    if (component.data[GLOBALWORD]) {
      const newPartialState = createState();
      if (typeof willUpdate === 'function') {
        if (willUpdate.call(store, component, newPartialState) === false) {
          renderedCallback();
          continue
        }
      }
      const patchs = diff(component.data[GLOBALWORD], newPartialState, GLOBALWORD);
      if (patchs.length > 0) {
        const params = [component, newPartialState, patchs, isPage];
        if (callHook(hooks, 'willUpdate', params) === false) {
          renderedCallback();
          continue
        }
        applyPatchs(component, patchs, renderedCallback);
        if (typeof didUpdate === 'function') {
          didUpdate.call(store, component, newPartialState, patchs);
        }
        callHook(hooks, 'didUpdate', [component, newPartialState, isPage]);
        if (component.timeTravel) {
          component.timeTravel.push(patchs);
        }
      } else {
        renderedCallback();
      }
    } else {
      renderedCallback();
    }
  }
}

class TimeTravel {
  constructor (component, GLOBALWORD, limit) {
    this.history = [];
    this.limit = limit;
    this.component = component;
    this.GLOBALWORD = GLOBALWORD;
    this.length = this.history.length;
    this.current = this.history.length;
    this.finallyState = component.data[GLOBALWORD];
  }
  push (patchs) {
    const {
      limit,
      history,
      GLOBALWORD,
      history: { length },
      component: { data },
    } = this;
    if (limit > 0) {
      const extraCount = length - limit;
      if (extraCount >= 0) {
        this.history.splice(0, extraCount + 1);
      }
      this.history.push(patchs);
      this.length = history.length;
      this.current = history.length;
      this.finallyState = clone(data[GLOBALWORD]);
    }
  }
  go (n) {
    const {
      current,
      history,
      component,
      GLOBALWORD,
      finallyState,
    } = this;
    assert(
      GLOBALWORD in component.data,
      'You can\'t use [timeTravel] because it only works for [global state]',
    );
    if (this.limit > 0) {
      if (n !== 0) {
        const range = n + current;
        const backtrack = Math.abs(n);
        if (range < 0 || range > history.length) {
          warning(`Index [${range}] is not within the allowed range.`, true);
          return
        }
        let index = 0;
        let data = clone(component.data[GLOBALWORD]);
        while(index++ < backtrack) {
          const id = current + Math.sign(n) * index;
          if (id < history.length) {
            const patchs = clone(history[id]);
            data = restore(data, patchs);
          } else {
            data = finallyState;
          }
        }
        const endPatchs = diff(component.data[GLOBALWORD], data, GLOBALWORD);
        if (endPatchs.length > 0) {
          applyPatchs(component, endPatchs);
        }
        this.current += n;
      }
    }
  }
  forward () {
    this.go(1);
  }
  back () {
    this.go(-1);
  }
  toStart () {
    this.go(-this.current);
  }
  toEnd () {
    this.go(this.history.length - this.current);
  }
}

const COMMONACTION = () => {};
function match (layer, action) {
  if (layer.action === COMMONACTION) return true
  return action === layer.action
}
function handleLayer (
  action,
  fn,
  store,
  payload,
  next,
  restoreProcessState,
) {
  try {
    fn.call(store, payload, next, action);
    restoreProcessState();
  } catch (error) {
    const hooks = store.hooks;
    restoreProcessState();
    if (hooks && typeof hooks['middlewareError'] === 'function') {
      hooks['middlewareError'](action, payload, error);
    } else {
      warning(`${error}\n\n   --- from middleware [${action}] action.`);
    }
  }
}
class Middleware {
  constructor (store) {
    this.stack = [];
    this.store = store;
    this.isProcessing = false;
  }
  use (action, fn) {
    assert(
      !this.isProcessing,
      'can\'t allow add new middleware in the middleware processing.'
    );
    this.stack.push({ fn, action });
  }
  remove (action, fn) {
    const index = this.stack.findIndex(layer => {
      return layer.fn === fn && layer.action === action
    });
    if (index > -1) {
      this.stack.splice(index, 1);
    }
  }
  process (action, payload, finish) {
    this.isProcessing = true;
    const restoreProcessState = () => {
      this.isProcessing = false;
    };
    if (this.stack.length > 0) {
      let index = 0;
      const next = prevPayload => {
        let layer = this.stack[index];
        index++;
        while (layer && !match(layer, action)) {
          layer = this.stack[index++];
        }
        if (layer) {
          handleLayer(
            action,
            layer.fn,
            this.store,
            prevPayload,
            next,
            restoreProcessState,
          );
        } else {
          finish(prevPayload, restoreProcessState);
        }
      };
      next(payload);
    } else {
      finish(payload, restoreProcessState);
    }
  }
}

let storeId = 0;
function filterReducer (state, action, reducer) {
  const { setter, namespace, partialState } = reducer;
  assert(
    'partialState' in reducer,
    `You must defined [partialState].` +
      `\n\n --- from [${action}] action.`,
  );
  assert(
    isPlainObject(partialState),
    `The [partialState] must be an object.` +
      `\n\n --- from [${action}] action.`,
  );
  if ('namespace' in reducer) {
    assert(
      typeof namespace === 'string',
      'The module namespace must be a string.' +
        `\n\n --- from [${action}] action.`,
    );
    const module = getModule(state, namespace);
  } else {
    inspectState(partialState, state, key => {
      return `The [${key}] already exists in global state, ` +
        `Please don't repeat defined. \n\n --- from [${action}] action.`
    });
    if (isModule(partialState)) ;
  }
  if (typeof setter !== 'function') {
    reducer.setter = () => {
      warning(
        `Can\'t changed [${action}] action value. Have you defined a setter?` +
          `\n\n --- from [${action}] action.`
      );
    };
  }
  return reducer
}
class Store {
  constructor (hooks) {
    this.hooks = hooks;
    this.reducers = [];
    this.id = ++storeId;
    this.depComponents = [];
    this.GLOBALWORD = 'global';
    this.isDispatching = false;
    this.version = '0.0.10';
    this.state = Object.freeze(createModule({}));
    this.middleware = new Middleware(this);
  }
  add (action, reducer) {
    assert(
      !this.reducers.find(v => v.action === action),
      `Can't repeat defined [${action}] action.`,
    );
    const { partialState } = filterReducer(this.state, action, reducer);
    reducer.action = action;
    this.reducers.push(reducer);
    if (!isEmptyObject(partialState)) {
      this.state = mergeState(this.state, partialState);
    }
  }
  dispatch (action, payload, callback) {
    const { reducers, isDispatching } = this;
    assert(
      !isDispatching,
      'It is not allowed to call "dispatch" during dispatch execution.' +
        `\n\n   --- from [${action}] action.`
    );
    const reducer = reducers.find(v => v.action === action);
    assert(
      reducer,
      `The [${action}] action does not exist. ` +
        'Maybe you have not defined.'
    );
    this.middleware.process(action, payload, (destPayload, restoreProcessState) => {
      this.isDispatching = true;
      try {
        let newPartialState;
        const namespace = reducer.namespace;
        const isModuleDispatch = typeof namespace === 'string';
        if (isModuleDispatch) {
          const module = this.getModule(namespace, true);
          newPartialState = reducer.setter(module, destPayload, this.state);
        } else {
          newPartialState = reducer.setter(this.state, destPayload);
        }
        assert(
          isPlainObject(newPartialState),
          'setter function should be return a plain object.',
        );
        if (!isEmptyObject(newPartialState)) {
          if (isModuleDispatch) {
            this.state = mergeState(
              this.state,
              {
                [namespace]: Object.assign(
                  {},
                  this.getModule(namespace),
                  newPartialState,
                ),
              },
            );
          } else {
            this.state = mergeState(
              this.state,
              newPartialState,
            );
          }
        }
      } finally {
         this.isDispatching = false;
        restoreProcessState();
      }
      updateComponents(this, callback);
    });
  }
  use (action, fn) {
    if (
      typeof action === 'function' &&
      action !== COMMONACTION
    ) {
      fn = action;
      action = COMMONACTION;
    }
    this.middleware.use(action, fn);
    return () => this.middleware.remove(action, fn)
  }
  setNamespace (key) {
    assert(
      key && typeof key === 'string',
      'The [namespace] must be a string',
    );
    this.GLOBALWORD = key;
  }
  getModule (namespace, needInspect) {
    assert(
      typeof namespace === 'string',
      'the namespace mast be a string',
    );
    const module = parsePath(namespace)(this.state);
    if (needInspect && !(isPlainObject(module) && module.__mpModule)) {
      warning(`The [${namespace}] module is not exist.`);
    }
    return module
  }
  rewirteCfgAndAddDep (config, isPage) {
    let createState = null;
    const store = this;
    const GLOBALWORD = this.GLOBALWORD;
    const { data, storeConfig = {} } = config;
    const {
      useState,
      didUpdate,
      willUpdate,
      defineReducer,
      travelLimit = 0,
    } = storeConfig;
    assert(
      typeof travelLimit === 'number',
      `[travelLimit] must be a number, but now is [${typeof travelLimit}].`
    );
    delete config.storeConfig;
    if (typeof defineReducer === 'function') {
      defineReducer.call(store, store);
    }
    if (typeof useState === 'function') {
      let namespace = null;
      let defineObject = null;
      const useConfig = useState.call(store, store);
      if (Array.isArray(useConfig)) {
        namespace = useConfig[0];
        defineObject = useConfig[1];
      } else {
        defineObject = useConfig;
      }
      assert(
        isPlainObject(defineObject),
        '[useState] must return a plain object, ' +
          `but now is return a [${typeof defineObject}]`,
      );
      createState = () => clone(mapObject(defineObject, fn => {
        return namespace === null
          ? fn(store.state)
          : fn(this.getModule(namespace, true), store.state)
      }));
    }
    if (createState !== null) {
      const useState = createState();
      if (isPlainObject(useState)) {
        data
          ? data[GLOBALWORD] = useState
          : config.data = { [GLOBALWORD]: useState };
      }
    }
    const addDep = component => {
      const shouldAdd = callHook(this.hooks, 'addDep', [component, isPage]);
      if (shouldAdd !== false && createState !== null) {
        if (component.data && isPlainObject(component.data[GLOBALWORD])) {
          component.timeTravel = new TimeTravel(component, GLOBALWORD, travelLimit);
          this.depComponents.push({
            isPage,
            component,
            didUpdate,
            willUpdate,
            createState,
          });
          const patchs = diff(component.data[GLOBALWORD], createState(), GLOBALWORD);
          if (patchs.length > 0) {
            applyPatchs(component, patchs, GLOBALWORD);
          }
        }
      }
    };
    if (isPage) {
      config.onLoad = createWraper(
        config.onLoad,
        function () {
          addDep(this);
          this.store = store;
        },
      );
      config.onUnload = createWraper(
        config.onUnload,
        null,
        function () {
          remove(store.depComponents, this);
        },
      );
    } else {
      config.lifetimes = config.lifetimes || {};
      const get = name => config[name] || config.lifetimes[name];
      const set = (name, fn) => config[name] = config.lifetimes[name] = fn;
      set('attached', createWraper(
        get('attached'),
        function () {
          addDep(this);
          this.store = store;
        },
      ));
      set('detached', createWraper(
        get('detached'),
        null,
        function () {
          remove(store.depComponents, this);
        },
      ));
    }
  }
}

const version = '0.0.10';
const nativePage = Page;
const nativeComponent = Component;
function expandConfig (config, expandMethods, isPage) {
  if (!isEmptyObject(expandMethods)) {
    if (isPage) {
      mixinMethods(config, expandMethods);
    } else {
      config.methods = config.methods || {};
      mixinMethods(config.methods, expandMethods);
    }
  }
}
function index (mixinInject, hooks) {
  const store = new Store(hooks);
  const expandMethods = mixin(mixinInject);
  Page = createWraper(
    nativePage,
    function (config) {
      callHook(hooks, 'createBefore', [config, true]);
      expandConfig(config, expandMethods, true);
      store.rewirteCfgAndAddDep(config, true);
    },
  );
  Component = createWraper(
    nativeComponent,
    function (config) {
      callHook(hooks, 'createBefore', [config, false]);
      expandConfig(config, expandMethods, false);
      store.rewirteCfgAndAddDep(config, false);
    },
  );
  return store
}

export default index;
export { clone, createModule, diff, restore, version };
//# sourceMappingURL=mpstore.es6m.js.map
