/**
 * index route file of route platform.
 * @description: exports all routes of route platform.
 */
const express =  require('express');
const router =  express.Router();
router.use('/api/v1/production-product',require('./productionProduct'));
module.exports = router;
