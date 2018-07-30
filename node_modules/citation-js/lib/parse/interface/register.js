"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.list = exports.has = exports.remove = exports.add = void 0;

var _parser = require("./parser");

var _type = require("./type");

var _data = require("./data");

var formats = {};

var add = function add(format, parsers) {
  var formatParser = new _parser.FormatParser(format, parsers);
  formatParser.validate();
  var index = formats[format] = {};

  if (formatParser.typeParser) {
    (0, _type.addTypeParser)(format, formatParser.typeParser);
    index.type = true;
  }

  if (formatParser.dataParser) {
    (0, _data.addDataParser)(format, formatParser.dataParser);
    index.data = true;
  }

  if (formatParser.asyncDataParser) {
    (0, _data.addDataParser)(format, formatParser.asyncDataParser);
    index.asyncData = true;
  }
};

exports.add = add;

var remove = function remove(format) {
  var index = formats[format];

  if (!index) {
    return;
  }

  if (index.type) {
    (0, _type.removeTypeParser)(format);
  }

  if (index.data) {
    (0, _data.removeDataParser)(format);
  }

  if (index.asyncData) {
    (0, _data.removeDataParser)(format, true);
  }

  delete formats[format];
};

exports.remove = remove;

var has = function has(format) {
  return format in formats;
};

exports.has = has;

var list = function list() {
  return Object.keys(formats);
};

exports.list = list;