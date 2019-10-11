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

function warn(message) {
  throw new Error("\n\n[MpStore warn]: ".concat(message, "\n\n"));
}
function assert(condition, message) {
  if (!condition) warn(message);
}
function mergeState(oldState, newState) {
  return Object.freeze(Object.assign({}, oldState, newState));
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

    while (--len >= 0) {
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
var REG = /(?<=[\[\].])[^\[\].]+/g;

function separatePath(obj, path) {
  var keys = path.match(REG);

  if (keys) {
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
  var delEmptys = new Map();

  while (--len >= 0) {
    var _patchs$len = patchs[len],
        type = _patchs$len.type,
        path = _patchs$len.path,
        leftValue = _patchs$len.leftValue;
    var parseItem = separatePath(obj, path);

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
            delEmptys.set(target, {
              key: key,
              prevTarget: prevTarget
            });
          }

          delete target[lastKey];
          break;
      }
    }
  }

  delEmptys.forEach(function (_ref, target) {
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

var COMMONACTION = function COMMONACTION() {};

function match(layer, action) {
  if (layer.action === COMMONACTION) return true;
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
      warn("".concat(error, "\n\n   --- from middleware [").concat(action, "] action."));
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

function applyPatchs(component, patchs) {
  var destObject = {};

  for (var i = 0, len = patchs.length; i < len; i++) {
    var _patchs$i = patchs[i],
        value = _patchs$i.value,
        path = _patchs$i.path;
    destObject[path] = value;
  }

  component.setData(destObject);
}
function updateComponents(store) {
  var hooks = store.hooks,
      GLOBALWORD = store.GLOBALWORD,
      depComponents = store.depComponents;
  var len = depComponents.length;
  if (len === 0) return;

  for (var i = 0; i < len; i++) {
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
          continue;
        }
      }

      var patchs = diff(component.data[GLOBALWORD], newPartialState, GLOBALWORD);

      if (patchs.length > 0) {
        var params = [component, newPartialState, patchs, isPage];

        if (callHook(hooks, 'willUpdate', params) === false) {
          continue;
        }

        applyPatchs(component, patchs);

        if (typeof didUpdate === 'function') {
          didUpdate.call(store, component, newPartialState, patchs);
        }

        callHook(hooks, 'didUpdate', [component, newPartialState, isPage]);
      }
    }
  }
}

var storeId = 0;

function assertReducer(state, action, reducer) {
  var setter = reducer.setter,
      partialState = reducer.partialState;
  assert('partialState' in reducer, "You must defined [partialState]." + "\n\n --- from [".concat(action, "] action."));
  assert(isPlainObject(partialState), "The [partialState] must be an object." + "\n\n --- from [".concat(action, "] action."));

  for (var key in partialState) {
    assert(!state.hasOwnProperty(key), "The [".concat(key, "] already exists in global state, ") + "Please don't repeat defined. \n\n --- from [".concat(action, "] action."));
  }

  if (typeof setter !== 'function') {
    reducer.setter = function () {
      throw "Can't changed [".concat(action, "] action value. Have you defined a setter?");
    };
  }

  return reducer;
}

var Store =
/*#__PURE__*/
function () {
  function Store(hooks) {
    _classCallCheck(this, Store);

    this.state = {};
    this.hooks = hooks;
    this.reducers = [];
    this.id = ++storeId;
    this.depComponents = [];
    this.GLOBALWORD = 'global';
    this.isDispatching = false;
    this.version = '0.0.3';
    this.middleware = new Middleware(this);
  }

  _createClass(Store, [{
    key: "add",
    value: function add(action, reducer) {
      assert(!this.reducers.find(function (v) {
        return v.action === action;
      }), "Can't repeat defined [".concat(action, "] action."));

      var _assertReducer = assertReducer(this.state, action, reducer),
          partialState = _assertReducer.partialState;

      reducer.action = action;
      this.reducers.push(reducer);
      this.state = mergeState(this.state, partialState);
    }
  }, {
    key: "dispatch",
    value: function dispatch(action, payload, callback) {
      var _this = this;

      var reducers = this.reducers,
          isDispatching = this.isDispatching;
      assert(!isDispatching, 'It is not allowed to call "dispatch" during dispatch execution.' + "\n\n   --- from [".concat(action, "] action."));
      var reducer = reducers.find(function (v) {
        return v.action === action;
      });
      assert(reducer, "The \"".concat(action, "\" does not exist. ") + 'Maybe you have not defined.');
      this.middleware.process(action, payload, function (desPayload, restoreProcessState) {
        _this.isDispatching = true;

        try {
          var newPartialState = reducer.setter(_this.state, desPayload);
          assert(isPlainObject(newPartialState), 'setter function should be return a plain object.');
          _this.state = mergeState(_this.state, newPartialState);
        } catch (error) {
          _this.isDispatching = false;
          restoreProcessState();
          warn("".concat(error, "\n\n   --- from [").concat(action, "] action."));
        }

        updateComponents(_this);
        _this.isDispatching = false;
        restoreProcessState();

        if (typeof callback === 'function') {
          callback();
        }
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
    key: "_rewirteCfgAndAddDep",
    value: function _rewirteCfgAndAddDep(config, isPage) {
      var _this3 = this;

      var createState = null;
      var store = this;
      var data = config.data,
          _config$storeConfig = config.storeConfig,
          storeConfig = _config$storeConfig === void 0 ? {} : _config$storeConfig;
      var didUpdate = storeConfig.didUpdate,
          willUpdate = storeConfig.willUpdate,
          defineReducer = storeConfig.defineReducer,
          usedGlobalState = storeConfig.usedGlobalState;
      delete config.storeConfig;

      if (typeof defineReducer === 'function') {
        defineReducer.call(store, store);
      }

      if (typeof usedGlobalState === 'function') {
        var defineObject = usedGlobalState.call(store, store);
        assert(isPlainObject(defineObject), '[usedGlobalState] must return a plain object, ' + "but now is return a [".concat(_typeof(defineObject), "]"));

        createState = function createState() {
          return mapObject(defineObject, function (fn) {
            return fn(store.state);
          });
        };
      }

      if (createState !== null) {
        var usedState = createState();

        if (isPlainObject(usedState)) {
          data ? data[this.GLOBALWORD] = usedState : config.data = _defineProperty({}, this.GLOBALWORD, usedState);
        }
      }

      var addDep = function addDep(component) {
        var shouldAdd = callHook(_this3.hooks, 'addDep', [component, isPage]);

        if (shouldAdd !== false && createState !== null) {
          if (component.data && isPlainObject(component.data[_this3.GLOBALWORD])) {
            _this3.depComponents.push({
              isPage: isPage,
              component: component,
              didUpdate: didUpdate,
              willUpdate: willUpdate,
              createState: createState
            });

            var patchs = diff(component.data[_this3.GLOBALWORD], createState(), _this3.GLOBALWORD);

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
        config.onUnload = createWraper(config.onUnload, null, function () {
          this.store = null;
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
          this.store = null;
          remove(store.depComponents, this);
        }));
      }
    }
  }]);

  return Store;
}();

var version = '0.0.3';
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

    store._rewirteCfgAndAddDep(config, true);
  });
  Component = createWraper(nativeComponent, function (config) {
    callHook(hooks, 'createBefore', [config, false]);
    expandConfig(config, expandMethods, false);

    store._rewirteCfgAndAddDep(config, false);
  });
  return store;
}

export default index;
export { restore, version };
