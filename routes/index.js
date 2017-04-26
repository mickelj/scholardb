var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  var db = req.app.get('db');
  db.run("SELECT last_name, left(email, strpos(email, '@') - 1) as image, count(works.id) FROM works, jsonb_to_recordset(works.contributors) AS w(person_id int) LEFT JOIN people p ON p.id = person_id GROUP BY last_name HAVING count(works.id) > 2 ORDER BY random() LIMIT 18", function(err, results) {
    console.log(results);
    res.render('index', {title: "ScholarsDB - Home", message: "Welcome to ScholarsDB!", people: results});
  });
});

module.exports = router;
