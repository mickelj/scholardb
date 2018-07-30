"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.parse = void 0;
var varDoiTypes = {
  'journal-article': 'article-journal',
  'book-chapter': 'chapter',
  'posted-content': 'manuscript',
  'proceedings-article': 'paper-conference'
};

var fetchDoiType = function fetchDoiType(value) {
  return varDoiTypes[value] || value;
};

exports.default = exports.parse = fetchDoiType;