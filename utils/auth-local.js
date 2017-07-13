const express = require('express');
const app = express();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const authHelpers = require('./auth-helpers');
const options = {};

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  var db = req.app.get('db');

  db.run("SELECT * FROM people WHERE id = $1", [id], function(err, results) {
    if (err) done(err, null);
    done(null, results[0]);
  });
});

passport.use(new LocalStrategy(options, (username, password, done) => {
  var db = req.app.get('db');
  console.log(db);

  //check to see if the username exists
  db.run('SELECT * FROM people WHERE email = $1', [username], function(err, results) {
    var user = results[0];
    console.log('User: ' + user);
    if (err) return done(err);
    if (!results.length) return done(null, false, {message: 'Username not found'});
    if (!authHelpers.comparePass(password, user.password)) {
      return done(null, false, {message: 'Incorrect password'});
    } else {
      return done(null, user);
    }
  });
}));

module.exports = passport;
