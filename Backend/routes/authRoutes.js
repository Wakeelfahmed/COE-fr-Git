const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/sync-firebase-user', authController.syncFirebaseUser);
router.get('/check', authController.checkAuth);
router.get('/profile', auth, authController.getProfile);
router.get('/accounts', auth, authController.getAllAccounts);
router.get('/account-report/:accountId', auth, authController.generateAccountReport);

module.exports = router;