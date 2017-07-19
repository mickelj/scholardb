const express = require('express');
const router = express.Router();
const authHelpers = require('../utils/auth-helpers');
const db = require('../utils/db');
const gn = require('../utils/genNames');

function getPenNames(req, res, next) {
  db.run("SELECT display_name as penname FROM pennames WHERE people_id = $1 ORDER BY machine_name", [req.user.id], function(err, results) {
    if (err) return next(err);

    req.pennames = results;
    return next();
  });
}

function savePenNames(req, res) {
  req.session.flash = [];

  if (!req.body.penname) {
    req.flash('error', 'Pen name was empty');
    res.redirect('/user/penname');
  }

  db.pennames.insert({people_id: req.user.id, display_name: req.body.penname, machine_name: gn.genMachineName(req.body.penname)}, (err, results) => {
    if (err) {
      req.flash('error', 'Error adding pen name to database');
      res.redirect('/user/penname');
    }
    req.flash('success', 'Pen name added successfully');
    res.redirect('/user/penname');
  })
}

router.get('/', authHelpers.loginRequired, (req, res, next) => {
  var nconf = req.app.get('nconf');

  res.render('user', {
    appconf: nconf.get(),
    user: req.user
  });
});

router.get('/penname', authHelpers.loginRequired, getPenNames, (req, res, next) => {
  var nconf = req.app.get('nconf');

  res.render('user', {
    appconf: nconf.get(),
    user: req.user,
    page: 'pennames',
    pennames: req.pennames,
    error: req.flash('error'),
    success: req.flash('success')
  });
});

router.post('/penname', authHelpers.loginRequired, savePenNames);

module.exports = router;
