const ApiFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      const err = new AppError('No Document found with that ID.', 404);
      next(err);
    }

    res.status(204).json({
      status: 'Success'
    });
  });

exports.updateOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!doc) {
      const err = new AppError('No Document found with that ID.', 404);
      next(err);
    }

    res.status(200).json({
      status: 'Success',
      data: {
        data: doc
      }
    });
  });

exports.createOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'Success',
      data: {
        data: doc
      }
    });
  });

exports.getOne = (Model, populateOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (populateOptions) {
      query.populate(populateOptions);
    }

    const doc = await query;

    if (!doc) {
      const err = new AppError('No Document found with that ID.', 404);
      next(err);
    }

    res.status(200).json({
      status: 'Success',
      data: {
        data: doc
      }
    });
  });

exports.getAll = Model =>
  catchAsync(async (req, res, next) => {
    let filter = {};

    if (req.params?.tourId) {
      filter = {
        tour: req.params.tourId
      };
    }
    const initialQuery = Model.find(filter);

    const features = new ApiFeatures(initialQuery, req.query);

    const appliedFeatures = features
      .filter()
      .sort()
      .limitFields()
      .paginate();

    // const docs = await appliedFeatures.query.explain();

    const docs = await appliedFeatures.query;

    res.status(200).json({
      status: 'Success',
      size: docs.length,
      data: {
        data: docs
      }
    });
  });
