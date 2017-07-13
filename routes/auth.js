const express = require('express');
const router = express.Router();
const authHelpers = require('../utils/auth-helpers');
const passport = require('../utils/auth-local');

router.get('/login', authHelpers.loginRedirect, (req, res) => {
  console.log("Flash: " + req.flash('error'));
  res.render('auth/login', {
    appconf: req.app.get('nconf').get(),
    error: req.flash('error')
  });
});

router.post('/login', authHelpers.loginRedirect, (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.redirect('/auth/login');
    req.login(user, (err) => {
      if (err) return next(err);
      req.session.save( (err) => {
        if (err) return next(err);
        res.redirect('/user');
      });
    });
  })(req, res, next);
});

router.get('/logout', authHelpers.loginRequired, (req, res) => {
  req.logout();
  req.session.save( (err) => {
    if (err) return err;
    res.redirect('/');
  });
});

module.exports = router;
