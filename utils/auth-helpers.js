const express = require('express');
const app = express();
const bcrypt = require('bcryptjs');
const db = require('./db');

function comparePass(userPassword, dbPassword) {
  return bcrypt.compareSync(userPassword, dbPassword);
}

function loginRequired(req, res, next) {
  if (!req.user) {
    req.flash('error', 'Login is required to access the previous page.');
    return res.redirect('/auth/login');
  }
  return next();
}

function adminRequired(req, res, next) {
  return db.people.findOne({email: req.user.email}, function (err, user) {
    if (err) {
      req.flash('error', 'A database error occurred.  Please try again later.');
      return res.redirect('/');
    }
    if (!req.user.admin) {
      req.flash('error', 'Sorry, you are not an authorized administrator.');
      return res.redirect('/');
    }
    return next();
  });
}

function loginRedirect(req, res, next) {
  if (req.user) {
    req.flash('error', 'You are already logged in.');
    return res.redirect('/user');
  }
  return next();
}

module.exports = {
  comparePass,
  loginRequired,
  adminRequired,
  loginRedirect
};
