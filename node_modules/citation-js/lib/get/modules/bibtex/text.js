"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.getBibtex = void 0;

var _json = _interopRequireDefault(require("./json"));

var _dict = require("../../dict");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

var syntaxTokens = {
  '|': '{\\textbar}',
  '<': '{\\textless}',
  '>': '{\\textgreater}',
  '~': '{\\textasciitilde}',
  '^': '{\\textasciicircum}',
  '\\': '{\\textbackslash}',
  '{': '\\{\\vphantom{\\}}',
  '}': '\\vphantom{\\{}\\}'
};

function escapeValue(value) {
  return value.replace(/[|<>~^\\{}]/g, function (match) {
    return syntaxTokens[match];
  });
}

var bracketMappings = {
  '': '',
  '{': '}'
};

function wrapInBrackets(prop, value) {
  var delStart = !isNaN(+value) ? '' : '{';
  var delEnd = bracketMappings[delStart];
  return delStart + value + delEnd;
}

var richTextMappings = {
  'i': '\\textit{',
  'b': '\\textbf{',
  'sc': '\\textsc{',
  'sup': '\\textsuperscript{',
  'sub': '\\textsubscript{',
  'span style="font-variant:small-caps;"': '\\textsc{',
  'span class="nocase"': '{'
};

function serializeRichTextValue(value) {
  var tokens = value.split(/<(\/.*?|i|b|sc|sup|sub|span.*?)>/g);
  tokens = tokens.map(function (token, index) {
    if (index % 2 === 0) {
      return escapeValue(token);
    } else if (token in richTextMappings) {
      return richTextMappings[token];
    } else {
      return '}';
    }
  });
  return tokens.join('');
}

var richTextFields = ['title'];

function serializeValue(prop, value, dict) {
  if (richTextFields.includes(prop)) {
    value = serializeRichTextValue(value);
  } else {
    value = escapeValue(value);
  }

  return dict.listItem.join("".concat(prop, "=").concat(wrapInBrackets(prop, value), ","));
}

function serializePropertyList(properties, dict) {
  return properties.map(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2),
        prop = _ref2[0],
        value = _ref2[1];

    return serializeValue(prop, value, dict);
  }).join('');
}

function serializeEntry(entry, dict) {
  var _getBibTeXJSON = (0, _json.default)(entry),
      type = _getBibTeXJSON.type,
      label = _getBibTeXJSON.label,
      properties = _getBibTeXJSON.properties;

  properties = serializePropertyList(Object.entries(properties), dict);
  return dict.entry.join("@".concat(type, "{").concat(label, ",").concat(dict.list.join(properties), "}"));
}

var getBibtex = function getBibtex(src, dict) {
  var entries = src.map(function (entry) {
    return serializeEntry(entry, dict);
  }).join('');
  return dict.bibliographyContainer.join(entries);
};

exports.getBibtex = getBibtex;

var getBibTeXWrapper = function getBibTeXWrapper(src, html) {
  var dict = (0, _dict.get)(html ? 'html' : 'text');
  return getBibtex(src, dict);
};

var _default = getBibTeXWrapper;
exports.default = _default;