const express = require('express');
const app = express();

module.exports = {
  logErrors: function(err, req, res, next) {
    console.error(err.stack);
    next(err);
  },

  clientErrorHandler: function(err, req, res, next) {
    if (req.xhr) {
      res.status(500).send({ error: 'Error occurred'});
    } else {
      next(err);
    }
  },

  errorHandler: function(err, req, res, next) {
    res.status(500);
    res.render('error', {error: err});
  }
}
