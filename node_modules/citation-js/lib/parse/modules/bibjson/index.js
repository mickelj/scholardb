"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.formats = exports.parsers = exports.ref = void 0;

var json = _interopRequireWildcard(require("./json"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

var scraperLinks = ['fulltext_html', 'fulltext_xml', 'fulltext_pdf'];
var ref = '@bibjson';
exports.ref = ref;
var parsers = {
  json: json
};
exports.parsers = parsers;
var formats = {
  '@bibjson/quickscrape+record+object': {
    parse: json.quickscrapeRecord,
    parseType: {
      propertyConstraint: {
        props: 'link',
        value: function value(links) {
          return scraperLinks.some(function (link) {
            return links.find(function (_ref) {
              var type = _ref.type;
              return type === link;
            });
          });
        }
      },
      extends: '@bibjson/record+object'
    }
  },
  '@bibjson/record+object': {
    parse: json.record,
    parseType: {
      dataType: 'SimpleObject',
      propertyConstraint: [{
        props: 'title'
      }, {
        props: ['author', 'editor'],
        match: 'some',
        value: function value(authors) {
          return Array.isArray(authors) && authors[0] && 'name' in authors[0];
        }
      }]
    }
  },
  '@bibjson/collection+object': {
    parse: function parse(collection) {
      return collection.records;
    },
    parseType: {
      dataType: 'SimpleObject',
      propertyConstraint: [{
        props: 'metadata',
        value: function value(metadata) {
          return 'collection' in metadata;
        }
      }, {
        props: 'records',
        value: function value(records) {
          return Array.isArray(records);
        }
      }]
    }
  }
};
exports.formats = formats;