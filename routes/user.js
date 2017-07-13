const express = require('express');
const router = express.Router();
const authHelpers = require('../utils/auth-helpers');
const db = require('../utils/db');
const nconf = require('../utils/nconf');

router.get('/', authHelpers.loginRequired, (req, res, next) => {
  res.render('user', {
    appconf: nconf.get(),
    user: req.user
  });
});

module.exports = router;
