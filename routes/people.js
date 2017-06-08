const express = require('express');
const router = express.Router();

function getPeopleList(req, res, next) {
  var db = req.app.get('db');

  var page = req.query.page ? req.query.page : "A";

  db.run("SELECT p.id as person_id, first_name, last_name, lower(left(email, strpos(email, '@') - 1)) as image, jsonb_agg(g) as memberships, count(w.id) as works_count FROM works w, JSONB_TO_RECORDSET(w.contributors) AS x(person_id int) JOIN people p on p.id = person_id, (select id, name, sort_name from groups where hidden = false) g JOIN UNNEST(p.group_membership) AS group_id ON group_id = g.id WHERE last_name LIKE $1 AND p.active = true GROUP BY p.id, first_name, last_name, image_url ORDER BY last_name, first_name", [page + "%"], function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.people_list = results;
    return next();
  });
}

function renderPeopleList(req, res) {
  var nconf = req.app.get('nconf');
  var cur_page = req.query.page ? req.query.page : "A";

  res.render('people', {
    title: nconf.get('application:appname') + " - People",
    tagline: nconf.get('application:tagline'),
    logo: nconf.get('application:logo'),
    appname: nconf.get('application:appname'),
    defimgext: nconf.get('application:defimgext'),
    imgrootdir: nconf.get('application:imgrootdir'),
    organization: nconf.get('application:organization'),
    searchdeftext: nconf.get('application:searchdeftext'),
    people_list: req.people_list,
    cur_page: cur_page
  });
}

router.get('/', getPeopleList, renderPeopleList);

module.exports = router;
