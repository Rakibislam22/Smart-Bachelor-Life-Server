const app = require("./src/app");
const envConfig = require("./src/config/env.config");
const { logger } = require("./src/utils/logger.util");

// Connect to MongoDB and Redis before starting the server
const connectDB = require("./src/config/mongoDB.config");
const { connectRedis } = require("./src/config/redis.config");

const PORT = envConfig.PORT || 3000;
const HEALTH_PING_INTERVAL_MS = envConfig.HEALTH_PING_INTERVAL_MS;

function startHealthPingScheduler() {
	const healthUrl = `http://127.0.0.1:${PORT}/health`;

	const pingHealth = async () => {
		try {
			const response = await fetch(healthUrl);

			if (!response.ok) {
				logger.warn("Scheduled health ping returned non-OK response", {
					url: healthUrl,
					status: response.status,
				});
				return;
			}

			logger.info("Scheduled health ping succeeded", {
				url: healthUrl,
				status: response.status,
			});
		} catch (error) {
			logger.warn("Scheduled health ping failed", {
				url: healthUrl,
				error: error?.message,
			});
		}
	};

	setInterval(pingHealth, HEALTH_PING_INTERVAL_MS);

	logger.info("Health ping scheduler started", {
		intervalMs: HEALTH_PING_INTERVAL_MS,
		url: healthUrl,
	});
}

async function startServer() {
	try {
		await Promise.all([connectDB(), connectRedis()]);

		app.listen(PORT, () => {
			logger.info(
				`SBL server started on port ${PORT} in ${envConfig.NODE_ENV} mode`,
			);
			startHealthPingScheduler();
		});
	} catch (error) {
		logger.error("Failed to start server", {
			error: error?.message,
		});
		process.exit(1);
	}
}

startServer();
