/**
 * index route file of admin platform.
 * @description: exports all routes of admin platform.
 */
const express =  require('express');
const router =  express.Router();
router.use('/api/v1/country',require('./country'));
router.use('/api/v1/state',require('./state'));
router.use('/api/v1/city',require('./city'));
module.exports = router;
