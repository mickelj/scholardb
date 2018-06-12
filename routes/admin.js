const express = require('express');
const router = express.Router();
const authHelpers = require('../utils/auth-helpers');
const db = require('../utils/db');

router.get('/', authHelpers.loginRequired, authHelpers.adminRequired, (req, res) => {
  var nconf = req.app.get('nconf');
  
  res.render('admin', {
    appconf: nconf.get(),
    user: req.user
  });
});

module.exports = router;
