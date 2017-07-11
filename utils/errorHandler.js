const express = require('express');
const app = express();

module.exports.logErrors = function(err, req, res, next) {
  console.error(err.stack);
  next(err);
};

module.exports.clientErrorHandler = function(err, req, res, next) {
  if (req.xhr) {
    res.status(500).send({ error: 'Error occurred'});
  } else {
    next(err);
  }
};

module.exports.errorHandler = function(err, req, res, next) {
  res.status(500);
  res.render('error', {error: err});
};
