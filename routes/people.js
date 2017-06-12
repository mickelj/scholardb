const express = require('express');
const _ = require('underscore');
const router = express.Router();

function getPeopleList(req, res, next) {
  var db = req.app.get('db');
  var page = req.query.page ? req.query.page : "A";

  db.run("SELECT p.id as person_id, first_name, last_name, lower(left(email, strpos(email, '@') - 1)) as image, jsonb_agg(g) as memberships FROM people p, (select id, name, sort_name from groups where hidden = false) g JOIN UNNEST(p.group_membership) AS group_id ON group_id = g.id WHERE last_name LIKE $1 AND p.active = true GROUP BY p.id, first_name, last_name, image_url ORDER BY last_name, first_name", [page + "%"], function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.people_list = results;
    return next();
  });
}

function getPeopleWorkCount (req, res, next) {
  var db = req.app.get('db');
  var page = req.query.page ? req.query.page : "A";

  db.run("SELECT person_id, UPPER(LEFT(last_name, 1)) as first_letter, COUNT(works.id) AS cnt FROM works, JSONB_TO_RECORDSET(works.contributors) AS w(person_id int) JOIN people p on p.id = person_id WHERE p.last_name LIKE $1 and p.active = true GROUP BY person_id, first_letter", [page + "%"], function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.people_works = results;
    var letter_counts = _.countBy(results, function(row) {
        return row.first_letter;
    });

    console.log(letter_counts);
    return next();
  });
}

function getLetterList(req, res, next) {
  var db = req.app.get('db');

  db.run("SELECT UPPER(LEFT(last_name, 1)) as first_letter, COUNT(*) FROM people GROUP BY first_letter ORDER BY first_letter", function(err, results) {
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
    title: nconf.get('application:appname') + " - People",
    tagline: nconf.get('application:tagline'),
    logo: nconf.get('application:logo'),
    appname: nconf.get('application:appname'),
    defimgext: nconf.get('application:defimgext'),
    imgrootdir: nconf.get('application:imgrootdir'),
    organization: nconf.get('application:organization'),
    searchdeftext: nconf.get('application:searchdeftext'),
    people_list: combPeople,
    cur_letter: cur_letter,
    letter_list: req.letter_list,
    cur_list: req.baseUrl
  });
}

router.get('/', getPeopleList, getPeopleWorkCount, getLetterList, renderPeopleList);

module.exports = router;
