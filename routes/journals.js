const express = require('express');
const _ = require('underscore');
const router = express.Router();
const request = require('request');
const xml2js = require('xml2js');

function getJournalList(req, res, next) {
  var db = req.app.get('db');
  var page = req.query.page ? req.query.page : "A";

  db.run("SELECT DISTINCT ON (j.sort_name) j.id, j.name, publisher_id, p.name as publisher_name, identifier as issn, identifiers FROM publications j LEFT JOIN publishers p ON j.publisher_id = p.id, JSONB_TO_RECORDSET(identifiers) as w(type text, identifier text) WHERE type LIKE 'ISSN%' AND j.sort_name LIKE $1 ORDER BY j.sort_name", [(page + "%").toLowerCase()], function(err, results) {
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

  db.run("SELECT DISTINCT ON (j.id) j.id, (select COUNT(works.id) from works where works.publication_id = j.id) AS cnt FROM publications j, JSONB_TO_RECORDSET(identifiers) as w(type text, identifier text) WHERE w.type LIKE 'ISSN%'", function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.journal_works = results;
    return next();
  });
}

function getLetterPagerCounts (req, res, next) {
  var db = req.app.get('db');

  db.run("SELECT DISTINCT ON (first_letter) UPPER(LEFT(sort_name, 1)) as first_letter, count(*) FROM publications, JSONB_TO_RECORDSET(identifiers) as w(type text, identifier text) WHERE type LIKE 'ISSN%' GROUP BY first_letter ORDER BY first_letter", function(err, results) {
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

  db.run("SELECT DISTINCT ON (j.id) j.id, j.name, publisher_id, p.name as publisher_name, identifier as issn, identifiers FROM publications j LEFT JOIN publishers p ON j.publisher_id = p.id, JSONB_TO_RECORDSET(identifiers) as w(type text, identifier text) WHERE j.id = $1", [journal_id], function(err, results) {
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

  db.run("SELECT person_id, first_name, last_name, lower(left(email, strpos(email, '@') - 1)) as image, count(works.id) FROM works, jsonb_to_recordset(works.contributors) AS w(person_id int) LEFT JOIN people p ON p.id = person_id WHERE publication_id = $1 AND active = true GROUP BY person_id, first_name, last_name, email ORDER BY last_name, first_name", [journal_id], function(err, results) {
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

  db.run("SELECT DISTINCT works.id, title_primary as work_title, description as work_type, contributors, publications.name as publication, publications.authority_id as pubid, publication_date_year as year FROM works JOIN publications ON publications.authority_id = works.publication_id JOIN work_types USING (type), JSONB_TO_RECORDSET(works.contributors) AS w(person_id int) LEFT JOIN people p ON person_id = p.id WHERE publications.id = $1 ORDER BY publication_date_year DESC, works.id DESC LIMIT $2 OFFSET $3", [journal_id, limit, offset], function(err, results) {
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

      req.romeo = results;
      return next();
    });
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
router.get('/:id', getJournalDetail, getJournalPeople, getJournalAllWorkCount, getJournalWorksList, getRomeoDetails, renderJournalDetail);

module.exports = router;
