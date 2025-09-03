/**
 * index route file of admin platform.
 * @description: exports all routes of admin platform.
 */
const express =  require('express');
const router =  express.Router();
router.use('/api/v1/auth',require('./auth'));
router.use('/api/v1/admin',require('./admin'));
router.use('/api/v1/admin/dashboard',require('./dashboard'));
module.exports = router;
