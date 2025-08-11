import winston from "winston";

export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getPreviousDateString = (currentDateString: string): string => {
  const [year, month, day] = currentDateString.split("-").map(Number);
  const currentDate = new Date(year, month - 1, day);
  currentDate.setDate(currentDate.getDate() - 1);
  return formatDate(currentDate);
};

export const getDaysBetweenDates = (startDate: Date, endDate: Date) => {
  const ONE_DAY = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
  return Math.round(
    Math.abs((endDate.getTime() - startDate.getTime()) / ONE_DAY),
  );
};

export const logger = winston.createLogger({
  level: "info",
  defaultMeta: { service: "API" },
  format: winston.format.combine(
    winston.format.json(),
    winston.format.timestamp(),
  ),
  transports: [
    new winston.transports.File({
      filename: "error.log",
      level: "error",
      format: winston.format.combine(
        winston.format.json(),
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
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
        }),
      ),
    }),
  );
}
