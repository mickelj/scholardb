"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.config = exports.dict = exports.output = exports.input = exports.list = exports.has = exports.remove = exports.add = void 0;

var input = _interopRequireWildcard(require("../parse/interface/"));

exports.input = input;

var output = _interopRequireWildcard(require("../get/registrar"));

exports.output = output;

var dict = _interopRequireWildcard(require("../get/dict"));

exports.dict = dict;

var config = _interopRequireWildcard(require("./config"));

exports.config = config;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

var registers = {
  input: input,
  output: output,
  dict: dict,
  config: config
};
var indices = {};

var add = function add(ref) {
  var plugins = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var mainIndex = indices[ref] = {};

  if ('config' in plugins) {
    registers.config.add(ref, plugins.config);
    delete plugins.config;
  }

  for (var type in plugins) {
    var typeIndex = mainIndex[type] = {};
    var typePlugins = plugins[type];

    for (var name in typePlugins) {
      var typePlugin = typePlugins[name];
      typeIndex[name] = true;
      registers[type].add(name, typePlugin);
    }
  }
};

exports.add = add;

var remove = function remove(ref) {
  var mainIndex = indices[ref];

  for (var type in mainIndex) {
    var typeIndex = mainIndex[type];

    for (var name in typeIndex) {
      registers[type].remove(name);
    }
  }

  delete indices[ref];
};

exports.remove = remove;

var has = function has(ref) {
  return ref in indices;
};

exports.has = has;

var list = function list() {
  return Object.keys(indices);
};

exports.list = list;