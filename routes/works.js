const express = require('express');
const router = express.Router();

function getWorkTypeCount (req, res, next) {
  var db = req.app.get('db');
  db.run("SELECT description AS fld, COUNT(type) AS cnt FROM works JOIN work_types USING (type) GROUP BY description ORDER BY count(description) DESC", function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.filter_worktypes = results;
    return next();
  });
}

function getDeptWorkCount (req, res, next) {
  var db = req.app.get('db');
  db.run("SELECT groups.name AS fld, COUNT(works.id) AS cnt FROM works, JSONB_TO_RECORDSET(works.contributors) AS w(person_id int) LEFT JOIN people p ON p.id = person_id, groups JOIN UNNEST(p.group_membership) AS group_id ON group_id = groups.id WHERE groups.hidden = false GROUP BY groups.name ORDER BY COUNT(works.id) DESC", function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.filter_deptworks = results;
    return next();
  });
}

function getPeopleWorkCount (req, res, next) {
  var db = req.app.get('db');
  db.run("SELECT CONCAT_WS(', ', last_name, first_name) AS fld, COUNT(works.id) AS cnt FROM works, JSONB_TO_RECORDSET(works.contributors) AS w(person_id int) JOIN people p on p.id = person_id GROUP BY fld ORDER BY COUNT(works.id) DESC;", function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.filter_peopleworks = results;
    return next();
  });
}

function getYearWorkCount (req, res, next) {
  var db = req.app.get('db');
  db.run("SELECT publication_date_year AS fld, COUNT(id) AS cnt FROM works GROUP BY publication_date_year ORDER BY publication_date_year DESC", function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.filter_yearworks = results;
    return next();
  });
}

function getPublicationWorkCount (req, res, next) {
  var db = req.app.get('db');
  db.run("SELECT name AS fld, COUNT(works.id) AS cnt FROM works JOIN publications ON publications.id = works.publication_id WHERE name <> 'Unknown' GROUP BY name ORDER BY COUNT(works.id) DESC", function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.filter_publicationworks = results;
    return next();
  });
}

function getPublisherWorkCount (req, res, next) {
  var db = req.app.get('db');
  db.run("SELECT publishers.name, COUNT(works.id) FROM works JOIN publications ON publications.id = works.publication_id JOIN publishers ON publishers.id = publications.publisher_id WHERE publishers.name <> 'Unknown' AND publications.name <> 'Unknown' GROUP BY publishers.name ORDER BY COUNT(works.id) DESC", function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.filter_publisherworks = results;
    return next();
  });
}

function renderWorksList (req, res) {
  var nconf = req.app.get('nconf');
  res.render('works', {
    title: nconf.get('application:appname') + " - Works",
    tagline: nconf.get('application:tagline'),
    logo: nconf.get('application:logo'),
    appname: nconf.get('application:appname'),
    sampling: "A Sample of " + nconf.get('application:orgshortname') + " Scholars",
    defimgext: nconf.get('application:defimgext'),
    imgrootdir: nconf.get('application:imgrootdir'),
    organization: nconf.get('application:organization'),
    searchdeftext: nconf.get('application:searchdeftext'),
    filter_worktypes: req.filter_worktypes,
    filter_deptworks: req.filter_deptworks,
    filter_peopleworks: req.filter_peopleworks,
    filter_publicationworks: req.filter_publicationworks,
    filter_publisherworks: req.filter_publisherworks
  });
}

router.get('/', getWorkTypeCount, getDeptWorkCount, getPeopleWorkCount, getPublicationWorkCount, getPublisherWorkCount, renderWorksList);

module.exports = router;
