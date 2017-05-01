const express = require('express');
const router = express.Router();

function getRandomScholars(req, res, next) {
  var db = req.app.get('db');
  db.run("SELECT last_name, lower(left(email, strpos(email, '@') - 1)) as image, count(works.id) FROM works, jsonb_to_recordset(works.contributors) AS w(person_id int) LEFT JOIN people p ON p.id = person_id GROUP BY last_name, email HAVING count(works.id) > 2 ORDER BY random() LIMIT 18", function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.scholars = results;
    return next();
  });
}

function getRecentWorks(req, res, next) {
  var db = req.app.get('db');
  db.run("SELECT works.id, type, title_primary, contributors, publication_date_year, name FROM works JOIN publications ON publications.id = works.publication_id ORDER BY works.updated_at DESC LIMIT 3;", function(err, results) {
    if (err || !results.length) {
      return next(err);
    }

    req.works = results;
    next();
  });
}

function renderHomePage(req, res) {
  var nconf = req.app.get('nconf');
  console.log(req.works);
  res.render('index', {
    people: req.scholars,
    works: req.works,
    title: nconf.get('application:appname') + " - Home",
    message: "Welcome to ScholarsDB!",
    tagline: nconf.get('application:tagline'),
    logo: nconf.get('application:logo'),
    appname: nconf.get('application:appname'),
    sampling: "A Sample of " + nconf.get('application:orgshortname') + " Scholars",
    defimgext: nconf.get('application:defimgext'),
    imgrootdir: nconf.get('application:imgrootdir'),
    organization: nconf.get('application:organization')
  });
}

router.get('/', getRandomScholars, getRecentWorks, renderHomePage);

module.exports = router;
