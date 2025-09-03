const express =  require('express');
const router =  express.Router();
router.use('/api/v1/role',require('./role'));
router.use('/api/v1/user-management',require('./user'));
module.exports = router;
