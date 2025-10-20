const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
// const auth = require('../middleware/auth');

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/check', authController.checkAuth);
router.get('/profile', authController.getProfile);
router.get('/accounts', authController.getAllAccounts);
router.post('/reports/account', authController.generateAccountReport);

module.exports = router;