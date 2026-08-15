const express = require("express");
const cors = require("cors");
const envConfig = require("./config/env.config");
const httpLoggerMiddleware = require("./middlewares/httpLogger.middleware");
const {
	swaggerUi,
	swaggerSpec,
	swaggerUiOptions,
} = require("./config/swagger.config");
const {
	securityHeadersMiddleware,
	globalApiLimiter,
} = require("./middlewares/security.middleware");

/**
 * 	Routes Requires
 * - test routes
 * - auth routes
 * - expenses routes
 * - group routes
 * - payment routes
 * - meal routes
 * - menu routes
 * - bazar routes
 */
const testRouter =
	envConfig.NODE_ENV === "development"
		? require("./routes/route.test")
		: null;

const authRouter = require("./routes/auth.route");
const expensesRouter = require("./routes/expenses.route");
const groupRouter = require("./routes/group.route");
const paymentRouter = require("./routes/payment.route");
const mealRouter = require("./routes/meal.route");
const menuRouter = require("./routes/menu.route");
const bazarRouter = require("./routes/bazar.route");
const chatRouter = require("./routes/chat.route");
const notificationRouter = require("./routes/notification.routes");

// Create an Express application
const app = express();

// Required for correct client IP resolution behind Render/other proxies.
app.set("trust proxy", 1);

function normalizeOrigin(origin) {
	return String(origin || "")
		.trim()
		.replace(/\/+$/, "");
}

const allowedOrigins = [
	"http://localhost:3000",
	"http://localhost:3001",
	"http://localhost:5173",
].map(normalizeOrigin);

if (envConfig.CLIENT_URL) {
	allowedOrigins.push(normalizeOrigin(envConfig.CLIENT_URL));
}

const uniqueAllowedOrigins = [...new Set(allowedOrigins)];

// CORS configuration & middleware
app.use(
	cors({
		origin: uniqueAllowedOrigins,
		methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
		credentials: true,
		allowedHeaders: ["Content-Type", "Authorization"],
	}),
);
app.use(securityHeadersMiddleware);
app.use(globalApiLimiter);
app.use(httpLoggerMiddleware);
app.use(express.json({ limit: "10mb" }));

/**
 * Basic route to check if the server is running.
 */
app.get("/health", (req, res) => {
	res.status(200).json({
		success: true,
		message: "OK",
	});
});

/**
 * Swagger API documentation route
 * - serves the Swagger UI at /api/docs
 * - serves the raw Swagger JSON at /api/docs.json
 */
app.use(
	"/api/docs",
	swaggerUi.serve,
	swaggerUi.setup(swaggerSpec, swaggerUiOptions),
);
app.get("/api/docs.json", (req, res) => {
	res.status(200).json(swaggerSpec);
});

/**
 * 	Routes Use
 * - test routes
 * - auth routes
 * - expenses routes
 * - group routes
 * - payment routes
 * - meal routes
 * - menu routes
 * - bazar routes
 */
if (envConfig.NODE_ENV === "development" && testRouter) {
	app.use("/api/test", testRouter);
}
app.use("/api/auth", authRouter);
app.use("/api/expenses", expensesRouter);
app.use("/api/group", groupRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/meals", mealRouter);
app.use("/api/menus", menuRouter);
app.use("/api/bazar", bazarRouter);
app.use("/api/chat", chatRouter);
app.use("/api/notifications", notificationRouter);

// 404 handler for unmatched routes
app.use((req, res) => {
	res.status(404).json({
		success: false,
		message: "Route not found",
	});
});

// Global error handler
app.use((error, req, res, next) => {
	if (res.headersSent) {
		return next(error);
	}

	return res.status(500).json({
		success: false,
		message: "An unexpected server error occurred",
	});
});

module.exports = app;
