const express = require('express');
const app = express();
const passport = require('passport');
const WindowsStrategy = require('passport-windowsauth');
const authHelpers = require('./auth-helpers');
const db = require('./db');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  db.run("SELECT * FROM people WHERE id = $1", [id], function(err, results) {
    if (err) done(err, null);
    done(null, results[0]);
  });
});

passport.use(new WindowsStrategy({
    ldap: {
      url:             process.env.LDAP_URL,
      base:            process.env.LDAP_BASE,
      bindDN:          process.env.LDAP_BIND_USER,
      bindCredentials: process.env.LDAP_BIND_PWD
    },
    integrated:      false
  }, 
  function(profile, done){
    console.log(profile);
    if (!profile) return done("Sorry, login failed", profile);
    db.run("SELECT * FROM people WHERE email = $1", [profile._json.mail], function(err, results) {
      var user = results[0];
      if (err) return done(err);
      if (!results.length) return done(null, false, {message: 'User account not found'});
      if (!authHelpers.comparePass(password, user.password)) {
        return done(null, false, {message: 'Incorrect password'});
      } else {
        return done(null, user);
      }
    });
  }
));

module.exports = passport;
