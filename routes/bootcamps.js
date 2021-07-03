const express = require('express');
const {
    getBootcamps,
    getBootcamp,
    createBootcamp,
    updateBootcamp,
    deleteBootcamp,
    getBootcampsInRadius,
    uploadPhoto } = require('../controllers/bootcamps');

const Bootcamp = require('../models/Bootcamp');
const advanceResults = require('../middlewares/advanceResults');

//Include Other Resource Router
const courseRouter = require('./courses');
const reviewRouter = require('./reviews');

const router = express.Router();

const { protect, authorize } = require('../middlewares/auth');

//Re-route into other resource router
router.use('/:bootcampId/courses', courseRouter);
router.use('/:bootcampId/reviews', reviewRouter);

//bootcamps route
router
    .route('/:id/photo')
    .put(protect, authorize('publisher', 'admin'), uploadPhoto);

router
    .route('/radius/:zipcode/:distance')
    .get(getBootcampsInRadius)
router
    .route('/')
    .get(advanceResults(Bootcamp, 'courses'), getBootcamps)
    .post(protect, authorize('publisher', 'admin'), createBootcamp);

router
    .route('/:id')
    .get(getBootcamp)
    .put(protect, authorize('publisher', 'admin'), updateBootcamp)
    .delete(protect, authorize('publisher', 'admin'), deleteBootcamp);


module.exports = router;