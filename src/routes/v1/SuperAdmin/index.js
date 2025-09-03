/**
 * index route file of admin platform.
 * @description: exports all routes of admin platform.
 */
const express =  require('express');
const router =  express.Router();
router.use('/api/v1/super-admin/auth',require('./auth'));
router.use('/api/v1/super-admin/dashboard',require('./dashboard'));
module.exports = router;
