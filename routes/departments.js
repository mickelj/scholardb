const express = require('express');
const _ = require('underscore');
const router = express.Router();
const request = require('request');
const db = require('../utils/db');
const nconf = require('../utils/nconf');

function getDeptList(req, res, next) {
  var page = req.query.page ? req.query.page : "A";

  db.run("SELECT g.id as group_id, g.name as group_name, g.url, g.parent_id as parent_id, g2.name as parent_name FROM groups g LEFT JOIN groups g2 ON g.parent_id = g2.id WHERE g.sort_name LIKE $1 AND g.hidden = false ORDER BY g.sort_name", [(page + "%").toLowerCase()], function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.dept_list = results;
    return next();
  });
}

function getDeptMembersCount (req, res, next) {
  var page = req.query.page ? req.query.page : "A";

  db.run("SELECT g.id as group_id, count(p.id) as cnt FROM people p LEFT JOIN memberships m on p.id = m.people_id JOIN groups g on m.group_id = g.id WHERE g.name <> '' AND g.sort_name LIKE $1 AND g.hidden = false GROUP BY g.id, g.sort_name ORDER BY g.sort_name", [(page + "%").toLowerCase()], function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.members = results;
    return next();
  });
}

function getLetterPagerCounts (req, res, next) {
  db.run("SELECT UPPER(LEFT(sort_name, 1)) as first_letter, count(*) FROM groups WHERE hidden = false GROUP BY first_letter ORDER BY first_letter", function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.letter_list = results;
    return next();
  });
}

function renderDeptList(req, res) {
  var cur_letter = req.query.page ? req.query.page : "A";

  var combDepts = _.map(req.dept_list, function(dept) {
    return _.extend(dept, _.omit(_.findWhere(req.members, {group_id: dept.group_id}), 'group_id'));
  });

  res.render('departments', {
    appconf: nconf.get(),
    title: nconf.get('customtext:appname') + " - Departments",
    dept_list: combDepts,
    cur_letter: cur_letter,
    letter_list: req.letter_list,
    cur_list: req.baseUrl
  });
}

function getDeptDetail (req, res, next) {
  var dept_id = req.params.id;

  db.run("SELECT g.id as group_id, g.name as group_name, g.url, g.parent_id as parent_id, g2.name as parent_name FROM groups g LEFT JOIN groups g2 ON g.parent_id = g2.id WHERE g.id = $1", [dept_id], function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.dept_detail = results[0];
    return next();
  });
}

function getDeptPeople (req, res, next) {
  var dept_id = req.params.id;

  db.run("SELECT person_id, first_name, last_name, image_url as image, user_type, count(works.id) FROM works, jsonb_to_recordset(works.contributors) AS w(person_id int) LEFT JOIN people p ON p.id = person_id LEFT JOIN memberships m on p.id = m.people_id JOIN groups g on m.group_id = g.id WHERE g.hidden = false AND g.id = $1 AND active = true GROUP BY person_id, first_name, last_name, email, image_url, user_type ORDER BY last_name, first_name", [dept_id], function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.dept_people = results;
    return next();
  });
}

function getDeptWorksCount(req, res, next) {
  var dept_id = req.params.id;

  db.run("SELECT count(distinct works.id) as total_works FROM works, JSONB_TO_RECORDSET(works.contributors) AS w(person_id int) LEFT JOIN people p ON person_id = p.id LEFT JOIN memberships m on p.id = m.people_id JOIN groups g on m.group_id = g.id WHERE g.hidden = false AND g.id = $1", [dept_id], function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.total_works = results[0].total_works;
    return next();
  });
}

function getDeptWorksList (req, res, next) {
  var dept_id = req.params.id;
  var limit = req.query.limit ? req.query.limit : 10;
  var offset = req.query.page ? (req.query.page - 1) * limit : 0;

  db.run("SELECT DISTINCT works.id, title_primary as work_title, title_secondary, title_tertiary, description as work_type, contributors, identifier, identifier_type, alt_identifier, alt_identifier_type, publications.name as publication, publications.authority_id as pubid, publication_date_year as year, volume, issue, start_page, end_page, archive_url FROM works JOIN publications ON publications.id = works.publication_id JOIN work_types USING (type), JSONB_TO_RECORDSET(works.contributors) AS w(person_id int) LEFT JOIN people p ON person_id = p.id LEFT JOIN memberships m on p.id = m.people_id JOIN groups g on m.group_id = g.id WHERE g.hidden = false AND g.id = $1 ORDER BY publication_date_year DESC, works.id DESC LIMIT $2 OFFSET $3", [dept_id, limit, offset], function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.dept_works_list = results;
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

    return next();
  });
}

function getWorksImages (req, res, next) {
  var idents = _.map(req.dept_works_list, function(work) {
    return work.identifier ? work.identifier.replace(/-/g, '') : 'null';
  });

  request.get(nconf.get('images:covimgsrv') + idents.join(','), function(err, res, body) {
    if (err) {
      return next(err);
    }

    imgobj = JSON.parse(body);

    _.map(req.dept_works_list, function(work) {
      var wi = (work.identifier ? work.identifier.replace(/-/g, '') : null);
      work.coverimage = (wi in imgobj ? imgobj[wi] : null);
    });

    return next();
  });
}

function renderDeptDetail(req, res) {
  var limit = req.query.limit ? req.query.limit : 10;
  var page_count = Math.ceil(req.total_works / limit);
  var cur_page = req.query.page ? req.query.page : 1;
  var offset = (cur_page - 1) * limit;

  res.render('dept_detail', {
    appconf: nconf.get(),
    title: nconf.get('customtext:appname') + " - Department: " + req.dept_detail.group_name,
    dept: req.dept_detail,
    people: req.dept_people,
    works_list: req.dept_works_list,
    total_works: req.total_works,
    pub_count: req.publications_count,
    limit: limit,
    page_count: page_count,
    cur_page: cur_page,
    offset: offset,
    cur_list: req.baseUrl + "/" + req.params.id
  });
}

function getRssResults(req, res, next) {
  var dept_id = req.params.id;
  var limit = req.query.limit ? req.query.limit : 10;

  db.run("SELECT DISTINCT works.id, title_primary as title, description as work_type, contributors, publications.name as pubname, publications.id as pubid, publication_date_year as year, works.updated_at, works.created_at FROM works JOIN publications ON publications.id = works.publication_id JOIN work_types USING (type), JSONB_TO_RECORDSET(works.contributors) AS w(person_id int) LEFT JOIN people p ON person_id = p.id LEFT JOIN memberships m on p.id = m.people_id JOIN groups g on m.group_id = g.id WHERE g.hidden = false AND g.id = $1 ORDER BY works.created_at DESC, works.id DESC LIMIT $2", [dept_id, limit], function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.feed_detail = results;
    return next();
  });
}

function getGroupName(req, res, next) {
  var dept_id = req.params.id;

  db.run("SELECT name FROM groups WHERE id = $1", [dept_id], function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.group_name = results[0].name;
    return next();
  })
}

function renderRssFeed(req, res) {
  res.render('rss', {
    appconf: nconf.get(),
    title: nconf.get('customtext:appname') + ": " + req.group_name,
    feed_link: req.protocol + '://' + req.get('host') + req.originalUrl,
    feed_detail: req.feed_detail
  });
}

router.get('/', getDeptList, getDeptMembersCount, getLetterPagerCounts, renderDeptList);
router.get('/:id', getDeptDetail, getDeptPeople, getDeptWorksCount, getDeptWorksList, getWorksImages, renderDeptDetail);
router.get('/:id/rss', getRssResults, getGroupName, renderRssFeed);

module.exports = router;
