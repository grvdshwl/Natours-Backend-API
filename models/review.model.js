const mongoose = require('mongoose');
const Tour = require('./tour.model');
const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'A review is reqiured field.']
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, 'A rating is reqiured field.'],
      set: val => Math.round(val * 10) / 10
    },
    createdAt: {
      type: Date,
      default: new Date()
    },
    tour: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Tour',
      required: [true, 'A review must belong to a tour.']
    },
    user: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: [true, 'A review must belong to a user.']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function() {
  this.populate({
    path: 'user',
    select: 'name photo'
  });
});

reviewSchema.statics.calcAverageRating = async function(tourId) {
  const stats = await this.aggregate([
    {
      $match: {
        tour: tourId
      }
    },
    {
      $group: {
        _id: '$tour',
        nCount: { $sum: 1 },
        rAverage: { $avg: '$rating' }
      }
    }
  ]);

  let ratingsAverage = 4.5;
  let ratingsQuantity = 0;

  if (stats.length) {
    ratingsAverage = stats[0].rAverage;
    ratingsQuantity = stats[0].nCount;
  }

  await Tour.findByIdAndUpdate(tourId, {
    ratingsAverage,
    ratingsQuantity
  });
};

reviewSchema.post('save', function() {
  this.constructor.calcAverageRating(this.tour);
});

//findOneAndUpdate & findOneAndDelete is short hand for findByIdByUpdate and findByIdAndDelete

reviewSchema.pre(/^findOneAnd/, async function(next) {
  this.document = await this.findOne();
  next();
});

reviewSchema.post(/^findOneAnd/, async function() {
  //await this.findOne() does not work here as query has already been executed.

  await this.document.constructor.calcAverageRating(this.document.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
