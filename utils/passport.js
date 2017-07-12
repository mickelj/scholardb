const express = require('express');
const passport = require('passport');
const db = app.get('db');

module.export = () => {
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    db.people.findOne(id, function(err, user) {
      if (err) done(err, null);

      done(null, user);
    })
  })
}
