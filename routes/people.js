const express = require('express');
const _ = require('underscore');
const router = express.Router();
const request = require('request');
const db = require('../utils/db');
const authHelpers = require('../utils/auth-helpers');

function getPeopleList(req, res, next) {
  var page = req.query.page || "A";

  db.run("SELECT p.id as person_id, first_name, middle_name, last_name, UPPER(LEFT(last_name, 1)) as first_letter, image_url as image, user_type, jsonb_agg(g) as memberships FROM people p LEFT JOIN LATERAL (select id, name, sort_name from groups join memberships m on groups.id = m.group_id where hidden = false AND m.people_id = p.id order by sort_name) g ON TRUE WHERE last_name LIKE $1 GROUP BY p.id, first_name, last_name, first_letter, image_url ORDER BY last_name, first_name", [page + "%"], function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.people_list = results;
    req.letter_list = _.countBy(results, function(row) {
        return row.first_letter;
    });

    return next();
  });
}

function getPeopleWorkCount (req, res, next) {
  var page = req.query.page || "A";

  db.run("SELECT person_id, COUNT(works_new.work_id) AS cnt FROM works_new, UNNEST(works_new.work_contributors) AS person_id LEFT JOIN people p on person_id = p.id GROUP BY person_id", function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.people_works = results;
    return next();
  });
}

function getLetterPagerCounts (req, res, next) {
  db.run("SELECT UPPER(LEFT(last_name, 1)) as first_letter, count(*) FROM people p GROUP BY first_letter ORDER BY first_letter", function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.letter_list = results;
    return next();
  });
}

function renderPeopleList(req, res) {
  var nconf = req.app.get('nconf');
  var cur_letter = req.query.page || "A";

  var combPeople = _.map(req.people_list, function(person) {
    return _.extend(person, _.omit(_.findWhere(req.people_works, {person_id: person.person_id}), 'person_id'));
  });

  res.render('people', {
    appconf: nconf.get(),
    title: nconf.get('customtext:appname') + " - People",
    people_list: combPeople,
    cur_letter: cur_letter,
    letter_list: req.letter_list,
    cur_list: req.baseUrl,
    user: req.user
  });
}

function getPersonDetail (req, res, next) {
  var person_id = req.params.id;

  db.run("SELECT p.id as person_id, first_name, middle_name, last_name, image_url as image, user_type, jsonb_agg(g) as memberships, alt_last_names, alt_first_names, fullname FROM people p LEFT JOIN LATERAL (select id, name, sort_name from groups join memberships m on groups.id = m.group_id where hidden = false AND m.people_id = p.id order by sort_name) g ON TRUE WHERE p.id = $1 GROUP BY p.id, first_name, last_name, image_url, user_type, alt_last_names, alt_first_names ORDER BY last_name, first_name", [person_id], function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.person_detail = results[0];
    return next();
  });
}

function getPersonWorksCount(req, res, next) {
  var person_id = req.params.id;

  db.run("SELECT count(*) as total_works FROM works_new, UNNEST(works_new.work_contributors) AS person_id WHERE person_id = $1", [person_id], function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.total_works = results[0].total_works;
    return next();
  });
}

function getPersonWorksList (req, res, next) {
  var person_id = req.params.id;
  var limit = req.query.limit || 10;
  var offset = req.query.page ? (req.query.page - 1) * limit : 0;

  db.run("SELECT works_new.work_id, work_data, description as work_type, work_contributors, name as publication, publications.id as pubid, identifier_type, identifier, alt_identifier_type, alt_identifier, work_data#>>'{issued,0,date-parts,0}' as year, archive_url FROM works_new LEFT JOIN publications ON publications.id = works_new.work_publication JOIN work_types on work_types.type=works_new.work_data->>'type', UNNEST(works_new.work_contributors) AS person_id WHERE person_id = $1 ORDER BY work_data#>>'{issued,0,date-parts,0}' DESC, works_new.work_id DESC LIMIT $2 OFFSET $3", [person_id, limit, offset], function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.person_works_list = results;
    req.works_count = results.length;

    return next();
  });
}

