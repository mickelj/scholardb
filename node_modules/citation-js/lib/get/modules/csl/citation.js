"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = citation;

var _engines = _interopRequireDefault(require("./engines"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function citation(data) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var _options$template = options.template,
      template = _options$template === void 0 ? 'apa' : _options$template,
      _options$lang = options.lang,
      lang = _options$lang === void 0 ? 'en-US' : _options$lang,
      _options$format = options.format,
      format = _options$format === void 0 ? 'text' : _options$format;
  var ids = data.map(function (_ref) {
    var id = _ref.id;
    return id;
  });
  var entries = options.entry ? [].concat(options.entry) : ids;
  var citeproc = (0, _engines.default)(data, template, lang, format);
  citeproc.updateItems(ids);
  var citation = citeproc.previewCitationCluster({
    citationItems: entries.map(function (id) {
      return {
        id: id
      };
    }),
    properties: {
      noteIndex: 0
    }
  }, [], [], format);
  return citation;
}