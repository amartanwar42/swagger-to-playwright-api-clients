import winston from 'winston';
import path from 'path';
import * as fs from 'fs';
import { LoggerConfig, LogLevel, defaultLoggerConfig } from '../config/types';

// Store the current logger instance
let loggerInstance: winston.Logger | null = null;
let currentConfig: LoggerConfig = { ...defaultLoggerConfig };
let configLoaded = false;

/**
 * Config file names to look for (in order of priority)
 */
const CONFIG_FILE_NAMES = [
	'generator-config.js',
	'generator-config.ts',
	'swagger-generator.config.js',
	'swagger-generator.config.ts',
];

/**
 * Try to auto-discover and load logger config from the project's generator config file.
 * This ensures the logger settings from generator-config.ts are respected
 * even during test runs (not just during generation).
 */
function loadConfigFromFile(): LoggerConfig {
	if (configLoaded) return currentConfig;
	configLoaded = true;

	const cwd = process.cwd();

	for (const configName of CONFIG_FILE_NAMES) {
		// Only try .js files (compiled config) — .ts files need ts-node which may not be available
		if (!configName.endsWith('.js')) continue;

		const configPath = path.join(cwd, configName);
		if (fs.existsSync(configPath)) {
			try {
				const config = require(configPath);
				const resolvedConfig = config.default || config;
				if (resolvedConfig?.logger) {
					currentConfig = { ...defaultLoggerConfig, ...resolvedConfig.logger };
					return currentConfig;
				}
			} catch {
				// Config file exists but can't be loaded — fall through to defaults
			}
		}
	}

	// Try loading .ts config files if ts-node is available
	for (const configName of CONFIG_FILE_NAMES) {
		if (!configName.endsWith('.ts')) continue;

		const configPath = path.join(cwd, configName);
		if (fs.existsSync(configPath)) {
			try {
				// Check if ts-node is already registered or available
				require.resolve('ts-node');
				try {
					require('ts-node').register({
						transpileOnly: true,
						compilerOptions: { module: 'commonjs' },
					});
				} catch {
					// ts-node may already be registered
				}
				const config = require(configPath);
				const resolvedConfig = config.default || config;
				if (resolvedConfig?.logger) {
					currentConfig = { ...defaultLoggerConfig, ...resolvedConfig.logger };
					return currentConfig;
				}
			} catch {
				// ts-node not available or config failed to load — use defaults
			}
		}
	}

	return currentConfig;
}

/**
 * Get log level from environment or config
 */
function getLogLevel(config: LoggerConfig): LogLevel {
	const envLevel = process.env.LOG_LEVEL as LogLevel | undefined;
	return envLevel || config.level || 'info';
}

/**
 * Check if console logging is enabled
 */
function isConsoleEnabled(config: LoggerConfig): boolean {
	const envConsole = process.env.LOG_CONSOLE;
	if (envConsole !== undefined) {
		return envConsole.toLowerCase() === 'true';
	}
	return config.console !== false;
}

/**
 * Custom log format for files
 */
const fileFormat = winston.format.combine(
	winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
	winston.format.errors({ stack: true }),
	winston.format.printf(({ level, message, timestamp, stack }) => {
		if (stack) {
			return `${timestamp} [${level.toUpperCase()}]: ${message}\n${stack}`;
		}
		return `${timestamp} [${level.toUpperCase()}]: ${message}`;
	})
);

/**
 * Console format with colors
 */
const consoleFormat = winston.format.combine(
	winston.format.colorize({ all: true }),
	winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
	winston.format.printf(({ level, message, timestamp }) => {
		return `${timestamp} [${level}]: ${message}`;
	})
);

/**
 * Create a new logger instance with the given configuration
 */
function createLogger(config: LoggerConfig = {}): winston.Logger {
	const mergedConfig: LoggerConfig = { ...defaultLoggerConfig, ...config };
	const logLevel = getLogLevel(mergedConfig);
	const consoleEnabled = isConsoleEnabled(mergedConfig);
	const logDir = path.resolve(process.cwd(), mergedConfig.outputDir || './logs');

	// Ensure log directory exists if file logging is enabled
	if (mergedConfig.file !== false) {
		if (!fs.existsSync(logDir)) {
			fs.mkdirSync(logDir, { recursive: true });
		}
	}

	const transports: winston.transport[] = [];

	// Add console transport if enabled
	if (consoleEnabled) {
		transports.push(
			new winston.transports.Console({
				format: consoleFormat,
			})
		);
	}

	// Add file transports if enabled
	if (mergedConfig.file !== false) {
		// Combined log file
		transports.push(
			new winston.transports.File({
				filename: path.join(logDir, 'combined.log'),
				maxsize: mergedConfig.maxFileSize || 5242880,
				maxFiles: mergedConfig.maxFiles || 5,
			})
		);

		// Error log file
		transports.push(
			new winston.transports.File({
				filename: path.join(logDir, 'error.log'),
				level: 'error',
				maxsize: mergedConfig.maxFileSize || 5242880,
				maxFiles: mergedConfig.maxFiles || 5,
			})
		);
	}

	return winston.createLogger({
		level: logLevel,
		format: fileFormat,
		transports,
	});
}

/**
 * Initialize or reconfigure the logger with given configuration
 * Call this at application startup with your config
 */
export function configureLogger(config: LoggerConfig = {}): winston.Logger {
	currentConfig = { ...defaultLoggerConfig, ...config };
	loggerInstance = createLogger(currentConfig);
	return loggerInstance;
}

/**
 * Get the current logger instance
 * If not initialized, auto-discovers config from generator-config file
 */
export function getLogger(): winston.Logger {
	if (!loggerInstance) {
		loadConfigFromFile();
		loggerInstance = createLogger(currentConfig);
	}
	return loggerInstance;
}

/**
 * Get the current logger configuration
 */
export function getLoggerConfig(): LoggerConfig {
	return { ...currentConfig };
}

// Create default logger instance
const logger = getLogger();

// Utility methods
export const logRequest = (
	method: string,
	url: string,
	statusCode: number,
	duration: number
): void => {
	getLogger().info(`${method} ${url} - ${statusCode} (${duration}ms)`);
};

export const logError = (error: Error, context = ''): void => {
	const errorMessage = context ? `${context}: ${error.message}` : error.message;
	getLogger().error(errorMessage, { stack: error.stack });
};

export default logger;
