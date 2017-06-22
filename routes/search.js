const express = require('express');
const _ = require('underscore');
const router = express.Router();
const request = require('request');

function searchWorks(req, res, next) {
  var db = req.app.get('db');
  var query = req.query.terms ? req.query.terms : null;

  if (query) {
    db.run("SELECT id, title_primary, TS_RANK_CD(full_title_search, query, 32/* rank/(rank+1) */) AS rank FROM works, TO_TSQUERY('''$1''') query WHERE query @@ full_title_search ORDER BY rank DESC", [query], function(err, results) {
      if (err) {
        return next(err);
      }

      if (!results.length) {
        req.works_results = null;
      } else {
        req.works_results = results;
      }

      return next();
    });
  } else {
    req.works_results = null;
    return next();
  }
}

function searchPeople(req, res, next) {
  var db = req.app.get('db');
  var query = req.query.terms ? req.query.terms : null;

  if (query) {
    db.run("SELECT id, last_name, first_name, middle_name, TS_RANK_CD(full_name_search, query, 32/* rank/(rank+1) */) AS rank FROM people, TO_TSQUERY('''$1''') query WHERE query @@ full_title_search ORDER BY rank DESC", [query], function(err, results) {
      if (err) {
        return next(err);
      }

      if (!results.length) {
        req.people_results = null;
      } else {
        req.people_results = results;
      }

      return next();
    });
  } else {
    req.people_results = null;
    return next();
  }
}

function searchDepts(req, res, next) {
  var db = req.app.get('db');
  var query = req.query.terms ? req.query.terms : null;

  if (query) {
    db.run("SELECT id, name, TS_RANK_CD(to_tsvector('english', name), query, 32/* rank/(rank+1) */) AS rank FROM groups, TO_TSQUERY('''$1''') query WHERE query @@ to_tsvector('english', name) ORDER BY rank DESC", [query], function(err, results) {
      if (err) {
        return next(err);
      }

      if (!results.length) {
        req.dept_results = null;
      } else {
        req.dept_results = results;
      }

      return next();
    });
  } else {
    req.dept_results = null;
    return next();
  }
}

function searchPublications(req, res, next) {
  var db = req.app.get('db');
  var query = req.query.terms ? req.query.terms : null;

  if (query) {
    db.run("SELECT id, name, TS_RANK_CD(to_tsvector('english', name), query, 32/* rank/(rank+1) */) AS rank FROM publications, TO_TSQUERY('''$1''') query WHERE query @@ to_tsvector('english', name) ORDER BY rank DESC", [query], function(err, results) {
      if (err) {
        return next(err);
      }

      if (!results.length) {
        req.publication_results = null;
      } else {
        req.publication_results = results;
      }

      return next();
    });
  } else {
    req.publication_results = null;
    return next();
  }
}

function searchPublishers(req, res, next) {
  var db = req.app.get('db');
  var query = req.query.terms ? req.query.terms : null;

  if (query) {
    db.run("SELECT id, name, TS_RANK_CD(to_tsvector('english', name), query, 32/* rank/(rank+1) */) AS rank FROM publishers, TO_TSQUERY('''$1''') query WHERE query @@ to_tsvector('english', name) ORDER BY rank DESC", [query], function(err, results) {
      if (err) {
        return next(err);
      }

      if (!results.length) {
        req.publisher_results = null;
      } else {
        req.publisher_results = results;
      }

      return next();
    });
  } else {
    req.publisher_results = null;
    return next();
  }
}

function renderSearchResults (req, res) {
  var nconf = req.app.get('nconf');
  var query = req.query.terms ? req.query.terms : null;

  res.render('search', {
    appconf: nconf.get('application'),
    title: nconf.get('application:appname') + " - Search" + (query ? " Results for Terms: " + query : ""), 
    terms: query,
    works: req.works_results,
    people: req.people_results,
    depts: req.dept_results,
    publications: req.publication_results,
    publishers: req.publisher_results
  });
}

router.get('/', searchWorks, searchPeople, searchDepts, searchPublications, searchPublishers, renderSearchResults);

module.exports = router;
