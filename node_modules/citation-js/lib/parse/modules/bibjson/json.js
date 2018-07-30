"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.record = exports.quickscrapeRecord = void 0;

var _date = _interopRequireDefault(require("../../date"));

var _name = _interopRequireDefault(require("../../name"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function nameProps(person) {
  var firstname = person.firstname,
      lastname = person.lastname,
      _person$firstName = person.firstName,
      given = _person$firstName === void 0 ? firstname : _person$firstName,
      _person$lastName = person.lastName,
      family = _person$lastName === void 0 ? lastname : _person$lastName;

  if (given && family) {
    return {
      given: given,
      family: family
    };
  } else if (person.name) {
    return (0, _name.default)(person.name);
  }
}

var identifiers = ['PMID', 'PMCID', 'DOI', 'ISBN'];
var journalIdentifiers = ['ISSN'];

function idProps(input, identifiers) {
  var output = {};

  for (var prop in input) {
    var upperCaseProp = prop.toUpperCase();

    if (identifiers.includes(upperCaseProp)) {
      output[upperCaseProp] = input[prop];
    }
  }

  if (input.identifier) {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = input.identifier[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var _ref2 = _step.value;
        var id = _ref2.id,
            _ref2$type = _ref2.type,
            type = _ref2$type === void 0 ? '' : _ref2$type;
        type = type.toUpperCase();

        if (identifiers.includes(type)) {
          output[type] = id;
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return != null) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  }

  return output;
}

var typeMap = {
  article: 'article',
  book: 'book',
  booklet: 'book',
  proceedings: 'book',
  mastersthesis: 'thesis',
  inbook: 'chapter',
  incollection: 'chapter',
  conference: 'paper-conference',
  inproceedings: 'paper-conference',
  online: 'website',
  patent: 'patent',
  phdthesis: 'thesis',
  techreport: 'report',
  unpublished: 'manuscript',
  manual: undefined,
  misc: undefined
};

function quickscrapeSpecificProps() {
  return {
    type: 'article-journal'
  };
}

function generalProps(input) {
  var output = {
    type: typeMap[input.type] || 'book'
  };

  if (input.title) {
    output.title = input.title;
  }

  if (input.author) {
    output.author = input.author.map(nameProps).filter(Boolean);
  }

  if (input.editor) {
    output.editor = input.editor.map(nameProps).filter(Boolean);
  }

  if (input.reviewer) {
    if (input.author) {
      output['reviewed-author'] = output.author;
    }

    output.author = input.reviewer.map(nameProps).filter(Boolean);
  }

  if (Array.isArray(input.keywords)) {
    output.keyword = input.keywords.join();
  } else if (input.keywords) {
    output.keyword = input.keywords;
  }

  if (input.publisher) {
    output.publisher = input.publisher.name || input.publisher;
  }

  if (input.date && Object.keys(input.date).length > 0) {
    var dates = input.date;

    if (dates.submitted) {
      output.submitted = (0, _date.default)(dates.submitted);
    }

    if (dates.published) {
      output.issued = (0, _date.default)(dates.published);
    }
  } else if (input.year) {
    output.issued = {
      'date-parts': [[+input.year]]
    };
  }

  if (input.journal) {
    var journal = input.journal;

    if (journal.name) {
      output['container-title'] = journal.name;
    }

    if (journal.volume) {
      output.volume = +journal.volume;
    }

    if (journal.issue) {
      output.issue = +journal.issue;
    }

    Object.assign(output, idProps(journal, journalIdentifiers));

    if (journal.firstpage) {
      output['page-first'] = journal.firstpage;
    }

    if (journal.pages) {
      output.page = journal.pages.replace('--', '-');
    } else if (journal.firstpage && journal.lastpage) {
      output.page = journal.firstpage + '-' + journal.lastpage;
    }
  }

  if (input.link && _typeof(input.link[0]) === 'object') {
    output.URL = input.link[0].url;
  }

  Object.assign(output, idProps(input, identifiers));

  if (input.cid) {
    output.id = input.cid;
  } else if (output.DOI) {
    output.id = output.DOI;
  }

  return output;
}

var parseContentMine = function parseContentMine(data) {
  return Object.assign(generalProps(data), quickscrapeSpecificProps(data));
};

exports.quickscrapeRecord = parseContentMine;

var parseBibJson = function parseBibJson(data) {
  return generalProps(data);
};

exports.record = parseBibJson;