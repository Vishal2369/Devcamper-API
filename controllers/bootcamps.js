const path = require("path");
const geocoder = require('../utils/geocoder')
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middlewares/async');
const Bootcamp = require('../models/Bootcamp');

// @desc       Get all bootcamps
// @route      GET /api/v1/bootcamps
// @access     Public

exports.getBootcamps = asyncHandler(async (req, res, next) => {

    res.status(200).json(res.advanceResults);

});

// @desc       Get one specific bootcamp
// @route      GET /api/v1/bootcamps/:id
// @access     Public

exports.getBootcamp = asyncHandler(async (req, res, next) => {

    const bootcamp = await Bootcamp.findById(req.params.id);
    if (!bootcamp) {
        return next(new ErrorResponse(`Bootcamp is not found with id of ${req.params.id}`, 404));
    }
    res.status(200).json({ success: true, data: bootcamp });
});

// @desc        Create a bootcamp
// @route       POST /api/v1/bootcamps
// @access      Private

exports.createBootcamp = asyncHandler(async (req, res, next) => {

    // Add user to req.body
    req.body.user = req.user.id;

    //Check for published bootcamp
    const publishedBootcamp = await Bootcamp.findOne({ user: req.user.id });

    //If user is not an admin, they can only add one bootcamp
    if (publishedBootcamp && req.user.role !== 'admin') {
        return next(new ErrorResponse(`The user with id ${req.user.id} has already published a bootcamp`, 400));
    }

    const bootcamp = await Bootcamp.create(req.body);
    res.status(201).json({ success: true, data: bootcamp });

});

// @desc        Update  a bootcamp
// @route       PUT /api/v1/bootcamps/:id
// @access      Private

exports.updateBootcamp = asyncHandler(async (req, res, next) => {

    let bootcamp = await Bootcamp.findById(req.params.id);

    if (!bootcamp) {
        return next(new ErrorResponse(`Bootcamp is not found with id of ${req.params.id}`, 404));
    }

    // Make sure user is bootcamp owner
    if (req.user.id != bootcamp.user.toString() && req.user.role != 'admin') {
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this bootcamp`, 401));

    }
    bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({ success: true, data: bootcamp })
});

// @desc        Delete a bootcamp
// @route       DELETE /api/v1/bootcamps/:id
// @access      Private

exports.deleteBootcamp = asyncHandler(async (req, res, next) => {

    const bootcamp = await Bootcamp.findById(req.params.id);
    if (!bootcamp) {
        return next(new ErrorResponse(`Bootcamp is not found with id of ${req.params.id}`, 404));
    }

    // Make sure user is bootcamp owner
    if (req.user.id != bootcamp.user.toString() && req.user.role != 'admin') {
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete this bootcamp`, 401));
    }

    bootcamp.remove();
    res.status(200).json({ success: true, data: {} })

});

// @desc        Get Bootcamps within a radius
// @route       GET /api/v1/bootcamps/radius/:zipcode/:distance
// @access      Private

exports.getBootcampsInRadius = asyncHandler(async (req, res, next) => {

    const { zipcode, distance } = req.params;

    //Get lat/lon from geocoder
    const loc = await geocoder.geocode(zipcode);
    const lat = loc[0].latitude;
    const lon = loc[0].longitude;

    //Calc radius using Radian
    //Divide dist by radius of Earth
    //Earth Radius = 6378 km
    const radius = distance / 3963;

    const bootcamps = await Bootcamp.find({
        location: { $geoWithin: { $centerSphere: [[lon, lat], radius] } }
    });
    res.status(200).json({
        success: true,
        count: bootcamps.length,
        data: bootcamps
    })
});

// @desc        Upload photo for bootcamp
// @route       PUT /api/v1/bootcamps/:id/photo
// @access      Private

exports.uploadPhoto = asyncHandler(async (req, res, next) => {

    const bootcamp = await Bootcamp.findById(req.params.id);
    if (!bootcamp) {
        return next(new ErrorResponse(`Bootcamp is not found with id of ${req.params.id}`, 404));
    }

    // Make sure user is bootcamp owner
    if (req.user.id != bootcamp.user.toString() && req.user.role != 'admin') {
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this bootcamp`, 401));
    }


    if (!req.files) {
        return next(new ErrorResponse(`Please upload a photo`, 404));
    }
    const file = req.files.file;
    //Checking if uploaded file is image or not

    if (!file.mimetype.startsWith('image')) {
        return next(new ErrorResponse(`Please upload a Image file`, 400));
    }

    if (file.size > process.env.MAX_PHOTO_SIZE) {
        return next(new ErrorResponse(`Please upload a Image having size less than 1 Mb`, 400));
    }

    //Create custom image name
    file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`;

    file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async err => {
        if (err) {
            return next(new ErrorResponse(`Network Error`, 500));
        }
        await Bootcamp.findByIdAndUpdate(req.params.id, { photo: file.name });
        res.status(200).json({ success: true, data: file.name });
    })
});  
