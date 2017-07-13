const express = require('express');
const router = express.Router();
const authHelpers = require('../utils/auth-helpers');

router.get('/', authHelpers.loginRequired, (req, res, next) => {
  res.render('user', {
    user: req.user
  });
});

module.exports = router;
