import winston from 'winston';
import path from 'path';

// Define log directory
const logDir = path.join(process.cwd(), 'logs');

// Custom log format
const logFormat = winston.format.combine(
	winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
	winston.format.errors({ stack: true }),
	winston.format.printf(({ level, message, timestamp, stack }) => {
		if (stack) {
			return `${timestamp} [${level.toUpperCase()}]: ${message}\n${stack}`;
		}
		return `${timestamp} [${level.toUpperCase()}]: ${message}`;
	})
);

// Console format with colors
const consoleFormat = winston.format.combine(
	winston.format.colorize({ all: true }),
	winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
	winston.format.printf(({ level, message, timestamp }) => {
		return `${timestamp} [${level}]: ${message}`;
	})
);

// Create logger instance
const logger = winston.createLogger({
	level: process.env.LOG_LEVEL || 'info',
	format: logFormat,
	transports: [
		// Console transport
		new winston.transports.Console({
			format: consoleFormat,
		}),
		// Combined log file
		new winston.transports.File({
			filename: path.join(logDir, 'combined.log'),
			maxsize: 5242880, // 5MB
			maxFiles: 5,
		}),
		// Error log file
		new winston.transports.File({
			filename: path.join(logDir, 'error.log'),
			level: 'error',
			maxsize: 5242880, // 5MB
			maxFiles: 5,
		}),
	],
});

// Utility methods
export const logRequest = (
	method: string,
	url: string,
	statusCode: number,
	duration: number
): void => {
	logger.info(`${method} ${url} - ${statusCode} (${duration}ms)`);
};

export const logError = (error: Error, context = ''): void => {
	const errorMessage = context ? `${context}: ${error.message}` : error.message;
	logger.error(errorMessage, { stack: error.stack });
};

export default logger;
