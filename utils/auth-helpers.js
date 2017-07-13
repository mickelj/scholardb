const express = require('express');
const app = express();
const bcrypt = require('bcryptjs');
const db = app.get('db');

function comparePass(userPassword, dbPassword) {
  return bcrypt.compareSync(userPassword, dbPassword);
}

function loginRequired(req, res, next) {
  if (!req.user) return res.status(401).json({status: 'Please log in'});
  return next();
}

function adminRequired(req, res, next) {
  if (!req.user) return res.status(401).json({status: 'Please log in'});

  return db.people.findOne({email: req.user.username}, function (err, user) {
    if (err) res.status(500).json({status: 'Uh oh, Spaghettios!'});
    if (!user.admin) {
      res.status(401).json({status: 'You are not authorized.'});
      return next();
    }
  });
}

function loginRedirect(req, res, next) {
  if (req.user) return res.status(401).json({status: 'You are already logged in.'});
  return next();
}

module.exports = {
  comparePass,
  loginRequired,
  adminRequired,
  loginRedirect
};
