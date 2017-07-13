const express = require('express');
const _ = require('underscore');
const router = express.Router();
const request = require('request');
const db = require('../utils/db');
const nconf = require('../utils/nconf');

function getPeopleList(req, res, next) {
  var page = req.query.page ? req.query.page : "A";

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
  var page = req.query.page ? req.query.page : "A";

  db.run("SELECT person_id, COUNT(works.id) AS cnt FROM works, JSONB_TO_RECORDSET(works.contributors) AS w(person_id int) LEFT JOIN people p on person_id = p.id GROUP BY person_id", function(err, results) {
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
  var cur_letter = req.query.page ? req.query.page : "A";

  var combPeople = _.map(req.people_list, function(person) {
    return _.extend(person, _.omit(_.findWhere(req.people_works, {person_id: person.person_id}), 'person_id'));
  });

  res.render('people', {
    appconf: nconf.get(),
    title: nconf.get('customtext:appname') + " - People",
    people_list: combPeople,
    cur_letter: cur_letter,
    letter_list: req.letter_list,
    cur_list: req.baseUrl
  });
}

function getPersonDetail (req, res, next) {
  var person_id = req.params.id;

  db.run("SELECT p.id as person_id, first_name, middle_name, last_name, image_url as image, user_type, jsonb_agg(g) as memberships, pn.pen_names FROM people p LEFT JOIN LATERAL (select jsonb_agg(display_name) as pen_names from pennames where people_id = p.id) pn ON TRUE LEFT JOIN LATERAL (select id, name, sort_name from groups join memberships m on groups.id = m.group_id where hidden = false AND m.people_id = p.id order by sort_name) g ON TRUE WHERE p.id = $1 GROUP BY p.id, first_name, last_name, image_url, user_type, pn.pen_names ORDER BY last_name, first_name", [person_id], function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.person_detail = results[0];
    return next();
  });
}

function getPersonWorksCount(req, res, next) {
  var person_id = req.params.id;

  db.run("SELECT count(*) as total_works FROM works, JSONB_TO_RECORDSET(works.contributors) AS w(person_id int) WHERE person_id = $1", [person_id], function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.total_works = results[0].total_works;
    return next();
  });
}

function getPersonWorksList (req, res, next) {
  var person_id = req.params.id;
  var limit = req.query.limit ? req.query.limit : 10;
  var offset = req.query.page ? (req.query.page - 1) * limit : 0;

  db.run("SELECT works.id, title_primary as work_title, title_secondary, title_tertiary, description as work_type, contributors, name as publication, publications.id as pubid, identifier_type, identifier, alt_identifier_type, alt_identifier, publication_date_year as year, volume, issue, start_page, end_page, archive_url FROM works LEFT JOIN publications ON publications.id = works.publication_id JOIN work_types USING (type), JSONB_TO_RECORDSET(works.contributors) AS w(person_id int) WHERE person_id = $1 ORDER BY publication_date_year DESC, works.id DESC LIMIT $2 OFFSET $3", [person_id, limit, offset], function(err, results) {
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

  db.run("SELECT count(works.id), name, publications.id as id FROM works LEFT JOIN publications ON publications.id = works.publication_id, JSONB_TO_RECORDSET(works.contributors) AS w(person_id int) WHERE identifier_type = 'ISSN' AND person_id = $1 GROUP BY publications.id, name ORDER BY count(works.id) DESC, name ASC", [person_id], function(err, results) {
    if (err) {
      return next(err);
    }

    req.publications_count = results;
    return next();
  });
}

function getCoauthors(req, res, next) {
  var person_id = req.params.id;

  db.run("SELECT person_id as id, (last_name || ', ' || first_name) as name, count(works.id) FROM works, JSONB_TO_RECORDSET(works.contributors) AS w(person_id int) JOIN people on person_id = people.id WHERE contributors @> '[{\"person_id\": " + person_id + "}]' GROUP BY person_id, last_name, first_name ORDER BY last_name ASC, first_name ASC", function(err, results) {
    if (err) {
      return next(err);
    }

    req.coauthors = results;
    return next();
  });
}

function getWorksImages (req, res, next) {
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
  var limit = req.query.limit ? req.query.limit : 10;
  var page_count = Math.ceil(req.total_works / limit);
  var cur_page = req.query.page ? req.query.page : 1;
  var offset = (cur_page - 1) * limit;

  res.render('people_detail', {
    appconf: nconf.get(),
    title: nconf.get('customtext:appname') + " - Person: " + req.person_detail.last_name + ", " + req.person_detail.first_name + " " + req.person_detail.middle_name,
    works_list: req.person_works_list,
    pers: req.person_detail,
    total_works: req.total_works,
    pub_count: req.publications_count,
    coauthors: req.coauthors,
    limit: limit,
    page_count: page_count,
    cur_page: cur_page,
    offset: offset,
    cur_list: req.baseUrl + "/" + req.params.id
  });
}

function getRssResults(req, res, next) {
  var person_id = req.params.id;
  var limit = req.query.limit ? req.query.limit : 10;

  db.run("SELECT DISTINCT works.id, title_primary as title, description as work_type, contributors, publications.name as pubname, publications.id as pubid, publication_date_year as year, works.updated_at, works.created_at FROM works JOIN publications ON publications.id = works.publication_id JOIN work_types USING (type), JSONB_TO_RECORDSET(works.contributors) AS w(person_id int) LEFT JOIN people p ON person_id = p.id WHERE p.id = $1 ORDER BY works.created_at DESC, works.id DESC LIMIT $2", [person_id, limit], function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.feed_detail = results;
    return next();
  });
}

function getPersonName(req, res, next) {
  var person_id = req.params.id;

  db.run("SELECT (coalesce(first_name,'') || ' ' || coalesce(middle_name,'') || ' ' || coalesce(last_name,'')) as name FROM people WHERE id = $1", [person_id], function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.person_name = results[0].name;
    return next();
  })
}

function renderRssFeed(req, res) {
  res.render('rss', {
    appconf: nconf.get(),
    title: nconf.get('customtext:appname') + ": " + req.person_name,
    feed_link: req.protocol + '://' + req.get('host') + req.originalUrl,
    feed_detail: req.feed_detail
  });
}

router.get('/', getPeopleList, getPeopleWorkCount, getLetterPagerCounts, renderPeopleList);
router.get('/:id', getPersonDetail, getPersonWorksCount, getPersonWorksList, getPublicationsCount, getCoauthors, getWorksImages, renderPersonDetail);
router.get('/:id/rss', getRssResults, getPersonName, renderRssFeed);

module.exports = router;
