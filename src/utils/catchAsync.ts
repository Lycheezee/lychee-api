import logger from "./logger";

const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    logger.error(err);
    next(err);
  });
};

export default catchAsync;
