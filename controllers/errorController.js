const AppError = require('../utils/appError');

const sendErrorProd = (err, res, req) => {
  //Operational Error : Truested Error.
  if (!req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      return res.status(err.statusCode).render('error', {
        message: err.message
      });
    } else {
      //Programming Error : Unknown Error.

      console.log('Error 💥💥💥', err);

      return res.status(err.statusCode).render('error', {
        message: 'Something went wrong.'
      });
    }
  }

  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  } else {
    //Programming Error : Unknown Error.

    console.log('Error 💥💥💥', err);

    return res.status(err.statusCode).json({
      status: 'Error',
      message: 'Something went wrong.'
    });
  }
};

const sendErrorDev = (err, res, req) => {
  if (!req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).render('error', {
      message: err.message
    });
  }

  return res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}:${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateErrorDB = err => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];

  const message = `Duplicate Field value:${value}.Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);

  const message = `Invalid Input Data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJsonWebTokenError = () => {
  const message = 'Invalid Token.Please Log in again.';
  return new AppError(message, 401);
};

const handleTokenExpiredError = () => {
  const message = 'Token Expired.Please Log in again.';
  return new AppError(message, 401);
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'Error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res, req);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;
    if (error.name === 'CastError') error = handleCastErrorDB(error);

    if (error.code === 11000) error = handleDuplicateErrorDB(error);

    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);

    if (error.name === 'JsonWebTokenError') {
      error = handleJsonWebTokenError();
    }

    if (error.name === 'TokenExpiredError') {
      error = handleTokenExpiredError();
    }

    sendErrorProd(error, res, req);
  }
};
