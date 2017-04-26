const express = require('express');
const router = express.Router();

router.get('/', function(req, res, next) {
  var db = req.app.get('db');
  var nconf = req.app.get('nconf');
  db.run("SELECT last_name, lower(left(email, strpos(email, '@') - 1)) as image, count(works.id) FROM works, jsonb_to_recordset(works.contributors) AS w(person_id int) LEFT JOIN people p ON p.id = person_id GROUP BY last_name, email HAVING count(works.id) > 2 ORDER BY random() LIMIT 18", function(err, results) {
    res.render('index', {
      title: nconf.get('application:appname') + " - Home",
      message: "Welcome to ScholarsDB!",
      tagline: nconf.get('application:tagline'),
      people: results,
      logo: nconf.get('application:logo'),
      appname: nconf.get('application:appname'),
      sampling: "A Sample of " + nconf.get('application:orgshortname') + " Scholars",
      defimgext: nconf.get('application:defimgext'),
      imgrootdir: nconf.get('application:imgrootdir')
    });
  });
});

module.exports = router;
