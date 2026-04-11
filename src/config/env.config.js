require("dotenv").config();

const { logger } = require("../utils/logger.util");
// Check for required environment variables and provide warnings or errors

if (!process.env.NODE_ENV) {
	logger.warn(
		"NODE_ENV is not defined in the environment variables. Defaulting to 'development'.",
	);
}

if (!process.env.CLIENT_URL) {
	logger.warn(
		"CLIENT_URL is not defined in the environment variables. Using default allowed origins.",
	);
}

if (!process.env.PORT) {
	logger.warn(
		"PORT is not defined in the environment variables. Using default port 3000.",
	);
}

if (!process.env.HEALTH_PING_INTERVAL_MS) {
	logger.warn(
		"HEALTH_PING_INTERVAL_MS is not defined. Using default 480000ms (8 minutes).",
	);
}

if (!process.env.MONGO_URI) {
	throw new Error("MONGO_URI is not defined in the environment variables");
}

if (!process.env.REDIS_URL) {
	throw new Error("REDIS_URL is not defined in the environment variables");
}

if (!process.env.FIREBASE_PROJECT_ID) {
	throw new Error(
		"FIREBASE_PROJECT_ID is not defined in the environment variables",
	);
}

if (!process.env.FIREBASE_CLIENT_EMAIL) {
	throw new Error(
		"FIREBASE_CLIENT_EMAIL is not defined in the environment variables",
	);
}

if (!process.env.FIREBASE_PRIVATE_KEY) {
	throw new Error(
		"FIREBASE_PRIVATE_KEY is not defined in the environment variables",
	);
}

if (!process.env.IMAGEKIT_PRIVATE_KEY) {
	throw new Error(
		"IMAGEKIT_PRIVATE_KEY is not defined in the environment variables",
	);
}

if (!process.env.IMAGEKIT_PUBLIC_KEY) {
	throw new Error(
		"IMAGEKIT_PUBLIC_KEY is not defined in the environment variables",
	);
}

if (!process.env.IMAGEKIT_URL_ENDPOINT) {
	throw new Error(
		"IMAGEKIT_URL_ENDPOINT is not defined in the environment variables",
	);
}

if (!process.env.SENDGRID_API_KEY) {
	throw new Error(
		"SENDGRID_API_KEY is not defined in the environment variables",
	);
}

if (!process.env.EMAIL_USER) {
	throw new Error("EMAIL_USER is not defined in the environment variables");
}

if (process.env.NODE_ENV === "production" && !process.env.CLIENT_URL) {
	throw new Error("CLIENT_URL is required in production");
}

if (!process.env.STRIPE_SECRET_KEY) {
	throw new Error(
		"STRIPE_SECRET_KEY is not defined in the environment variables",
	);
}

if (!process.env.STRIPE_CURRENCY) {
	throw new Error(
		"STRIPE_CURRENCY is not defined in the environment variables",
	);
}

const parsedHealthPingInterval = Number(
	process.env.HEALTH_PING_INTERVAL_MS || 8 * 60 * 1000,
);

if (Number.isNaN(parsedHealthPingInterval) || parsedHealthPingInterval < 1000) {
	throw new Error(
		"HEALTH_PING_INTERVAL_MS must be a valid number greater than or equal to 1000",
	);
}

const envConfig = {
	NODE_ENV: process.env.NODE_ENV || "development",
	CLIENT_URL: process.env.CLIENT_URL,
	PORT: process.env.PORT,
	HEALTH_PING_INTERVAL_MS: parsedHealthPingInterval,
	MONGO_URI: process.env.MONGO_URI,
	REDIS_URL: process.env.REDIS_URL,
	FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
	FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
	FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY.replace(
		/\\n/g,
		"\n",
	),
	IMAGEKIT_PRIVATE_KEY: process.env.IMAGEKIT_PRIVATE_KEY,
	IMAGEKIT_PUBLIC_KEY: process.env.IMAGEKIT_PUBLIC_KEY,
	IMAGEKIT_URL_ENDPOINT: process.env.IMAGEKIT_URL_ENDPOINT,
	SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
	EMAIL_USER: process.env.EMAIL_USER,
	STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
	STRIPE_CURRENCY: process.env.STRIPE_CURRENCY,
};

module.exports = envConfig;
