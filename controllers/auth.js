const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middlewares/async');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

// @desc       Register a user
// @route      POST /api/v1/auth/register
// @access     Public

exports.register = asyncHandler(async (req, res, next) => {
    const { name, email, password, role } = req.body;

    const user = await User.create({ name, email, password, role });

    sendTokenResponse(user, 200, res);

});

// @desc       Login a user
// @route      POST /api/v1/auth/login
// @access     Public

exports.login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new ErrorResponse('Invalid Input', 400));
    }

    //Check User
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        return next(new ErrorResponse('Invalid Credentials', 401));
    }

    //Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
        return next(new ErrorResponse('Invalid Credentials', 401));
    }

    //Create Token
    sendTokenResponse(user, 200, res);
})

// @desc       Log user out / clear cookie
// @route      POST /api/v1/auth/me
// @access     Private

exports.logout = asyncHandler(async (req, res, next) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 1000),
        httpOnly: true
    });
    res.status(200).json({
        success: true,
        data: {}
    })
})

// @desc       Get currently logged in user
// @route      POST /api/v1/auth/me
// @access     Private

exports.getMe = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    res.status(200).json({
        success: true,
        data: user
    })
})

// @desc       Update user details
// @route      PUT /api/v1/auth/updateDetails
// @access     Private

exports.updateDetails = asyncHandler(async (req, res, next) => {
    const fieldsToUpdate = {
        name: req.body.name,
        email: req.body.email
    }
    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        data: user
    })
});

// @desc       Update User Password 
// @route      PUT /api/v1/auth/updatePassword
// @access     Private

exports.updatePassword = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    if (!(await user.matchPassword(req.body.currentPassword))) {
        return next(new ErrorResponse(`Password is incorrect`, 401));
    }

    user.password = req.body.newPassword;
    await user.save();

    sendTokenResponse(user, 200, res)
})

// @desc       Forgot Password 
// @route      POST /api/v1/auth/forgotPassword
// @access     Public

exports.forgotPassword = asyncHandler(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
        return next(new ErrorResponse(`There is no user with that email`, 404));
    }
    // Get reset token
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    // Create reset url
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/resetPassword/${resetToken}`;

    const message = `Reset Your Password \n\n ${resetUrl}`;

    console.log(user.email);

    try {
        await sendEmail({
            email: user.email,
            subject: 'Reset Password',
            message
        });
        res.status(200).json({ success: true, data: 'Email sent' });
    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save({ validateBeforeSave: false });

        console.log(error);

        return next(new ErrorResponse(`Email couldn't be send`, 500));
    }

});

// @desc       Reset Password 
// @route      POST /api/v1/auth/resetPassword/:resetToken
// @access     Private
exports.resetPassword = asyncHandler(async (req, res, next) => {
    // Get hashed token
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.resetToken).digest('hex');

    const user = await User.findOne({ resetPasswordToken, resetPasswordExpire: { $gt: Date.now() } });

    if (!user) {
        return next(new ErrorResponse('Invalid Token', 400));
    }
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    //Create Token
    sendTokenResponse(user, 200, res);
})
///********///
// FUNCTIONS//
///*******///

// Get token from model, create cookie and send response
const sendTokenResponse = function (user, statusCode, res) {
    //Create token
    const token = user.getSignedJwtToken();

    const options = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
        httpOnly: true
    };

    if (process.env.NODE_ENV === 'production') {
        options.secure = true;
    }

    res
        .status(statusCode)
        .cookie('token', token, options)
        .json({ success: true, token });
}

