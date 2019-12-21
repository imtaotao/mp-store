/*!
 * Mpstore.js v0.1.13
 * (c) 2019-2019 Imtaotao
 * Released under the MIT License.
 */
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _typeof(obj) {
  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function (obj) {
      return typeof obj;
    };
  } else {
    _typeof = function (obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
  }

  return _typeof(obj);
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function _slicedToArray(arr, i) {
  return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest();
}

function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}

function _iterableToArrayLimit(arr, i) {
  if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) {
    return;
  }

  var _arr = [];
  var _n = true;
  var _d = false;
  var _e = undefined;

  try {
    for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);

      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }

  return _arr;
}

function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance");
}

function warning(message, noError) {
  message = "\n\nMpStore warning: ".concat(message, "\n\n");

  if (noError) {
    console.warn(message);
    return;
  }

  throw new Error(message);
}
function assert(condition, message) {
  if (!condition) warning(message);
}
function isPrimitive(value) {
  return typeof value === 'string' || typeof value === 'number' || _typeof(value) === 'symbol' || typeof value === 'boolean';
}
function deepFreeze(state) {
  if (Object.isFrozen(state)) return state;
  var names = Object.getOwnPropertyNames(state);
  var len = names.length;

  while (~len--) {
    var value = state[names[len]];

    if (_typeof(value) === 'object' && value !== null) {
      deepFreeze(value);
    }
  }

  return Object.freeze(state);
}
function mergeState(oldState, newState) {
  return deepFreeze(Object.assign({}, oldState, newState));
}
function mixinMethods(config, methods) {
  for (var key in methods) {
    if (!(key in config)) {
      config[key] = methods[key];
    }
  }
}
function remove(list, component) {
  var index = list.findIndex(function (item) {
    return item.component === component;
  });

  if (index > -1) {
    list.splice(index, 1);
  }
}
function callHook(hooks, name, args) {
  if (hooks && typeof hooks[name] === 'function') {
    return hooks[name].apply(hooks, args);
  }
}
function isEmptyObject(obj) {
  for (var k in obj) {
    return false;
  }

  return true;
}
function mapObject(obj, fn) {
  var destObject = {};

  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      destObject[key] = fn(obj[key]);
    }
  }

  return destObject;
}
function createWraper(target, before, after) {
  return function () {
    var result;

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

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
}
function isPlainObject(obj) {
  if (_typeof(obj) !== 'object' || obj === null) return false;
  var proto = Object.getPrototypeOf(obj);
  if (proto === null) return true;
  var baseProto = proto;

  while (Object.getPrototypeOf(baseProto) !== null) {
    baseProto = Object.getPrototypeOf(baseProto);
  }

  return proto === baseProto;
}
function clone(value) {
  var record = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : new WeakMap();

  if (value === null || value === undefined || isPrimitive(value) || typeof value === 'function' || value instanceof Date) {
    return value;
  }

  if (record.has(value)) return record.get(value);
  var result = typeof value.constructor !== 'function' ? Object.create(null) : new value.constructor();
  record.set(value, result);

  for (var key in value) {
    result[key] = clone(value[key], record);
  }

  return result;
}

function mixin (inject) {
  var expandMethods = Object.create(null);

  if (typeof inject === 'function') {
    var callback = function callback(name, fn) {
      assert(typeof name === 'string', "The mixed method name must a string.");
      assert(typeof fn === 'function', 'The mixed method is not a function.');
      assert(!(name in expandMethods), "The \"".concat(name, "\" is exist,"));
      expandMethods[name] = fn;
    };

    inject(callback);
  }

  return expandMethods;
}

var MODULE_FLAG = Symbol('module');
function isModule(m) {
  return isPlainObject(m) && m[MODULE_FLAG] === true;
}
function addModuleFlag(obj) {
  obj[MODULE_FLAG] = true;
  return obj;
}
function createModule(obj) {
  assert(isPlainObject(obj), 'The base module object must be an plain object');

  if (isModule(obj)) {
    return obj;
  }

  addModuleFlag(obj);
  return obj;
}
function getModule(state, namespace) {
  if (!namespace) return state;
  var module = state;
  var segments = namespace.split('.');

  for (var i = 0, len = segments.length; i < len; i++) {
    if (!isModule(module)) return null;
    module = module[segments[i]];
  }

  return isModule(module) ? module : null;
}

function assertChildModule(a, b, key) {
  var isModuleForOrigin = isModule(a);
  var isModuleForCurrent = isModule(b);
  assert(!(isModuleForOrigin && !isModuleForCurrent), "The namespace [".concat(key, "] is a module that you can change to other value, ") + 'You can use `createModule` method to recreate a module.' + '\n\n  --- from setter function.');
  assert(!(!isModuleForOrigin && isModuleForCurrent), "The namespace [".concat(key, "] is not a module, you can't create it as a module, ") + 'you must define the module in `reducer`.' + '\n\n  --- from setter function.');
  return isModuleForOrigin && isModuleForCurrent;
}

function checkChildModule(a, b) {
  var keys = Object.keys(b);
  var len = keys.length;

  while (~--len) {
    var key = keys[len];

    if (assertChildModule(a[key], b[key], key)) {
      checkChildModule(a[key], b[key]);
    }
  }

  keys = Object.keys(a);
  len = keys.length;

  while (~--len) {
    var _key = keys[len];

    if (!(_key in b)) {
      assertChildModule(a[_key], b[_key], _key);
    }
  }
}

function mergeModule(module, partialModule, moduleName, createMsg) {
  var keys = Object.keys(partialModule);
  var len = keys.length;

  while (~--len) {
    var key = keys[len];

    if (typeof createMsg === 'function') {
      assert(!(key in module), createMsg(key, moduleName));
    } else {
      var originItem = module[key];
      var currentPartialItem = partialModule[key];

      if (assertChildModule(originItem, currentPartialItem, key)) {
        checkChildModule(originItem, currentPartialItem);
      }
    }
  }

  return createModule(Object.assign({}, module, partialModule));
}
function createModuleByNamespace(namespace, partialModule, rootModule, stringifyAction, createMsg) {
  partialModule = partialModule || {};

  if (!namespace) {
    return mergeModule(rootModule, partialModule);
  }

  var parentWraper = {};
  var parentModule = rootModule;
  var moduleWraper = parentWraper;
  var segments = namespace.split('.');
  var remaingMsg = "\n\n  --- from [".concat(stringifyAction, "] action");

  for (var i = 0, len = segments.length; i < len; i++) {
    var childModule = void 0;
    var key = segments[i];
    var isLastIndex = i === len - 1;

    if (key in parentModule) {
      assert(isModule(parentModule[key]), 'you can\'t create child moudle, ' + "because namespace [".concat(key, "] already exists in [").concat(segments[i - 1] || 'root', "] module, ") + "but [".concat(key, "] not a module.").concat(remaingMsg));
      childModule = isLastIndex ? mergeModule(parentModule[key], partialModule, key, createMsg) : Object.assign({}, parentModule[key]);
    } else {
      childModule = isLastIndex ? createModule(partialModule) : addModuleFlag({});
    }

    parentWraper[key] = childModule;
    parentWraper = childModule;
    parentModule = childModule;
  }

  return moduleWraper;
}

var ADD = 1;
var REMOVE = 2;
var REPLACE = 3;

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
  } else if (_typeof(left) === 'object') {
    if (right !== null && _typeof(right) === 'object' && !Array.isArray(right)) {
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
    var len = a.length;

    while (~--len) {
      if (a[len] !== b[len]) {
        var path = "".concat(base, "[").concat(len, "]");
        diffValues(a[len], b[len], path, patchs);
      }
    }

    if (b.length > a.length) {
      len = b.length;

      while (--len >= a.length) {
        var _path = "".concat(base, "[").concat(len, "]");

        patchs.push(new Patch(ADD, _path, b[len], a[len]));
      }
    }
  } else {
    patchs.push(new Patch(REPLACE, base, b, a));
  }
}

