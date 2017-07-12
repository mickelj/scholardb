const express = require('express');
const router = express.Router();
const authHelpers = require('../utils/passport-helpers');
const passport = require('../utils/passport-local');

router.get('/login', (req, res) => {
  res.render('auth/login', {
    appconf: req.app.get('nconf').get(),
    error: req.flash('message')
  });
});

router.post('/login', authHelpers.loginRedirect, passport.authenticate('local', { failureRedirect: '/auth/login', failureFlash: true }), (req, res, next) => {
  req.session.save( (err) => {
    if (err) return next(err);
    res.redirect('/user');
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
