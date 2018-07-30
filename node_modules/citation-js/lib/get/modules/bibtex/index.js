"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _dict = require("../../dict");

var _json = _interopRequireDefault(require("./json"));

var _text = require("./text");

var _bibtxt = require("./bibtxt");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var factory = function factory(formatter) {
  return function (data) {
    var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        type = _ref.type,
        _ref$format = _ref.format,
        format = _ref$format === void 0 ? type || 'text' : _ref$format;

    if (format === 'object') {
      return data.map(_json.default);
    } else {
      return (0, _dict.has)(format) ? formatter(data, (0, _dict.get)(format)) : '';
    }
  };
};

var _default = {
  bibtex: factory(_text.getBibtex),
  bibtxt: factory(_bibtxt.getBibtxt)
};
exports.default = _default;