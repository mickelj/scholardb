"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.formats = exports.parsers = exports.ref = void 0;

var list = _interopRequireWildcard(require("./list"));

var json = _interopRequireWildcard(require("./json"));

var prop = _interopRequireWildcard(require("./prop"));

var type = _interopRequireWildcard(require("./type"));

var url = _interopRequireWildcard(require("./url"));

var api = _interopRequireWildcard(require("./api"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

var ref = '@wikidata';
exports.ref = ref;
var parsers = {
  list: list,
  json: json,
  prop: prop,
  type: type,
  url: url,
  api: api
};
exports.parsers = parsers;
var formats = {
  '@wikidata/id': {
    parse: list.parse,
    parseType: {
      dataType: 'String',
      predicate: /^\s*(Q\d+)\s*$/
    }
  },
  '@wikidata/list+text': {
    parse: list.parse,
    parseType: {
      dataType: 'String',
      predicate: /^\s*((?:Q\d+(?:\s+|,|))*Q\d+)\s*$/
    }
  },
  '@wikidata/api': {
    parse: api.parse,
    parseAsync: api.parseAsync,
    parseType: {
      dataType: 'String',
      predicate: /^(https?:\/\/(?:www\.)?wikidata.org\/w\/api\.php(?:\?.*)?)$/,
      extends: '@else/url'
    }
  },
  '@wikidata/url': {
    parse: url.parse,
    parseType: {
      dataType: 'String',
      predicate: /\/(Q\d+)(?:[#?/]|\s*$)/,
      extends: '@else/url'
    }
  },
  '@wikidata/list+object': {
    parse: list.parse,
    parseType: {
      dataType: 'Array',
      elementConstraint: '@wikidata/id'
    }
  },
  '@wikidata/object': {
    parse: json.parse,
    parseAsync: json.parseAsync,
    parseType: {
      dataType: 'SimpleObject',
      propertyConstraint: {
        props: 'entities'
      }
    }
  },
  '@wikidata/prop': {
    parse: prop.parse
  },
  '@wikidata/type': {
    parse: type.parse
  }
};
exports.formats = formats;