function walkObject(a, b, base, patchs) {
  for (var key in a) {
    var path = "".concat(base, ".").concat(key);

    if (!(key in b)) {
      patchs.push(new Patch(REMOVE, path, null, a[key]));
    } else if (a[key] !== b[key]) {
      diffValues(a[key], b[key], path, patchs);
    }
  }

  for (var _key in b) {
    if (!(_key in a)) {
      var _path2 = "".concat(base, ".").concat(_key);

      patchs.push(new Patch(ADD, _path2, b[_key], null));
    }
  }
}

function diff(a, b, basePath) {
  var patchs = [];
  walkObject(a, b, basePath, patchs);
  return patchs;
}
var REG = /[^\[\].]+(?=[\[\].])/g;

function separatePath(obj, path) {
  var keys = path.match(REG);

  if (keys && keys.shift() && keys.length > 0) {
    var i = -1;
    var key = null;
    var target = obj;
    var prevTarget = null;

    while (i++ < keys.length - 2) {
      prevTarget = target;
      key = keys[i];
      target = target[key];
    }

    return [target, key, prevTarget, keys[keys.length - 1]];
  }
}

function restore(obj, patchs) {
  var len = patchs.length;
  var deleteEmptys = new Map();

  while (~--len) {
    var _patchs$len = patchs[len],
        type = _patchs$len.type,
        path = _patchs$len.path,
        leftValue = _patchs$len.leftValue;
    var parseItem = separatePath(obj, path + '.');

    if (parseItem) {
      var _parseItem = _slicedToArray(parseItem, 4),
          target = _parseItem[0],
          key = _parseItem[1],
          prevTarget = _parseItem[2],
          lastKey = _parseItem[3];

      switch (type) {
        case REMOVE:
          target[lastKey] = leftValue;
          break;

        case REPLACE:
          target[lastKey] = leftValue;
          break;

        case ADD:
          if (Array.isArray(target) && target === prevTarget[key]) {
            deleteEmptys.set(target, {
              key: key,
              prevTarget: prevTarget
            });
          }

          delete target[lastKey];
          break;
      }
    }
  }

  deleteEmptys.forEach(function (_ref, target) {
    var key = _ref.key,
        prevTarget = _ref.prevTarget;
    var clone = new target.constructor();
    target.forEach(function (item) {
      return clone.push(item);
    });
    prevTarget[key] = clone;
  });
  return obj;
}

