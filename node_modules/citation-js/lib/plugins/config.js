"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.remove = exports.get = exports.add = void 0;
var configs = {};

var add = function add(ref, config) {
  configs[ref] = config;
};

exports.add = add;

var get = function get(ref) {
  return configs[ref];
};

exports.get = get;

var remove = function remove(ref) {
  delete configs[ref];
};

exports.remove = remove;