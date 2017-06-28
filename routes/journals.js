const express = require('express');
const _ = require('underscore');
const router = express.Router();
const request = require('request');
const xml2js = require('xml2js');

function getJournalList(req, res, next) {
  var db = req.app.get('db');
  var page = req.query.page ? req.query.page : "A";

  db.run("SELECT DISTINCT ON (j.sort_name) j.id, j.name, publisher_id, p.name as publisher_name, identifier as issn, identifiers FROM publications j LEFT JOIN publishers p ON j.publisher_id = p.id, JSONB_TO_RECORDSET(identifiers) as w(type text, identifier text) WHERE identifiers @> '[{\"type\" : \"ISSN\"}]' AND j.sort_name LIKE $1 AND j.active = true ORDER BY j.sort_name", [(page + "%").toLowerCase()], function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.journal_list = results;
    return next();
  });
}

function getJournalWorkCount (req, res, next) {
  var db = req.app.get('db');
  var page = req.query.page ? req.query.page : "A";

  db.run("SELECT DISTINCT ON (j.id) j.id, (select COUNT(works.id) from works where works.publication_id = j.id) AS cnt FROM publications j, JSONB_TO_RECORDSET(identifiers) as w(type text, identifier text) WHERE j.active = true AND j.identifiers @> '[{\"type\" : \"ISSN\"}]'", function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.journal_works = results;
    return next();
  });
}

function getLetterPagerCounts (req, res, next) {
  var db = req.app.get('db');

  db.run("SELECT DISTINCT ON (first_letter) UPPER(LEFT(sort_name, 1)) as first_letter, count(*) FROM publications, JSONB_TO_RECORDSET(identifiers) as w(type text, identifier text) WHERE active = true AND identifiers @> '[{\"type\" : \"ISSN\"}]' GROUP BY first_letter ORDER BY first_letter", function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.letter_list = results;
    return next();
  });
}

function renderJournalList(req, res) {
  var nconf = req.app.get('nconf');
  var cur_letter = req.query.page ? req.query.page : "A";

  var combJournals = _.map(req.journal_list, function(journal) {
    return _.extend(journal, _.omit(_.findWhere(req.journal_works, {id: journal.id}), 'id'));
  });

  res.render('journals', {
    appconf: nconf.get('application'),
    title: nconf.get('application:appname') + " - Journals",
    journal_list: combJournals,
    cur_letter: cur_letter,
    letter_list: req.letter_list,
    cur_list: req.baseUrl
  });
}

function getJournalDetail (req, res, next) {
  var db = req.app.get('db');
  var journal_id = req.params.id;

  db.run("SELECT DISTINCT ON (j.id) j.id, j.name, publisher_id, p.name as publisher_name, type as ident_type, g.identifier as issn, identifiers FROM publications j LEFT JOIN publishers p ON j.publisher_id = p.id LEFT JOIN LATERAL (select w.type, w.identifier from publications j2, JSONB_TO_RECORDSET(j2.identifiers) AS w(type text, identifier text) where j2.id = j.id) g ON TRUE WHERE j.id = $1;", [journal_id], function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.journal_detail = results[0];
    return next();
  });
}

function getJournalPeople (req, res, next) {
  var db = req.app.get('db');
  var journal_id = req.params.id;

  db.run("SELECT person_id, first_name, last_name, lower(left(email, strpos(email, '@') - 1)) as image, user_type, count(works.id) FROM works, jsonb_to_recordset(works.contributors) AS w(person_id int) LEFT JOIN people p ON p.id = person_id WHERE publication_id = $1 AND active = true GROUP BY person_id, first_name, last_name, email, user_type ORDER BY last_name, first_name", [journal_id], function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.journal_people = results;
    return next();
  });
}

function getJournalAllWorkCount (req, res, next) {
  var db = req.app.get('db');
  var journal_id = req.params.id;

  db.run("SELECT j.id, COUNT(works.id) AS cnt FROM publications j JOIN works ON j.id = works.publication_id WHERE j.id = $1 GROUP BY j.id", [journal_id], function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.total_works = results[0].cnt;
    return next();
  });
}

function getJournalWorksList (req, res, next) {
  var db = req.app.get('db');
  var journal_id = req.params.id;
  var limit = req.query.limit ? req.query.limit : 10;
  var offset = req.query.page ? (req.query.page - 1) * limit : 0;

  db.run("SELECT DISTINCT works.id, title_primary as work_title, title_secondary, title_tertiary, description as work_type, contributors, j.name as publication, j.id as pubid, publication_date_year as year, pi.identifier FROM works JOIN publications j ON j.id = works.publication_id JOIN work_types USING (type) LEFT JOIN LATERAL (select w.identifier from publications j2, JSONB_TO_RECORDSET(identifiers) as w(type text, identifier text) WHERE j2.id = j.id AND w.type LIKE 'ISBN%' LIMIT 1) pi ON TRUE, JSONB_TO_RECORDSET(works.contributors) AS w(person_id int) LEFT JOIN people p ON person_id = p.id WHERE j.id = $1 ORDER BY publication_date_year DESC, works.id DESC LIMIT $2 OFFSET $3", [journal_id, limit, offset], function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.journal_works_list = results;
    req.works_count = results.length;
    return next();
  });
}

function getRomeoDetails (req, res, next) {
  var nconf = req.app.get('nconf');
  var romeourl = nconf.get('application:romeourl') + nconf.get('application:romeoapikey');

  request.get(romeourl + '&issn=' + req.journal_detail.issn, function(err, res, body) {
    if (err) {
      return next(err);
    }

    xml2js.parseString(body, function(err, result) {
      if (err) {
        return next(err);
      }

      req.romeo = {};
      req.romeo.numhits = result.romeoapi.header[0].numhits[0];
      if (req.romeo.numhits > 0) {
        req.romeo.publisher = result.romeoapi.publishers[0].publisher[0];
      }
      return next();
    });
  });
}

function getWorksImages (req, res, next) {
  var nconf = req.app.get('nconf');

  var idents = _.map(req.journal_works_list, function(work) {
    return work.identifier ? work.identifier.replace(/-/g, '') : 'null';
  });

  request.get(nconf.get('application:ccurlbase') + idents.join(','), function(err, res, body) {
    if (err) {
      return next(err);
    }

    imgobj = JSON.parse(body);

    _.map(req.journal_works_list, function(work) {
      var wi = (work.identifier ? work.identifier.replace(/-/g, '') : null);
      work.coverimage = (wi in imgobj ? imgobj[wi] : null);
    });

    return next();
  });
}

function renderJournalDetail(req, res) {
  var nconf = req.app.get('nconf');
  var limit = req.query.limit ? req.query.limit : 10;
  var page_count = Math.ceil(req.total_works / limit);
  var cur_page = req.query.page ? req.query.page : 1;
  var offset = (cur_page - 1) * limit;

  res.render('journal_detail', {
    appconf: nconf.get('application'),
    title: nconf.get('application:appname') + " - Journal: " + req.journal_detail.name,
    journal: req.journal_detail,
    people: req.journal_people,
    works_list: req.journal_works_list,
    total_works: req.total_works,
    romeo: req.romeo,
    limit: limit,
    page_count: page_count,
    cur_page: cur_page,
    offset: offset,
    cur_list: req.baseUrl + "/" + req.params.id
  });
}

router.get('/', getJournalList, getJournalWorkCount, getLetterPagerCounts, renderJournalList);
router.get('/:id', getJournalDetail, getJournalPeople, getJournalAllWorkCount, getJournalWorksList, getRomeoDetails, getWorksImages, renderJournalDetail);

module.exports = router;
