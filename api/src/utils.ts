import winston from "winston";

export { formatDate, getPreviousDateString, getDaysBetweenDates } from "./date-utils.js";

export const logger = winston.createLogger({
  level: "info",
  defaultMeta: { service: "API" },
  format: winston.format.combine(
    winston.format.json(),
    winston.format.timestamp(),
  ),
  transports: [],
});

export const scriptLogger = logger.child({
  service: "SCRIPT",
});

logger.add(
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(({ level, message, timestamp }) => {
        return `[${level}] [${timestamp}]: ${message}`;
      }),
    ),
  }),
);