function getPublicationsCount(req, res, next) {
  var person_id = req.params.id;

  db.run("SELECT count(works_new.work_id), name, publications.id as id FROM works_new LEFT JOIN publications ON publications.id = works_new.work_publication, UNNEST(works_new.work_contributors) AS person_id WHERE identifier_type = 'ISSN' AND person_id = $1 GROUP BY publications.id, name ORDER BY count(works_new.work_id) DESC, name ASC", [person_id], function(err, results) {
    if (err) {
      return next(err);
    }

    req.publications_count = results;
    return next();
  });
}

function getCoauthors(req, res, next) {
  var person_id = req.params.id;

  db.run("SELECT person_id as id, fullname as name, count(works_new.work_id) FROM works_new, UNNEST(works_new.work_contributors) AS person_id JOIN people on person_id = people.id WHERE work_contributors @> ARRAY[" + person_id + "] GROUP BY person_id, fullname, last_name, first_name ORDER BY last_name ASC, first_name ASC", function(err, results) {
    if (err) {
      return next(err);
    }

    req.coauthors = results;
    return next();
  });
}

function getWorksImages (req, res, next) {
  var nconf = req.app.get('nconf');
  var idents = _.map(req.person_works_list, function(work) {
    return work.identifier ? work.identifier.replace(/-/g, '') : 'null';
  });

  request.get(nconf.get('images:covimgsrv') + idents.join(','), function(err, res, body) {
    if (err) {
      return next(err);
    }

    imgobj = JSON.parse(body);

    _.map(req.person_works_list, function(work) {
      var wi = (work.identifier ? work.identifier.replace(/-/g, '') : null);
      work.coverimage = (wi in imgobj ? imgobj[wi] : null);
    });

    return next();
  });
}

function renderPersonDetail(req, res) {
  const util = require('util');
  var nconf = req.app.get('nconf');
  var limit = req.query.limit || 10;
  var page_count = Math.ceil(req.total_works / limit);
  var cur_page = req.query.page || 1;
  var offset = (cur_page - 1) * limit;

  res.render('people_detail', {
    appconf: nconf.get(),
    title: nconf.get('customtext:appname') + " - Person: " + req.person_detail.fullname,
    works_list: req.person_works_list,
    pers: req.person_detail,
    total_works: req.total_works,
    pub_count: req.publications_count,
    coauthors: req.coauthors,
    limit: limit,
    page_count: page_count,
    cur_page: cur_page,
    offset: offset,
    cur_list: req.baseUrl + "/" + req.params.id,
    user: req.user
  });
}

function getRssResults(req, res, next) {
  var person_id = req.params.id;
  var limit = req.query.limit || 10;

  db.run("SELECT DISTINCT works_new.work_id, work_data, description as work_type, work_contributors, publications.name as pubname, publications.id as pubid, works_new.updated_at, works_new.created_at FROM works_new JOIN publications ON publications.id = works_new.work_publication JOIN work_types on work_types.type=works_new.work_data->>'type', UNNEST(works_new.work_contributors) AS person_id LEFT JOIN people p ON person_id = p.id WHERE p.id = $1 ORDER BY works_new.created_at DESC, works_new.work_id DESC LIMIT $2", [person_id, limit], function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.feed_detail = results;
    return next();
  });
}

function getPersonName(req, res, next) {
  var person_id = req.params.id;

  db.run("SELECT fullname as name FROM people WHERE id = $1", [person_id], function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.person_name = results[0].name;
    return next();
  })
}

function renderRssFeed(req, res) {
  var nconf = req.app.get('nconf');

  res.render('rss', {
    appconf: nconf.get(),
    title: nconf.get('customtext:appname') + ": " + req.person_name,
    feed_link: req.protocol + '://' + req.get('host') + req.originalUrl,
    feed_detail: req.feed_detail
  });
}

function searchPersonByName(req, res) {
  var name = req.query.q;

  db.run("SELECT * FROM people WHERE fullname ILIKE $1 ORDER BY last_name, first_name, middle_name;", ["%" + name + "%"], function(err, results) {
    if (err || !results.length) return res.json({});

    res.json(results);
  });
}

router.get('/', getPeopleList, getPeopleWorkCount, getLetterPagerCounts, renderPeopleList);
router.get('/search', authHelpers.loginRequired, searchPersonByName);
router.get('/:id', getPersonDetail, getPersonWorksCount, getPersonWorksList, getPublicationsCount, getCoauthors, getWorksImages, renderPersonDetail);
router.get('/:id/rss', getRssResults, getPersonName, renderRssFeed);

module.exports = router;
