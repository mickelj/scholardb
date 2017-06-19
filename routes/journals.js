const express = require('express');
const _ = require('underscore');
const router = express.Router();
const request = require('request');

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
    dept_list: combJournals,
    cur_letter: cur_letter,
    letter_list: req.letter_list,
    cur_list: req.baseUrl
  });
}

router.get('/', getJournalList, getJournalWorkCount, getLetterPagerCounts, renderJournalList);
//router.get('/:id', getDeptDetail, getDeptPeople, getDeptWorksCount, getDeptWorksList, getWorksImages, renderDeptDetail);

module.exports = router;
