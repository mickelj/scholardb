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

function checkPenName(req, res, next) {
  req.pn = req.body.last_name + ", " + req.body.first_name + (req.body.middle_name ? " " + req.body.middle_name : "");
  req.mn = gn.genMachineName(pn);

  db.run("SELECT id FROM pennames WHERE machine_name ILIKE $1", ['%' + mn + '%'], (err, results) => {
    if (err) return next(err);
    if (results.length) {
      req.dberr = 'Pen name is already in database.';
      return next();
    }
    return next();
  })
}

function savePenName(req, res) {
  req.session.flash = [];

  if (req.dberr) {
    req.flash('error', req.dberr);
    res.redirect('/user/penname');
  }

  if (!req.pn) {
    req.flash('error', 'Pen name was empty');
    res.redirect('/user/penname');
  }

  db.pennames.insert({people_id: req.user.id, display_name: req.body.penname, machine_name: gn.genMachineName(req.body.penname)}, (err, results) => {
    if (err) {
      req.flash('error', 'Error adding pen name to database: ' + err);
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

router.post('/penname', authHelpers.loginRequired, checkPenName, savePenName);

module.exports = router;
