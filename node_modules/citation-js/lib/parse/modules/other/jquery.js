"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parse = void 0;

var parse = function parse(input) {
  return input.val() || input.text() || input.html();
};

exports.parse = parse;