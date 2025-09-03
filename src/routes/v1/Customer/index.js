/**
 * index route file of route platform.
 * @description: exports all routes of route platform.
 */
const express =  require('express');
const router =  express.Router();
router.use('/api/v1/customer',require('./customer'));
router.use('/api/v1/customer',require('./customerAddress'));
router.use('/api/v1/customer-item',require('./customerItem'));
module.exports = router;
