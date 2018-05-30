const express = require('express');
const _ = require('underscore');
const router = express.Router();
const request = require('request');
const xml2js = require('xml2js');
const db = require('../utils/db');

function getJournalList(req, res, next) {
  var page = req.query.page || "A";

  db.run("SELECT j.id, j.name, publisher_id, p.name as publisher_name, identifier, alt_identifier FROM publications j LEFT JOIN publishers p ON j.publisher_id = p.id WHERE identifier_type = 'ISSN' AND j.sort_name LIKE $1 ORDER BY j.sort_name", [(page + "%").toLowerCase()], function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.journal_list = results;
    return next();
  });
}

function getJournalWorkCount (req, res, next) {
  var page = req.query.page || "A";

  db.run("SELECT j.id, (select COUNT(works.id) from works where works.publication_id = j.id) AS cnt FROM publications j WHERE j.identifier_type = 'ISSN' AND j.sort_name LIKE $1", [(page + "%").toLowerCase()], function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.journal_works = results;
    return next();
  });
}

function getLetterPagerCounts (req, res, next) {
  db.run("SELECT UPPER(LEFT(sort_name, 1)) as first_letter, count(*) FROM publications WHERE identifier_type = 'ISSN' GROUP BY first_letter ORDER BY first_letter", function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.letter_list = results;
    return next();
  });
}

function renderJournalList(req, res) {
  var nconf = req.app.get('nconf');
  var cur_letter = req.query.page || "A";

  var combJournals = _.map(req.journal_list, function(journal) {
    return _.extend(journal, _.omit(_.findWhere(req.journal_works, {id: journal.id}), 'id'));
  });

  res.render('publications', {
    appconf: nconf.get(),
    title: nconf.get('customtext:appname') + " - Journals",
    journal_list: combJournals,
    cur_letter: cur_letter,
    letter_list: req.letter_list,
    cur_list: req.baseUrl,
    user: req.user
  });
}

function getJournalDetail (req, res, next) {
  var journal_id = req.params.id;

  db.run("SELECT j.id, j.name, publisher_id, p.name as publisher_name, identifier_type, identifier, alt_identifier_type, alt_identifier FROM publications j LEFT JOIN publishers p ON j.publisher_id = p.id WHERE j.id = $1;", [journal_id], function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.journal_detail = results[0];
    return next();
  });
}

function getJournalPeople (req, res, next) {
  var journal_id = req.params.id;

  db.run("SELECT person_id, first_name, last_name, image_url as image, user_type, count(works.id) FROM works, jsonb_to_recordset(works.contributors) AS w(person_id int) LEFT JOIN people p ON p.id = person_id WHERE publication_id = $1 AND active = true GROUP BY person_id, first_name, last_name, email, image_url, user_type ORDER BY last_name, first_name, image_url, user_type", [journal_id], function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.journal_people = results;
    return next();
  });
}

function getJournalAllWorkCount (req, res, next) {
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
  var journal_id = req.params.id;
  var limit = req.query.limit || 10;
  var offset = req.query.page ? (req.query.page - 1) * limit : 0;

  db.run("SELECT DISTINCT works.id, title_primary as work_title, title_secondary, title_tertiary, description as work_type, contributors, j.name as publication, j.id as pubid, publication_date_year as year, identifier, identifier_type, alt_identifier, alt_identifier_type, volume, issue, start_page, end_page, archive_url FROM works JOIN publications j ON j.id = works.publication_id JOIN work_types USING (type), JSONB_TO_RECORDSET(works.contributors) AS w(person_id int) LEFT JOIN people p ON person_id = p.id WHERE j.id = $1 ORDER BY publication_date_year DESC, works.id DESC LIMIT $2 OFFSET $3", [journal_id, limit, offset], function(err, results) {
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
  var romeourl = nconf.get('romeo:romeourl') + process.env.ROMEO_API_KEY;

  if (req.journal_detail.identifier_type && req.journal_detail.identifier_type === 'ISSN') {
    request.get(romeourl + '&issn=' + req.journal_detail.identifier, function(err, res, body) {
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
  } else {
    return next();
  }
}

function getWorksImages (req, res, next) {
  var nconf = req.app.get('nconf');

  if (req.journal_detail.identifier_type && req.journal_detail.identifier_type.startsWith('ISBN')) {
    var idents = _.map(req.journal_works_list, function(work) {
      return work.identifier ? work.identifier.replace(/-/g, '') : 'null';
    });

    request.get(nconf.get('images:covimgsrv') + idents.join(','), function(err, res, body) {
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
  } else {
    return next();
  }
}

function renderJournalDetail(req, res) {
  var nconf = req.app.get('nconf');
  var limit = req.query.limit || 10;
  var page_count = Math.ceil(req.total_works / limit);
  var cur_page = req.query.page || 1;
  var offset = (cur_page - 1) * limit;

  res.render('publication_detail', {
    appconf: nconf.get(),
    title: nconf.get('customtext:appname') + " - Journal: " + req.journal_detail.name,
    journal: req.journal_detail,
    people: req.journal_people,
    works_list: req.journal_works_list,
    total_works: req.total_works,
    romeo: req.romeo,
    limit: limit,
    page_count: page_count,
    cur_page: cur_page,
    offset: offset,
    cur_list: req.baseUrl + "/" + req.params.id,
    user: req.user
  });
}

function searchJournalByName(req, res) {
  var nconf = req.app.get('nconf');
  var title = req.query.q;

  console.log(title);

  db.run("SELECT id, name, identifier FROM publications WHERE name ILIKE $1 AND id = authority_id;", ["%" + title + "%"], function(err, results) {
    if (err || !results.length) return res.status(500).send(err);

    req.journal_name_list = results;
    console.log(results);
    res.json(results);
  });
}

router.get('/', getJournalList, getJournalWorkCount, getLetterPagerCounts, renderJournalList);
router.get('/:id', getJournalDetail, getJournalPeople, getJournalAllWorkCount, getJournalWorksList, getRomeoDetails, getWorksImages, renderJournalDetail);
router.get('/search', searchJournalByName);

module.exports = router;
