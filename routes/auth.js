const express = require('express');
const router = express.Router();
const authHelpers = require('../utils/passport-helpers');
const passport = require('../utils/passport-local');

router.get('/login', (req, res) => {
  console.log("Flash: " + req.flash('error'));
  res.render('auth/login', {
    appconf: req.app.get('nconf').get(),
    error: req.flash('error')
  });
});

router.post('/login', authHelpers.loginRedirect, (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) res.status(500).send('Error in passort local authentication module');
    if (!user) res.redirect('/auth/login');
    if (user) {
      req.logIn(user, function(err) {
        console.log('made it to the login');
        if (err) res.status(500).send('Error logging in');
        req.session.save( (err) => {
          if (err) return next(err);
          res.redirect('/user');
        });
      });
    }
  });
});

router.get('/logout', authHelpers.loginRequired, (req, res, next) => {
  req.logout();
  req.session.save( (err) => {
    if (err) return next(err);
    res.redirect('/');
  });
});

module.exports = router;
