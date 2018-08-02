const express = require('express');
const _ = require('underscore');
const router = express.Router();
const request = require('request');
const db = require('../utils/db');

/* FOR OLD WORKS TABLE
function getRandomScholars(req, res, next) {
  db.run("SELECT person_id, first_name, last_name, image_url as image, user_type, count(works.id) FROM works, jsonb_to_recordset(works.contributors) AS w(person_id int) LEFT JOIN people p ON p.id = person_id WHERE active = true GROUP BY person_id, first_name, last_name, email, image_url, user_type HAVING count(works.id) > 2 ORDER BY random() LIMIT 12", function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.scholars = results;
    return next();
  });
} */

function getRandomScholars(req, res, next) {
  db.run("SELECT person_id, first_name, last_name, image_url as image, user_type, count(works_new.work_id) FROM works_new, unnest(works_new.work_contributors) person_id LEFT JOIN people p ON p.id = person_id WHERE active = true GROUP BY person_id, first_name, last_name, email, image_url, user_type HAVING count(works_new.work_id) > 2 ORDER BY random() LIMIT 12", function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.scholars = results;
    return next();
  });
}

/* FOR OLD WORKS TABLE
function getRecentWorks(req, res, next) {
  db.run("SELECT works.id, description as work_type, title_primary as work_title, title_secondary, title_tertiary, contributors, publication_date_year as year, name as publication, publications.id as pubid, identifier, volume, issue, start_page, end_page FROM works JOIN publications ON publications.id = works.publication_id JOIN work_types USING (type) ORDER BY works.id DESC LIMIT 3;", function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.works = results;
    next();
  });
} */

function getRecentWorks(req, res, next) {
  db.run("SELECT works_new.work_id, work_types.description as work_type, works_new.work_data, works_new.work_contributors, works_new.work_publication, works_new.archive_url FROM works_new JOIN publications ON publications.id = works_new.work_publication JOIN work_types ON work_types.type = works_new.work_data->>'type' ORDER BY works_new.created_at DESC LIMIT 3;", function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.works = results;
    next();
  });
}

/* FOR OLD WORKS TABLE
function getWorksImages (req, res, next) {
  var nconf = req.app.get('nconf');
  var idents = _.map(req.works, function(work) {
    return work.identifier ? work.identifier.replace(/-/g, '') : 'null';
  });

  request.get(nconf.get('images:covimgsrv') + idents.join(','), function(err, res, body) {
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
} */

function getWorksImages (req, res, next) {
  var nconf = req.app.get('nconf');
  var idents = _.map(req.works, function(work) {
    return work.work_data.ISBN ? work.work_data.ISBN.replace(/-/g, '') : 'null';
  });

  request.get(nconf.get('images:covimgsrv') + idents.join(','), function(err, res, body) {
    if (err) {
      return next(err);
    }

    imgobj = JSON.parse(body);

    _.map(req.works, function(work) {
      var wi = (work.work_data.ISBN ? work.work_data.ISBN.replace(/-/g, '') : null);
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
    appconf: nconf.get(),
    title: nconf.get('customtext:appname') + " - Home",
    index: true,
    user: req.user
  });
}

router.get('/', getRandomScholars, getRecentWorks, getWorksImages, renderHomePage);

module.exports = router;
