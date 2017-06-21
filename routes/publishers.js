const express = require('express');
const _ = require('underscore');
const router = express.Router();
const request = require('request');

function getPublisherList (req, res, next) {
  var db = req.app.get('db');
  var page = req.query.page ? req.query.page : "A";

  db.run("SELECT id, name, url FROM publishers WHERE sort_name LIKE $1 ORDER BY sort_name", [page.toLowerCase() + "%"], function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.publisher_list = results;
    return next();
  });
}

function getPublisherWorkCount (req, res, next) {
  var db = req.app.get('db');
  var page = req.query.page ? req.query.page : "A";

  db.run("SELECT pub.id, COUNT(works.id) as cnt FROM works LEFT JOIN publications j ON works.publication_id = j.id LEFT JOIN publishers pub ON j.publisher_id = pub.id WHERE pub.sort_name LIKE $1 GROUP BY pub.id ORDER BY pub.sort_name", [page.toLowerCase() + "%"], function (err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.publisher_work_count = results;
    return next();
  });
}

function getLetterPagerCounts (req, res, next) {
  var db = req.app.get('db');

  db.run("SELECT DISTINCT ON (first_letter) UPPER(LEFT(sort_name, 1)) as first_letter, count(*) FROM publishers GROUP BY first_letter ORDER BY first_letter", function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.letter_list = results;
    return next();
  });
}

function renderPublisherList(req, res) {
  var nconf = req.app.get('nconf');
  var cur_letter = req.query.page ? req.query.page : "A";

  var combPublishers = _.map(req.publisher_list, function(publisher) {
    return _.extend(publisher, _.omit(_.findWhere(req.publisher_work_count, {id: publisher.id}), 'id'));
  });

  res.render('publishers', {
    appconf: nconf.get('application'),
    title: nconf.get('application:appname') + " - Publishers",
    publisher_list: combPublishers,
    cur_letter: cur_letter,
    letter_list: req.letter_list,
    cur_list: req.baseUrl
  });
}

function getPublisherDetail (req, res, next) {
  var db = req.app.get('db');
  var publisher_id = req.params.id;

  db.run("SELECT pub.id, pub.name, pub.url, array_to_json(array_agg(j)) as publications FROM publishers pub JOIN LATERAL (select id, name, identifiers from publications where publisher_id = pub.id order by sort_name) j ON TRUE WHERE pub.id = $1 GROUP BY pub.id, pub.name, pub.url", [publisher_id], function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.publisher_detail = results[0];
    var pubsets = [];
    var setind = 0;
    for (var i = 0 ; i < results[0].publications.length ; i++) {
      if (!(i % 10)) {
        setind = Math.floor(i/10);
        pubsets[setind] = [];
      }
      pubsets[setind].push(results[0].publications[i]);
    }

    req.publication_sets = pubsets;
    return next();
  });
}

function getPublisherPeople (req, res, next) {
  var db = req.app.get('db');
  var publisher_id = req.params.id;

  db.run("SELECT person_id, first_name, last_name, lower(left(email, strpos(email, '@') - 1)) as image, count(works.id) FROM works LEFT JOIN publications j ON works.publication_id = j.id LEFT JOIN publishers pub ON j.publisher_id = pub.id, jsonb_to_recordset(works.contributors) AS w(person_id int) LEFT JOIN people p ON p.id = person_id WHERE pub.id = $1 AND active = true GROUP BY person_id, first_name, last_name, email ORDER BY last_name, first_name", [publisher_id], function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.publisher_people = results;
    return next();
  });
}

function getPublisherAllWorkCount (req, res, next) {
  var db = req.app.get('db');
  var publisher_id = req.params.id;

  db.run("SELECT pub.id, COUNT(works.id) AS cnt FROM publishers pub JOIN publications j ON pub.id = j.publisher_id JOIN works ON j.id = works.publication_id WHERE pub.id = $1 GROUP BY pub.id", [publisher_id], function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.total_works = results[0].cnt;
    return next();
  });
}

function getPublisherWorksList (req, res, next) {
  var db = req.app.get('db');
  var publisher_id = req.params.id;
  var limit = req.query.limit ? req.query.limit : 10;
  var offset = req.query.page ? (req.query.page - 1) * limit : 0;

  db.run("SELECT DISTINCT works.id, title_primary as work_title, description as work_type, contributors, j.name as publication, j.id as pubid, publication_date_year as year, pi.identifier FROM works JOIN publications j ON j.id = works.publication_id JOIN publishers pub ON j.publisher_id = pub.id JOIN work_types USING (type) LEFT JOIN LATERAL (select w.identifier from publications j2, JSONB_TO_RECORDSET(j2.identifiers) as w(type text, identifier text) WHERE j2.id = j.id AND w.type LIKE 'ISBN%') pi ON TRUE, JSONB_TO_RECORDSET(works.contributors) AS w(person_id int) LEFT JOIN people p ON person_id = p.id WHERE pub.id = $1 ORDER BY publication_date_year DESC, works.id DESC LIMIT $2 OFFSET $3", [publisher_id, limit, offset], function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.publisher_works_list = results;
    req.works_count = results.length;
    return next();
  });
}

function getWorksImages (req, res, next) {
  var nconf = req.app.get('nconf');

  var idents = _.map(req.publisher_works_list, function(work) {
    return work.identifier ? work.identifier.replace(/-/g, '') : 'null';
  });

  request.get(nconf.get('application:ccurlbase') + idents.join(','), function(err, res, body) {
    if (err) {
      return next(err);
    }

    imgobj = JSON.parse(body);

    _.map(req.publisher_works_list, function(work) {
      var wi = (work.identifier ? work.identifier.replace(/-/g, '') : null);
      work.coverimage = (wi in imgobj ? imgobj[wi] : null);
    });

    return next();
  });
}

function renderPublisherDetail(req, res) {
  var nconf = req.app.get('nconf');
  var limit = req.query.limit ? req.query.limit : 10;
  var page_count = Math.ceil(req.total_works / limit);
  var cur_page = req.query.page ? req.query.page : 1;
  var offset = (cur_page - 1) * limit;

  res.render('publisher_detail', {
    appconf: nconf.get('application'),
    title: nconf.get('application:appname') + " - Publisher: " + req.publisher_detail.name,
    publisher: req.publisher_detail,
    pubsets: req.publication_sets,
    people: req.publisher_people,
    works_list: req.publisher_works_list,
    total_works: req.total_works,
    limit: limit,
    page_count: page_count,
    cur_page: cur_page,
    offset: offset,
    cur_list: req.baseUrl + "/" + req.params.id
  });
}

router.get('/', getPublisherList, getPublisherWorkCount, getLetterPagerCounts, renderPublisherList);
router.get('/:id', getPublisherDetail, getPublisherPeople, getPublisherAllWorkCount, getPublisherWorksList, getWorksImages, renderPublisherDetail)

module.exports = router;
