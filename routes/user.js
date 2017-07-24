const express = require('express');
const router = express.Router();
const authHelpers = require('../utils/auth-helpers');
const db = require('../utils/db');
const gn = require('../utils/genNames');

function getInfo(req, res, next) {
  db.run("SELECT prefix, suffix, phone, office_location FROM people WHERE id = $1", [req.user.id], (err, results) => {
    if (err) return next(err);

    req.info = results[0];
    return next();
  });
}

function saveInfo(req, res, next) {
  db.people.update({id: req.user.id, prefix: req.body.prefix, suffix: req.body.suffix, phone: req.body.phone, office_location: req.body.office}, (err, results) => {
    if (err) {
      req.flash('error', 'Error updating information: ' + err);
      return res.redirect('/user/info');
    }
    req.flash('success', 'Information updated successfully');
    return res.redirect('/user/info');
  });
}

function getPenNames(req, res, next) {
  db.run("SELECT display_name FROM pennames WHERE people_id = $1 ORDER BY machine_name", [req.user.id], (err, results) => {
    if (err) return next(err);

    req.pennames = results;
    return next();
  });
}

function checkPenName(req, res, next) {
  req.pn = req.body.last_name + ", " + req.body.first_name + (req.body.middle_name ? " " + req.body.middle_name : "");
  req.mn = gn.genMachineName(req.pn);

  db.run("SELECT id FROM pennames WHERE people_id = $1 AND machine_name ILIKE $2", [req.user.id, '%' + req.mn + '%'], (err, results) => {
    if (err) return next(err);
    if (results.length) {
      req.dberr = 'Pen name is already in database.';
      return next();
    }
    return next();
  })
}

function savePenName(req, res, next) {
  if (req.dberr) {
    req.flash('error', req.dberr);
    return res.redirect('/user/penname');
  }

  if (!req.pn) {
    req.flash('error', 'Pen name was empty');
    return res.redirect('/user/penname');
  }

  db.pennames.insert({people_id: req.user.id, display_name: req.pn, machine_name: req.mn}, (err, results) => {
    if (err) {
      req.flash('error', 'Error adding pen name to database: ' + err);
      return res.redirect('/user/penname');
    }
    req.flash('success', 'Pen name added successfully');
    return res.redirect('/user/penname');
  });
}

function getAllDepts(req, res, next) {
  db.run("SELECT id, name FROM groups WHERE hidden = false ORDER BY name", (err, results) => {
    if (err) return next(err);
    req.alldepts = results;
    return next();
  });
}

function getDepartments(req, res, next) {
  db.run("SELECT group_id, name FROM memberships JOIN groups ON group_id = id WHERE hidden = false AND people_id = $1 ORDER BY name", [req.user.id], (err, results) => {
    if (err) return next(err);

    req.departments = results;
    return next();
  });
}

function addDepartment(req, res, next) {
  var deptid = req.body.deptid || null;

  if (deptid) {
    db.memberships.insert({group_id: deptid, people_id: req.user.id}, (err, results) => {
      if (err) return res.json({"err": err});
      return res.json({success: true});
    });
  }
}

function deleteDepartment(req, res, next) {
  var deptid = req.body.deptid || null;

  if (deptid) {
    db.memberships.destroy({group_id: deptid, people_id: req.user.id}, (err, results) => {
      if (err) return res.json({"err": err});
      return res.json({success: true});
    });
  }
}

router.get('/', authHelpers.loginRequired, (req, res) => {
  var nconf = req.app.get('nconf');

  res.render('user', {
    appconf: nconf.get(),
    user: req.user
  });
});

router.get('/info', authHelpers.loginRequired, getInfo, (req, res) => {
  var nconf = req.app.get('nconf');

  res.render('user', {
    appconf: nconf.get(),
    user: req.user,
    page: 'info',
    info: req.info,
    error: req.flash('error'),
    success: req.flash('success')
  })
});

router.get('/penname', authHelpers.loginRequired, getPenNames, (req, res) => {
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

router.get('/departments', authHelpers.loginRequired, getAllDepts, getDepartments, (req, res) => {
  var nconf = req.app.get('nconf');

  res.render('user', {
    appconf: nconf.get(),
    user: req.user,
    page: 'departments',
    departments: req.departments,
    alldepts: req.alldepts,
    error: req.flash('error'),
    success: req.flash('success')
  });
});

router.post('/penname', authHelpers.loginRequired, checkPenName, savePenName);
router.post('/info', authHelpers.loginRequired, saveInfo);
router.post('/departments/add', authHelpers.loginRequired, addDepartment);
router.post('/departments/delete', authHelpers.loginRequired, deleteDepartment);

module.exports = router;
