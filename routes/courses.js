const express = require('express');
const {
    getCourses,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse
} = require('../controllers/courses');

const Course = require('../models/Courses')
const advanceResults = require('../middlewares/advanceResults');

const router = express.Router({ mergeParams: true });

const { protect, authorize } = require('../middlewares/auth');


router
    .route('/')
    .get(advanceResults(Course, {
        path: 'bootcamp',
        select: 'name description'
    }), getCourses)
    .post(protect, authorize('publisher', 'admin'), createCourse);

router
    .route('/:courseId')
    .get(getCourseById)
    .put(protect, authorize('publisher', 'admin'), updateCourse)
    .delete(protect, authorize('publisher', 'admin'), deleteCourse);

module.exports = router;