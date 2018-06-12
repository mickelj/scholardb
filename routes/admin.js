const express = require('express');
const router = express.Router();
const authHelpers = require('../utils/auth-helpers');
const db = require('../utils/db');

router.get('/', authHelpers.adminRequired, (req, res, next) => {
  res.render('admin');
});

module.exports = router;