function applyPatchs(component, patchs, callback) {
  var destObject = {};

  for (var i = 0, len = patchs.length; i < len; i++) {
    var _patchs$i = patchs[i],
        value = _patchs$i.value,
        path = _patchs$i.path;
    destObject[path] = value;
  }

  component.setData(destObject, callback);
}
function updateComponents(store, callback) {
  var total = 0;
  var hooks = store.hooks,
      GLOBALWORD = store.GLOBALWORD,
      depComponents = store.depComponents;

  if (depComponents.length === 0) {
    callback();
    return;
  }

  var renderedCallback = function renderedCallback() {
    if (++total === depComponents.length) {
      if (!callback._called) {
        callback._called = true;
        callback();
      }
    }
  };

  for (var i = 0; i < depComponents.length; i++) {
    var _depComponents$i = depComponents[i],
        isPage = _depComponents$i.isPage,
        component = _depComponents$i.component,
        didUpdate = _depComponents$i.didUpdate,
        willUpdate = _depComponents$i.willUpdate,
        createState = _depComponents$i.createState;

    if (component.data[GLOBALWORD]) {
      var newPartialState = createState();

      if (typeof willUpdate === 'function') {
        if (willUpdate.call(store, component, newPartialState) === false) {
          renderedCallback();
          continue;
        }
      }

      var patchs = diff(component.data[GLOBALWORD], newPartialState, GLOBALWORD);

      if (patchs.length > 0) {
        var params = [component, newPartialState, patchs, isPage];

        if (callHook(hooks, 'willUpdate', params) === false) {
          renderedCallback();
          continue;
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

var TimeTravel =
/*#__PURE__*/
function () {
  function TimeTravel(component, GLOBALWORD, limit) {
    _classCallCheck(this, TimeTravel);

    this.history = [];
    this.limit = limit;
    this.component = component;
    this.GLOBALWORD = GLOBALWORD;
    this.length = this.history.length;
    this.current = this.history.length;
    this.finallyState = component.data[GLOBALWORD];
  }

  _createClass(TimeTravel, [{
    key: "push",
    value: function push(patchs) {
      var limit = this.limit,
          history = this.history,
          GLOBALWORD = this.GLOBALWORD,
          length = this.history.length,
          data = this.component.data;

      if (limit > 0) {
        var extraCount = length - limit;

        if (extraCount >= 0) {
          this.history.splice(0, extraCount + 1);
        }

        this.history.push(patchs);
        this.length = history.length;
        this.current = history.length;
        this.finallyState = clone(data[GLOBALWORD]);
      }
    }
  }, {
    key: "go",
    value: function go(n) {
      var current = this.current,
          history = this.history,
          component = this.component,
          GLOBALWORD = this.GLOBALWORD,
          finallyState = this.finallyState;
      assert(GLOBALWORD in component.data, 'You can\'t use [timeTravel] because it only works for [global state]');

      if (this.limit > 0) {
        if (n !== 0) {
          var range = n + current;
          var backtrack = Math.abs(n);

          if (range < 0 || range > history.length) {
            warning("Index [".concat(range, "] is not within the allowed range."), true);
            return;
          }

          var index = 0;
          var data = clone(component.data[GLOBALWORD]);

          while (index++ < backtrack) {
            var id = current + Math.sign(n) * index;

            if (id < history.length) {
              var patchs = clone(history[id]);
              data = restore(data, patchs);
            } else {
              data = finallyState;
            }
          }

          var endPatchs = diff(component.data[GLOBALWORD], data, GLOBALWORD);

          if (endPatchs.length > 0) {
            applyPatchs(component, endPatchs);
          }

          this.current += n;
        }
      }
    }
  }, {
    key: "forward",
    value: function forward() {
      this.go(1);
    }
  }, {
    key: "back",
    value: function back() {
      this.go(-1);
    }
  }, {
    key: "toStart",
    value: function toStart() {
      this.go(-this.current);
    }
  }, {
    key: "toEnd",
    value: function toEnd() {
      this.go(this.history.length - this.current);
    }
  }]);

  return TimeTravel;
}();

var COMMONACTION = function COMMONACTION() {};

function match(layer, action) {
  if (layer.action === COMMONACTION) {
    return true;
  }

  if (Array.isArray(layer.action)) {
    return layer.action.indexOf(action) > -1;
  }

  return action === layer.action;
}

function handleLayer(action, fn, store, payload, next, restoreProcessState) {
  try {
    fn.call(store, payload, next, action);
    restoreProcessState();
  } catch (error) {
    var hooks = store.hooks;
    restoreProcessState();

    if (hooks && typeof hooks['middlewareError'] === 'function') {
      hooks['middlewareError'](action, payload, error);
    } else {
      warning("".concat(error, "\n\n   --- from middleware [").concat(action.toString(), "] action."));
    }
  }
}

var Middleware =
/*#__PURE__*/
function () {
  function Middleware(store) {
    _classCallCheck(this, Middleware);

    this.stack = [];
    this.store = store;
    this.isProcessing = false;
  }

  _createClass(Middleware, [{
    key: "use",
    value: function use(action, fn) {
      assert(!this.isProcessing, 'can\'t allow add new middleware in the middleware processing.');
      this.stack.push({
        fn: fn,
        action: action
      });
    }
  }, {
    key: "remove",
    value: function remove(action, fn) {
      var index = this.stack.findIndex(function (layer) {
        return layer.fn === fn && layer.action === action;
      });

      if (index > -1) {
        this.stack.splice(index, 1);
      }
    }
  }, {
    key: "process",
    value: function process(action, payload, finish) {
      var _this = this;

      this.isProcessing = true;

      var restoreProcessState = function restoreProcessState() {
        _this.isProcessing = false;
      };

      if (this.stack.length > 0) {
        var index = 0;

        var next = function next(prevPayload) {
          var layer = _this.stack[index];
          index++;

          while (layer && !match(layer, action)) {
            layer = _this.stack[index++];
          }

          if (layer) {
            handleLayer(action, layer.fn, _this.store, prevPayload, next, restoreProcessState);
          } else {
            finish(prevPayload, restoreProcessState);
          }
        };

        next(payload);
      } else {
        finish(payload, restoreProcessState);
      }
    }
  }]);

  return Middleware;
}();

var storeId = 0;

function assertReducer(action, reducer) {
  var setter = reducer.setter,
      partialState = reducer.partialState;
  var stringifyAction = action.toString();
  assert(!('partialState' in reducer && !isPlainObject(partialState)), "The [partialState] must be an object." + "\n\n --- from [".concat(stringifyAction, "] action."));

  if (typeof setter !== 'function') {
    reducer.setter = function () {
      warning("Can't changed [".concat(stringifyAction, "] action value. Have you defined a setter?") + "\n\n --- from [".concat(stringifyAction, "] action."));
    };
  }

  return reducer;
}

function filterReducer(state, action, reducer) {
  var stringifyAction = action.toString();
  var namespace = reducer.namespace,
      partialState = reducer.partialState;

  if ('namespace' in reducer) {
    assert(typeof namespace === 'string', 'The module namespace must be a string.' + "\n\n --- from [".concat(stringifyAction, "] action."));
    reducer.partialState = createModuleByNamespace(namespace, partialState, state, stringifyAction, function (key, moduleName) {
      return "The [".concat(key, "] already exists in [").concat(moduleName, "] module, ") + "Please don't repeat defined. \n\n --- from [".concat(stringifyAction, "] action.");
    });
  } else {
    for (var key in partialState) {
      assert(!state.hasOwnProperty(key), "The [".concat(key, "] already exists in global state, ") + "Please don't repeat defined. \n\n --- from [".concat(stringifyAction, "] action."));
    }
  }

  return reducer;
}

var Store =
/*#__PURE__*/
function () {
  function Store(hooks) {
    _classCallCheck(this, Store);

    this.hooks = hooks;
    this.reducers = [];
    this.id = ++storeId;
    this.depComponents = [];
    this.GLOBALWORD = 'global';
    this.isDispatching = false;
    this.version = '0.1.13';
    this.state = Object.freeze(createModule({}));
    this.middleware = new Middleware(this);
  }

  _createClass(Store, [{
    key: "add",
    value: function add(action, reducer) {
      var actionType = _typeof(action);

      assert(actionType === 'string' || actionType === 'symbol', "The action must be a Symbol or String, but now is [".concat(actionType, "]."));
      assert(!this.reducers.find(function (v) {
        return v.action === action;
      }), "Can't repeat defined [".concat(action.toString(), "] action."));
      assertReducer(action, reducer);
      filterReducer(this.state, action, reducer);
      reducer.action = action;
      this.reducers.push(reducer);
      var partialState = reducer.partialState;

      if (partialState && !isEmptyObject(partialState)) {
        this.state = mergeState(this.state, partialState);
      }
    }
  }, {
    key: "dispatch",
    value: function dispatch(action, payload, callback) {
      var _this = this;

      var reducers = this.reducers,
          isDispatching = this.isDispatching;
      var stringifyAction = action.toString();
      assert(!isDispatching, 'It is not allowed to call "dispatch" during dispatch execution.' + "\n\n   --- from [".concat(stringifyAction, "] action."));
      this.middleware.process(action, payload, function (destPayload, restoreProcessState) {
        _this.isDispatching = true;

        try {
          var reducer = reducers.find(function (v) {
            return v.action === action;
          });
          assert(reducer, "The [".concat(stringifyAction, "] action does not exist. ") + 'Maybe you have not defined.');
          var newPartialState;
          var namespace = reducer.namespace;
          var isModuleDispatching = typeof namespace === 'string';

          if (isModuleDispatching) {
            var module = _this.getModule(namespace, "\n\n --- from [".concat(stringifyAction, "] action."));

            newPartialState = reducer.setter(module, destPayload, _this.state);
          } else {
            newPartialState = reducer.setter(_this.state, destPayload);
          }

          assert(isPlainObject(newPartialState), 'setter function should be return a plain object.');

          if (!isEmptyObject(newPartialState)) {
            if (isModuleDispatching) {
              newPartialState = createModuleByNamespace(namespace, newPartialState, _this.state, stringifyAction);
              _this.state = mergeState(_this.state, newPartialState);
            } else {
              _this.state = deepFreeze(mergeModule(_this.state, newPartialState));
            }
          }
        } finally {
          _this.isDispatching = false;
          restoreProcessState();
        }

        updateComponents(_this, function () {
          if (typeof callback === 'function') {
            callback(destPayload);
          }
        });
      });
    }
  }, {
    key: "use",
    value: function use(action, fn) {
      var _this2 = this;

      if (typeof action === 'function' && action !== COMMONACTION) {
        fn = action;
        action = COMMONACTION;
      }

      this.middleware.use(action, fn);
      return function () {
        return _this2.middleware.remove(action, fn);
      };
    }
  }, {
    key: "setNamespace",
    value: function setNamespace(key) {
      assert(key && typeof key === 'string', 'The [namespace] must be a string');
      this.GLOBALWORD = key;
    }
  }, {
    key: "getModule",
    value: function getModule$1(namespace, remainMsg) {
      assert(typeof namespace === 'string', 'the namespace mast be a string');

      if (!namespace) {
        return this.state;
      }

      var module = getModule(this.state, namespace);

      if (remainMsg && module === null) {
        warning("The [".concat(namespace, "] module is not exist.").concat(remainMsg || ''));
      }

      return module;
    }
  }, {
    key: "addModule",
    value: function addModule(namespace, reducers) {
      var _this3 = this;

      assert(typeof namespace === 'string', 'the namespace mast be a string');

      if (isPlainObject(reducers)) {
        var keys = Object.keys(reducers);
        var symbols = Object.getOwnPropertySymbols(reducers);

        if (keys.length + symbols.length > 0) {
          var i = 0;

          var addRecucer = function addRecucer(action) {
            var reducer = reducers[action];
            reducer.namespace = namespace;

            _this3.add(action, reducer);
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
  }, {
    key: "rewirteConfigAndAddDep",
    value: function rewirteConfigAndAddDep(config, isPage) {
      var _this4 = this;

      var createState = null;
      var store = this;
      var GLOBALWORD = this.GLOBALWORD;
      var data = config.data,
          _config$storeConfig = config.storeConfig,
          storeConfig = _config$storeConfig === void 0 ? {} : _config$storeConfig;
      var useState = storeConfig.useState,
          didUpdate = storeConfig.didUpdate,
          willUpdate = storeConfig.willUpdate,
          defineReducer = storeConfig.defineReducer,
          _storeConfig$travelLi = storeConfig.travelLimit,
          travelLimit = _storeConfig$travelLi === void 0 ? 0 : _storeConfig$travelLi;
      assert(typeof travelLimit === 'number', "[travelLimit] must be a number, but now is [".concat(_typeof(travelLimit), "]."));
      delete config.storeConfig;

      if (typeof defineReducer === 'function') {
        defineReducer.call(store, store);
      }

      if (typeof useState === 'function') {
        var namespace = null;
        var defineObject = null;
        var useConfig = useState.call(store, store);

        if (Array.isArray(useConfig)) {
          namespace = useConfig[0];
          defineObject = useConfig[1];
        } else {
          defineObject = useConfig;
        }

        assert(isPlainObject(defineObject), '[useState] must return a plain object, ' + "but now is return a [".concat(_typeof(defineObject), "]"));

        if (namespace === null) {
          createState = function createState() {
            return clone(mapObject(defineObject, function (fn) {
              return fn(store.state);
            }));
          };
        } else {
          createState = function createState() {
            var module = _this4.getModule(namespace, "\n\n   --- from [".concat(namespace, "] of useState."));

            return clone(mapObject(defineObject, function (fn) {
              return fn(module, store.state);
            }));
          };
        }
      }

      if (createState !== null) {
        var _useState = createState();

        if (isPlainObject(_useState)) {
          data ? data[GLOBALWORD] = _useState : config.data = _defineProperty({}, GLOBALWORD, _useState);
        }
      }

      var addDep = function addDep(component) {
        var shouldAdd = callHook(_this4.hooks, 'addDep', [component, isPage]);

        if (shouldAdd !== false && createState !== null) {
          if (component.data && isPlainObject(component.data[GLOBALWORD])) {
            component.timeTravel = new TimeTravel(component, GLOBALWORD, travelLimit);

            _this4.depComponents.push({
              isPage: isPage,
              component: component,
              didUpdate: didUpdate,
              willUpdate: willUpdate,
              createState: createState
            });

            var patchs = diff(component.data[GLOBALWORD], createState(), GLOBALWORD);

            if (patchs.length > 0) {
              applyPatchs(component, patchs, GLOBALWORD);
            }
          }
        }
      };

      if (isPage) {
        config.onLoad = createWraper(config.onLoad, function () {
          addDep(this);
          this.store = store;
        });
        config.onUnload = createWraper(config.onUnload, null, function () {
          remove(store.depComponents, this);
        });
      } else {
        config.lifetimes = config.lifetimes || {};

        var get = function get(name) {
          return config[name] || config.lifetimes[name];
        };

        var set = function set(name, fn) {
          return config[name] = config.lifetimes[name] = fn;
        };

        set('attached', createWraper(get('attached'), function () {
          addDep(this);
          this.store = store;
        }));
        set('detached', createWraper(get('detached'), null, function () {
          remove(store.depComponents, this);
        }));
      }
    }
  }]);

  return Store;
}();

var version = '0.1.13';
var nativePage = Page;
var nativeComponent = Component;

function expandConfig(config, expandMethods, isPage) {
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
  var store = new Store(hooks);
  var expandMethods = mixin(mixinInject);
  Page = createWraper(nativePage, function (config) {
    callHook(hooks, 'createBefore', [config, true]);
    expandConfig(config, expandMethods, true);
    store.rewirteConfigAndAddDep(config, true);
  });
  Component = createWraper(nativeComponent, function (config) {
    callHook(hooks, 'createBefore', [config, false]);
    expandConfig(config, expandMethods, false);
    store.rewirteConfigAndAddDep(config, false);
  });
  return store;
}

exports.clone = clone;
exports.createModule = createModule;
exports.default = index;
exports.diff = diff;
exports.isModule = isModule;
exports.restore = restore;
exports.version = version;
