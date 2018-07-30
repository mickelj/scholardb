"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.parse = void 0;

var _name = _interopRequireDefault(require("../../name"));

var _date = _interopRequireDefault(require("../../date"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var months = [/jan(uary)?\.?/i, /feb(ruary)?\.?/i, /mar(ch)?\.?/i, /apr(il)?\.?/i, /may\.?/i, /jun(e)?\.?/i, /jul(y)?\.?/i, /aug(ust)?\.?/i, /sep(tember)?\.?/i, /oct(ober)?\.?/i, /nov(ember)?\.?/i, /dec(ember)?\.?/i];

var parseBibtexDate = function parseBibtexDate(value) {
  if (/{|}/.test(value)) {
    return {
      literal: value.replace(/[{}]/g, '')
    };
  } else {
    return (0, _date.default)(value);
  }
};

var parseBibtexName = function parseBibtexName(name) {
  if (/{|}/.test(name)) {
    return {
      literal: name.replace(/[{}]/g, '')
    };
  } else {
    return (0, _name.default)(name);
  }
};

var parseBibtexNameList = function parseBibtexNameList(list) {
  var literals = [];
  list = list.replace(/%/g, '%0').replace(/{.*?}/g, function (m) {
    return "%[".concat(literals.push(m) - 1, "]");
  });
  return list.split(' and ').map(function (name) {
    return name.replace(/%\[(\d+)\]/, function (_, i) {
      return literals[+i];
    }).replace(/%0/g, '%');
  }).map(parseBibtexName);
};

var richTextMappings = {
  textit: 'i',
  textbf: 'b',
  textsc: 'sc',
  textsuperscript: 'sup',
  textsubscript: 'sub'
};

var parseBibtexRichText = function parseBibtexRichText(text) {
  var tokens = text.split(/((?:\\text[a-z]+)?{|})/);
  var closingTags = [];
  var hasTopLevelTag = text[0] === '{' && text[text.length - 1] === '}';
  tokens = tokens.map(function (token, index) {
    if (index % 2 === 0) {
      return token;
    } else if (token[0] === '\\') {
      var tag = richTextMappings[token.slice(1, -1)];
      closingTags.push("</".concat(tag, ">"));
      return "<".concat(tag, ">");
    } else if (token === '{') {
      closingTags.push('</span>');
      return '<span class="nocase">';
    } else if (token === '}') {
      if (closingTags.length === 1 && index !== tokens.length - 2) {
        hasTopLevelTag = false;
      }

      return closingTags.pop();
    }
  });

  if (hasTopLevelTag) {
    tokens.splice(0, 2);
    tokens.splice(-2, 2);
  }

  return tokens.join('');
};

var propMap = {
  address: 'publisher-place',
  author: true,
  booktitle: 'container-title',
  doi: 'DOI',
  date: 'issued',
  edition: true,
  editor: true,
  isbn: 'ISBN',
  issn: 'ISSN',
  issue: 'issue',
  journal: 'container-title',
  language: true,
  location: 'publisher-place',
  note: true,
  number: 'issue',
  numpages: 'number-of-pages',
  pages: 'page',
  pmid: 'PMID',
  pmcid: 'PMCID',
  publisher: true,
  series: 'collection-title',
  title: true,
  url: 'URL',
  volume: true,
  year: 'issued:date-parts.0.0',
  month: 'issued:date-parts.0.1',
  day: 'issued:date-parts.0.2',
  crossref: false,
  keywords: false
};

var parseBibTeXProp = function parseBibTeXProp(name, value) {
  if (!propMap.hasOwnProperty(name)) {
    logger.info('[set]', "Unknown property: ".concat(name));
    return undefined;
  } else if (propMap[name] === false) {
    return undefined;
  }

  var cslProp = propMap[name] === true ? name : propMap[name];

  var cslValue = function (name, value) {
    switch (name) {
      case 'author':
      case 'editor':
        return parseBibtexNameList(value);

      case 'issued':
        return parseBibtexDate(value);

      case 'edition':
        return value;

      case 'issued:date-parts.0.1':
        return parseFloat(value) ? value : months.findIndex(function (month) {
          return month.test(value);
        }) + 1;

      case 'page':
        return value.replace(/[—–]/, '-');

      case 'title':
        return parseBibtexRichText(value);

      default:
        return value.replace(/[{}]/g, '');
    }
  }(cslProp, value);

  return [cslProp, cslValue];
};

exports.default = exports.parse = parseBibTeXProp;