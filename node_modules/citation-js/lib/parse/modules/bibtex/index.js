"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.formats = exports.parsers = exports.ref = void 0;

var text = _interopRequireWildcard(require("./text"));

var json = _interopRequireWildcard(require("./json"));

var prop = _interopRequireWildcard(require("./prop"));

var type = _interopRequireWildcard(require("./type"));

var bibtxt = _interopRequireWildcard(require("./bibtxt"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

var ref = '@bibtex';
exports.ref = ref;
var parsers = {
  text: text,
  json: json,
  prop: prop,
  type: type,
  bibtxt: bibtxt
};
exports.parsers = parsers;
var formats = {
  '@bibtex/text': {
    parse: text.parse,
    parseType: {
      dataType: 'String',
      predicate: /@\s{0,5}[A-Za-z]{1,13}\s{0,5}\{\s{0,5}[^@{}"=,\\\s]{0,100}\s{0,5},[\s\S]*\}/
    }
  },
  '@bibtxt/text': {
    parse: bibtxt.parse,
    parseType: {
      dataType: 'String',
      predicate: /^\s*(\[(?!\s*[{[]).*?\]\s*(\n\s*[^[]((?!:)\S)+\s*:\s*.+?\s*)*\s*)+$/
    }
  },
  '@bibtex/object': {
    parse: json.parse,
    parseType: {
      dataType: 'SimpleObject',
      propertyConstraint: {
        props: ['type', 'label', 'properties']
      }
    }
  },
  '@bibtex/prop': {
    parse: prop.parse
  },
  '@bibtex/type': {
    parse: type.parse
  }
};
exports.formats = formats;