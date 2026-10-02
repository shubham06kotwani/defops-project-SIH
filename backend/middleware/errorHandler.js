module.exports = (err, req, res, next) => {
  console.error(`[SYSTEM ERROR]: ${err.stack}`);

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Tactical Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};