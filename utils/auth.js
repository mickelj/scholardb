const express = require('express');
const app = express();
const passport = require('passport');
const db = app.get('db');

module.exports = () => {
  passport.serializeUser((user, done) => {
    console.log('In serialize');
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    console.log('In deserialize');
    db.run("SELECT * FROM people WHERE id = $1", [id], function(err, results) {
      if (err) done(err, null);
      done(null, results[0]);
    });
  });
}
