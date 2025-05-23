import winston, { format } from "winston";

var logger;

export const getLogger = (): winston.Logger => {
  if (logger) return logger;

  return createLogger();
};

export const createLogger = () => {
  if (logger) {
    return logger;
  }
  const customFormat = (info: winston.Logform.TransformableInfo) => {
    return `[${info.level}]: ${info.message} ${
      info.stack ? "\n" + info.stack : ""
    }`;
  };

  const consoleLogger = new winston.transports.Console({
    format: format.combine(
      format.colorize(),
      format.timestamp({
        format: "YYYY-MM-DD HH:mm:ss",
      }),
      format.splat(),
      format.printf((info) => {
        return info.timestamp + " " + customFormat(info);
      })
    ),
    level: "debug",
  });

  const _logger = winston.createLogger({
    transports: [consoleLogger],
    format: format.errors({ stack: true }),
  });
  logger = _logger;

  return logger;
};

export default getLogger();
