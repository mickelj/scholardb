const express = require('express');
const _ = require('underscore');
const router = express.Router();

function getDeptList(req, res, next) {
  var db = req.app.get('db');
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
  var db = req.app.get('db');
  var page = req.query.page ? req.query.page : "A";

  db.run("SELECT g.id as group_id, count(p.id) as cnt FROM people p LEFT JOIN LATERAL (select id, name, sort_name from groups where hidden = false AND groups.id = ANY(p.group_membership) order by sort_name) g ON TRUE WHERE g.name <> '' and g.sort_name LIKE $1 GROUP BY g.id, g.sort_name ORDER BY g.sort_name", [(page + "%").toLowerCase()], function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.members = results;
    return next();
  });
}

function getLetterPagerCounts (req, res, next) {
  var db = req.app.get('db');

  db.run("SELECT UPPER(LEFT(sort_name, 1)) as first_letter, count(*) FROM groups WHERE hidden = false GROUP BY first_letter ORDER BY first_letter", function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.letter_list = results;
    return next();
  });
}

function renderDeptList(req, res) {
  var nconf = req.app.get('nconf');
  var cur_letter = req.query.page ? req.query.page : "A";

  var combDepts = _.map(req.dept_list, function(dept) {
    return _.extend(dept, _.omit(_.findWhere(req.members, {group_id: dept.group_id}), 'group_id'));
  });

  res.render('departments', {
    appconf: nconf.get('application'),
    title: nconf.get('application:appname') + " - Departments",
    dept_list: combDepts,
    cur_letter: cur_letter,
    letter_list: req.letter_list,
    cur_list: req.baseUrl
  });
}

function getDeptDetail (req, res, next) {
  var db = req.app.get('db');
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
  var db = req.app.get('db');
  var dept_id = req.params.id;

  db.run("SELECT person_id, first_name, last_name, lower(left(email, strpos(email, '@') - 1)) as image, count(works.id) FROM works, jsonb_to_recordset(works.contributors) AS w(person_id int) LEFT JOIN people p ON p.id = person_id LEFT JOIN LATERAL (select id, name, sort_name from groups where hidden = false AND groups.id = ANY(p.group_membership) order by sort_name) g ON TRUE WHERE g.id = $1 AND active = true GROUP BY person_id, first_name, last_name, email ORDER BY last_name, first_name", [dept_id], function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.dept_people = results;
    return next();
  });
}

function getDeptWorksCount(req, res, next) {
  var db = req.app.get('db');
  var dept_id = req.params.id;

  db.run("SELECT count(*) as total_works FROM works, JSONB_TO_RECORDSET(works.contributors) AS w(person_id int) LEFT JOIN people p ON person_id = p.id LEFT JOIN LATERAL (select id, name, sort_name from groups where hidden = false AND groups.id = ANY(p.group_membership)) g ON TRUE WHERE g.id = $1", [dept_id], function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.total_works = results[0].total_works;
    return next();
  });
}

function getDeptWorksList (req, res, next) {
  var db = req.app.get('db');
  var dept_id = req.params.id;
  var limit = req.query.limit ? req.query.limit : 10;
  var offset = req.query.page ? (req.query.page - 1) * limit : 0;

  db.run("SELECT works.id, title_primary as work_title, description as work_type, contributors, publications.name as publication, publications.authority_id as pubid, publication_date_year as year FROM works JOIN publications ON publications.authority_id = works.publication_id JOIN work_types USING (type), JSONB_TO_RECORDSET(works.contributors) AS w(person_id int) LEFT JOIN people p ON person_id = p.id LEFT JOIN LATERAL (select id, name, sort_name from groups where hidden = false AND groups.id = ANY(p.group_membership)) g ON TRUE WHERE g.id = $1 ORDER BY publication_date_year DESC, works.id DESC LIMIT $2 OFFSET $3", [dept_id, limit, offset], function(err, results) {
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

function renderDeptDetail(req, res) {
  var nconf = req.app.get('nconf');
  var limit = req.query.limit ? req.query.limit : 10;
  var page_count = Math.ceil(req.total_works / limit);
  var cur_page = req.query.page ? req.query.page : 1;
  var offset = (cur_page - 1) * limit;

  res.render('dept_detail', {
    appconf: nconf.get('application'),
    title: nconf.get('application:appname') + " - Department: " + req.dept_detail.group_name,
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

router.get('/', getDeptList, getDeptMembersCount, getLetterPagerCounts, renderDeptList);
router.get('/:id', getDeptDetail, getDeptPeople, getDeptWorksCount, getDeptWorksList, renderDeptDetail);

module.exports = router;
