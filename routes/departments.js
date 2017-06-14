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
    title: nconf.get('application:appname') + " - Departments",
    tagline: nconf.get('application:tagline'),
    logo: nconf.get('application:logo'),
    appname: nconf.get('application:appname'),
    defimgext: nconf.get('application:defimgext'),
    imgrootdir: nconf.get('application:imgrootdir'),
    organization: nconf.get('application:organization'),
    searchdeftext: nconf.get('application:searchdeftext'),
    dept_list: combDepts,
    cur_letter: cur_letter,
    letter_list: req.letter_list,
    cur_list: req.baseUrl
  });

}

router.get('/', getDeptList, getDeptMembersCount, getLetterPagerCounts, renderDeptList);
//router.get('/:id', getDeptDetail, renderDeptDetail);

module.exports = router;
