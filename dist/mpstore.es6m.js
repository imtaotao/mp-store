/*!
 * Mpstore.js v0.2.1
 * (c) 2019-2020 Imtaotao
 * Released under the MIT License.
 */
function warning (message, noError) {
  message = `\n\nMpStore warning: ${message}\n\n`;
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
  if (Object.isFrozen(state)) return state
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
function mergeState (oldState, newState, env) {
  const state = Object.assign({}, oldState, newState);
  return env === 'develop'
    ? deepFreeze(state)
    : state
}
function mixinMethods (config, methods) {
  for (const key in methods) {
    if (!(key in config)) {
      config[key] = methods[key];
    }
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

const MODULE_FLAG = Symbol('module');
function isModule (m) {
  return isPlainObject(m) && m[MODULE_FLAG] === true
}
function addModuleFlag (obj) {
  obj[MODULE_FLAG] = true;
  return obj
}
function createModule (obj) {
  assert(
    isPlainObject(obj),
    'The base module object must be an plain object',
  );
  if (isModule(obj)) {
    return obj
  }
  addModuleFlag(obj);
  return obj
}
function getModule (state, namespace) {
  if (!namespace) return state
  let module = state;
  const segments = namespace.split('.');
  for (let i = 0, len = segments.length; i < len; i++) {
    if (!isModule(module)) return null
    module = module[segments[i]];
  }
  return isModule(module) ? module : null
}
function assertChildModule(a, b, key) {
  const isModuleForOrigin = isModule(a);
  const isModuleForCurrent = isModule(b);
  assert(
    !(isModuleForOrigin && !isModuleForCurrent),
    `The namespace [${key}] is a module that you can change to other value, ` +
      'You can use `createModule` method to recreate a module.' +
        '\n\n  --- from setter function.',
  );
  assert(
    !(!isModuleForOrigin && isModuleForCurrent),
    `The namespace [${key}] is not a module, you can't create it as a module, ` +
      'you must define the module in `reducer`.' +
        '\n\n  --- from setter function.',
  );
  return isModuleForOrigin && isModuleForCurrent
}
function checkChildModule(a, b) {
  let keys = Object.keys(b);
  let len = keys.length;
  while(~--len) {
    const key = keys[len];
    if (assertChildModule(a[key], b[key], key)) {
      checkChildModule(a[key], b[key]);
    }
  }
  keys = Object.keys(a);
  len = keys.length;
  while(~--len) {
    const key = keys[len];
    if (!(key in b)) {
      assertChildModule(a[key], b[key], key);
    }
  }
}
function mergeModule (module, partialModule, moduleName, createMsg, env) {
  const keys = Object.keys(partialModule);
  let len = keys.length;
  if (env === 'develop') {
    while(~--len) {
      const key = keys[len];
      if (typeof createMsg === 'function') {
        assert(!(key in module), createMsg(key, moduleName));
      } else {
        const originItem = module[key];
        const currentPartialItem = partialModule[key];
        if (assertChildModule(originItem, currentPartialItem, key)) {
          checkChildModule(originItem, currentPartialItem);
        }
      }
    }
  }
  return createModule(Object.assign({}, module, partialModule))
}
function createModuleByNamespace (namespace, partialModule, rootModule, stringifyAction, createMsg, env) {
  partialModule = partialModule || {};
  if (!namespace) {
    return mergeModule(rootModule, partialModule, null, null, env)
  }
  let parentWraper = {};
  let parentModule = rootModule;
  const moduleWraper = parentWraper;
  const segments = namespace.split('.');
  const remaingMsg =  `\n\n  --- from [${stringifyAction}] action`;
  for (let i = 0, len = segments.length; i < len; i++) {
    let childModule;
    const key = segments[i];
    const isLastIndex = i === len - 1;
    if (key in parentModule) {
      assert(
        isModule(parentModule[key]),
        'you can\'t create child moudle, ' +
          `because namespace [${key}] already exists in [${segments[i - 1] || 'root'}] module, ` +
            `but [${key}] not a module.${remaingMsg}`,
      );
      childModule = isLastIndex
        ? mergeModule(parentModule[key], partialModule, key, createMsg, env)
        : Object.assign({}, parentModule[key]);
    } else {
      childModule = isLastIndex
        ? createModule(partialModule)
        : addModuleFlag({});
    }
    parentWraper[key] = childModule;
    parentWraper = childModule;
    parentModule = childModule;
  }
  return moduleWraper
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
function asyncUpdate (store, type, callback) {
  if (type === null) {
    updateComponents(store, callback);
    return
  }
  if (store[type].length === 0) {
    setTimeout(() => {
      const cbs = store[type].slice();
      store[type].length = 0;
      updateComponents(store, () => {
        for (let i = 0; i < cbs.length; i++) {
          if (typeof cbs[i] === 'function') {
            cbs[i]();
          }
        }
      });
    });
  }
  store[type].push(callback);
}
function updateComponents (store, callback) {
  let total = 0;
  const {
    hooks,
    GLOBALWORD,
    depComponents,
  } = store;
  if (depComponents.length === 0) {
    callback();
    return
  }
  const simulateDeps = depComponents.slice();
  const len = simulateDeps.length;
  const renderedCallback = () => {
    if (++total === len) {
      if (!callback._called) {
        callback._called = true;
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
    } = simulateDeps[i];
    if (component._$loaded && component.data[GLOBALWORD]) {
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

var defaultOption = {
  env: 'develop',
};

const COMMONACTION = () => {};
function match (layer, action) {
  if (layer.action === COMMONACTION) {
    return true
  }
  if (Array.isArray(layer.action)) {
    return layer.action.indexOf(action) > -1
  }
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
      warning(`${error}\n\n   --- from middleware [${action.toString()}] action.`);
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
function assertReducer (action, reducer) {
  const { setter, partialState } = reducer;
  const stringifyAction = action.toString();
  assert(
    !('partialState' in reducer && !isPlainObject(partialState)),
    `The [partialState] must be an object.` +
      `\n\n --- from [${stringifyAction}] action.`,
  );
  if (typeof setter !== 'function') {
    reducer.setter = () => {
      warning(
        `Can\'t changed [${stringifyAction}] action value. Have you defined a setter?` +
          `\n\n --- from [${stringifyAction}] action.`
      );
    };
  }
  return reducer
}
function filterReducer (state, action, reducer, env) {
  const stringifyAction = action.toString();
  const { namespace, partialState } = reducer;
  if ('namespace' in reducer) {
    assert(
      typeof namespace === 'string',
      'The module namespace must be a string.' +
        `\n\n --- from [${stringifyAction}] action.`,
    );
    reducer.partialState = createModuleByNamespace(
      namespace,
      partialState,
      state,
      stringifyAction,
      (key, moduleName) => `The [${key}] already exists in [${moduleName}] module, ` +
        `Please don't repeat defined. \n\n --- from [${stringifyAction}] action.`,
      env,
    );
  } else {
    if (env === 'develop') {
      for (const key in partialState) {
        assert(
          !state.hasOwnProperty(key),
          `The [${key}] already exists in global state, ` +
            `Please don't repeat defined. \n\n --- from [${stringifyAction}] action.`,
        );
      }
    }
  }
  return reducer
}
class Store {
  constructor (hooks, options = {}) {
    this.hooks = hooks;
    this.reducers = [];
    this.id = ++storeId;
    this.depComponents = [];
    this.GLOBALWORD = 'global';
    this.isDispatching = false;
    this.restoreCallbacks = [];
    this.dispatchCallbacks = [];
    this.version = '0.2.1';
    this.state = Object.freeze(createModule({}));
    this.middleware = new Middleware(this);
    this.options = Object.assign(defaultOption, options);
  }
  add (action, reducer) {
    const env = this.options.env;
    const actionType = typeof action;
    assert(
      actionType === 'string' || actionType === 'symbol',
      `The action must be a Symbol or String, but now is [${actionType}].`,
    );
    assert(
      !this.reducers.find(v => v.action === action),
      `Can't repeat defined [${action.toString()}] action.`,
    );
    const originPartialState = reducer.partialState;
    if (env === 'develop') {
      assertReducer(action, reducer);
    }
    filterReducer(this.state, action, reducer, env);
    reducer.action = action;
    this.reducers.push(reducer);
    const { partialState } = reducer;
    if (partialState && !isEmptyObject(partialState)) {
      this.state = mergeState(this.state, partialState, env);
    }
    reducer.partialState = originPartialState;
  }
  dispatch (action, payload, callback) {
    const { options, reducers, isDispatching } = this;
    const stringifyAction = action.toString();
    assert(
      !isDispatching,
      'It is not allowed to call "dispatch" during dispatch execution.' +
        `\n\n   --- from [${stringifyAction}] action.`
    );
    this.middleware.process(action, payload, (destPayload, restoreProcessState) => {
      this.isDispatching = true;
      try {
        const reducer = reducers.find(v => v.action === action);
        assert(
          reducer,
          `The [${stringifyAction}] action does not exist. ` +
            'Maybe you have not defined.'
        );
        let newPartialState;
        const namespace = reducer.namespace;
        const isModuleDispatching = typeof namespace === 'string';
        if (isModuleDispatching) {
          const module = this.getModule(namespace, `\n\n --- from [${stringifyAction}] action.`);
          newPartialState = reducer.setter(module, destPayload, this.state);
        } else {
          newPartialState = reducer.setter(this.state, destPayload);
        }
        assert(
          isPlainObject(newPartialState),
          'setter function should be return a plain object.',
        );
        if (!isEmptyObject(newPartialState)) {
          if (isModuleDispatching) {
            newPartialState = createModuleByNamespace(
              namespace,
              newPartialState,
              this.state,
              stringifyAction,
              null,
              options.env,
            );
            this.state = mergeState(this.state, newPartialState, options.env);
          } else {
            this.state = deepFreeze(mergeModule(this.state, newPartialState, null, null, options.env));
          }
        }
      } finally {
         this.isDispatching = false;
        restoreProcessState();
      }
      asyncUpdate(this, 'dispatchCallbacks', () => {
        if (typeof callback === 'function') {
          callback(destPayload);
        }
      });
    });
  }
  restore (action, callback) {
    const reducer = this.reducers.find(v => v.action === action);
    const stringifyAction = action.toString();
    assert(
      reducer,
      `The [${stringifyAction}] action does not exist. ` +
        'Maybe you have not defined.'
    );
    const env = this.options.env;
    const { namespace, partialState } = reducer;
    assert(
      isPlainObject(partialState),
      'no initialized state, do you have a definition?' +
        `\n\n   --- from [${stringifyAction}] action.`
    );
    if (typeof namespace === 'string') {
      const newPartialState = createModuleByNamespace(
        namespace,
        partialState,
        this.state,
        stringifyAction,
        env,
      );
      this.state = mergeState(this.state, newPartialState, env);
    } else {
      this.state = deepFreeze(mergeModule(this.state, partialState, null, null, env));
    }
    asyncUpdate(this, 'restoreCallbacks',  () => {
      if (typeof callback === 'function') {
        callback(partialState);
      }
    });
  }
  forceUpdate () {
    asyncUpdate(this, null, COMMONACTION);
  }
  use (action, fn) {
    if (typeof action === 'function' && action !== COMMONACTION) {
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
  getModule (namespace, remainMsg) {
    assert(
      typeof namespace === 'string',
      'the namespace mast be a string',
    );
    if (!namespace) {
      return this.state
    }
    const module = getModule(this.state, namespace);
    if (remainMsg && module === null) {
      warning(`The [${namespace}] module is not exist.${remainMsg || ''}`);
    }
    return module
  }
  addModule (namespace, reducers) {
    assert(
      typeof namespace === 'string',
      'the namespace mast be a string',
    );
    if (isPlainObject(reducers)) {
      const keys = Object.keys(reducers);
      const symbols = Object.getOwnPropertySymbols(reducers);
      if (keys.length + symbols.length > 0) {
        let i = 0;
        const addRecucer = action => {
          const reducer = reducers[action];
          reducer.namespace = namespace;
          this.add(action, reducer);
        };
        for (; i < keys.length; i++) {
          addRecucer(keys[i]);
        }
        for (i = 0; i < symbols.length; i++) {
          addRecucer(symbols[i]);
        }
      }
    }
  }
  rewirteConfigAndAddDep (config, isPage) {
    let createState = null;
    const store = this;
    const GLOBALWORD = this.GLOBALWORD;
    const { data, storeConfig = {} } = config;
    const {
      addDep,
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
      if (namespace === null) {
        createState = () => clone(mapObject(defineObject, fn => fn(store.state)));
      } else {
        createState = () => {
          const module = this.getModule(namespace, `\n\n   --- from [${namespace}] of useState.`);
          return clone(mapObject(defineObject, fn => fn(module, store.state)))
        };
      }
    }
    if (createState !== null) {
      const useState = createState();
      if (isPlainObject(useState)) {
        data
          ? data[GLOBALWORD] = useState
          : config.data = { [GLOBALWORD]: useState };
      }
    }
    const addDepToStore = component => {
      if (typeof addDep === 'function') {
        if (addDep.call(store, component, isPage) === false) {
          return
        }
      }
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
    function onLoad () {
      addDepToStore(this);
      this.store = store;
      this._$loaded = true;
    }
    function onUnload () {
      this._$loaded = false;
      remove(store.depComponents, this);
    }
    if (isPage) {
      config.onLoad = createWraper(config.onLoad, onLoad, null);
      config.onUnload = createWraper(config.onUnload, null, onUnload);
    } else {
      config.lifetimes = config.lifetimes || {};
      const get = name => config[name] || config.lifetimes[name];
      const set = (name, fn) => config[name] = config.lifetimes[name] = fn;
      set('attached', createWraper(get('attached'), onLoad, null));
      set('detached', createWraper(get('detached'), null, onUnload));
    }
  }
}

const version = '0.2.1';
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
function index (mixinInject, hooks, options) {
  const store = new Store(hooks, options);
  const expandMethods = mixin(mixinInject);
  Page = createWraper(
    nativePage,
    function (config) {
      callHook(hooks, 'createBefore', [config, true]);
      expandConfig(config, expandMethods, true);
      store.rewirteConfigAndAddDep(config, true);
    },
  );
  Component = createWraper(
    nativeComponent,
    function (config) {
      callHook(hooks, 'createBefore', [config, false]);
      expandConfig(config, expandMethods, false);
      store.rewirteConfigAndAddDep(config, false);
    },
  );
  return store
}

export default index;
export { clone, createModule, diff, isModule, restore, version };
