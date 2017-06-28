const express = require('express');
const _ = require('underscore');
const router = express.Router();
const request = require('request');

function getRandomScholars(req, res, next) {
  var db = req.app.get('db');
  db.run("SELECT person_id, first_name, last_name, lower(left(email, strpos(email, '@') - 1)) as image, user_type, count(works.id) FROM works, jsonb_to_recordset(works.contributors) AS w(person_id int) LEFT JOIN people p ON p.id = person_id WHERE active = true GROUP BY person_id, first_name, last_name, email HAVING count(works.id) > 2 ORDER BY random() LIMIT 18", function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.scholars = results;
    return next();
  });
}

function getRecentWorks(req, res, next) {
  var db = req.app.get('db');
  db.run("SELECT works.id, description as work_type, title_primary as work_title, title_secondary, title_tertiary, contributors, publication_date_year as year, name as publication, publications.id as pubid FROM works JOIN publications ON publications.id = works.publication_id JOIN work_types USING (type) ORDER BY works.updated_at DESC LIMIT 3;", function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.works = results;
    next();
  });
}

function getWorksImages (req, res, next) {
  var nconf = req.app.get('nconf');

  var idents = _.map(req.works, function(work) {
    return work.identifier ? work.identifier.replace(/-/g, '') : 'null';
  });

  request.get(nconf.get('application:ccurlbase') + idents.join(','), function(err, res, body) {
    if (err) {
      return next(err);
    }

    imgobj = JSON.parse(body);

    _.map(req.works, function(work) {
      var wi = (work.identifier ? work.identifier.replace(/-/g, '') : null);
      work.coverimage = (wi in imgobj ? imgobj[wi] : null);
    });

    return next();
  });
}

function renderHomePage(req, res) {
  var nconf = req.app.get('nconf');
  res.render('index', {
    people: req.scholars,
    works_list: req.works,
    appconf: nconf.get('application'),
    title: nconf.get('application:appname') + " - Home",
    index: true
  });
}

router.get('/', getRandomScholars, getRecentWorks, getWorksImages, renderHomePage);

module.exports = router;
