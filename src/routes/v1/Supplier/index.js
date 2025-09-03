/**
 * index route file of supplier platform.
 * @description: exports all routes of supplier platform.
 */
const express =  require('express');
const router =  express.Router();
router.use('/api/v1/supplier',require('./supplier'));
module.exports = router;
