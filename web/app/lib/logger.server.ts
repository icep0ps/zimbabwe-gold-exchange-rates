import winston from "winston";

export const logger = winston.createLogger({
  level: "info",
  defaultMeta: { service: "FRONTEND" },
  format: winston.format.combine(
    winston.format.json(),
    winston.format.timestamp()
  ),
  transports: [
    new winston.transports.File({
      filename: "error.log",
      level: "error",
      format: winston.format.combine(
        winston.format.json(),
        winston.format.timestamp(),
        winston.format.errors({ stack: true })
      ),
    }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

export const scriptLogger = logger.child({
  service: "SCRIPT",
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp }) => {
          return `[${level}] [${timestamp}]: ${message}`;
        })
      ),
    })
  );
}
