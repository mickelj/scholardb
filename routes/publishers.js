const express = require('express');
const _ = require('underscore');
const router = express.Router();

function getPublisherList (req, res, next) {
  var db = req.app.get('db');
  var page = req.query.page ? req.query.page : "A";

  db.run("SELECT id, name, url FROM publishers WHERE sort_name LIKE $1 ORDER BY sort_name", [page.toLowerCase() + "%"], function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.publisher_list = results;
    return next();
  });
}

function getPublisherWorkCount (req, res, next) {
  var db = req.app.get('db');
  var page = req.query.page ? req.query.page : "A";

  db.run("SELECT pub.id, COUNT(works.id) as cnt FROM works LEFT JOIN publications j ON works.publication_id = j.id LEFT JOIN publishers pub ON j.publisher_id = pub.id WHERE pub.sort_name LIKE $1 GROUP BY pub.id ORDER BY pub.sort_name", [page.toLowerCase() + "%"], function (err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.publisher_work_count = results;
    return next();
  });
}

function getLetterPagerCounts (req, res, next) {
  var db = req.app.get('db');

  db.run("SELECT DISTINCT ON (first_letter) UPPER(LEFT(sort_name, 1)) as first_letter, count(*) FROM publishers GROUP BY first_letter ORDER BY first_letter", function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.letter_list = results;
    return next();
  });
}

function renderPublisherList(req, res) {
  var nconf = req.app.get('nconf');
  var cur_letter = req.query.page ? req.query.page : "A";

  var combPublishers = _.map(req.publisher_list, function(publisher) {
    return _.extend(publisher, _.omit(_.findWhere(req.publisher_work_count, {id: publisher.id}), 'id'));
  });

  res.render('publishers', {
    appconf: nconf.get('application'),
    title: nconf.get('application:appname') + " - Publishers",
    publisher_list: combPublishers,
    cur_letter: cur_letter,
    letter_list: req.letter_list,
    cur_list: req.baseUrl
  });
}

router.get('/', getPublisherList, getPublisherWorkCount, getLetterPagerCounts, renderPublisherList);

module.exports = router;
