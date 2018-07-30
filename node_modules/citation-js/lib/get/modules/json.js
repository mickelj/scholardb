"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.getJsonWrapper = void 0;

var _deepCopy = _interopRequireDefault(require("../../util/deepCopy.js"));

var _dict = require("../dict");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

var appendCommas = function appendCommas(string, index, array) {
  return string + (index < array.length - 1 ? ',' : '');
};

var getJsonObject = function getJsonObject(src, dict) {
  var isArray = Array.isArray(src);
  var entries;

  if (isArray) {
    entries = src.map(function (entry) {
      return getJsonValue(entry, dict);
    });
  } else {
    entries = Object.entries(src).map(function (_ref) {
      var _ref2 = _slicedToArray(_ref, 2),
          prop = _ref2[0],
          value = _ref2[1];

      return "\"".concat(prop, "\": ").concat(getJsonValue(value, dict));
    });
  }

  entries = entries.map(appendCommas).map(function (entry) {
    return dict.listItem.join(entry);
  });
  entries = dict.list.join(entries.join(''));
  return isArray ? "[".concat(entries, "]") : "{".concat(entries, "}");
};

var getJsonValue = function getJsonValue(src, dict) {
  if (_typeof(src) === 'object' && src !== null) {
    if (src.length === 0) {
      return '[]';
    } else if (Object.keys(src).length === 0) {
      return '{}';
    } else {
      return getJsonObject(src, dict);
    }
  } else {
    return JSON.stringify(src) + '';
  }
};

var getJson = function getJson(src, dict) {
  var entries = src.map(function (entry) {
    return getJsonObject(entry, dict);
  });
  entries = entries.map(appendCommas).map(function (entry) {
    return dict.entry.join(entry);
  });
  entries = entries.join('');
  return dict.bibliographyContainer.join("[".concat(entries, "]"));
};

var getJsonWrapper = function getJsonWrapper(src) {
  return getJson(src, (0, _dict.get)('html'));
};

exports.getJsonWrapper = getJsonWrapper;
var _default = {
  data: function data(_data) {
    var _ref3 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        type = _ref3.type,
        _ref3$format = _ref3.format,
        format = _ref3$format === void 0 ? type || 'text' : _ref3$format;

    if (format === 'object') {
      return (0, _deepCopy.default)(_data);
    } else if (format === 'text') {
      return JSON.stringify(_data, null, 2);
    } else {
      logger.warn('[get]', 'This feature (JSON output with special formatting) is unstable. See https://github.com/larsgw/citation.js/issues/144');
      return (0, _dict.has)(format) ? getJson(_data, (0, _dict.get)(format)) : '';
    }
  }
};
exports.default = _default;