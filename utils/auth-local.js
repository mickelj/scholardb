const express = require('express');
const app = express();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const authHelpers = require('./auth-helpers');
const db = require('./db');
const options = {};

passport.serializeUser((user, done) => {
  done(null, {'id' : user.id, 'admin' : user.admin});
});

passport.deserializeUser((id, done) => {
  db.run("SELECT * FROM people WHERE id = $1", [id], function(err, results) {
    if (err) done(err, null);
    done(null, results[0]);
  });
});

passport.use(new LocalStrategy(options, (username, password, done) => {
  //check to see if the username exists
  db.run("SELECT * FROM people WHERE email = $1 AND password IS NOT NULL AND password <> ''", [username], function(err, results) {
    var user = results[0];
    if (err) return done(err);
    if (!results.length) return done(null, false, {message: 'User account not found'});
    if (!authHelpers.comparePass(password, user.password)) {
      return done(null, false, {message: 'Incorrect password'});
    } else {
      return done(null, user);
    }
  });
}));

module.exports = passport;
