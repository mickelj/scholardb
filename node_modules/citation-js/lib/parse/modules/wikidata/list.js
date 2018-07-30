"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.parse = void 0;

var _wikidataSdk = _interopRequireDefault(require("wikidata-sdk"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var parseWikidata = function parseWikidata(data) {
  var list = Array.isArray(data) ? data : data.trim().split(/(?:[\s,]\s*)/g);
  return [].concat(_wikidataSdk.default.getEntities(list, ['en']));
};

exports.default = exports.parse = parseWikidata;