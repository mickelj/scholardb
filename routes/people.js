const express = require('express');
const _ = require('underscore');
const router = express.Router();

function getPeopleList(req, res, next) {
  var db = req.app.get('db');
  var page = req.query.page ? req.query.page : "A";

  db.run("SELECT p.id as person_id, first_name, middle_name, last_name, UPPER(LEFT(last_name, 1)) as first_letter, lower(left(email, strpos(email, '@') - 1)) as image, jsonb_agg(g) as memberships FROM people p LEFT JOIN LATERAL (select id, name, sort_name from groups where hidden = false AND groups.id = ANY(p.group_membership) order by sort_name) g ON TRUE WHERE last_name LIKE $1 GROUP BY p.id, first_name, last_name, first_letter, image ORDER BY last_name, first_name", [page + "%"], function(err, results) {
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
  var db = req.app.get('db');
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
  var db = req.app.get('db');

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
  var cur_letter = req.query.page ? req.query.page : "A";

  var combPeople = _.map(req.people_list, function(person) {
    return _.extend(person, _.omit(_.findWhere(req.people_works, {person_id: person.person_id}), 'person_id'));
  });

  res.render('people', {
    appconf: nconf.get('application'),
    title: nconf.get('application:appname') + " - People",
    people_list: combPeople,
    cur_letter: cur_letter,
    letter_list: req.letter_list,
    cur_list: req.baseUrl
  });
}

function getPersonDetail (req, res, next) {
  var db = req.app.get('db');
  var person_id = req.params.id;

  db.run("SELECT p.id as person_id, first_name, middle_name, last_name, lower(left(email, strpos(email, '@') - 1)) as image, jsonb_agg(g) as memberships FROM people p LEFT JOIN LATERAL (select id, name, sort_name from groups where hidden = false AND groups.id = ANY(p.group_membership) order by sort_name) g ON TRUE WHERE p.id = $1 GROUP BY p.id, first_name, last_name, image ORDER BY last_name, first_name", [person_id], function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.person_detail = results[0];
    return next();
  });
}

function getPersonWorksCount(req, res, next) {
  var db = req.app.get('db');
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
  var db = req.app.get('db');
  var person_id = req.params.id;
  var limit = req.query.limit ? req.query.limit : 10;
  var offset = req.query.page ? (req.query.page - 1) * limit : 0;

  db.run("SELECT works.id, title_primary as work_title, description as work_type, contributors, name as publication, publications.authority_id as pubid, pi.identifier, publication_date_year as year FROM works JOIN publications ON publications.authority_id = works.publication_id JOIN work_types USING (type) LEFT JOIN LATERAL (select identifier from publications p2, JSONB_TO_RECORDSET(identifiers) as w(type text, identifier text) WHERE p2.id = publications.id AND type LIKE 'ISBN%') pi ON TRUE, JSONB_TO_RECORDSET(works.contributors) AS w(person_id int) WHERE person_id = $1 ORDER BY publication_date_year DESC, works.id DESC LIMIT $2 OFFSET $3", [person_id, limit, offset], function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.person_works_list = results;
    req.works_count = results.length;
    var pubcount = results.reduce(function (allPubs, pub) {
      if (pub.pubid in allPubs) {
        allPubs[pub.pubid].count++;
      } else {
        allPubs[pub.pubid] = {count: 1};
        allPubs[pub.pubid].name = pub.publication;
      }
      return allPubs;
    }, {});

    req.publications_count = _.sortBy(pubcount, 'name');

    var coauth_ids = [req.person_detail.person_id];
    var coauthors = [];
    for (var i = 0 ; i < results.length ; i++) {
      for (var j = 0 ; j < results[i].contributors.length ; j++) {
        if (results[i].contributors[j].person_id) {
          if (coauth_ids.indexOf(results[i].contributors[j].person_id) == -1) {
            coauth_ids.push(results[i].contributors[j].person_id);
            coauthors.push({id: results[i].contributors[j].person_id, name: results[i].contributors[j].display_name});
          }
        }
      }
    }

    req.coauthors = _.sortBy(coauthors, 'name');

    return next();
  });
}

function getWorksImages (req, res, next) {
  var nconf = req.app.get('nconf');

  var idents = _.map(req.person_works_list, function(work) {
    return work.identifier ? work.identifier.replace(/-/g, '') : 'null';
  });

  request.get(nconf.get('application:ccurlbase') + idents.join(','), function(err, res, body) {
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
  var nconf = req.app.get('nconf');
  var limit = req.query.limit ? req.query.limit : 10;
  var page_count = Math.ceil(req.total_works / limit);
  var cur_page = req.query.page ? req.query.page : 1;
  var offset = (cur_page - 1) * limit;

  res.render('people_detail', {
    appconf: nconf.get('application'),
    title: nconf.get('application:appname') + " - Person: " + req.person_detail.last_name + ", " + req.person_detail.first_name + " " + req.person_detail.middle_name,
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

router.get('/', getPeopleList, getPeopleWorkCount, getLetterPagerCounts, renderPeopleList);
router.get('/:id', getPersonDetail, getPersonWorksCount, getPersonWorksList, getWorksImages, renderPersonDetail);

module.exports = router;
