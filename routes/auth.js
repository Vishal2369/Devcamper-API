const express = require('express');
const {
    register,
    login,
    getMe,
    forgotPassword,
    resetPassword,
    updateDetails,
    updatePassword,
    logout
} = require('../controllers/auth');

const router = express.Router();

const { protect } = require('../middlewares/auth');

router.route('/register').post(register);

router.route('/login').post(login);

router.route('/logout').get(logout);

router.route('/me').get(protect, getMe);

router.route('/updateDetails').put(protect, updateDetails);

router.route('/updatePassword').put(protect, updatePassword);

router.route('/forgotPassword').post(forgotPassword);

router.route('/resetPassword/:resetToken').put(resetPassword);

module.exports = router;