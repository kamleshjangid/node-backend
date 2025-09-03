/**
 * index route file of route platform.
 * @description: exports all routes of route platform.
 */
const express =  require('express');
const router =  express.Router();
router.use(require('./front'));
module.exports = router;
