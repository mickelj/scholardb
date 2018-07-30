"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.defaultOptions = exports.options = void 0;

var _validate = require("./validate");

var defaultOptions = {
  format: 'real',
  type: 'json',
  style: 'csl',
  lang: 'en-US'
};
exports.defaultOptions = defaultOptions;

var options = function options(_options, log) {
  if (log) {
    this.save();
  }

  try {
    (0, _validate.validateOutputOptions)(_options);
    Object.assign(this._options, _options);
  } catch (_ref) {
    var message = _ref.message;
    logger.warn('[options]', message);
  }

  return this;
};

exports.options = options;