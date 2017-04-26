const express = require('express');
const router = express.Router();

var Routes = function(app) {
  const db = app.get('db');

  app.get('/', function(req, res, next) {
    db.run("SELECT last_name, count(works.id) FROM works, jsonb_to_recordset(works.contributors) AS w(person_id int) LEFT JOIN people p ON p.id = person_id GROUP BY last_name HAVING count(works.id) > 2 ORDER BY random() LIMIT 16", function(err, results) {
      console.log(results);
      res.render('index', {title: "ScholarsDB - Home", message: "Welcome to ScholarsDB!"});
    });
  });
}

module.exports = Routes;
