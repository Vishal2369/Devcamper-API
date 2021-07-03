const mongoose = require('mongoose');
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

const CourseSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true,
        required: [true, 'Please add a title']
    },
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    weeks: {
        type: Number,
        required: [true, 'Please add number of weeks']
    },
    tuition: {
        type: Number,
        required: [true, 'Please add tuition fee']
    },
    minimumSkill: {
        type: String,
        required: [true, 'Please add min skill required'],
        enum: ['beginner', 'intermediate', 'advanced']
    },
    scholarshipAvailable: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    bootcamp: {
        type: mongoose.Schema.ObjectId,
        ref: 'Bootcamp',
        required: true
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    }
});

//Static method to get average of course tuitions
CourseSchema.statics.getAverageCost = async function (bootcampId) {
    //console.log('Calculating average cost'.blue);
    const obj = await this.aggregate([
        {
            $match: { bootcamp: bootcampId }
        },
        {
            $group: {
                _id: '$bootcamp',
                averageCost: { $avg: '$tuition' }
            }
        }
    ]);
    try {
        await this.model('Bootcamp').findByIdAndUpdate(bootcampId, {
            averageCost: Math.ceil(obj[0].averageCost)
        })
    } catch (error) {
        console.log(error);
    }
    //console.log(obj);
}

//Call getAverageCost after save
CourseSchema.post('save', function () {
    this.constructor.getAverageCost(this.bootcamp);
});

//Call getAverageCost before removing
CourseSchema.pre('remove', function () {

    this.constructor.getAverageCost(this.bootcamp);
})

module.exports = mongoose.model('Course', CourseSchema);