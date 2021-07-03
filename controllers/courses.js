const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middlewares/async');
const Course = require('../models/Courses');
const Bootcamp = require('../models/Bootcamp');

// @desc       Get all courses
// @route      GET /api/v1/courses
// @route      GET /api/v1/bootcamps/:bootcampId/courses
// @access     Public

exports.getCourses = asyncHandler(async (req, res, next) => {
    if (req.params.bootcampId) {
        const courses = await Course.find({ bootcamp: req.params.bootcampId });
        res.status(200).json({ success: true, count: courses.length, data: courses })
    } else {
        res.status(200).json(res.advanceResults);
    }

});


// @desc       Get a single course
// @route      GET /api/v1/courses/:courseId
// @access     Public

exports.getCourseById = asyncHandler(async (req, res, next) => {

    const course = await Course.findById(req.params.courseId).populate({ path: 'bootcamp', select: 'name description' });

    if (!course) {
        return next(new ErrorResponse(`Course not found with id ${req.params.courseId}`), 404);
    }
    res.status(200).json({ success: true, data: course })
});

// @desc       Create a single course
// @route      POST /api/v1/bootcamps/:bootcampId/courses
// @access     Private

exports.createCourse = asyncHandler(async (req, res, next) => {

    req.body.bootcamp = req.params.bootcampId;
    req.body.user = req.userr.id;

    const bootcamp = await Bootcamp.findById(req.params.bootcampId);

    if (!bootcamp) {
        return next(new ErrorResponse(`Bootcamp not found with id ${req.params.bootcampId}`), 404);
    }

    // Make sure User is Owner of Bootcamp
    if (req.user.id != bootcamp.user.toString() && req.user.role != 'admin') {
        return next(new ErrorResponse(`User with user id ${req.user.id} is not authorized to create a course`, 401));
    }

    const course = await Course.create(req.body);

    res.status(200).json({ success: true, data: course })
});


// @desc       Update a course
// @route      POST /api/v1/courses/:courseId
// @access     Private

exports.updateCourse = asyncHandler(async (req, res, next) => {

    let course = await Course.findById(req.params.courseId);

    if (!course) {
        return next(new ErrorResponse(`Bootcamp not found with id ${req.params.courseId}`), 404);
    }

    // Make sure User is Owner of Bootcamp
    if (req.user.id != course.user.toString() && req.user.role != 'admin') {
        return next(new ErrorResponse(`User with user id ${req.user.id} is not authorized to update this course`, 401));
    }

    course = await Course.findByIdAndUpdate(req.params.courseId, req.body, { new: true, runValidators: true });

    res.status(200).json({ success: true, data: course })
});


// @desc       Delete a course
// @route      DELETE /api/v1/courses/:courseId
// @access     Private

exports.deleteCourse = asyncHandler(async (req, res, next) => {

    const course = await Course.findById(req.params.courseId);

    if (!course) {
        return next(new ErrorResponse(`Bootcamp not found with id ${req.params.courseId}`), 404);
    }

    // Make sure User is Owner of Bootcamp
    if (req.user.id != course.user.toString() && req.user.role != 'admin') {
        return next(new ErrorResponse(`User with user id ${req.user.id} is not authorized to delete this course`, 401));
    }

    await course.remove();

    res.status(200).json({ success: true, data: {} })
});