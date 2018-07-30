"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.typeMatcher = exports.treeTypeParser = exports.listTypeParser = exports.removeTypeParser = exports.hasTypeParser = exports.addTypeParser = exports.type = void 0;

var _dataType = require("./dataType");

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

var types = {};
var dataTypes = {};
var unregExts = {};

var parseNativeTypes = function parseNativeTypes(input, dataType) {
  switch (dataType) {
    case 'Array':
      if (input.length === 0 || input.every(function (entry) {
        return type(entry) === '@csl/object';
      })) {
        return '@csl/list+object';
      } else {
        return '@else/list+object';
      }

    case 'SimpleObject':
    case 'ComplexObject':
      return '@csl/object';

    default:
      logger.warn('[set]', 'This format is not supported or recognized');
      return '@invalid';
  }
};

var matchType = function matchType() {
  var typeList = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  var data = arguments.length > 1 ? arguments[1] : undefined;
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = typeList[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var _type = _step.value;

      if (types[_type].predicate(data)) {
        return matchType(types[_type].extensions, data) || _type;
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return != null) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }
};

var type = function type(input) {
  var dataType = (0, _dataType.dataTypeOf)(input);

  if (dataType === 'Array' && input.length === 0) {
    return parseNativeTypes(input, dataType);
  }

  var match = matchType(dataTypes[dataType], input);
  return match || parseNativeTypes(input, dataType);
};

exports.type = type;

var addTypeParser = function addTypeParser(format, _ref) {
  var dataType = _ref.dataType,
      predicate = _ref.predicate,
      extend = _ref.extends;
  var extensions = [];

  if (format in unregExts) {
    extensions = unregExts[format];
    delete unregExts[format];
    logger.info('[set]', "Subclasses \"".concat(extensions, "\" finally registered to parent type \"").concat(format, "\""));
  }

  var object = {
    predicate: predicate,
    extensions: extensions
  };
  types[format] = object;

  if (extend) {
    var parentTypeParser = types[extend];

    if (parentTypeParser) {
      parentTypeParser.extensions.push(format);
    } else {
      if (!unregExts[extend]) {
        unregExts[extend] = [];
      }

      unregExts[extend].push(format);
      logger.info('[set]', "Subclass \"".concat(format, "\" is waiting on parent type \"").concat(extend, "\""));
    }
  } else {
    var typeList = dataTypes[dataType] || (dataTypes[dataType] = []);
    typeList.push(format);
  }
};

exports.addTypeParser = addTypeParser;

var hasTypeParser = function hasTypeParser(type) {
  return types.hasOwnProperty(type);
};

exports.hasTypeParser = hasTypeParser;

var removeTypeParser = function removeTypeParser(type) {
  delete types[type];

  var typeLists = _toConsumableArray(Object.values(dataTypes)).concat(_toConsumableArray(Object.values(types).map(function (type) {
    return type.extensions;
  }).filter(function (list) {
    return list.length > 0;
  })));

  typeLists.forEach(function (typeList) {
    var index = typeList.indexOf(type);

    if (index > -1) {
      typeList.splice(index, 1);
    }
  });
};

exports.removeTypeParser = removeTypeParser;

var listTypeParser = function listTypeParser() {
  return Object.keys(types);
};

exports.listTypeParser = listTypeParser;

var treeTypeParser = function treeTypeParser() {
  var attachNode = function attachNode(name) {
    return {
      name: name,
      children: types[name].extensions.map(attachNode)
    };
  };

  return {
    name: 'Type tree',
    children: Object.entries(dataTypes).map(function (_ref2) {
      var _ref3 = _slicedToArray(_ref2, 2),
          name = _ref3[0],
          children = _ref3[1];

      return {
        name: name,
        children: children.map(attachNode)
      };
    })
  };
};

exports.treeTypeParser = treeTypeParser;
var typeMatcher = /^(?:@(.+?))(?:\/(?:(.+?)\+)?(?:(.+)))?$/;
exports.typeMatcher = typeMatcher;